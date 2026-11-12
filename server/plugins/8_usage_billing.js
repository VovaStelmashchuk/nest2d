import { getDb } from "../db/postgres";
import {
    FREE_NESTING_LIMIT,
    NESTING_JOB_TABLES,
} from "../features/payment/const";
import { getPlan, getSubscriptionOf } from "../features/payment/store";
import { isOnDemandPlan, reportMeterEvent } from "../features/payment/stripe";
import logger from "../utils/logger";

const tag = "usagebilling";

const IDLE_DELAY_MS = 10 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Settles one successful nesting job: spends a free run if any are left,
 * otherwise reports one unit of usage to the Stripe meter.
 *
 * Only jobs enqueued with billing_status "pending" are considered. Final states:
 * - free: covered by the free quota
 * - billed: usage reported to Stripe
 * - unbilled: no free runs and no metered subscription (logged)
 * - skipped: the run failed, nothing to bill
 * - failed: Stripe kept rejecting the report
 *
 * @param {import('postgres').Sql} sql
 * @param {string} tableName
 * @returns {Promise<boolean>} whether a job was processed
 */
async function settleNextJob(sql, tableName) {
    const table = sql(tableName);

    // Failed runs are never billed and do not consume a free run.
    await sql`
        UPDATE ${table} SET billing_status = 'skipped', billed_at = now()
        WHERE billing_status = 'pending' AND status IN ('error', 'failed')
    `;

    const [job] = await sql`
        UPDATE ${table}
        SET billing_status = 'processing', billing_attempt = billing_attempt + 1
        WHERE id = (
            SELECT id FROM ${table}
            WHERE billing_status = 'pending'
              AND status = 'done'
              AND billing_attempt < ${MAX_ATTEMPTS}
            ORDER BY id
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id, slug, owner_id, billing_attempt
    `;

    if (!job) {
        return false;
    }

    const settle = (billingStatus) => sql`
        UPDATE ${table} SET billing_status = ${billingStatus}, billed_at = now()
        WHERE id = ${job.id}
    `;

    try {
        // Atomically spend a free run; the guard keeps concurrent settlements
        // from overspending the quota.
        const [freeRun] = await sql`
            UPDATE users SET free_nesting_used = free_nesting_used + 1
            WHERE id = ${job.ownerId} AND free_nesting_used < ${FREE_NESTING_LIMIT}
            RETURNING id
        `;
        if (freeRun) {
            await settle("free");
            return true;
        }

        const [user] = await sql`
            SELECT id, stripe_customer_id FROM users WHERE id = ${job.ownerId}
        `;
        const subscription = await getSubscriptionOf(job.ownerId);
        const plan = await getPlan();

        if (
            plan?.meterEventName &&
            user?.stripeCustomerId &&
            isOnDemandPlan(subscription, plan)
        ) {
            await reportMeterEvent({
                eventName: plan.meterEventName,
                customerId: user.stripeCustomerId,
                identifier: `${tableName}:${job.id}`,
            });
            await settle("billed");
            return true;
        }

        logger.warn(
            `[${tag}] No free runs and no metered subscription: ${tableName}/${job.slug} user=${job.ownerId}`
        );
        await settle("unbilled");
    } catch (err) {
        logger.warn(
            `[${tag}] Failed to settle job ${tableName}/${job.slug}: ${err?.message || err}`
        );
        const nextStatus = job.billingAttempt >= MAX_ATTEMPTS ? "failed" : "pending";
        await sql`
            UPDATE ${table} SET billing_status = ${nextStatus} WHERE id = ${job.id}
        `;
    }

    return true;
}

export default defineNitroPlugin(async () => {
    logger.info(`[${tag}] Usage billing plugin start`);

    let initialized = false;
    while (true) {
        let didWork = false;
        try {
            const sql = await getDb();

            if (!initialized) {
                // Return jobs left mid-settlement by a previous process to the
                // queue. Meter events are idempotent per job, so a retry cannot
                // double bill.
                for (const name of NESTING_JOB_TABLES) {
                    await sql`
                        UPDATE ${sql(name)} SET billing_status = 'pending'
                        WHERE billing_status = 'processing'
                    `;
                }
                initialized = true;
            }

            for (const name of NESTING_JOB_TABLES) {
                try {
                    didWork = (await settleNextJob(sql, name)) || didWork;
                } catch (err) {
                    logger.error(`[${tag}] Usage billing loop error (${name}): ${err?.message || err}`);
                }
            }
        } catch (err) {
            logger.error(`[${tag}] Usage billing loop error: ${err?.message || err}`);
        }

        if (!didWork) {
            await new Promise((resolve) => setTimeout(resolve, IDLE_DELAY_MS));
        }
    }
});
