import { runQuery } from "@/lib/neo4j";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")?.trim().toUpperCase();
  const to = searchParams.get("to")?.trim().toUpperCase();
  const requestedStops = Number.parseInt(searchParams.get("maxStops") || "2", 10);
  const maxStops = Number.isInteger(requestedStops)
    ? Math.min(Math.max(requestedStops, 0), 5)
    : 2;
  const maxHops = maxStops + 1;

  if (!from || !to) {
    return NextResponse.json(
      { success: false, error: "Please provide both 'from' and 'to' city codes" },
      { status: 400 }
    );
  }

  try {
    const routes = await runQuery(
      `
      MATCH path = (start:City {code: $from})-[*1..${maxHops}]->(end:City {code: $to})
      WHERE ALL(node IN nodes(path) WHERE single(other IN nodes(path) WHERE other = node))
      WITH path,
           [r IN relationships(path) | type(r)] AS modes,
           reduce(totalTime = 0.0, r IN relationships(path) | totalTime + r.duration_hours) AS totalDuration,
           reduce(totalPrice = 0.0, r IN relationships(path) | totalPrice + r.price_usd) AS totalPrice,
           [n IN nodes(path) | n.name] AS cityNames
      RETURN cityNames, modes, totalDuration, totalPrice, length(path) AS stops
      ORDER BY totalDuration ASC
      LIMIT 15
      `,
      { from, to }
    );

    return NextResponse.json({ success: true, data: routes });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to find routes. Database may be unreachable." },
      { status: error.code === "NEO4J_CONFIG_MISSING" ? 503 : 500 }
    );
  }
}