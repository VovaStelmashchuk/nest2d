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
 * Creates a Stripe Checkout session for the metered (on-demand) plan. Nothing
 * is charged up front; Checkout only collects a payment method and usage is
 * invoiced monthly in arrears.
 * @param {{
 *   customerId: string,
 *   priceId: string,
 *   userId: string,
 *   internalId: string,
 *   successUrl: string,
 *   cancelUrl: string,
 * }} options
 * @returns {Promise<{id: string, url: string}>}
 */
export async function createMeteredCheckout({
    customerId,
    priceId,
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
    // Metered prices must not carry a quantity.
    params.append('line_items[0][price]', priceId)
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
 * Reports one unit of usage to a Stripe Billing Meter. The identifier makes
 * the call idempotent, so a retried report is not billed twice.
 * @param {{eventName: string, customerId: string, identifier: string, value?: number}} event
 */
export async function reportMeterEvent({ eventName, customerId, identifier, value = 1 }) {
    const params = new URLSearchParams()
    params.append('event_name', eventName)
    params.append('identifier', identifier)
    params.append('payload[stripe_customer_id]', customerId)
    params.append('payload[value]', String(value))

    try {
        await $fetch(`${STRIPE_BASE}/billing/meter_events`, {
            method: 'POST',
            headers: authHeaders('application/x-www-form-urlencoded'),
            body: params,
        })
    } catch (err) {
        // Stripe rejects a repeated identifier: the usage was already recorded
        // by an earlier attempt, so the retry has succeeded.
        if (/already exists/i.test(err?.data?.error?.message || '')) {
            return
        }
        throw err
    }
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
 * Cancels a subscription immediately. An already deleted subscription counts
 * as cancelled.
 * @param {string} subscriptionId
 */
export async function cancelSubscription(subscriptionId) {
    try {
        await $fetch(`${STRIPE_BASE}/subscriptions/${subscriptionId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        })
    } catch (err) {
        if (err?.data?.error?.code === 'resource_missing') {
            return
        }
        throw err
    }
}

/**
 * Maps a raw Stripe subscription object to the fields we persist on the user.
 * @param {any} subscription
 * @returns {{stripeSubscriptionId: string, status: string, currentPeriodEnd: Date, priceId: string, productId: string, updatedAt: Date}}
 */
export function mapSubscription(subscription) {
    const item = subscription?.items?.data?.[0]
    // Since API version 2025-03-31.basil the period lives on the item.
    const periodEnd = subscription.current_period_end ?? item?.current_period_end
    return {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        priceId: item?.price?.id || null,
        productId: item?.price?.product || null,
        updatedAt: new Date(),
    }
}

/**
 * Subscription statuses that grant access to nesting.
 */
export const ACTIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active']

/**
 * Whether a stored subscription is on the on-demand (metered) plan, the only
 * plan that grants access. Matches on the product so subscribers stay on the
 * plan across price changes (Stripe prices are immutable).
 * @param {any} subscription the stored user.subscription
 * @param {any} plan the `subscription_plan` document
 * @returns {boolean}
 */
export function isOnDemandPlan(subscription, plan) {
    if (!subscription || !plan) {
        return false
    }
    return Boolean(
        (plan.productId && subscription.productId === plan.productId) ||
        (plan.priceId && subscription.priceId === plan.priceId)
    )
}
