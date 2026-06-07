import { connectDB } from '~~/server/db/mongo'
import { getCheckoutSession, mapSubscription } from '~~/server/features/payment/stripe'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const internalId = getQuery(event).subscriptionInternalId
    if (!internalId) {
        return { status: 'missing' }
    }

    const db = await connectDB()

    const checkout = await db
        .collection('subscription_checkouts')
        .findOne({ internalId, userId })

    if (!checkout) {
        return { status: 'not_found' }
    }

    const session = await getCheckoutSession(checkout.checkoutId)
    const subscription = session?.subscription

    if (!subscription || typeof subscription !== 'object') {
        return { status: 'pending' }
    }

    const mapped = mapSubscription(subscription)

    await db
        .collection('users')
        .updateOne({ id: userId }, { $set: { subscription: mapped } })

    await db
        .collection('subscription_checkouts')
        .updateOne(
            { _id: checkout._id },
            { $set: { status: 'completed', updatedAt: new Date() } }
        )

    return { status: mapped.status }
})
