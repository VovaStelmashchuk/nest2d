import { connectDB } from "~~/server/db/mongo";

/**
 * @param {string} userId 
 * @param {string} projectSlug 
 * @returns {Promise<{items: {slug: string, status: string, createdAt: Date, svgs: string[]}[]}>}
 */
export async function getResults(userId, projectSlug) {
    const db = await connectDB();
    const queueList = await db
        .collection("nesting_jobs")
        .find({ ownerId: userId, ...(projectSlug && { projectSlug }) })
        .sort({ createdAt: -1 })
        .toArray();

    const respnoseItems = queueList.map((queueItem) => {
        let status = queueItem.status
        if (queueItem.error || queueItem.placed !== queueItem.requested || queueItem.status == 'error') {
            status = 'failed'
        }
        let isMultiSheet = queueItem.layoutCount > 1
        let downloadUrl = ''
        let zipDownloadUrl = ''
        if (queueItem.status == 'done') {
            zipDownloadUrl = `/api/files/result/zip/${queueItem.slug}`
            downloadUrl = isMultiSheet ? zipDownloadUrl : `/api/files/result/dxf/${queueItem.dxf_files[0]}`
        } else {
            downloadUrl = null
            zipDownloadUrl = null
        }
        return {
            slug: queueItem.slug,
            status: status,
            isMultiSheet: isMultiSheet,
            createdAt: queueItem.createdAt,
            placed: queueItem.placed || 0,
            requested: queueItem.requested || 0,
            downloadUrl: downloadUrl,
            zipDownloadUrl: zipDownloadUrl,
            svgs: (queueItem.svg_files || []).map((file) => "/api/files/result/svg/" + file),
            dxfs: (queueItem.dxf_files || []).map((file) => "/api/files/result/dxf/" + file),
        }
    })

    return {
        items: respnoseItems.filter((item) => item),
    };
}