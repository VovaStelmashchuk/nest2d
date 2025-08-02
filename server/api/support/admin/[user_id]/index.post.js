import { connectDB } from '~/server/db/mongo'
import { MESSAGE_SENDER } from '~/server/features/support/const'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    const isAdmin = event.context?.auth?.isAdmin
    if (!userId || !isAdmin) {
        setResponseStatus(401)
        return
    }

    const { message } = await readBody(event)

    const customerId = event.context.params.user_id

    const db = await connectDB()
    const record = await db.collection('supportMessages').insertOne({
        userId: customerId,
        sender: MESSAGE_SENDER.SUPPORT,
        message: message,
        timestamp: new Date()
    })

    const { insertedId } = record

    const dbMessage = await db
        .collection('supportMessages')
        .findOne({ _id: insertedId })

    return dbMessage
})
