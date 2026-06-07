const STRIPE_BASE = 'https://api.stripe.com/v1'

function authHeaders(contentType) {
    const stripeSecretKey = useRuntimeConfig().stripeSecretKey
    const headers = {
        'Authorization': `Bearer ${stripeSecretKey}`,
    }
    if (contentType) {
        headers['Content-Type'] = contentType
    }
    return headers
}

/**
 * Creates (or returns) a Stripe customer for the given user.
 * @param {{email: string, userId: string}} user
 * @returns {Promise<string>} the Stripe customer id
 */
export async function createCustomer({ email, userId }) {
    const params = new URLSearchParams()
    if (email) {
        params.append('email', email)
    }
    params.append('metadata[userId]', userId)

    const response = await $fetch(`${STRIPE_BASE}/customers`, {
        method: 'POST',
        headers: authHeaders('application/x-www-form-urlencoded'),
        body: params,
    })
    return response.id
}

/**
 * Creates a Stripe Checkout session in subscription mode with a free trial.
 * @param {{
 *   customerId: string,
 *   priceId: string,
 *   currency: string,
 *   trialDays: number,
 *   userId: string,
 *   internalId: string,
 *   successUrl: string,
 *   cancelUrl: string,
 * }} options
 * @returns {Promise<{id: string, url: string}>}
 */
export async function createSubscriptionCheckout({
    customerId,
    priceId,
    currency,
    trialDays,
    userId,
    internalId,
    successUrl,
    cancelUrl,
}) {
    const params = new URLSearchParams()
    params.append('mode', 'subscription')
    params.append('customer', customerId)
    params.append('success_url', successUrl)
    params.append('cancel_url', cancelUrl)
    params.append('line_items[0][price]', priceId)
    params.append('line_items[0][quantity]', '1')
    if (currency) {
        params.append('currency', currency)
    }
    if (trialDays > 0) {
        params.append('subscription_data[trial_period_days]', String(trialDays))
    }
    params.append('client_reference_id', userId)
    params.append('metadata[userId]', userId)
    params.append('metadata[internalId]', internalId)
    params.append('allow_promotion_codes', 'true')

    const response = await $fetch(`${STRIPE_BASE}/checkout/sessions`, {
        method: 'POST',
        headers: authHeaders('application/x-www-form-urlencoded'),
        body: params,
    })
    return { id: response.id, url: response.url }
}

/**
 * Reads a checkout session, expanding the created subscription.
 * @param {string} checkoutId
 * @returns {Promise<any>}
 */
export async function getCheckoutSession(checkoutId) {
    return await $fetch(`${STRIPE_BASE}/checkout/sessions/${checkoutId}`, {
        method: 'GET',
        headers: authHeaders('application/x-www-form-urlencoded'),
        query: {
            'expand[]': 'subscription',
        },
    })
}

/**
 * Reads the current state of a subscription from Stripe.
 * @param {string} subscriptionId
 * @returns {Promise<any>}
 */
export async function getSubscription(subscriptionId) {
    return await $fetch(`${STRIPE_BASE}/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: authHeaders('application/x-www-form-urlencoded'),
    })
}

/**
 * Maps a raw Stripe subscription object to the fields we persist on the user.
 * @param {any} subscription
 * @returns {{stripeSubscriptionId: string, status: string, currentPeriodEnd: Date, priceId: string, updatedAt: Date}}
 */
export function mapSubscription(subscription) {
    const item = subscription?.items?.data?.[0]
    return {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
        priceId: item?.price?.id || null,
        updatedAt: new Date(),
    }
}

/**
 * Subscription statuses that grant access to nesting.
 */
export const ACTIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active']
