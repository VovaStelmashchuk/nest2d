import { getDb } from "~~/server/db/postgres";

/**
 * Persists a subscription mapped by `mapSubscription` for the user.
 * @param {string} userId
 * @param {ReturnType<import('./stripe').mapSubscription>} subscription
 * @param {import('postgres').Sql} [sql]
 */
export async function saveSubscription(userId, subscription, sql) {
    const db = sql || (await getDb());
    await db`
        INSERT INTO user_subscriptions (
            user_id, stripe_subscription_id, status, current_period_end,
            price_id, product_id, updated_at
        ) VALUES (
            ${userId}, ${subscription.stripeSubscriptionId}, ${subscription.status},
            ${subscription.currentPeriodEnd}, ${subscription.priceId},
            ${subscription.productId}, ${subscription.updatedAt}
        )
        ON CONFLICT (user_id) DO UPDATE SET
            stripe_subscription_id = EXCLUDED.stripe_subscription_id,
            status = EXCLUDED.status,
            current_period_end = EXCLUDED.current_period_end,
            price_id = EXCLUDED.price_id,
            product_id = EXCLUDED.product_id,
            updated_at = EXCLUDED.updated_at
    `;
}

/**
 * @param {string} userId
 * @returns {Promise<{stripeSubscriptionId: string, status: string, currentPeriodEnd: Date|null, priceId: string|null, productId: string|null, updatedAt: Date}|null>}
 */
export async function getSubscriptionOf(userId) {
    const db = await getDb();
    const [subscription] = await db`
        SELECT stripe_subscription_id, status, current_period_end, price_id, product_id, updated_at
        FROM user_subscriptions WHERE user_id = ${userId}
    `;
    return subscription || null;
}

/**
 * @returns {Promise<any>} the on-demand plan, or null before the first sync
 */
export async function getPlan() {
    const db = await getDb();
    const [plan] = await db`SELECT * FROM subscription_plan WHERE id = 'subscription'`;
    return plan || null;
}
