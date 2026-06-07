import { connectDB } from '~~/server/db/mongo'
import { getCurrencyByCountry } from '~~/server/utils/currency'
import { getEntitlement } from '~~/server/utils/entitlement'
import { TRIAL_DAYS } from '~~/server/features/payment/const'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const db = await connectDB()
    const plan = await db.collection('subscription_plan').findOne({ id: 'subscription' })

    const country = getHeader(event, 'cf-ipcountry')
    const currency = getCurrencyByCountry(country)

    const entitlement = await getEntitlement(userId)

    let planView = null
    if (plan) {
        const amount = plan.prices?.[currency] ?? plan.prices?.['usd'] ?? 0
        const finalCurrency = plan.prices?.[currency] != null ? currency : 'usd'
        planView = {
            priceId: plan.priceId,
            title: plan.title,
            description: plan.description,
            interval: plan.interval,
            amount: amount / 100,
            currency: finalCurrency,
            trialDays: TRIAL_DAYS,
        }
    }

    return {
        plan: planView,
        ...entitlement,
    }
})
