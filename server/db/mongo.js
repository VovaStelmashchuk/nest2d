import { MongoClient, GridFSBucket } from "mongodb";
import logger from "../utils/logger";

const uri = useRuntimeConfig().mongoUri;

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

let userDxfFilesSvg;

/**
 * @returns {Promise<GridFSBucket>}
 */
export async function getUserDxfFilesSvgBucket() {
  await connectDB();
  if (!userDxfFilesSvg) {
    userDxfFilesSvg = new GridFSBucket(db, {
      bucketName: "userDxfFilesSvg",
    });
  }
  return userDxfFilesSvg;
}

let dxfResultBucket;

/**
 * @returns {Promise<GridFSBucket>}
 */
export async function getDxfResultBucket() {
  await connectDB();
  if (!dxfResultBucket) {
    dxfResultBucket = new GridFSBucket(db, {
      bucketName: "nestDxf",
    });
  }
  return dxfResultBucket;
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

let validUserDxfBucket;

/**
 * @returns {Promise<GridFSBucket>}
 */
export async function getValidUserDxfBucket() {
  await connectDB();
  if (!validUserDxfBucket) {
    validUserDxfBucket = new GridFSBucket(db, {
      bucketName: "validDxf",
    });
  }
  return validUserDxfBucket;
}

export async function connectDB() {
  if (!client) {
    try {
      client = new MongoClient(uri);
      await client.connect();
      logger.info("Connected to MongoDB");
    } catch (error) {
      logger.error("Failed to connect to MongoDB", error);
      throw error;
    }
  }
  if (!db) {
    db = client.db();
  }
  return db;
}
