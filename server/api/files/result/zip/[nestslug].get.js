import { getDb } from "~/server/db/postgres";
import { BUCKET, getFiles } from "~/server/db/files";
import { createError } from "h3";
import archiver from "archiver";
import { trackEvent } from "~~/server/tracking/add"

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId;
    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }
    const nestSlug = getRouterParam(event, "nestslug");
    const sql = await getDb();
    const [nestResult] = await sql`
        SELECT dxf_files FROM nesting_jobs WHERE slug = ${nestSlug} AND owner_id = ${userId}
    `
    if (!nestResult) {
        throw createError({ statusCode: 404, statusMessage: "Nesting result not found" });
    }

    await trackEvent(event, "download_nested_result_zip_file", {
        nestSlug: nestSlug,
    })

    const dxfFiles = await getFiles(BUCKET.NEST_DXF, nestResult.dxfFiles);

    setResponseHeaders(event, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=nesting-${nestSlug}.zip`,
    });

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
        throw createError({
            statusCode: 500,
            statusMessage: "Error creating zip archive",
            data: err.message,
        });
    });

    event.res.on("close", () => archive.destroy());
    archive.pipe(event.res);

    for (const file of dxfFiles) {
        archive.append(file.data, { name: file.name });
    }
    await archive.finalize();
    return event.res;
})
