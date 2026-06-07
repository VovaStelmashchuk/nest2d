import { connectDB } from "~/server/db/mongo";
import { getEntitlement } from "~/server/utils/entitlement";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return {};
  }

  const db = await connectDB();
  const user = await db.collection("users").findOne({ id: userId });

  const isStripFeatureEnable = user.isStripFeatureEnable || false;
  const entitlement = isStripFeatureEnable
    ? await getEntitlement(userId)
    : { freeRemaining: 0, subscriptionStatus: null, requiresPaywall: false };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatarUrl || "/api/user/avatar",
    isAdmin: user.isAdmin || false,
    isStripFeatureEnable: isStripFeatureEnable,
    freeRemaining: entitlement.freeRemaining,
    subscriptionStatus: entitlement.subscriptionStatus,
    requiresPaywall: entitlement.requiresPaywall,
  };
});
