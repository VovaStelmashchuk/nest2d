import { defineEventHandler, getCookie, readBody } from 'h3'
import { saveTrackRecordInBackground, type TrackDBRecord } from '~~/server/tracking/add'
import { COUNTRY_HEADER_NAME, TRACKING_COOKIE_NAME } from '~~/server/tracking/const'
import type { TrackRequest } from '~~/shared/types/track_body'

export default defineEventHandler(async (event) => {
    const sessionKey = getCookie(event, TRACKING_COOKIE_NAME) as string
    const trackRequest = await readBody<TrackRequest>(event)

    const country = event.node.req.headers[COUNTRY_HEADER_NAME] as string

    const userId = event.context.auth?.userId

    const trackRecond: TrackDBRecord = {
        action: trackRequest.action,
        country: country,
        data: trackRequest.data,
        sessionKey: sessionKey,
        timestamp: new Date(),
        userId: userId,
    }

    await saveTrackRecordInBackground(trackRecond)
})