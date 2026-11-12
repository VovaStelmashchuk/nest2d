import { defineEventHandler, readBody } from "h3";
import { getDb } from "~~/server/db/postgres";
import { generateRandomString } from "~~/server/utils/strings";
import standardSlugify from "standard-slugify";
import { trackEvent } from "~~/server/tracking/add";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";
import { assertCanNest } from "~~/server/utils/entitlement";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
  await assertStripFeatureEnabled(userId);

  const sql = await getDb();

  const stripSlug = getRouterParam(event, "slug");

  trackEvent(event, "request_strip_nesting", {
    stripSlug: stripSlug,
  });

  const [strip] = await sql`
    SELECT slug FROM strip_projects WHERE slug = ${stripSlug} AND owner_id = ${userId}
  `;
  if (!strip) {
    throw createError({
      statusCode: 404,
      statusMessage: "Strip project not found",
    });
  }

  const body = await readBody(event);
  /**
   * @type {{files: {slug: string, count: number}[], params: {height: number}}}
   **/
  const { files, params } = body;

  const filteredFiles = (files || []).filter((file) => file.count > 0);

  if (filteredFiles.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please select at least one file to nest.",
    });
  }

  const height = Number(params?.height);
  if (!Number.isFinite(height) || height <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please provide a valid height.",
    });
  }

  const stripFilesDatabase = await sql`
    SELECT slug, name FROM strip_user_dxf_files
    WHERE slug IN ${sql(filteredFiles.map((file) => file.slug))} AND owner_id = ${userId}
  `;

  const fileMetadata = stripFilesDatabase.map((file) => {
    const requestFile = filteredFiles.find((f) => f.slug === file.slug);
    return {
      slug: file.slug,
      simpleName: file.name.replace(".dxf", ""),
      count: requestFile?.count || 0,
      // Allowed orientations for this part. Strip nesting only supports keeping
      // the part as-is or flipping it 180°, so anything else is dropped.
      angle: parseStripAngle(requestFile?.rotation),
    };
  });

  const jobSlug = `strip-nested-${fileMetadata
    .map((file) => {
      const fileNameSlug = standardSlugify(file.simpleName, { keepCase: false });
      return fileNameSlug + "_" + file.count;
    })
    .join("-")}-${generateRandomString(6)}`;

  // Free-quota / on-demand plan gate, once the request is fully validated.
  await assertCanNest(userId);

  // billing_status is settled by the usage billing job once the run succeeds.
  await sql`
    INSERT INTO strip_nesting_jobs (
      slug, strip_slug, files, params, status, billing_status, owner_id
    ) VALUES (
      ${jobSlug}, ${stripSlug}, ${sql.json(fileMetadata)}, ${sql.json({ height })},
      'pending', 'pending', ${userId}
    )
  `;

  return {
    slug: jobSlug,
  };
});

/**
 * Parse the per-file rotation sent by the strip UI into a sanitized list of
 * allowed orientations. Only 0° and 180° are supported for strip nesting; any
 * other value is discarded and an empty/invalid input falls back to [0].
 *
 * @param {string | number[] | undefined} rotation
 * @returns {number[]}
 */
function parseStripAngle(rotation) {
  let parsed = rotation;
  if (typeof rotation === "string") {
    try {
      parsed = JSON.parse(rotation);
    } catch {
      parsed = null;
    }
  }
  const allowed = Array.isArray(parsed)
    ? parsed.map(Number).filter((angle) => angle === 0 || angle === 180)
    : [];
  const unique = [...new Set(allowed)];
  return unique.length > 0 ? unique : [0];
}
