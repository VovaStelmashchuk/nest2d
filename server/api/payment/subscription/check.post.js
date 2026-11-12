import { getDb } from '~~/server/db/postgres'
import { getCheckoutSession, mapSubscription } from '~~/server/features/payment/stripe'
import { saveSubscription } from '~~/server/features/payment/store'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const internalId = getQuery(event).subscriptionInternalId
    if (!internalId) {
        return { status: 'missing' }
    }

    const sql = await getDb()

    const [checkout] = await sql`
        SELECT id, checkout_id FROM subscription_checkouts
        WHERE internal_id = ${String(internalId)} AND user_id = ${userId}
    `

    if (!checkout) {
        return { status: 'not_found' }
    }

    const session = await getCheckoutSession(checkout.checkoutId)
    const subscription = session?.subscription

    if (!subscription || typeof subscription !== 'object') {
        return { status: 'pending' }
    }

    const mapped = mapSubscription(subscription)

    await saveSubscription(userId, mapped)

    await sql`
        UPDATE subscription_checkouts SET status = 'completed', updated_at = now()
        WHERE id = ${checkout.id}
    `

    return { status: mapped.status }
})
