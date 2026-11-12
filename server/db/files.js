import { getDb } from "./postgres";

/**
 * Logical buckets of the `files` table. The Python workers use the same names
 * (see workers/x/utils/db.py).
 */
export const BUCKET = {
    AVATAR: "avatar",
    USER_DXF: "user_dxf",
    VALID_DXF: "valid_dxf",
    USER_DXF_SVG: "user_dxf_svg",
    NEST_DXF: "nest_dxf",
    NEST_SVG: "nest_svg",
    STRIP_USER_DXF: "strip_user_dxf",
    STRIP_NEST_DXF: "strip_nest_dxf",
};

/**
 * Stores a file, replacing any file with the same bucket and name.
 * @param {string} bucket
 * @param {string} name
 * @param {string|null} ownerId
 * @param {Buffer} data
 * @param {import('postgres').Sql} [sql] a transaction to run in
 */
export async function saveFile(bucket, name, ownerId, data, sql) {
    const db = sql || (await getDb());
    await db`
        INSERT INTO files (bucket, name, owner_id, data)
        VALUES (${bucket}, ${name}, ${ownerId}, ${data})
        ON CONFLICT (bucket, name)
        DO UPDATE SET owner_id = EXCLUDED.owner_id, data = EXCLUDED.data, created_at = now()
    `;
}

/**
 * @param {string} bucket
 * @param {string} name
 * @returns {Promise<{ownerId: string|null, data: Buffer}|null>}
 */
export async function getFile(bucket, name) {
    const db = await getDb();
    const [file] = await db`
        SELECT owner_id, data FROM files WHERE bucket = ${bucket} AND name = ${name}
    `;
    return file || null;
}

/**
 * @param {string} bucket
 * @param {string[]} names
 * @returns {Promise<{name: string, data: Buffer}[]>} in the order of `names`
 */
export async function getFiles(bucket, names) {
    if (names.length === 0) {
        return [];
    }
    const db = await getDb();
    const files = await db`
        SELECT name, data FROM files WHERE bucket = ${bucket} AND name IN ${db(names)}
    `;
    const byName = new Map(files.map((file) => [file.name, file]));
    return names.map((name) => byName.get(name)).filter(Boolean);
}
