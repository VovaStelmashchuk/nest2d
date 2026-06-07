import { connectDB } from '~~/server/db/mongo'

/**
 * Syncs the monthly subscription plan from Stripe into the `subscription_plan`
 * collection (a single document). The plan is identified as a Product whose
 * default price is recurring; mark it with metadata.type=subscription in Stripe
 * to disambiguate from any legacy one-time credit products.
 */
export default defineNitroPlugin(async () => {
    const config = useRuntimeConfig()
    const stripeSecretKey = config.stripeSecretKey

    if (!stripeSecretKey) {
        console.warn('[subscription-plan-sync] No Stripe secret key, skipping.')
        return
    }

    console.log('Starting Stripe subscription plan sync...')

    const productResponse = await $fetch<{ data: any[] }>('https://api.stripe.com/v1/products', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
        },
        query: {
            active: 'true',
            limit: 100,
            'expand[]': 'data.default_price',
        },
    })

    const candidates = productResponse.data.filter((product: any) => {
        if (product.metadata?.type === 'subscription') {
            return true
        }
        const price = product.default_price
        return typeof price === 'object' && price?.recurring != null
    })

    if (candidates.length === 0) {
        console.warn('[subscription-plan-sync] No subscription product found in Stripe.')
        return
    }

    if (candidates.length > 1) {
        console.warn(
            `[subscription-plan-sync] Found ${candidates.length} subscription candidates; using the first.`
        )
    }

    const product = candidates[0]
    const defaultPriceId =
        typeof product.default_price === 'object'
            ? product.default_price.id
            : product.default_price

    let priceData = product.default_price
    if (defaultPriceId) {
        priceData = await $fetch(`https://api.stripe.com/v1/prices/${defaultPriceId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
            },
            query: {
                'expand[]': 'currency_options',
            },
        })
    }

    const prices: Record<string, number> = {}
    if (priceData?.currency_options) {
        for (const [currency, option] of Object.entries(priceData.currency_options)) {
            prices[currency] = (option as any).unit_amount
        }
    }
    if (priceData?.currency && !prices[priceData.currency]) {
        prices[priceData.currency] = priceData.unit_amount
    }

    const plan = {
        id: 'subscription',
        productId: product.id,
        priceId: priceData?.id,
        title: product.name,
        description: product.description,
        interval: priceData?.recurring?.interval || 'month',
        prices,
        updatedAt: new Date(),
    }

    const db = await connectDB()
    await db
        .collection('subscription_plan')
        .updateOne({ id: 'subscription' }, { $set: plan }, { upsert: true })

    console.log('[subscription-plan-sync] Synced subscription plan', plan.priceId)
})
