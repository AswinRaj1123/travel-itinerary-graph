import { runQuery } from "@/lib/neo4j";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hubs = await runQuery(`
      MATCH (c:City)-[r]->()
      RETURN c.name AS city, c.code AS code, c.country AS country, count(r) AS connections
      ORDER BY connections DESC
      LIMIT 10
    `);

    return NextResponse.json({ success: true, data: hubs });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hubs." },
      { status: error.code === "NEO4J_CONFIG_MISSING" ? 503 : 500 }
    );
  }
}