import { connectDB } from '~~/server/db/mongo'
import { getCreditByVariantId } from '~~/server/features/payment/const'

export default defineEventHandler(async (event) => {
    const signature = getHeader(event, 'X-Signature')
    console.log('signature header', signature)

    const body = await readBody(event)

    const userId = body.meta.custom_data.userId
    const transactionSecret = body.meta.custom_data.transactionSecret
    const webhookId = body.meta.webhook_id

    const db = await connectDB()

    const transaction = await db.collection('transactions').findOne(
        {
            status: 'created',
            userId: userId,
            transactionSecret: transactionSecret,
            webhookId: { $exists: false }
        }
    )

    if (!transaction) {
        return {
            "message": "Transaction not found"
        }
    }

    const orderItem = body.data.attributes.first_order_item
    const variantId = orderItem.variant_id

    await db.collection('transactions').updateOne({ _id: transaction._id }, { $set: { status: 'completed', variantId: variantId } })

    console.log('variantId', variantId)
    console.log('userId', userId)

    let creditAmount = getCreditByVariantId(variantId)
    console.log('creditAmount', creditAmount)

    await db.collection('users').updateOne({ id: userId }, { $inc: { balance: creditAmount } })

    await db.collection('transactions').updateOne({ _id: transaction._id }, { $set: { webhookId: webhookId } })
})