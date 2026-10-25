import { connectDB } from "../db/mongo";
import { cancelSubscription, isOnDemandPlan } from "../features/payment/stripe";
import logger from "../utils/logger";

const tag = "migrations";

/**
 * One-off data migrations, applied once and recorded in the `migrations`
 * collection. Each migration must be idempotent: two app instances starting
 * at the same time may both run it before either records it.
 */
const migrations = [
    {
        id: "2026-10-on-demand-billing-reset-free-nesting",
        // Switching every user to on-demand billing: everyone starts with the
        // full free quota again.
        run: async (db) => {
            const result = await db
                .collection("users")
                .updateMany({}, { $set: { freeNestingUsed: 0 } });
            return { modified: result.modifiedCount };
        },
    },
    {
        id: "2026-10-remove-legacy-pay-flows",
        // On-demand is the only pay flow: cancel any legacy subscription that
        // could still bill (e.g. a trial converting to the monthly plan), and
        // drop the credit balance and the legacy product caches.
        run: async (db) => {
            const plan = await waitForPlan(db);
            if (!plan) {
                // Without the plan we can't tell legacy from on-demand
                // subscriptions; throw so the migration retries next start.
                throw new Error("on-demand plan not synced yet");
            }

            const users = await db
                .collection("users")
                .find(
                    { subscription: { $exists: true } },
                    { projection: { id: 1, subscription: 1 } }
                )
                .toArray();
            const legacy = users.filter((user) => !isOnDemandPlan(user.subscription, plan));

            for (const user of legacy) {
                const subscription = user.subscription;
                if (
                    subscription.stripeSubscriptionId &&
                    !["canceled", "incomplete_expired"].includes(subscription.status)
                ) {
                    await cancelSubscription(subscription.stripeSubscriptionId);
                }
                await db
                    .collection("users")
                    .updateOne({ _id: user._id }, { $unset: { subscription: "" } });
            }

            const balance = await db
                .collection("users")
                .updateMany({ balance: { $exists: true } }, { $unset: { balance: "" } });

            const existing = (await db.listCollections({}, { nameOnly: true }).toArray())
                .map((collection) => collection.name);
            const dropped = [];
            for (const name of ["products", "paywallProduct"]) {
                if (existing.includes(name)) {
                    await db.collection(name).drop();
                    dropped.push(name);
                }
            }

            return {
                legacySubscriptions: legacy.length,
                balanceRemoved: balance.modifiedCount,
                dropped,
            };
        },
    },
];

/**
 * Waits for the plan sync plugin, which runs concurrently at startup.
 * @param {import('mongodb').Db} db
 * @returns {Promise<any>} the on-demand plan, or null on timeout
 */
async function waitForPlan(db) {
    for (let attempt = 0; attempt < 30; attempt++) {
        const plan = await db
            .collection("subscription_plan")
            .findOne({ id: "subscription", meterEventName: { $exists: true } });
        if (plan) {
            return plan;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return null;
}

export default defineNitroPlugin(async () => {
    const db = await connectDB();

    for (const migration of migrations) {
        try {
            const applied = await db
                .collection("migrations")
                .findOne({ _id: migration.id });
            if (applied) {
                continue;
            }

            const result = await migration.run(db);
            await db
                .collection("migrations")
                .updateOne(
                    { _id: migration.id },
                    { $setOnInsert: { appliedAt: new Date(), result } },
                    { upsert: true }
                );
            logger.info(`[${tag}] Applied ${migration.id}: ${JSON.stringify(result)}`);
        } catch (err) {
            logger.error(`[${tag}] Failed ${migration.id}: ${err?.message || err}`);
        }
    }
});
