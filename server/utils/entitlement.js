import { createError } from "h3";
import { getDb } from "~~/server/db/postgres";
import { FREE_NESTING_LIMIT } from "~~/server/features/payment/const";
import {
  getPlan,
  getSubscriptionOf,
  saveSubscription,
} from "~~/server/features/payment/store";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  getSubscription,
  isOnDemandPlan,
  mapSubscription,
} from "~~/server/features/payment/stripe";
import logger from "./logger";

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
 * @param {any} user
 * @returns {Promise<boolean>} whether the refreshed subscription is active
 */
async function refreshSubscription(user, plan) {
  const subscriptionId = user?.subscription?.stripeSubscriptionId;
  if (!subscriptionId) {
    return false;
  }
  try {
    const stripeSub = await getSubscription(subscriptionId);
    const mapped = mapSubscription(stripeSub);
    await saveSubscription(user.id, mapped);
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
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countUnbilledJobs(userId) {
  const sql = await getDb();
  const [{ count }] = await sql`
    SELECT (
      (SELECT count(*) FROM nesting_jobs
        WHERE owner_id = ${userId}
          AND billing_status IN ('pending', 'processing')
          AND status NOT IN ('error', 'failed'))
      +
      (SELECT count(*) FROM strip_nesting_jobs
        WHERE owner_id = ${userId}
          AND billing_status IN ('pending', 'processing')
          AND status NOT IN ('error', 'failed'))
    )::int AS count
  `;
  return count;
}

/**
 * @param {string} userId
 * @returns {Promise<{id: string, freeNestingUsed: number, subscription: any}|null>}
 */
async function getUser(userId) {
  const sql = await getDb();
  const [user] = await sql`
    SELECT id, free_nesting_used FROM users WHERE id = ${userId}
  `;
  if (!user) {
    return null;
  }
  return { ...user, subscription: await getSubscriptionOf(userId) };
}

/**
 * Read-only entitlement summary for UI (banner, paywall state).
 * @param {string} userId
 * @returns {Promise<{freeRemaining: number, subscriptionStatus: string|null, requiresPaywall: boolean}>}
 */
export async function getEntitlement(userId) {
  const user = await getUser(userId);

  const plan = await getPlan();
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
  const user = await getUser(userId);

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const plan = await getPlan();
  if (hasActiveSubscription(user, plan)) {
    return;
  }

  // Period looks expired but we have a subscription on file — the poll may not
  // have caught a renewal yet, so verify against Stripe before denying.
  if (
    user.subscription?.stripeSubscriptionId &&
    (await refreshSubscription(user, plan))
  ) {
    return;
  }

  const reserved = await countUnbilledJobs(userId);
  if ((user.freeNestingUsed || 0) + reserved < FREE_NESTING_LIMIT) {
    return;
  }

  throw createError({
    statusCode: 402,
    statusMessage: "Payment method required",
    data: { reason: "paywall" },
  });
}
