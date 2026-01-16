import { connectDB } from "../db/mongo"
import type { H3Event } from "h3"
import { COUNTRY_HEADER_NAME, TRACKING_COOKIE_NAME } from "./const"

export type TrackDBRecord = {
    action: string
    country: string | null
    data: Record<string, string>
    sessionKey: string
    timestamp: Date,
    userBalance: number | null,
    userId: string | null
}

export async function saveTrackRecordInBackground(record: TrackDBRecord) {
    const db = await connectDB()
    db.collection('tracking').insertOne(record)
}

export async function trackEvent(event: H3Event<any>, action: string, data: Record<string, string>) {
    const db = await connectDB()
    const country = event.node.req.headers[COUNTRY_HEADER_NAME] as string
    const sessionKey = getCookie(event, TRACKING_COOKIE_NAME) as string

    const userId = event.context.auth?.userId

    const user = await db.collection('users').findOne({ id: userId })
    const userBalance = user?.balance || null

    const timestamp = new Date()
    const record: TrackDBRecord = {
        action: action,
        country: country,
        data: data,
        sessionKey: sessionKey,
        timestamp: timestamp,
        userBalance: userBalance,
        userId: userId,
    }
    await db.collection('tracking').insertOne(record)
}
