import { connectDB } from '~~/server/db/mongo'

export async function getStripeVariants() {
    const db = await connectDB()
    const prices = await db.collection('paywallProduct').find({}).toArray()
    return prices
}

export function getCreditByStripePriceId(stripePriceId) {
    for (let i = 0; i < variants.length; i++) {
        const variant = variants[i]
        if (variant.stripePriceId == stripePriceId) {
            return variant.credit
        }
    }
    return undefined
}

export function getStripePriceIdByVariantId(variantId) {
    for (let i = 0; i < variants.length; i++) {
        const variant = variants[i]
        if (variant.stripePriceId == variantId) {
            return variant.stripePriceId
        }
    }
    return undefined
}
