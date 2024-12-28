import { MongoClient } from "mongodb";
const runtimeConfig = useRuntimeConfig();
const mongoUrl = runtimeConfig.dbUrl;

console.log("mongoUrl", mongoUrl);

const client = new MongoClient(mongoUrl, {
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000,
});

client
  .connect()
  .then(() => console.log("Connected to MongoDB"))
  .catch((e) => {
    console.error("Failed to connect to MongoDB:", e);
    process.exit(1);
  });

export const db = client.db();
