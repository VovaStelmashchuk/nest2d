import fs from 'fs'
const runtimeConfig = useRuntimeConfig().public

export function getConfig() {
    const asText = fs.readFileSync(runtimeConfig.secretFile, 'utf8')
    return JSON.parse(asText)
}

export function getDiscord() {
    const config = getConfig()
    return config.discord
}

export function getBaseUrl() {
    return runtimeConfig.baseUrl
}

export function getCommitSha() {
    return runtimeConfig.gitCommitSha || 'unknown'
}
