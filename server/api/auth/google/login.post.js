import { TRACKING_COOKIE_NAME } from '~~/server/tracking/const'
import { getCookie } from 'h3'
import { createOrUpdateUser } from '~~/server/utils/user'
import { setSessionCookie } from '~~/server/utils/user'

export default defineEventHandler(async (event) => {
    const { googleAccessToken } = await readBody(event)

    const url = new URL('https://www.googleapis.com/oauth2/v3/userinfo')
    url.searchParams.append('access_token', googleAccessToken)

    const data = await $fetch(url)

    const { sub, picture, email, name } = data

    if (!sub || !email || !picture || !name) {
        setResponseStatus(event, 401)
        return {
            error: 'Invalid access token',
            isSub: !!sub,
            isEmail: !!email,
            isAvatar: !!picture
        }
    }

    const sessionId = getCookie(event, TRACKING_COOKIE_NAME)

    const session = await createOrUpdateUser({
        sessionId: sessionId,
        providerId: sub,
        email: email,
        name: name,
        avatarUrl: picture
    })

    setSessionCookie(event, session)
    return
})
