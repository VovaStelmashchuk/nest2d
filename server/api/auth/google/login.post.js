import { connectDB } from '~/server/db/mongo'
import { generateSession } from '~~/server/utils/auth'

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

    const session = await createOrUpdateUser({
        provider: 'google',
        providerId: sub,
        email: email,
        name: name,
    })

    setSessionCookie(event, session)
    return
})
