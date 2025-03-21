import { MongoClient, GridFSBucket } from "mongodb";
import { getConfig } from "../utils/config";

const uri = getConfig().mongoUri;

let client;
/**
 * @type {import('mongodb').Db}
 */
export let db;

/**
 * @type {GridFSBucket}
 */
let avatarBucket;

/**
 * @returns {Promise<GridFSBucket>}
 */
export async function getAvatarBucket() {
  await connectDB();
  if (!avatarBucket) {
    avatarBucket = new GridFSBucket(db, {
      bucketName: "avatars",
    });
  }
  return avatarBucket;
}

let svgResultBucket;

/**
 * @returns {Promise<GridFSBucket>}
 */
export async function getSvgResultBucket() {
  await connectDB();
  if (!svgResultBucket) {
    svgResultBucket = new GridFSBucket(db, {
      bucketName: "nestSvg",
    });
  }
  return svgResultBucket;
}

/**
 * @type {GridFSBucket}
 */
let userDxfBucket;

/**
 * @returns {Promise<GridFSBucket>}
 */
export async function getUserDxfBucket() {
  await connectDB();
  if (!userDxfBucket) {
    userDxfBucket = new GridFSBucket(db, {
      bucketName: "userDxf",
    });
  }
  return userDxfBucket;
}

/**
 * @type {GridFSBucket}
 */
let userSvgBucket;

/**
 * @returns {Promise<GridFSBucket>}
 */
export async function getUserSvgBucket() {
  await connectDB();
  if (!userSvgBucket) {
    userSvgBucket = new GridFSBucket(db, {
      bucketName: "userSvg",
    });
  }
  return userSvgBucket;
}

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
