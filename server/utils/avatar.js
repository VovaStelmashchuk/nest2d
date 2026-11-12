import { BUCKET, saveFile } from '../db/files'

/**
 * Downloads the avatar and stores it in the `files` table, named by user id.
 * @param {string} userId - The user's ID (must already exist in `users`)
 * @param {string} avatarUrl - The URL of the avatar to download
 */
export async function downloadAndStoreAvatar(userId, avatarUrl) {
    const response = await $fetch(new URL(avatarUrl), {
        responseType: 'arrayBuffer'
    })

    await saveFile(BUCKET.AVATAR, userId, userId, Buffer.from(response))
}
