import { MESSAGE_SENDER } from '~/server/features/support/const'
import { connectDB } from '~/server/db/mongo'

export async function sendWelcomeMessage(userId) {
    const db = await connectDB()
    const user = await db.collection('users').findOne({ id: userId })
    if (!user) {
        return
    }

    db.collection('supportMessages').insertOne({
        userId: userId,
        sender: MESSAGE_SENDER.WELCOME,
        message: 'Welcome to the support channel! We will do our best to help you with your questions and issues.',
        timestamp: new Date()
    })

    await new Promise((resolve) => setTimeout(resolve, 3000))

    db.collection('supportMessages').insertOne({
        userId: userId,
        sender: MESSAGE_SENDER.WELCOME,
        message: 'If you have any questions or issues, please feel free to ask.',
        timestamp: new Date()
    })
}