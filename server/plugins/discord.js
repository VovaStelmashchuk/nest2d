import Eris from 'eris'
import { connectDB } from '~~/server/db/mongo'

export default defineNitroPlugin(async () => {
    logger.info("Discord bot plugin start");
    const bot = new Eris(useRuntimeConfig().discordToken, {
        intents: ['guildMessages', 'messageContent'],
        autoreconnect: true
    })

    bot.on('ready', () => {
        logger.info('Discord bot is ready!')
    })

    bot.on('error', (err) => {
        console.error(err)
    })

    const discordGuildId = useRuntimeConfig().public.discordGuildId

    bot.on('messageCreate', (msg) => {
        if (msg.author.bot) return

        if (msg.content.toLowerCase() === '!serverid') {
            bot.createMessage(msg.channel.id, `Server ID: ${msg.guildID}`)
        } else {
            if (msg.guildID === discordGuildId) {
                handleDiscordMessage(msg.content, msg.channel.id).then(() => {
                    bot.addMessageReaction(msg.channel.id, msg.id, '✅')
                })
            } else {
                console.log(
                    'Message from the wrong server',
                    msg.content,
                    msg.guildID
                )
            }
        }
    })

    bot.connect()
})

async function handleDiscordMessage(content, channelId) {
    const db = await connectDB()

    const user = await db
        .collection('users')
        .findOne({ supportChannelId: channelId })

    if (user) {
        const userId = user.id

        await db.collection('supportMessages').insertOne({
            userId: userId,
            sender: 'support',
            message: content,
            timestamp: new Date()
        })
    }
}
