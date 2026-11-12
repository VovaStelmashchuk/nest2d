import { streamMessages } from '~~/server/features/support/messages'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        setResponseStatus(event, 401)
        return
    }

    return streamMessages(event, userId)
})
