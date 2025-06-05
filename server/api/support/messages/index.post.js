import { connectDB } from '~/server/db/mongo'
import { MESSAGE_SENDER } from '~/server/features/support/const'
import { createSupportChatIfNeeded } from '~~/server/features/support/createSupportChat'
import { sendMessage } from '~~/server/utils/discord'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        setResponseStatus(401)
        return
    }

    const { message } = await readBody(event)

    const db = await connectDB()
    const record = await db.collection('supportMessages').insertOne({
        userId: userId,
        sender: MESSAGE_SENDER.USER,
        message: message,
        timestamp: new Date()
    })

    const { insertedId } = record

    const user = await db.collection('users').findOne({ id: userId })
    let userSupportChannelId = user.supportChannelId

    if (!userSupportChannelId) {
        userSupportChannelId = await createSupportChatIfNeeded(userId)
    }

    await sendMessage(userSupportChannelId, message)

    const dbMessage = await db
        .collection('supportMessages')
        .findOne({ _id: insertedId })

    return dbMessage
})
