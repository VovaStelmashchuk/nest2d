import { json2Dxf } from "@deepnest/dxf2svg-processor";
import { parseAndCombine } from "~~/server/core/dxf/parser";
import { transformEntity } from "~~/server/core/dxf/transform";
import { connectDB } from "~~/server/db/mongo";
import { generateSvg } from "./svg/generator";
import { buildPolygon } from "./polygones";

export async function nest(jobId) {
  const db = await connectDB();

  const nestRequest = await db
    .collection("nest_request")
    .findOne({ _id: jobId });

  if (!nestRequest) {
    throw new Error(`No job found with ID: ${jobId}`);
  }

  const { objectsToNest, params } = nestRequest;

  const polygonsWithCount = objectsToNest.flatMap((objectWithCount) => {
    return parseAndCombine(
      objectWithCount.dxfObject,
      params.tolerance
    ).closed.map((polygon) => {
      return {
        polygon: polygon,
        count: objectWithCount.count,
      };
    });
  });

  const solution = await performJaguarRequest(
    jobId,
    polygonsWithCount,
    params.width,
    params.height,
    params.space
  );

  if (
    !solution ||
    solution.Usage === null ||
    solution.Usage === undefined ||
    solution.Layouts.length === 0
  ) {
    await db
      .collection("nest_request")
      .updateOne({ _id: jobId }, { $set: { isFail: true } });

    return {
      error: "No solution found",
      nestId: jobId,
    };
  }

  const placementInstruction = await getPlacementInstruction(
    jobId,
    solution,
    polygonsWithCount
  );

  const originDxfObject = objectsToNest[0].dxfObject;

  let handle = 200;

  const newEntities = placementInstruction.flatMap((inst) => {
    return inst.entities.map((entity) => {
      const newEntity = transformEntity(entity, inst.transform);
      newEntity.common.handle = handle++;
      return newEntity;
    });
  });

  originDxfObject.__entities = newEntities;

  await db
    .collection("nest_request")
    .updateOne(
      { _id: jobId },
      { $set: { dxfResultAsObject: originDxfObject } }
    );

  const svg = generateSvg(originDxfObject);

  await db
    .collection("nest_request")
    .updateOne({ _id: jobId }, { $set: { svg: svg } });

  const dxfAsString = json2Dxf({ jsonData: JSON.stringify(originDxfObject) });

  await db
    .collection("nest_request")
    .updateOne({ _id: jobId }, { $set: { dxfResult: dxfAsString } });
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
  await db.collection("nest_request").updateOne(
    { _id: insertedId },
    {
      $set: {
        isAllItemsPlaced: isAllItemsPlaced,
        usage: usage,
        requested: requestedPolygones,
        placed: placedItems.length,
      },
    }
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

async function performJaguarRequest(
  insertedId,
  polygonesWithCount,
  width,
  height,
  space
) {
  const db = await connectDB();
  const jaguarRequest = buildNestJson(polygonesWithCount, width, height, space);

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

function buildNestJson(polygonsWithCount, width, height, space) {
  const items = polygonsWithCount.map((polygoneWithCount) => {
    return {
      Demand: polygoneWithCount.count,
      AllowedOrientations: [0.0, 90.0, 180.0, 270.0],
      Shape: {
        Type: "SimplePolygon",
        Data: buildPolygon(polygoneWithCount.polygon.polygon, space),
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
