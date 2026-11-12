import { MESSAGE_SENDER } from '~/server/features/support/const'
import { getDb } from '~/server/db/postgres'

export async function sendWelcomeMessage(userId) {
    const sql = await getDb()

    await sql`
        INSERT INTO support_messages (user_id, sender, message)
        VALUES (
            ${userId}, ${MESSAGE_SENDER.WELCOME},
            'Welcome to the support channel! We will do our best to help you with your questions and issues.'
        )
    `

    await new Promise((resolve) => setTimeout(resolve, 3000))

    await sql`
        INSERT INTO support_messages (user_id, sender, message)
        VALUES (${userId}, ${MESSAGE_SENDER.WELCOME}, 'If you have any questions or issues, please feel free to ask.')
    `
}
