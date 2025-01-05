import { json2Dxf } from "@deepnest/dxf2svg-processor";
import { parseAndCombine } from "~~/server/core/dxf/parser";
import { transformEntity } from "~~/server/core/dxf/transform";

import { connectDB } from "~~/server/db/mongo";

import fs from "fs";
import { generateSvg } from "./svg/generator";

export async function nest(files, params, projectSlug) {
  const db = await connectDB();
  const nestRequestInsert = await db.collection("nest_request").insertOne({
    slug: projectSlug,
    files: files,
    params: params,
    requestedAt: new Date(),
  });

  const project = await db
    .collection("projects")
    .findOne({ slug: projectSlug });

  const polygonsWithCount = files.flatMap((file) => {
    const dxfObject = project.dxf.find((d) => d.slug === file.slug).asObject;

    return parseAndCombine(dxfObject, 0.1).closed.map((polygon) => {
      return {
        polygon: polygon,
        count: file.count,
      };
    });
  });

  const solution = await performJaguarRequest(
    nestRequestInsert.insertedId,
    polygonsWithCount,
    params.width,
    params.height
  );

  await validateSolution(nestRequestInsert.insertedId, solution);

  const placementInstruction = await getPlacementInstruction(
    nestRequestInsert.insertedId,
    solution,
    polygonsWithCount
  );

  const firstFile = files[0].slug;
  const originDxfObject = project.dxf.find(
    (d) => d.slug === firstFile
  ).asObject;

  const newEntities = placementInstruction.flatMap((inst) => {
    return inst.entities.map((entity) => {
      return transformEntity(entity, inst.transform);
    });
  });

  originDxfObject.__entities = newEntities;

  const svg = generateSvg(originDxfObject);

  await db
    .collection("nest_request")
    .updateOne({ _id: nestRequestInsert.insertedId }, { $set: { svg: svg } });

  fs.writeFileSync(
    "test.dxf",
    json2Dxf({ jsonData: JSON.stringify(originDxfObject) })
  );

  return nestRequestInsert.insertedId;
}

async function getPlacementInstruction(
  insertedId,
  solution,
  polygonesWithCount
) {
  const db = await connectDB();

  const requestedPolygones = countOfPolygons(polygonesWithCount);

  const layout = solution.Layouts[0];
  const placedItems = layout.PlacedItems;

  const isAllItemsPlaced = placedItems.length === requestedPolygones;

  const usage = layout.Statistics.Usage;
  await db
    .collection("nest_request")
    .updateOne(
      { _id: insertedId },
      { $set: { isAllItemsPlaced: isAllItemsPlaced, usage: usage } }
    );

  return placedItems.map((placedItem) => {
    const transform = {
      x: placedItem.Transformation.Translation[0],
      y: placedItem.Transformation.Translation[1],
      angle: placedItem.Transformation.Rotation,
    };

    const entities =
      polygonesWithCount[placedItem.Index].polygon.originEntities;

    return {
      transform: transform,
      entities: entities,
    };
  });
}

async function validateSolution(insertId, solution) {
  const db = await connectDB();

  if (
    !solution ||
    solution.Usage === null ||
    solution.Usage === undefined ||
    solution.Layouts.length === 0
  ) {
    await db
      .collection("nest_request")
      .updateOne({ _id: insertId }, { $set: { isFail: true } });
    throw createError(400, "Solution not found");
  }
}

async function performJaguarRequest(
  insertedId,
  polygonesWithCount,
  width,
  height
) {
  const db = await connectDB();
  const jaguarRequest = buildNestJson(polygonesWithCount, width, height);

  await db
    .collection("nest_request")
    .updateOne({ _id: insertedId }, { $set: { jaguarRequest: jaguarRequest } });

  const data = await $fetch("https://jaguar.stelmashch.uk/nest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jaguarRequest),
  });

  await db
    .collection("nest_request")
    .updateOne({ _id: insertedId }, { $set: { jaguarResponce: data } });

  return data.Solution;
}

function countOfPolygons(polygonsWithCount) {
  return polygonsWithCount.reduce((acc, polygoneWithCount) => {
    return acc + polygoneWithCount.count;
  }, 0);
}

function buildNestJson(polygonsWithCount, width, height) {
  const items = polygonsWithCount.map((polygoneWithCount) => {
    return {
      Demand: polygoneWithCount.count,
      AllowedOrientations: [0.0, 90.0, 180.0, 270.0],
      Shape: {
        Type: "SimplePolygon",
        Data: polygoneWithCount.polygon.polygon.map((point) => {
          return [point.x, point.y];
        }),
      },
    };
  });

  return {
    uuid: "7015feef-56b4-429f-9f88-ad9a32c82cec",
    input: {
      Name: "nest",
      Items: items,
      Objects: [
        {
          Cost: 1,
          Stock: 1,
          Zones: [],
          Shape: {
            Type: "Polygon",
            Data: {
              Outer: [
                [0.0, 0.0],
                [width, 0.0],
                [width, height],
                [0.0, height],
                [0.0, 0.0],
              ],
              Inner: [],
            },
          },
        },
      ],
    },
    config: {
      cde_config: {
        quadtree_depth: 5,
        hpg_n_cells: 2000,
        item_surrogate_config: {
          pole_coverage_goal: 0.9,
          max_poles: 10,
          n_ff_poles: 2,
          n_ff_piers: 0,
        },
      },
      poly_simpl_tolerance: 0.001,
      prng_seed: 0,
      n_samples: 500000,
      ls_frac: 0.2,
    },
  };
}
