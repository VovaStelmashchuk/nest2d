import { getDb } from "../db/postgres";
import logger from "../utils/logger";

const tag = "cleanup";

const RUN_EVERY_MS = 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 60 * 60 * 1000;
// Upper bound for every delete query in a single run, to keep the load on the
// server predictable. A larger backlog is worked off over consecutive days.
const BATCH_LIMIT = 50;
const INACTIVE_USER_AFTER_MS = 365 * 24 * 60 * 60 * 1000;

// Subscription statuses that may still bill the customer; such users are kept.
const BILLABLE_SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "unpaid"];
// Jobs still running or waiting to be billed are kept.
const UNSETTLED_JOB_STATUSES = ["pending", "processing"];

/**
 * Users who have not logged in for a year: every session has expired
 * (sessions live one year from login) and there was no activity or signup
 * within the year. Admins, users with a billable subscription and users with
 * unsettled nesting jobs are kept.
 *
 * Everything the user owns (sessions, projects, files, jobs, support
 * messages, ...) is removed by ON DELETE CASCADE.
 * @param {import('postgres').Sql} sql
 */
async function deleteInactiveUsers(sql) {
    const cutoff = new Date(Date.now() - INACTIVE_USER_AFTER_MS);

    const deleted = await sql`
        DELETE FROM users WHERE id IN (
            SELECT u.id FROM users u
            LEFT JOIN user_subscriptions s ON s.user_id = u.id
            WHERE NOT u.is_admin
              AND (s.status IS NULL OR s.status NOT IN ${sql(BILLABLE_SUBSCRIPTION_STATUSES)})
              AND NOT EXISTS (
                  SELECT 1 FROM sessions
                  WHERE sessions.user_id = u.id AND sessions.expires_at > now()
              )
              AND (u.last_active_at IS NULL OR u.last_active_at < ${cutoff})
              AND u.created_at < ${cutoff}
              AND NOT EXISTS (
                  SELECT 1 FROM nesting_jobs j
                  WHERE j.owner_id = u.id
                    AND (j.status IN ${sql(UNSETTLED_JOB_STATUSES)}
                         OR j.billing_status IN ${sql(UNSETTLED_JOB_STATUSES)})
              )
              AND NOT EXISTS (
                  SELECT 1 FROM strip_nesting_jobs j
                  WHERE j.owner_id = u.id
                    AND (j.status IN ${sql(UNSETTLED_JOB_STATUSES)}
                         OR j.billing_status IN ${sql(UNSETTLED_JOB_STATUSES)})
              )
            LIMIT ${BATCH_LIMIT}
        )
        RETURNING id
    `;
    return { users: deleted.count };
}

/**
 * @param {import('postgres').Sql} sql
 */
async function deleteExpiredSessions(sql) {
    const deleted = await sql`DELETE FROM sessions WHERE expires_at < now()`;
    return { sessions: deleted.count };
}

const steps = [
    ["inactive users", deleteInactiveUsers],
    ["expired sessions", deleteExpiredSessions],
];

async function runCleanup(sql) {
    for (const [name, step] of steps) {
        try {
            const result = await step(sql);
            logger.info(`[${tag}] ${name}: ${JSON.stringify(result)}`);
        } catch (err) {
            logger.error(`[${tag}] Step failed: ${name}: ${err?.message || err}`);
        }
    }
}

/**
 * Claims today's run. The lock row makes the job run once a day across
 * restarts and multiple app instances.
 * @param {import('postgres').Sql} sql
 * @returns {Promise<boolean>}
 */
async function claimRun(sql) {
    const lastAllowed = new Date(Date.now() - RUN_EVERY_MS);
    const claimed = await sql`
        INSERT INTO job_locks (name, last_run_at) VALUES (${tag}, now())
        ON CONFLICT (name) DO UPDATE SET last_run_at = now()
        WHERE job_locks.last_run_at <= ${lastAllowed}
        RETURNING name
    `;
    return claimed.length > 0;
}

export default defineNitroPlugin(async () => {
    logger.info(`[${tag}] Cleanup plugin start`);

    while (true) {
        try {
            const sql = await getDb();
            if (await claimRun(sql)) {
                logger.info(`[${tag}] Cleanup run start`);
                await runCleanup(sql);
                logger.info(`[${tag}] Cleanup run done`);
            }
        } catch (err) {
            logger.error(`[${tag}] Cleanup loop error: ${err?.message || err}`);
        }
        await new Promise((resolve) => setTimeout(resolve, CHECK_EVERY_MS));
    }
});
