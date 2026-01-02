import { connectDB, getDxfResultBucket } from "~/server/db/mongo";
import { createError } from "h3";
import archiver from "archiver";
import { getRouterParam } from "#imports"; // fallback, adjust if needed

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId;
    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }
    const nestSlug = getRouterParam(event, "nestslug");
    const db = await connectDB();
    const nestResult = await db.collection('nesting_jobs').findOne({ slug: nestSlug, ownerId: userId })

    track("download_nested_result_zip_file", userId, {
        nestSlug: nestSlug,
    })

    const nestDxfBucket = await getDxfResultBucket();

    const dxfFiles = await nestDxfBucket.find({ filename: { $in: nestResult.dxf_files } }).toArray();

    setResponseHeaders(event, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=nesting-${nestSlug}.zip`,
        "Cache-Control": "public, max-age=86400",
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
        const stream = nestDxfBucket.openDownloadStreamByName(file.filename);
        archive.append(stream, { name: file.filename });
    }
    await archive.finalize();
    return event.res;
})