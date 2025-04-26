import { connectDB } from '~/server/db/mongo'
import { generateSession } from '~~/server/utils/auth'
import { getConfig } from '~/server/utils/config'

export default defineEventHandler(async (event) => {
    const { githubCode } = await readBody(event)

    const accessToken = await getGithubAccessToken(githubCode)

    const data = await $fetch('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    const { id, avatar_url, email, name } = data

    if (!id || !email || !avatar_url || !name) {
        setResponseStatus(event, 401)
        return {
            error: 'Invalid access token',
            isId: !!id,
            isEmail: !!email,
            isAvatar: !!avatar_url
        }
    }
    const session = generateSession()
    const db = await connectDB()

    await db.collection('users').updateOne(
        { id: `github:${id}` },
        {
            $set: {
                email: email,
                name: name,
                avatarUrl: avatar_url,
                avatarSource: 'origin',
                github: {
                    id: id
                },
                updatedAt: new Date()
            },
            $setOnInsert: {
                createdAt: new Date(),
                creddits: 150
            },
            $push: {
                sessions: session
            }
        },
        { upsert: true }
    )

    setCookie(event, 'sessionId', session.sessionId, {
        expires: new Date(session.expiresAt)
    })

    return {
        ok: true
    }
})

async function getGithubAccessToken(githubCode) {
    const githubConfig = getConfig().github

    const url = new URL('https://github.com/login/oauth/access_token')
    url.searchParams.append('client_id', githubConfig.clientId)
    url.searchParams.append('client_secret', githubConfig.clientSecret)
    url.searchParams.append('code', githubCode)

    const data = await $fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json'
        }
    })

    return data['access_token']
}
