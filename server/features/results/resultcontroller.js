import { getDb } from "~~/server/db/postgres";

/**
 * @param {string} userId 
 * @param {string} projectSlug 
 * @returns {Promise<{items: {slug: string, status: string, createdAt: Date, svgs: string[]}[]}>}
 */
export async function getResults(userId, projectSlug) {
    const sql = await getDb();
    const queueList = await sql`
        SELECT slug, status, error, layout_count, created_at, placed, requested, dxf_files, svg_files
        FROM nesting_jobs
        WHERE owner_id = ${userId}
          ${projectSlug ? sql`AND project_slug = ${projectSlug}` : sql``}
        ORDER BY created_at DESC
    `;

    const respnoseItems = queueList.map((queueItem) => {
        let status = queueItem.status
        if (queueItem.error || queueItem.status == 'error') {
            status = 'failed'
        }
        let isMultiSheet = queueItem.layoutCount > 1
        let downloadUrl = ''
        let zipDownloadUrl = ''
        if (queueItem.status == 'done') {
            zipDownloadUrl = `/api/files/result/zip/${queueItem.slug}`
            downloadUrl = isMultiSheet ? zipDownloadUrl : `/api/files/result/dxf/${queueItem.dxfFiles[0]}`
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
            isInProgress: queueItem.status === 'processing' || queueItem.status === 'pending',
            svgs: (queueItem.svgFiles || []).map((file) => "/api/files/result/svg/" + file),
            dxfs: (queueItem.dxfFiles || []).map((file) => "/api/files/result/dxf/" + file),
        }
    })

    return {
        items: respnoseItems.filter((item) => item),
    };
}