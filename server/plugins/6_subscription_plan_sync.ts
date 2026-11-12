import { getDb } from '~~/server/db/postgres'

/**
 * Syncs the on-demand (metered) plan from Stripe into the `subscription_plan`
 * table (a single row). The plan is the Product marked with
 * metadata.type=metered, created by scripts/stripe-setup-metered.mjs. Its
 * default price is a metered price attached to a Billing Meter.
 */
export default defineNitroPlugin(async () => {
    const config = useRuntimeConfig()
    const stripeSecretKey = config.stripeSecretKey

    if (!stripeSecretKey) {
        console.warn('[subscription-plan-sync] No Stripe secret key, skipping.')
        return
    }

    console.log('Starting Stripe metered plan sync...')

    const headers = { 'Authorization': `Bearer ${stripeSecretKey}` }

    const productResponse = await $fetch<{ data: any[] }>('https://api.stripe.com/v1/products', {
        method: 'GET',
        headers,
        query: {
            active: 'true',
            limit: 100,
            'expand[]': 'data.default_price',
        },
    })

    const product = productResponse.data.find((p: any) => p.metadata?.type === 'metered')
    if (!product) {
        console.warn('[subscription-plan-sync] No product with metadata.type=metered found in Stripe.')
        return
    }

    const price = product.default_price
    if (typeof price !== 'object' || price?.recurring?.usage_type !== 'metered' || !price.recurring.meter) {
        console.warn('[subscription-plan-sync] Metered product has no metered default price.', product.id)
        return
    }

    const meter = await $fetch<any>(`https://api.stripe.com/v1/billing/meters/${price.recurring.meter}`, {
        method: 'GET',
        headers,
    })

    const plan = {
        id: 'subscription',
        productId: product.id,
        priceId: price.id,
        meterEventName: meter.event_name,
        title: product.name,
        description: product.description,
        interval: price.recurring.interval || 'month',
        currency: price.currency,
        // Price per unit in cents, as a decimal string (e.g. "10").
        unitAmountDecimal: price.unit_amount_decimal,
        updatedAt: new Date(),
    }

    const sql = await getDb()
    await sql`
        INSERT INTO subscription_plan ${sql(plan)}
        ON CONFLICT (id) DO UPDATE SET
            product_id = EXCLUDED.product_id,
            price_id = EXCLUDED.price_id,
            meter_event_name = EXCLUDED.meter_event_name,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            interval = EXCLUDED.interval,
            currency = EXCLUDED.currency,
            unit_amount_decimal = EXCLUDED.unit_amount_decimal,
            updated_at = EXCLUDED.updated_at
    `

    console.log('[subscription-plan-sync] Synced metered plan', plan.priceId)
})
