import { connectDB } from "../db/mongo";

export default defineNitroPlugin(async (nitroApp) => {
  console.log("Nitro plugin start");
  connectDB();
});
