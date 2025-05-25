import { connectDB } from '../db/mongo'

const SENSITIVE_KEY_REGEX = /(token|password|pass)/i

function filterSensitive(obj) {
    if (Array.isArray(obj)) {
        return obj.map(filterSensitive)
    } else if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
                if (typeof key === 'string' && SENSITIVE_KEY_REGEX.test(key)) {
                    return [key, '***']
                }
                return [key, filterSensitive(value)]
            })
        )
    }
    return obj
}

export default defineEventHandler(async (event) => {
    const { method, url, headers } = event.node.req
    const userAgent = headers['user-agent']
    const userId = event.context.auth?.userId
    const start = Date.now()

    let requestBody = undefined
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            requestBody = await readBody(event)
            requestBody = filterSensitive(requestBody)
        } catch (e) {
            requestBody = '[unreadable]'
        }
    }

    let chunks = []
    const originalWrite = event.node.res.write
    const originalEnd = event.node.res.end

    event.node.res.write = function (chunk, ...args) {
        if (chunk) chunks.push(Buffer.from(chunk))
        return originalWrite.apply(this, [chunk, ...args])
    }
    event.node.res.end = function (chunk, ...args) {
        if (chunk) chunks.push(Buffer.from(chunk))
        const bodyBuffer = Buffer.concat(chunks)
        let responseBody = 'default (use for non-json responses)'
        try {
            if (event.node.res.getHeader('content-type')?.includes('application/json')) {
                responseBody = bodyBuffer.toString('utf8')
                responseBody = JSON.parse(responseBody)
                responseBody = filterSensitive(responseBody)
            } else {
                responseBody = 'else (use for non-json responses)'
            }
        } catch {
            // leave as string if not JSON
            responseBody = 'error parsing response body'
        }

        const duration = Date.now() - start
        const statusCode = event.node.res.statusCode

        connectDB().then(db => {
            db.collection('http').insertOne({
                method,
                url,
                userAgent,
                userId,
                requestBody,
                statusCode,
                duration,
                responseBody,
                timestamp: new Date()
            })
        })

        return originalEnd.apply(this, [chunk, ...args])
    }
})