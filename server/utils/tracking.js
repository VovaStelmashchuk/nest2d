import { connectDB } from "../db/mongo";

export function track(event, userId, data) {
    new Promise(async (resolve, reject) => {
        const db = await connectDB();
        db.collection("tracking").insertOne({
            event,
            userId,
            data,
            timestamp: new Date()
        });
    });
}