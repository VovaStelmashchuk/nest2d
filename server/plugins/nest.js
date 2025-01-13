import { startNestWorker } from "../workers/nestWorker";

export default defineNitroPlugin(async (nitroApp) => {
  console.log("Nitro plugin start");
  startNestWorker();
});
