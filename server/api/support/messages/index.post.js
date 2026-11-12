import { MESSAGE_SENDER } from '~/server/features/support/const'
import { addMessage } from '~/server/features/support/messages'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        setResponseStatus(event, 401)
        return
    }

    const { message } = await readBody(event)

    return await addMessage(userId, MESSAGE_SENDER.USER, message)
})
