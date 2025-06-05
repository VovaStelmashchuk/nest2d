import { createChannel } from '~/server/utils/discord'
import { connectDB } from '~/server/db/mongo'

const creatingInProgress = new Set()

export async function createSupportChatIfNeeded(userId) {
    const db = await connectDB()

    const supportChannelId = (await db.collection('users').findOne({ id: userId }))?.supportChannelId

    if (supportChannelId) {
        return supportChannelId
    }

    if (creatingInProgress.has(userId)) {
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const supportChannelId = (await db.collection('users').findOne({ id: userId }))?.supportChannelId

            if (supportChannelId) {
                return supportChannelId
            }
        }
        throw new Error('Support channel creation is pending')
    } else {
        try {
            creatingInProgress.add(userId)

            const user = await db.collection('users').findOne({ id: userId })

            const channelName = `${user.name}-${user.id}`
            const initMessage = `Support channel created for ${user.name} (${user.id})`

            const channelId = await createChannel(channelName, initMessage)

            await db.collection('users').updateOne(
                { id: userId },
                { $set: { supportChannelId: channelId } }
            )

            return channelId
        } catch (err) {
            await db.collection('users').updateOne(
                { id: userId },
                { $unset: { supportChannelId: '' } }
            )
            throw err
        } finally {
            creatingInProgress.delete(userId)
        }
    }
}