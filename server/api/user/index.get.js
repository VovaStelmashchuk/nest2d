import { getDb } from "~/server/db/postgres";
import { getEntitlement } from "~/server/utils/entitlement";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(event, 401);
    return {};
  }

  const sql = await getDb();
  const [user] = await sql`
    SELECT id, name, email, is_admin, is_strip_feature_enable FROM users WHERE id = ${userId}
  `;
  if (!user) {
    setResponseStatus(event, 401);
    return {};
  }

  const entitlement = await getEntitlement(userId);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: "/api/user/avatar",
    isAdmin: user.isAdmin,
    isStripFeatureEnable: user.isStripFeatureEnable,
    freeRemaining: entitlement.freeRemaining,
    subscriptionStatus: entitlement.subscriptionStatus,
    requiresPaywall: entitlement.requiresPaywall,
  };
});
