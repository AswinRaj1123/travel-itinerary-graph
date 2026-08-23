import { runQuery } from "@/lib/neo4j";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Please provide a city code" },
      { status: 400 }
    );
  }

  try {
    const connections = await runQuery(
      `
      MATCH (c:City {code: $code})-[r]->(other:City)
      RETURN other.name AS city,
             other.code AS code,
             other.country AS country,
             type(r) AS mode,
             r.duration_hours AS duration,
             r.price_usd AS price,
             r.airline AS airline
      ORDER BY r.duration_hours ASC
      `,
      { code }
    );

    return NextResponse.json({ success: true, data: connections });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to search connections." },
      { status: error.code === "NEO4J_CONFIG_MISSING" ? 503 : 500 }
    );
  }
}