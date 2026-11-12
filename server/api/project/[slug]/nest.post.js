import { defineEventHandler, readBody } from "h3";
import { getDb } from "~~/server/db/postgres";
import { generateRandomString } from "~~/server/utils/strings";
import standardSlugify from "standard-slugify";
import logger from "~~/server/utils/logger";
import { trackEvent } from "~~/server/tracking/add";
import { assertCanNest } from "~~/server/utils/entitlement";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
  const sql = await getDb();

  const projectSlug = getRouterParam(event, "slug");

  trackEvent(event, "request_nesting", {
    projectSlug: projectSlug,
  });

  const [project] = await sql`
    SELECT slug FROM projects WHERE slug = ${projectSlug} AND owner_id = ${userId}
  `
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project not found",
    });
  }
  const body = await readBody(event);
  /**
   * @type {{originFiles: {name: string, count: int}[], params: {height: float, width: float, space: float}}}
   **/
  const { files, params } = body;

  const filteredFiles = files.filter((file) => file.count > 0);

  const requestedSlugs = filteredFiles.map((file) => file.slug)
  const userDxfFilesDatabase = requestedSlugs.length === 0 ? [] : await sql`
    SELECT slug, name FROM user_dxf_files
    WHERE slug IN ${sql(requestedSlugs)} AND owner_id = ${userId}
  `

  const fileMetadata = userDxfFilesDatabase.map((file) => {
    const requestFile = filteredFiles.find((f) => f.slug === file.slug)
    return {
      slug: file.slug,
      simpleName: file.name.replace('.dxf', ''),
      count: requestFile?.count || 0,
      rotations: requestFile?.rotation ? JSON.parse(requestFile.rotation) : [0, 90, 180, 270]
    }
  })

  const nestingSlug = `nested-${fileMetadata.map((file) => {
    const fileNameSlug = standardSlugify(file.simpleName, { keepCase: false })
    return fileNameSlug + '_' + file.count
  }).join('-')}-${generateRandomString(6)}`;

  const dbParams = {
    height: params.height,
    width: params.width,
    space: params.space,
    sheetCount: params.sheetCount,
    addOutShape: params.addOutShape,
  }

  // Free-quota / on-demand plan gate, once the request is fully validated.
  await assertCanNest(userId);

  // billing_status is settled by the usage billing job once the run succeeds.
  await sql`
    INSERT INTO nesting_jobs (
      slug, project_slug, files, params, status, billing_status, owner_id
    ) VALUES (
      ${nestingSlug}, ${projectSlug}, ${sql.json(fileMetadata)}, ${sql.json(dbParams)},
      'pending', 'pending', ${userId}
    )
  `;

  return {
    slug: nestingSlug,
  };
});
