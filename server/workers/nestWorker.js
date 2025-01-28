import { connectDB } from "~/server/db/mongo"; // Replace with your DB connection logic
import { nest } from "../core/nest";

export async function startNestWorker() {
  const db = await connectDB();

  console.log("Worker started!");

  while (true) {
    const task = await db
      .collection("nest_request")
      .findOneAndUpdate(
        { status: "pending" },
        { $set: { status: "in-progress", startedAt: new Date() } },
        { returnDocument: "after" }
      );

    if (task) {
      const { _id } = task;

      console.log(`Processing task: ${_id}`);

      try {
        const result = await nest(_id);

        let status = "completed";
        if (result.error) {
          status = "failed";
        }

        await db
          .collection("nest_request")
          .updateOne(
            { _id },
            { $set: { status: status, result, completedAt: new Date() } }
          );

        console.log(`Task ${_id} completed`);
      } catch (error) {
        await db.collection("nest_request").updateOne(
          { _id },
          {
            $set: {
              status: "failed",
              error: {
                message: error.message,
              },
              failedAt: new Date(),
            },
          }
        );

        console.error(`Task ${_id} failed:`, error.message);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
