import { createError } from "h3";
import { connectDB } from "~~/server/db/mongo";
import {
  FREE_NESTING_LIMIT,
  NESTING_JOB_COLLECTIONS,
} from "~~/server/features/payment/const";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  getSubscription,
  isOnDemandPlan,
  mapSubscription,
} from "~~/server/features/payment/stripe";
import logger from "./logger";

/**
 * @param {import('mongodb').Db} db
 * @returns {Promise<any>} the on-demand plan, or null before the first sync
 */
function getPlan(db) {
  return db.collection("subscription_plan").findOne({ id: "subscription" });
}

/**
 * Returns true if the user's stored subscription is on the on-demand plan and
 * currently grants access.
 * @param {any} user
 * @param {any} plan
 * @returns {boolean}
 */
function hasActiveSubscription(user, plan) {
  const subscription = user?.subscription;
  if (!isOnDemandPlan(subscription, plan)) {
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
async function refreshSubscription(db, user, plan) {
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
    return hasActiveSubscription({ subscription: mapped }, plan);
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
 * Counts the user's nesting jobs that are queued or running and not billed
 * yet. Each of them will consume a free run (or be billed) once it succeeds,
 * so they are reserved against the free quota at enqueue time.
 * @param {import('mongodb').Db} db
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countUnbilledJobs(db, userId) {
  const filter = {
    ownerId: userId,
    billingStatus: { $in: ["pending", "processing"] },
    status: { $nin: ["error", "failed"] },
  };
  const counts = await Promise.all(
    NESTING_JOB_COLLECTIONS.map((name) =>
      db.collection(name).countDocuments(filter)
    )
  );
  return counts.reduce((acc, count) => acc + count, 0);
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

  const plan = await getPlan(db);
  const subscriptionStatus = isOnDemandPlan(user?.subscription, plan)
    ? user.subscription.status
    : null;
  const active = hasActiveSubscription(user, plan);
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
 * Gate for nesting requests.
 *
 * Allows the request when the user has an active on-demand subscription, or
 * when free runs remain after reserving the user's queued and running jobs.
 * Nothing is consumed here: the usage billing job spends a free run or reports
 * usage to Stripe only once a job finishes successfully. Throws a 402 with a
 * paywall reason when neither is available.
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

  const plan = await getPlan(db);
  if (hasActiveSubscription(user, plan)) {
    return;
  }

  // Period looks expired but we have a subscription on file — the poll may not
  // have caught a renewal yet, so verify against Stripe before denying.
  if (
    user.subscription?.stripeSubscriptionId &&
    (await refreshSubscription(db, user, plan))
  ) {
    return;
  }

  const reserved = await countUnbilledJobs(db, userId);
  if ((user.freeNestingUsed || 0) + reserved < FREE_NESTING_LIMIT) {
    return;
  }

  throw createError({
    statusCode: 402,
    statusMessage: "Payment method required",
    data: { reason: "paywall" },
  });
}
