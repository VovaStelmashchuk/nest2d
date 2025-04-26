import { getConfig, getBaseUrl } from '~/server/utils/config'

export default defineEventHandler(async (_) => {
    return {
        url: await buildGithubAuthLink()
    }
})

async function buildGithubAuthLink() {
    const config = await getConfig()
    const baseUrl = getBaseUrl()
    const githubConfig = config.github
    const url = new URL('https://github.com/login/oauth/authorize')
    url.searchParams.append('client_id', githubConfig.clientId)
    url.searchParams.append('redirect_uri', `${baseUrl}/auth/github/callback`)
    url.searchParams.append('scope', 'user')

    return url.toString()
}
