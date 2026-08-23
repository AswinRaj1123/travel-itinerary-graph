import { verifyConnectivity, closeDriver } from "../lib/neo4j.js";
import dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: ".env.local" });

async function main() {
  try {
    const message = await verifyConnectivity();
    console.log("✅", message);
  } catch (error) {
    console.error("❌ Connection failed:");
    console.error(error.message);
  } finally {
    await closeDriver();
    process.exit(0);
  }
}

main();