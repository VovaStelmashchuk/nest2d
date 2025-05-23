import { getAvatarBucket } from '../db/mongo'

/**
 * Downloads and stores an avatar in MongoDB GridFS
 * @param {string} userId - The user's ID
 * @param {string} avatarUrl - The URL of the avatar to download
 * @returns {Promise<{avatarSource: string, avatarFileName: string}>} The avatar storage info
 */
export async function downloadAndStoreAvatar(userId, avatarUrl) {
    const avatarBucket = await getAvatarBucket()
    const response = await $fetch(new URL(avatarUrl), {
        responseType: 'arrayBuffer'
    })

    const buffer = Buffer.from(response)
    const avatarKey = `avatar-${userId}.jpg`

    // Delete old avatar if exists
    const oldAvatarFiles = await avatarBucket
        .find({ filename: avatarKey })
        .toArray()

    for (const oldAvatarFile of oldAvatarFiles) {
        await avatarBucket.delete(oldAvatarFile._id)
    }

    // Upload new avatar
    await new Promise((resolve, reject) => {
        const uploadStream = avatarBucket.openUploadStream(avatarKey)
        uploadStream.write(buffer)
        uploadStream.end()

        uploadStream.on('finish', resolve)
        uploadStream.on('error', reject)
    })
    return avatarKey
} 