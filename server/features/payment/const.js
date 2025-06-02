export const variants = [
    {
        variantId: '825383',
        credit: 100
    },
    {
        variantId: '825384',
        credit: 500,
    },
    {
        variantId: '825388',
        credit: 2500,
    }
]

export function getCreditByVariantId(variantId) {
    for (let i = 0; i < variants.length; i++) {
        const variant = variants[i]
        if (variant.variantId == variantId) {
            return variant.credit
        }
    }
    return undefined
}