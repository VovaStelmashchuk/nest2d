
import { connectDB } from '~~/server/db/mongo'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        setResponseStatus(401)
        return
    }

    const eventStream = createEventStream(event)

    const db = await connectDB()

    const balance = await db.collection('users').findOne({ id: userId }, { projection: { balance: 1 } })
    if (!balance) {
        setResponseStatus(404)
        return
    }

    let lastBalance = balance.balance
    eventStream.push(
        JSON.stringify({
            type: 'initial',
            data: {
                balance: balance.balance
            }
        })
    )

    const interval = setInterval(async () => {
        const newBalance = await db
            .collection('users')
            .findOne({ id: userId }, { projection: { balance: 1 } })
        if (newBalance.balance !== lastBalance) {
            await eventStream.push(
                JSON.stringify({
                    type: 'newBalance',
                    data: {
                        balance: newBalance.balance
                    }
                })
            )
            lastBalance = newBalance.balance
        }
    }, 1000)

    const heartbeatInterval = setInterval(async () => {
        await eventStream.push(
            JSON.stringify({
                type: 'heartbeat',
                ts: Date.now()
            })
        )
    }, 30000)

    eventStream.onClosed(async () => {
        clearInterval(heartbeatInterval)
        clearInterval(interval)
        await eventStream.close()
    })

    return eventStream.send()
})