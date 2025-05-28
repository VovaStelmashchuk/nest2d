import { createChannel } from '~/server/utils/discord'
import { connectDB } from '~/server/db/mongo'

export async function createSupportChat(userId) {
    const db = await connectDB()
    const user = await db.collection('users').findOne({ id: userId })
    if (!user) {
        return
    }

    const channelName = `${user.name}-${user.id}`
    const initMessage = `Support channel created for ${user.name} (${user.id})`
    const channelId = await createChannel(channelName, initMessage)

    await db.collection('users').updateOne(
        { id: userId },
        {
            $set: {
                supportChannelId: channelId
            }
        }
    )
}