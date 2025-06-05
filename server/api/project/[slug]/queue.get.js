import { getResults } from '~/server/features/results/resultcontroller'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    const projectSlug = getRouterParam(event, 'slug')

    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    return await getResults(userId, projectSlug)
})
