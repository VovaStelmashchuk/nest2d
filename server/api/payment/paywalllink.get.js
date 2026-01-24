import { connectDB } from '~~/server/db/mongo'
import { generateRandomString } from '~~/server/utils/strings'

const baseUrl = useRuntimeConfig().public.baseUrl
const stripeSecretKey = useRuntimeConfig().stripeSecretKey
const redirectUrl = `${baseUrl}/home`

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    const stripePriceId = getQuery(event).stripePriceId

    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: 'User not found'
        })
    }

    const db = await connectDB()

    const user = await db.collection('users').findOne({ id: userId })
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'User not found'
        })
    }

    const product = await db.collection('products').findOne({ stripePriceId: stripePriceId })
    if (!product) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Product not found'
        })
    }

    const transactionInternalId = generateRandomString(24)

    const params = new URLSearchParams()
    params.append('success_url', redirectUrl + '?checkoutInternalId=' + transactionInternalId)
    params.append('cancel_url', redirectUrl)
    params.append('mode', 'payment')
    params.append('customer_email', user.email)
    params.append('client_reference_id', user.id)
    params.append('line_items[0][price]', stripePriceId)
    params.append('line_items[0][quantity]', '1')
    params.append('metadata[userId]', user.id)
    params.append('metadata[transactionInternalId]', transactionInternalId)
    params.append('allow_promotion_codes', 'true')

    const responseData = await $fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
    })

    const sessionId = responseData.id
    const url = responseData.url

    await db.collection('transactions').insertOne({
        stripePriceId: stripePriceId,
        credit: product.balance,
        transactionInternalId: transactionInternalId,
        userId: user.id,
        checkoutId: sessionId,
        status: 'created',
        attempt: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    return {
        url: url
    }
})
