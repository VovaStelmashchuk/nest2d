import { getStripeSecretKey } from '~~/server/utils/config'

const stripeSecretKey = getStripeSecretKey()

export async function getTransactionStatus(transactionId) {
    const response = await $fetch(`https://api.stripe.com/v1/checkout/sessions/${transactionId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })
    return response.payment_status
}