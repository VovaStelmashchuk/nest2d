import { connectDB } from '~~/server/db/mongo'
import { getBaseUrl, getStripeSecretKey } from '~~/server/utils/config'
import { generateRandomString } from '~~/server/utils/strings'
import { getStripeVariants } from '~~/server/features/payment/const'

const baseUrl = getBaseUrl()
const stripeSecretKey = getStripeSecretKey()
const redirectUrl = `${baseUrl}/home`

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    const stripePriceId = getQuery(event).stripePriceId

    if (!userId) {
        setResponseStatus(401)
        return
    }

    const db = await connectDB()

    const user = await db.collection('users').findOne({ id: userId })
    if (!user) {
        setResponseStatus(401)
        return
    }

    const transactionInternalId = generateRandomString(24)
    const variant = (await getStripeVariants()).find(v => v.stripePriceId === stripePriceId)
    if (!variant) {
        setResponseStatus(400)
        return { error: 'Invalid stripePriceId' }
    }

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
        stripePriceId: variant.stripePriceId,
        credit: variant.credit,
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
