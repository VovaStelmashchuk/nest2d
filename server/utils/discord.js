import { getDiscord } from '~/server/utils/config'

const discordToken = getDiscord().botToken
const discordServerId = getDiscord().guildId

export async function createChannel(name, initialMessage) {
    const data = await $fetch(
        `https://discord.com/api/v10/guilds/${discordServerId}/channels`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bot ${discordToken}`,
                'Content-Type': 'application/json'
            },
            body: {
                name: name,
                type: 0,
                permission_overwrites: [
                    {
                        id: discordServerId,
                        type: 0,
                        deny: 1024
                    }
                ]
            }
        }
    )
    if (initialMessage) {
        await sendMessage(data.id, initialMessage)
    }
    return data.id
}

export async function sendMessage(channelId, messageContent) {
    const data = await $fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bot ${discordToken}`,
                'Content-Type': 'application/json'
            },
            body: {
                content: messageContent
            }
        }
    )
    return data
}
