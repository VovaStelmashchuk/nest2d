import { createError } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { FREE_NESTING_LIMIT } from "~~/server/features/payment/const";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  getSubscription,
  mapSubscription,
} from "~~/server/features/payment/stripe";
import logger from "./logger";

/**
 * Returns true if the user's stored subscription currently grants access.
 * @param {any} user
 * @returns {boolean}
 */
function hasActiveSubscription(user) {
  const subscription = user?.subscription;
  if (!subscription) {
    return false;
  }
  if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
    return false;
  }
  // No period end recorded yet (e.g. just created) — trust the status.
  if (!subscription.currentPeriodEnd) {
    return true;
  }
  return new Date(subscription.currentPeriodEnd) > new Date();
}

/**
 * Re-reads the subscription from Stripe and persists it. Used as a lazy
 * fallback when the locally stored period looks expired, so the polling lag
 * doesn't wrongly block a freshly-renewed subscriber.
 * @param {import('mongodb').Db} db
 * @param {any} user
 * @returns {Promise<boolean>} whether the refreshed subscription is active
 */
async function refreshSubscription(db, user) {
  const subscriptionId = user?.subscription?.stripeSubscriptionId;
  if (!subscriptionId) {
    return false;
  }
  try {
    const stripeSub = await getSubscription(subscriptionId);
    const mapped = mapSubscription(stripeSub);
    await db
      .collection("users")
      .updateOne({ id: user.id }, { $set: { subscription: mapped } });
    return hasActiveSubscription({ subscription: mapped });
  } catch (err) {
    logger.warn("Failed to refresh subscription from Stripe", {
      userId: user.id,
      subscriptionId,
      err,
    });
    return false;
  }
}

/**
 * Read-only entitlement summary for UI (banner, paywall state).
 * @param {string} userId
 * @returns {Promise<{freeRemaining: number, subscriptionStatus: string|null, requiresPaywall: boolean}>}
 */
export async function getEntitlement(userId) {
  const db = await connectDB();
  const user = await db
    .collection("users")
    .findOne(
      { id: userId },
      { projection: { freeNestingUsed: 1, subscription: 1 } }
    );

  const subscriptionStatus = user?.subscription?.status || null;
  const active = hasActiveSubscription(user);
  const freeRemaining = Math.max(
    0,
    FREE_NESTING_LIMIT - (user?.freeNestingUsed || 0)
  );

  return {
    freeRemaining,
    subscriptionStatus,
    requiresPaywall: !active && freeRemaining === 0,
  };
}

/**
 * Gate for nesting requests of feature-flagged users.
 *
 * Allows the request when the user has an active subscription, otherwise
 * atomically consumes one of the free nesting operations. Throws a 402 with a
 * paywall reason when neither is available.
 *
 * Callers must only invoke this for users with isStripFeatureEnable on; legacy
 * (flag-off) users keep their balance-based flow.
 *
 * @param {string} userId
 */
export async function assertCanNest(userId) {
  const db = await connectDB();
  const user = await db
    .collection("users")
    .findOne(
      { id: userId },
      { projection: { id: 1, freeNestingUsed: 1, subscription: 1 } }
    );

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  if (hasActiveSubscription(user)) {
    return;
  }

  // Period looks expired but we have a subscription on file — the poll may not
  // have caught a renewal yet, so verify against Stripe before denying.
  if (
    user.subscription?.stripeSubscriptionId &&
    (await refreshSubscription(db, user))
  ) {
    return;
  }

  // Atomically consume a free nesting operation. The guard prevents two
  // concurrent requests from both spending the same remaining free slot.
  const consumed = await db.collection("users").findOneAndUpdate(
    { id: userId, freeNestingUsed: { $lt: FREE_NESTING_LIMIT } },
    { $inc: { freeNestingUsed: 1 } }
  );

  if (consumed) {
    return;
  }

  throw createError({
    statusCode: 402,
    statusMessage: "Subscription required",
    data: { reason: "paywall" },
  });
}
