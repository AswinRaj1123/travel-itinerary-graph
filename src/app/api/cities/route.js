import { runQuery } from "@/lib/neo4j";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cities = await runQuery(`
      MATCH (c:City)
      RETURN c.name AS name, c.country AS country, c.code AS code, c.lat AS lat, c.lng AS lng
      ORDER BY c.name
    `);

    return NextResponse.json({ success: true, data: cities });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cities. Database may be unreachable." },
      { status: error.code === "NEO4J_CONFIG_MISSING" ? 503 : 500 }
    );
  }
}