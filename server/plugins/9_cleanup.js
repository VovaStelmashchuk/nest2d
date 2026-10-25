import {
    connectDB,
    getAvatarBucket,
    getDxfResultBucket,
    getStripNestDxfBucket,
    getStripUserDxfBucket,
    getSvgResultBucket,
    getUserDxfBucket,
    getUserDxfFilesSvgBucket,
    getValidUserDxfBucket,
} from "../db/mongo";
import logger from "../utils/logger";

const tag = "cleanup";

const RUN_EVERY_MS = 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 60 * 60 * 1000;
// Upper bound for every delete query in a single run, to keep the load on the
// server predictable. A larger backlog is worked off over consecutive days.
const BATCH_LIMIT = 50;
const INACTIVE_USER_AFTER_MS = 365 * 24 * 60 * 60 * 1000;

// Subscription statuses that may still bill the customer; such users are kept.
const BILLABLE_SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "unpaid"];
// Jobs still running or waiting to be billed are kept.
const UNSETTLED_JOB_STATUSES = ["pending", "processing"];

/**
 * Finds up to BATCH_LIMIT documents whose parent (looked up by key) is gone.
 * @param {import('mongodb').Db} db
 * @param {{collection: string, localField: string, from: string, foreignField: string, match?: object}} options
 * @returns {Promise<any[]>}
 */
async function findOrphans(db, { collection, localField, from, foreignField, match = {} }) {
    return await db
        .collection(collection)
        .aggregate([
            { $match: match },
            { $lookup: { from, localField, foreignField, as: "__parent" } },
            { $match: { "__parent.0": { $exists: false } } },
            { $limit: BATCH_LIMIT },
            { $project: { __parent: 0 } },
        ])
        .toArray();
}

/**
 * @param {import('mongodb').GridFSBucket} bucket
 * @param {string[]} filenames
 * @returns {Promise<number>} number of deleted files
 */
async function deleteGridFsFiles(bucket, filenames) {
    const names = filenames.filter(Boolean);
    if (names.length === 0) {
        return 0;
    }
    const files = await bucket.find({ filename: { $in: names } }).toArray();
    for (const file of files) {
        await bucket.delete(file._id);
    }
    return files.length;
}

async function deleteByIds(db, collection, docs) {
    if (docs.length === 0) {
        return 0;
    }
    const result = await db
        .collection(collection)
        .deleteMany({ _id: { $in: docs.map((doc) => doc._id) } });
    return result.deletedCount;
}

/**
 * Users who have not logged in for a year: every session has expired
 * (sessions live one year from login) and there was no activity or signup
 * within the year. Admins and users with a billable subscription are kept.
 */
async function deleteInactiveUsers(db) {
    const now = new Date();
    const cutoff = new Date(now.getTime() - INACTIVE_USER_AFTER_MS);

    const users = await db
        .collection("users")
        .find(
            {
                isAdmin: { $ne: true },
                "subscription.status": { $nin: BILLABLE_SUBSCRIPTION_STATUSES },
                sessions: { $not: { $elemMatch: { expiresAt: { $gt: now } } } },
                $and: [
                    { $or: [{ lastActiveAt: { $lt: cutoff } }, { lastActiveAt: { $exists: false } }] },
                    { $or: [{ createdAt: { $lt: cutoff } }, { createdAt: { $exists: false } }] },
                ],
            },
            { projection: { _id: 1, id: 1, avatarFileName: 1 } }
        )
        .limit(BATCH_LIMIT)
        .toArray();

    const avatars = await deleteGridFsFiles(
        await getAvatarBucket(),
        users.map((user) => user.avatarFileName)
    );
    const deleted = await deleteByIds(db, "users", users);
    return { users: deleted, avatars };
}

async function deleteOwnerlessProjects(db) {
    const projects = await findOrphans(db, {
        collection: "projects",
        localField: "ownerId",
        from: "users",
        foreignField: "id",
    });
    const stripProjects = await findOrphans(db, {
        collection: "strip_projects",
        localField: "ownerId",
        from: "users",
        foreignField: "id",
    });
    return {
        projects: await deleteByIds(db, "projects", projects),
        stripProjects: await deleteByIds(db, "strip_projects", stripProjects),
    };
}

