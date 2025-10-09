import { connectDB } from "../db/mongo"

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
