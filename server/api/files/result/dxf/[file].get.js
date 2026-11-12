import { BUCKET, getFile } from "~/server/db/files";
import { trackEvent } from "~~/server/tracking/add"

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId;
    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const fileName = getRouterParam(event, "file");

    const file = await getFile(BUCKET.NEST_DXF, fileName);
    if (!file) {
        throw createError({ statusCode: 404, statusMessage: "File not found" });
    }

    if (file.ownerId !== userId && !(event.context.auth.isAdmin == true)) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    await trackEvent(event, "download_nested_result_dxf_file", {
        fileName: fileName,
    })

    setResponseHeaders(event, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
    });
    return file.data;
});
