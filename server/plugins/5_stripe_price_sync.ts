import { connectDB } from '~~/server/db/mongo'

export default defineNitroPlugin(async (nitroApp) => {
    const config = useRuntimeConfig()
    const stripeSecretKey = config.stripeSecretKey

    try {
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


        const products = await Promise.all(productResponse.data.map(async (product: any) => {
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

        if (products.length > 0) {
            const db = await connectDB()
            const collection = db.collection('products')

            const operations = products.map((p: any) => ({
                updateOne: {
                    filter: { id: p.id },
                    update: { $set: p },
                    upsert: true
                }
            }))

            await collection.bulkWrite(operations)
            console.log(`Synced ${products.length} products from Stripe to MongoDB.`)
        } else {
            console.log('No active products found in Stripe.')
        }

    } catch (error) {
        console.error('Failed to sync Stripe products:', error)
    }
})
