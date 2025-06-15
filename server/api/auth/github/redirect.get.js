export default defineEventHandler(async (_) => {
    return {
        url: await buildGithubAuthLink()
    }
})

async function buildGithubAuthLink() {
    const baseUrl = useRuntimeConfig().public.baseUrl
    const url = new URL('https://github.com/login/oauth/authorize')
    url.searchParams.append('client_id', useRuntimeConfig().public.githubClientId)
    url.searchParams.append('redirect_uri', `${baseUrl}/auth/github/callback`)
    url.searchParams.append('scope', 'user')

    return url.toString()
}
