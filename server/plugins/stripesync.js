import { connectDB } from "../db/mongo";
import { getTransactionStatus } from "../features/payment/sync";

export default defineNitroPlugin(async (_) => {
    console.log('Stripe sync plugin start')
    const db = await connectDB()

    await db
        .collection('transactions')
        .updateMany({ status: 'processing' }, { $set: { status: 'created' } })

    console.log('Cleared processing transactions')

    while (true) {
        const transaction = await db
            .collection('transactions')
            .findOneAndUpdate(
                {
                    status: 'created',
                    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
                },
                { $set: { status: 'processing', updatedAt: new Date() } },
                { returnDocument: 'after' }
            )

        console.log('Found transaction', transaction)

        if (transaction) {
            await db.collection('transactions').updateOne({ _id: transaction._id }, { $inc: { attempt: 1 } })
            const status = await getTransactionStatus(transaction.checkoutId)
            if (status === 'paid') {
                await db.collection('users').updateOne({ id: transaction.userId }, { $inc: { balance: transaction.credit } })
                await db.collection('transactions').updateOne({ _id: transaction._id }, { $set: { status: 'completed', updatedAt: new Date() } })
            } else {
                await db.collection('transactions').updateOne({ _id: transaction._id }, { $set: { status: 'created', updatedAt: new Date() } })
            }
        } else {
            await new Promise((resolve) => setTimeout(resolve, 30 * 1000))
        }
    }
})