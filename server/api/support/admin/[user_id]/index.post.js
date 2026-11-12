import { MESSAGE_SENDER } from '~/server/features/support/const'
import { addMessage } from '~/server/features/support/messages'
import { sendNewSupportMessageEmail } from '~/server/features/notification/sendEmail'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    const isAdmin = event.context?.auth?.isAdmin
    if (!userId || !isAdmin) {
        setResponseStatus(event, 401)
        return
    }

    const { message } = await readBody(event)

    const customerId = event.context.params.user_id

    const dbMessage = await addMessage(customerId, MESSAGE_SENDER.SUPPORT, message)

    await sendNewSupportMessageEmail(customerId)

    return dbMessage
})
