import { getDxfResultBucket } from "~/server/db/mongo";
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

    const resultDxfBucket = await getDxfResultBucket();

    const files = await resultDxfBucket.find({ filename: fileName }).toArray()
    const metadata = files[0].metadata

    if (metadata.ownerId !== userId && !(event.context.auth.isAdmin == true)) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    await trackEvent(event, "download_nested_result_dxf_file", {
        fileName: fileName,
    })

    const readStream = resultDxfBucket.openDownloadStreamByName(fileName);

    setResponseHeaders(event, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
    });
    return readStream;
});
