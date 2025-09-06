import { getDxfResultBucket } from "~/server/db/mongo";
import { track } from "~~/server/utils/tracking";

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId;
    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const fileName = getRouterParam(event, "file");

    const resultDxfBucket = await getDxfResultBucket();

    const files = await resultDxfBucket.find({ filename: fileName }).toArray()
    const metadata = files[0].metadata

    if (metadata.ownerId !== userId && !(event.context.auth.isAdmin == true)) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const readStream = resultDxfBucket.openDownloadStreamByName(fileName);

    track("download_nested_result_dxf_file", userId, {
        fileName: fileName,
    })

    setResponseHeaders(event, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
    });
    return readStream;
});
