import { getDb } from '~~/server/db/postgres'
import { generateRandomString } from '~~/server/utils/strings'
import { createCustomer, createMeteredCheckout } from '~~/server/features/payment/stripe'
import { getPlan } from '~~/server/features/payment/store'

const baseUrl = useRuntimeConfig().public.baseUrl

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const sql = await getDb()

    const [user] = await sql`SELECT id, email, stripe_customer_id FROM users WHERE id = ${userId}`
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'User not found' })
    }

    const plan = await getPlan()
    if (!plan?.priceId) {
        throw createError({ statusCode: 503, statusMessage: 'Billing plan not available' })
    }

    // Ensure a Stripe customer exists so the subscription and the usage
    // reports are attached to it.
    let customerId = user.stripeCustomerId
    if (!customerId) {
        customerId = await createCustomer({ email: user.email, userId: user.id })
        await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${user.id}`
    }

    const internalId = generateRandomString(24)
    const redirectUrl = `${baseUrl}/home`

    const { id: sessionId, url } = await createMeteredCheckout({
        customerId,
        priceId: plan.priceId,
        userId: user.id,
        internalId,
        successUrl: `${redirectUrl}?subscriptionInternalId=${internalId}`,
        cancelUrl: redirectUrl,
    })

    await sql`
        INSERT INTO subscription_checkouts (internal_id, user_id, checkout_id, status)
        VALUES (${internalId}, ${user.id}, ${sessionId}, 'created')
    `

    return { url }
})
