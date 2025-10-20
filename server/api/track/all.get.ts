import { defineEventHandler } from 'h3'
import { connectDB } from '~~/server/db/mongo'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const apiToken = config.apiToken

    const authHeader = event.node.req.headers['authorization'] || (event.node.req.headers['Authorization'] as string)
    if (!authHeader || !authHeader.startsWith('api ') || authHeader.slice(4).trim() !== apiToken) {
        throw createError({
            statusCode: 401,
            statusText: 'unauth',
        })
    }

    const db = await connectDB()
    const records = await db.collection('tracking').find().sort({ timestamp: -1 }).toArray()
    const result = records.map((record) => ({
        ...record,
        timestamp: record.timestamp instanceof Date ? record.timestamp.toISOString() : record.timestamp,
    }))
    return result
})
