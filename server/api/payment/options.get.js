import { connectDB } from '~~/server/db/mongo'
import { getCurrencyByCountry } from '~/server/utils/currency'

export default defineEventHandler(async (event) => {
    const db = await connectDB()
    const products = await db.collection('products').find({}).toArray()

    const country = getHeader(event, 'cf-ipcountry')
    const currency = getCurrencyByCountry(country)

    const options = products
        .map(product => {
            const priceAmount = product.prices?.[currency] || product.prices?.['usd'] || 0
            const finalCurrency = product.prices?.[currency] ? currency : 'usd'

            return {
                stripePriceId: product.stripePriceId,
                credit: product.balance,
                title: product.title,
                description: product.description,
                amount: priceAmount / 100,
                currency: finalCurrency,
            }
        })
        .sort((a, b) => a.amount - b.amount)

    return {
        options
    }
})