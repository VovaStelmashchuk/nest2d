import { Pulse } from "@pulsecron/pulse";

import { getConfig } from "../utils/config";

const uri = getConfig().mongoUri;

const pulse = new Pulse({
  db: { address: uri, collection: "pulse_jobs" },
  resumeOnRestart: true,
});

export const initPulse = async () => {
  try {
    await pulse.start();
    console.log("Pulse connected and ready!");
  } catch (error) {
    console.error("Failed to initialize Pulse:", error);
    throw error;
  }
};

export default pulse;
