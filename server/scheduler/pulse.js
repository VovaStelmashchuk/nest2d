import { Pulse } from "@pulsecron/pulse";

const runtimeConfig = useRuntimeConfig();
const mongoUrl = runtimeConfig.dbUrl;

const pulse = new Pulse({
  db: { address: mongoUrl, collection: "pulse_jobs" },
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
