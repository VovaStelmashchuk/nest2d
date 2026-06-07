import { connectDB } from '~~/server/db/mongo'
import { generateRandomString } from '~~/server/utils/strings'
import { getCurrencyByCountry } from '~~/server/utils/currency'
import { createCustomer, createSubscriptionCheckout } from '~~/server/features/payment/stripe'
import { TRIAL_DAYS } from '~~/server/features/payment/const'

const baseUrl = useRuntimeConfig().public.baseUrl

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const db = await connectDB()

    const user = await db.collection('users').findOne({ id: userId })
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'User not found' })
    }

    const plan = await db.collection('subscription_plan').findOne({ id: 'subscription' })
    if (!plan?.priceId) {
        throw createError({ statusCode: 503, statusMessage: 'Subscription plan not available' })
    }

    // Ensure a Stripe customer exists so the subscription is attached to it.
    let customerId = user.stripeCustomerId
    if (!customerId) {
        customerId = await createCustomer({ email: user.email, userId: user.id })
        await db
            .collection('users')
            .updateOne({ id: user.id }, { $set: { stripeCustomerId: customerId } })
    }

    const country = getHeader(event, 'cf-ipcountry')
    const currency = plan.prices?.[getCurrencyByCountry(country)] != null
        ? getCurrencyByCountry(country)
        : 'usd'

    const internalId = generateRandomString(24)
    const redirectUrl = `${baseUrl}/home`

    const { id: sessionId, url } = await createSubscriptionCheckout({
        customerId,
        priceId: plan.priceId,
        currency,
        trialDays: TRIAL_DAYS,
        userId: user.id,
        internalId,
        successUrl: `${redirectUrl}?subscriptionInternalId=${internalId}`,
        cancelUrl: redirectUrl,
    })

    await db.collection('subscription_checkouts').insertOne({
        internalId,
        userId: user.id,
        checkoutId: sessionId,
        status: 'created',
        attempt: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    return { url }
})
