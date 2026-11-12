import { streamMessages } from '~~/server/features/support/messages'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    const isAdmin = event.context?.auth?.isAdmin
    if (!userId || !isAdmin) {
        setResponseStatus(event, 401)
        return
    }

    const customerId = event.context.params.user_id

    return streamMessages(event, customerId)
})
