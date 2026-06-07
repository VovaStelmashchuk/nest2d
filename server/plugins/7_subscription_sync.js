import { connectDB } from "../db/mongo";
import {
    getCheckoutSession,
    getSubscription,
    mapSubscription,
} from "../features/payment/stripe";
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
 */
async function resolvePendingCheckouts(db) {
    const checkout = await db.collection("subscription_checkouts").findOneAndUpdate(
        {
            status: "created",
            createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
            attempt: { $lt: 5 },
        },
        { $set: { status: "processing", updatedAt: new Date() }, $inc: { attempt: 1 } },
        { returnDocument: "after" }
    );

    if (!checkout) {
        return false;
    }

    try {
        const session = await getCheckoutSession(checkout.checkoutId);
        const subscription = session?.subscription;

        if (subscription && typeof subscription === "object") {
            const mapped = mapSubscription(subscription);
            await db
                .collection("users")
                .updateOne({ id: checkout.userId }, { $set: { subscription: mapped } });
            await db
                .collection("subscription_checkouts")
                .updateOne(
                    { _id: checkout._id },
                    { $set: { status: "completed", updatedAt: new Date() } }
                );
            logger.info(`[${tag}] Resolved checkout`, {
                userId: checkout.userId,
                status: mapped.status,
            });
        } else {
            // Not paid/created yet — return to the queue for another attempt.
            await db
                .collection("subscription_checkouts")
                .updateOne(
                    { _id: checkout._id },
                    { $set: { status: "created", updatedAt: new Date() } }
                );
        }
    } catch (err) {
        logger.warn(`[${tag}] Failed to resolve checkout`, {
            checkoutId: checkout.checkoutId,
            err,
        });
        await db
            .collection("subscription_checkouts")
            .updateOne(
                { _id: checkout._id },
                { $set: { status: "created", updatedAt: new Date() } }
            );
    }

    return true;
}

/**
 * Refreshes the stalest stored subscription from Stripe so renewals,
 * cancellations and failed payments are reflected without webhooks.
 */
async function refreshStaleSubscription(db) {
    const user = await db.collection("users").findOne(
        {
            "subscription.stripeSubscriptionId": { $exists: true },
            "subscription.updatedAt": { $lt: new Date(Date.now() - REFRESH_AFTER_MS) },
        },
        { projection: { id: 1, subscription: 1 }, sort: { "subscription.updatedAt": 1 } }
    );

    if (!user) {
        return false;
    }

    try {
        const stripeSub = await getSubscription(user.subscription.stripeSubscriptionId);
        const mapped = mapSubscription(stripeSub);
        await db
            .collection("users")
            .updateOne({ id: user.id }, { $set: { subscription: mapped } });
        logger.info(`[${tag}] Refreshed subscription`, {
            userId: user.id,
            status: mapped.status,
        });
    } catch (err) {
        logger.warn(`[${tag}] Failed to refresh subscription`, {
            userId: user.id,
            err,
        });
        // Bump updatedAt so a permanently failing id doesn't spin the loop.
        await db
            .collection("users")
            .updateOne(
                { id: user.id },
                { $set: { "subscription.updatedAt": new Date() } }
            );
    }

    return true;
}

export default defineNitroPlugin(async () => {
    logger.info(`[${tag}] Subscription sync plugin start`);
    const db = await connectDB();

    // Clear any checkouts left mid-flight by a previous process.
    await db
        .collection("subscription_checkouts")
        .updateMany({ status: "processing" }, { $set: { status: "created" } });

    while (true) {
        const didCheckout = await resolvePendingCheckouts(db);
        const didRefresh = await refreshStaleSubscription(db);

        if (!didCheckout && !didRefresh) {
            await new Promise((resolve) => setTimeout(resolve, IDLE_DELAY_MS));
        }
    }
});
