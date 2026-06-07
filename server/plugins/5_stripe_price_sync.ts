import { connectDB } from '~~/server/db/mongo'

export default defineNitroPlugin(async (nitroApp) => {
    const config = useRuntimeConfig()
    const stripeSecretKey = config.stripeSecretKey

    console.log('Starting Stripe product sync...')

    const productResponse = await $fetch<{ data: any[] }>('https://api.stripe.com/v1/products', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
        },
        query: {
            active: 'true',
            limit: 100,
            'expand[]': 'data.default_price'
        }
    })

    console.log('Fetched', productResponse.data.length, 'products from Stripe.')

    // The subscription plan is synced separately (6_subscription_plan_sync) and
    // must not appear in the pay-as-you-go credit list.
    const isSubscription = (product: any) => {
        if (product.metadata?.type === 'subscription') {
            return true
        }
        const price = product.default_price
        return typeof price === 'object' && price?.recurring != null
    }

    const creditProducts = productResponse.data.filter((p: any) => !isSubscription(p))
    const excludedIds = productResponse.data
        .filter((p: any) => isSubscription(p))
        .map((p: any) => p.id)

    const products = await Promise.all(creditProducts.map(async (product: any) => {
        const defaultPriceId = typeof product.default_price === 'object' ? product.default_price.id : product.default_price
        let priceData = product.default_price

        if (defaultPriceId) {
            try {
                priceData = await $fetch(`https://api.stripe.com/v1/prices/${defaultPriceId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${stripeSecretKey}`,
                    },
                    query: {
                        'expand[]': 'currency_options'
                    }
                })
            } catch (e) {
                console.error(`Failed to fetch price details for ${defaultPriceId}`, e)
            }
        }

        const price = priceData
        const prices: Record<string, number> = {}

        if (price?.currency_options) {
            for (const [currency, option] of Object.entries(price.currency_options)) {
                prices[currency] = (option as any).unit_amount
            }
        }

        if (price?.currency && !prices[price.currency]) {
            prices[price.currency] = price.unit_amount
        }

        return {
            id: product.id,
            stripePriceId: price?.id,
            title: product.name,
            description: product.description,
            balance: Number(product.metadata?.balance || 0),
            prices: prices,
            updatedAt: new Date()
        }
    }))

    const db = await connectDB()
    const collection = db.collection('products')

    // Remove any subscription products that were synced before they were
    // excluded, so the credit list stays pay-as-you-go only.
    if (excludedIds.length > 0) {
        await collection.deleteMany({ id: { $in: excludedIds } })
    }

    if (products.length > 0) {
        const operations = products.map((p: any) => ({
            updateOne: {
                filter: { id: p.id },
                update: { $set: p },
                upsert: true
            }
        }))

        await collection.bulkWrite(operations)
        console.log(`Synced ${products.length} credit products from Stripe to MongoDB.`)
    } else {
        console.warn('[stripe-price-sync] No pay-as-you-go credit products found in Stripe.')
    }
})
