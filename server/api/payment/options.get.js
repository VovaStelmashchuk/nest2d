import { getStripeVariants } from '~~/server/features/payment/const'

export default defineEventHandler(async (event) => {
    return {
        options: await getStripeVariants()
    }
});