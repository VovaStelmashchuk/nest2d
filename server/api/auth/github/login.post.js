import { getConfig } from '~/server/utils/config'
import { createOrUpdateUser } from '~/server/utils/user'

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

    const session = await createOrUpdateUser({
        provider: 'github',
        providerId: id,
        email: email,
        name: name,
    })

    setSessionCookie(event, session)

    return
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
