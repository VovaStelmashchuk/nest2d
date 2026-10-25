import { connectDB } from "../db/mongo";
import {
    FREE_NESTING_LIMIT,
    NESTING_JOB_COLLECTIONS,
} from "../features/payment/const";
import { isOnDemandPlan, reportMeterEvent } from "../features/payment/stripe";
import logger from "../utils/logger";

const tag = "usagebilling";

const IDLE_DELAY_MS = 10 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Settles one successful nesting job: spends a free run if any are left,
 * otherwise reports one unit of usage to the Stripe meter.
 *
 * Only jobs enqueued with billingStatus "pending" are considered, so jobs
 * created before on-demand billing are never billed. Final states:
 * - free: covered by the free quota
 * - billed: usage reported to Stripe
 * - unbilled: no free runs and no metered subscription (logged)
 * - skipped: the run failed, nothing to bill
 * - failed: Stripe kept rejecting the report
 *
 * @param {import('mongodb').Db} db
 * @param {string} collectionName
 * @returns {Promise<boolean>} whether a job was processed
 */
async function settleNextJob(db, collectionName) {
    const collection = db.collection(collectionName);

    // Failed runs are never billed and do not consume a free run.
    await collection.updateMany(
        { billingStatus: "pending", status: { $in: ["error", "failed"] } },
        { $set: { billingStatus: "skipped", billedAt: new Date() } }
    );

    const job = await collection.findOneAndUpdate(
        {
            billingStatus: "pending",
            status: "done",
            billingAttempt: { $not: { $gte: MAX_ATTEMPTS } },
        },
        { $set: { billingStatus: "processing" }, $inc: { billingAttempt: 1 } },
        { returnDocument: "after" }
    );

    if (!job) {
        return false;
    }

    const settle = (billingStatus) =>
        collection.updateOne(
            { _id: job._id },
            { $set: { billingStatus, billedAt: new Date() } }
        );

    try {
        // Atomically spend a free run; the guard keeps concurrent settlements
        // from overspending the quota.
        const freeRun = await db.collection("users").findOneAndUpdate(
            { id: job.ownerId, freeNestingUsed: { $not: { $gte: FREE_NESTING_LIMIT } } },
            { $inc: { freeNestingUsed: 1 } }
        );
        if (freeRun) {
            await settle("free");
            return true;
        }

        const user = await db
            .collection("users")
            .findOne(
                { id: job.ownerId },
                { projection: { id: 1, stripeCustomerId: 1, subscription: 1 } }
            );
        const plan = await db
            .collection("subscription_plan")
            .findOne({ id: "subscription" });

        if (
            plan?.meterEventName &&
            user?.stripeCustomerId &&
            isOnDemandPlan(user.subscription, plan)
        ) {
            await reportMeterEvent({
                eventName: plan.meterEventName,
                customerId: user.stripeCustomerId,
                identifier: `${collectionName}:${job._id}`,
            });
            await settle("billed");
            return true;
        }

        logger.warn(
            `[${tag}] No free runs and no metered subscription: ${collectionName}/${job.slug} user=${job.ownerId}`
        );
        await settle("unbilled");
    } catch (err) {
        logger.warn(
            `[${tag}] Failed to settle job ${collectionName}/${job.slug}: ${err?.message || err}`
        );
        const nextStatus = job.billingAttempt >= MAX_ATTEMPTS ? "failed" : "pending";
        await collection.updateOne(
            { _id: job._id },
            { $set: { billingStatus: nextStatus } }
        );
    }

    return true;
}

export default defineNitroPlugin(async () => {
    logger.info(`[${tag}] Usage billing plugin start`);
    const db = await connectDB();

    // Return jobs left mid-settlement by a previous process to the queue.
    // Meter events are idempotent per job, so a retry cannot double bill.
    for (const name of NESTING_JOB_COLLECTIONS) {
        await db
            .collection(name)
            .updateMany({ billingStatus: "processing" }, { $set: { billingStatus: "pending" } });
    }

    while (true) {
        let didWork = false;
        for (const name of NESTING_JOB_COLLECTIONS) {
            try {
                didWork = (await settleNextJob(db, name)) || didWork;
            } catch (err) {
                logger.error(`[${tag}] Usage billing loop error (${name}): ${err?.message || err}`);
            }
        }

        if (!didWork) {
            await new Promise((resolve) => setTimeout(resolve, IDLE_DELAY_MS));
        }
    }
});
