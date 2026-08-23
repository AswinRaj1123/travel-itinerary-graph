import neo4j from "neo4j-driver";
import dotenv from "dotenv";
import path from "node:path";

for (const envPath of [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "src/scripts/.env.local"),
  path.resolve(process.cwd(), "scripts/.env.local"),
]) {
  dotenv.config({ path: envPath });
}

let driver = null;

export function getDriver() {
  if (!driver) {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
      const error = new Error(
        "Missing Neo4j environment variables. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in .env.local."
      );
      error.code = "NEO4J_CONFIG_MISSING";
      throw error;
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

export async function runQuery(cypher, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => {
      const obj = {};
      record.keys.forEach((key) => {
        const value = record.get(key);
        obj[key] = neo4j.isInt(value) ? value.toNumber() : value;
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}