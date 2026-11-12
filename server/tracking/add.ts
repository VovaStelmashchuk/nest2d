import { getDb } from "../db/postgres"
import type { H3Event } from "h3"
import logger from "../utils/logger"
import { COUNTRY_HEADER_NAME, TRACKING_COOKIE_NAME } from "./const"

export type TrackDBRecord = {
    action: string
    country: string | null
    data: Record<string, string>
    sessionKey: string
    timestamp: Date,
    userId: string | null
}

async function insertTrackRecord(record: TrackDBRecord) {
    const sql = await getDb()
    await sql`
        INSERT INTO tracking (action, country, data, session_key, user_id, created_at)
        VALUES (
            ${record.action}, ${record.country ?? null},
            ${record.data == null ? null : sql.json(record.data)},
            ${record.sessionKey ?? null}, ${record.userId ?? null}, ${record.timestamp}
        )
    `
}

export async function saveTrackRecordInBackground(record: TrackDBRecord) {
    insertTrackRecord(record).catch((err) => logger.error('Failed to save tracking record', err))
}

export async function trackEvent(event: H3Event<any>, action: string, data?: Record<string, string>) {
    const country = event.node.req.headers[COUNTRY_HEADER_NAME] as string
    const sessionKey = getCookie(event, TRACKING_COOKIE_NAME) as string

    const userId = event.context.auth?.userId

    try {
        await insertTrackRecord({
            action: action,
            country: country,
            data: data,
            sessionKey: sessionKey,
            timestamp: new Date(),
            userId: userId,
        })
    } catch (err) {
        logger.error('Failed to save tracking record', err)
    }
}
