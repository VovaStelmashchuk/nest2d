import { MongoClient } from "mongodb";

const runtimeConfig = useRuntimeConfig();
const uri = runtimeConfig.dbUrl;

let client;
/**
 * @type {import('mongodb').Db}
 */
let db;

export async function connectDB() {
  if (!client) {
    try {
      client = new MongoClient(uri);
      await client.connect();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      throw error;
    }
  }
  if (!db) {
    db = client.db();
  }
  return db;
}
