import { defineEventHandler } from "h3";
import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
    const db = await connectDB()
    let isDbConnected = true
    try {
        await db.command({ ping: 1 })
    } catch (error) {
        isDbConnected = false
    }
    if (!isDbConnected) {
        event.node.res.statusCode = 503
        return {
            status: 'error',
            message: 'Database connection failed',
        }
    }
    return {
        status: 'ok',
    }
})