async function deleteOrphanProjectFiles(db) {
    const files = await findOrphans(db, {
        collection: "user_dxf_files",
        localField: "projectSlug",
        from: "projects",
        foreignField: "slug",
    });
    const slugs = files.map((file) => file.slug);
    const blobs =
        (await deleteGridFsFiles(await getUserDxfBucket(), slugs)) +
        (await deleteGridFsFiles(await getValidUserDxfBucket(), slugs)) +
        (await deleteGridFsFiles(
            await getUserDxfFilesSvgBucket(),
            files.map((file) => file.svgFileSlug)
        ));
    return { files: await deleteByIds(db, "user_dxf_files", files), blobs };
}

async function deleteOrphanStripFiles(db) {
    const files = await findOrphans(db, {
        collection: "strip_user_dxf_files",
        localField: "stripSlug",
        from: "strip_projects",
        foreignField: "slug",
    });
    const blobs = await deleteGridFsFiles(
        await getStripUserDxfBucket(),
        files.map((file) => file.slug)
    );
    return { files: await deleteByIds(db, "strip_user_dxf_files", files), blobs };
}

async function deleteOrphanNestingJobs(db) {
    const settled = {
        status: { $nin: UNSETTLED_JOB_STATUSES },
        billingStatus: { $nin: UNSETTLED_JOB_STATUSES },
    };

    const jobs = await findOrphans(db, {
        collection: "nesting_jobs",
        localField: "projectSlug",
        from: "projects",
        foreignField: "slug",
        match: settled,
    });
    const jobBlobs =
        (await deleteGridFsFiles(
            await getDxfResultBucket(),
            jobs.flatMap((job) => job.dxf_files || [])
        )) +
        (await deleteGridFsFiles(
            await getSvgResultBucket(),
            jobs.flatMap((job) => job.svg_files || [])
        ));

    const stripJobs = await findOrphans(db, {
        collection: "strip_nesting_job_queue",
        localField: "stripSlug",
        from: "strip_projects",
        foreignField: "slug",
        match: settled,
    });
    const stripJobBlobs = await deleteGridFsFiles(
        await getStripNestDxfBucket(),
        stripJobs.flatMap((job) => job.dxf_files || [])
    );

    return {
        jobs: await deleteByIds(db, "nesting_jobs", jobs),
        stripJobs: await deleteByIds(db, "strip_nesting_job_queue", stripJobs),
        blobs: jobBlobs + stripJobBlobs,
    };
}

async function deleteOrphanSupportMessages(db) {
    const messages = await findOrphans(db, {
        collection: "supportMessages",
        localField: "userId",
        from: "users",
        foreignField: "id",
    });
    return { supportMessages: await deleteByIds(db, "supportMessages", messages) };
}

// Ordered parents first, so one run cascades: users -> projects -> files/jobs.
const steps = [
    ["inactive users", deleteInactiveUsers],
    ["ownerless projects", deleteOwnerlessProjects],
    ["orphan project files", deleteOrphanProjectFiles],
    ["orphan strip files", deleteOrphanStripFiles],
    ["orphan nesting jobs", deleteOrphanNestingJobs],
    ["orphan support messages", deleteOrphanSupportMessages],
];

async function runCleanup(db) {
    for (const [name, step] of steps) {
        try {
            const result = await step(db);
            logger.info(`[${tag}] ${name}: ${JSON.stringify(result)}`);
        } catch (err) {
            logger.error(`[${tag}] Step failed: ${name}: ${err?.message || err}`);
        }
    }
}

/**
 * Claims today's run. The lock document makes the job run once a day across
 * restarts and multiple app instances.
 * @returns {Promise<boolean>}
 */
async function claimRun(db) {
    const now = new Date();
    try {
        const claimed = await db.collection("job_locks").findOneAndUpdate(
            { _id: tag, lastRunAt: { $not: { $gt: new Date(now.getTime() - RUN_EVERY_MS) } } },
            { $set: { lastRunAt: now } },
            { upsert: true, returnDocument: "after" }
        );
        return claimed !== null;
    } catch (err) {
        // Duplicate key: the lock exists and was claimed within the last day.
        if (err?.code === 11000) {
            return false;
        }
        throw err;
    }
}

export default defineNitroPlugin(async () => {
    logger.info(`[${tag}] Cleanup plugin start`);
    const db = await connectDB();

    while (true) {
        try {
            if (await claimRun(db)) {
                logger.info(`[${tag}] Cleanup run start`);
                await runCleanup(db);
                logger.info(`[${tag}] Cleanup run done`);
            }
        } catch (err) {
            logger.error(`[${tag}] Cleanup loop error: ${err?.message || err}`);
        }
        await new Promise((resolve) => setTimeout(resolve, CHECK_EVERY_MS));
    }
});
