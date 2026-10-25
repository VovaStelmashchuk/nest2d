import { connectDB } from '~~/server/db/mongo'
import { getEntitlement } from '~~/server/utils/entitlement'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const db = await connectDB()
    const plan = await db.collection('subscription_plan').findOne({ id: 'subscription' })

    const entitlement = await getEntitlement(userId)

    let planView = null
    if (plan) {
        planView = {
            priceId: plan.priceId,
            title: plan.title,
            description: plan.description,
            interval: plan.interval,
            // Price per successful nesting run in major currency units.
            unitAmount: Number(plan.unitAmountDecimal || 0) / 100,
            currency: plan.currency || 'usd',
        }
    }

    return {
        plan: planView,
        ...entitlement,
    }
})
