import { defineEventHandler } from "h3";
import { getDb } from "~~/server/db/postgres";

export default defineEventHandler(async (event) => {
    let isDbConnected = true
    try {
        const sql = await getDb()
        await sql`SELECT 1`
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
