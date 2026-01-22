import { createError, defineEventHandler } from 'h3'
import { COUNTRY_HEADER_NAME } from '~~/server/tracking/const'

const blockedCountries = ["RU", "BY"]

export default defineEventHandler((event) => {
    const country = event.node.req.headers[COUNTRY_HEADER_NAME] as string

    if (blockedCountries.includes(country)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden'
        })
    }
})
