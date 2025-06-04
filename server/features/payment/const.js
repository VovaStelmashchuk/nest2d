export const variants = [
    {
        stripePriceId: 'price_1RWDw804bHN5Vmavj9dZlHtw',
        credit: 100,
    },
    {
        stripePriceId: 'price_1RWDx004bHN5VmavtNp8mogY',
        credit: 500,
    },
    {
        stripePriceId: 'price_1RWDy004bHN5VmavWeAfqBsz',
        credit: 2500,
    }
]

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