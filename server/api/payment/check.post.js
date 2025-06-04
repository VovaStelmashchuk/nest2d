import { connectDB } from '~~/server/db/mongo'
import { getTransactionStatus } from '~~/server/features/payment/sync'

export default defineEventHandler(async (event) => {
    const checkoutInternalId = getQuery(event).checkoutInternalId

    if (!checkoutInternalId) {
        return { error: 'No checkoutInternalId' }
    }

    const db = await connectDB()

    const transaction = await db
        .collection('transactions')
        .findOneAndUpdate({ transactionInternalId: checkoutInternalId, status: 'created' }, { $set: { status: 'processing' } }, { returnDocument: 'after' })

    if (!transaction) {
        return { error: 'Transaction not found' }
    }

    const status = await getTransactionStatus(transaction.checkoutId)
    if (status === 'paid') {
        await db.collection('users').updateOne({ id: transaction.userId }, { $inc: { balance: transaction.credit } })
        await db.collection('transactions').updateOne({ _id: transaction._id }, { $set: { status: 'completed', updatedAt: new Date() } })
        return { status: 'yep' }
    } else {
        await db.collection('transactions').updateOne({ _id: transaction._id }, { $set: { status: 'created', updatedAt: new Date() } })
        return { status: 'not found' }
    }
})