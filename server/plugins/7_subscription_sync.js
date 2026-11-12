import { getDb } from "../db/postgres";
import {
    getCheckoutSession,
    getSubscription,
    mapSubscription,
} from "../features/payment/stripe";
import { saveSubscription } from "../features/payment/store";
import logger from "../utils/logger";

const tag = "subscriptionsync";

// How often the loop wakes up when there is nothing immediate to do.
const IDLE_DELAY_MS = 30 * 1000;
// How stale a stored subscription may get before we refresh it from Stripe.
const REFRESH_AFTER_MS = 6 * 60 * 60 * 1000;

/**
 * Resolves a freshly created checkout into a stored subscription. Mirrors the
 * post-redirect /subscription/check endpoint for users who close the tab before
 * being redirected back.
 * @param {import('postgres').Sql} sql
 */
async function resolvePendingCheckouts(sql) {
    const [checkout] = await sql`
        UPDATE subscription_checkouts
        SET status = 'processing', updated_at = now(), attempt = attempt + 1
        WHERE id = (
            SELECT id FROM subscription_checkouts
            WHERE status = 'created'
              AND created_at >= now() - interval '1 hour'
              AND attempt < 5
            ORDER BY id
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING *
    `;

    if (!checkout) {
        return false;
    }

    const setStatus = (status) => sql`
        UPDATE subscription_checkouts SET status = ${status}, updated_at = now()
        WHERE id = ${checkout.id}
    `;

    try {
        const session = await getCheckoutSession(checkout.checkoutId);
        const subscription = session?.subscription;

        if (subscription && typeof subscription === "object") {
            const mapped = mapSubscription(subscription);
            await saveSubscription(checkout.userId, mapped);
            await setStatus("completed");
            logger.info(`[${tag}] Resolved checkout`, {
                userId: checkout.userId,
                status: mapped.status,
            });
        } else {
            // Not paid/created yet — return to the queue for another attempt.
            await setStatus("created");
        }
    } catch (err) {
        logger.warn(`[${tag}] Failed to resolve checkout`, {
            checkoutId: checkout.checkoutId,
            err,
        });
        await setStatus("created");
    }

    return true;
}

/**
 * Refreshes the stalest stored subscription from Stripe so renewals,
 * cancellations and failed payments are reflected without webhooks.
 * @param {import('postgres').Sql} sql
 */
async function refreshStaleSubscription(sql) {
    const staleBefore = new Date(Date.now() - REFRESH_AFTER_MS);
    const [subscription] = await sql`
        SELECT user_id, stripe_subscription_id FROM user_subscriptions
        WHERE updated_at < ${staleBefore}
        ORDER BY updated_at
        LIMIT 1
    `;

    if (!subscription) {
        return false;
    }

    const userId = subscription.userId;
    try {
        const stripeSub = await getSubscription(subscription.stripeSubscriptionId);
        const mapped = mapSubscription(stripeSub);
        await saveSubscription(userId, mapped);
        logger.info(`[${tag}] Refreshed subscription`, {
            userId,
            status: mapped.status,
        });
    } catch (err) {
        logger.warn(`[${tag}] Failed to refresh subscription`, { userId, err });
        // Bump updated_at so a permanently failing id doesn't spin the loop.
        await sql`
            UPDATE user_subscriptions SET updated_at = now() WHERE user_id = ${userId}
        `;
    }

    return true;
}

export default defineNitroPlugin(async () => {
    logger.info(`[${tag}] Subscription sync plugin start`);

    let initialized = false;
    while (true) {
        let didWork = false;
        try {
            const sql = await getDb();

            if (!initialized) {
                // Clear any checkouts left mid-flight by a previous process.
                await sql`
                    UPDATE subscription_checkouts SET status = 'created'
                    WHERE status = 'processing'
                `;
                initialized = true;
            }

            const didCheckout = await resolvePendingCheckouts(sql);
            const didRefresh = await refreshStaleSubscription(sql);
            didWork = didCheckout || didRefresh;
        } catch (err) {
            logger.error(`[${tag}] Subscription sync loop error: ${err?.message || err}`);
        }

        if (!didWork) {
            await new Promise((resolve) => setTimeout(resolve, IDLE_DELAY_MS));
        }
    }
});
