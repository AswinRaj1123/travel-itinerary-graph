import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

const cities = [
  { name: "Paris", country: "France", code: "PAR", lat: 48.8566, lng: 2.3522 },
  { name: "London", country: "UK", code: "LON", lat: 51.5074, lng: -0.1278 },
  { name: "Amsterdam", country: "Netherlands", code: "AMS", lat: 52.3676, lng: 4.9041 },
  { name: "Berlin", country: "Germany", code: "BER", lat: 52.52, lng: 13.405 },
  { name: "Rome", country: "Italy", code: "ROM", lat: 41.9028, lng: 12.4964 },
  { name: "Madrid", country: "Spain", code: "MAD", lat: 40.4168, lng: -3.7038 },
  { name: "Barcelona", country: "Spain", code: "BCN", lat: 41.3874, lng: 2.1686 },
  { name: "Vienna", country: "Austria", code: "VIE", lat: 48.2082, lng: 16.3738 },
  { name: "Prague", country: "Czech Republic", code: "PRG", lat: 50.0755, lng: 14.4378 },
  { name: "Munich", country: "Germany", code: "MUC", lat: 48.1351, lng: 11.582 },
  { name: "Zurich", country: "Switzerland", code: "ZRH", lat: 47.3769, lng: 8.5417 },
  { name: "Brussels", country: "Belgium", code: "BRU", lat: 50.8503, lng: 4.3517 },
];

// Flights (bidirectional for simplicity)
const flights = [
  ["PAR", "LON", 1.3, 89, "Air France", 344],
  ["PAR", "AMS", 1.2, 75, "KLM", 430],
  ["PAR", "BER", 1.8, 95, "EasyJet", 878],
  ["PAR", "ROM", 2.1, 110, "Alitalia", 1105],
  ["PAR", "MAD", 2.0, 99, "Iberia", 1054],
  ["PAR", "BCN", 1.7, 85, "Vueling", 831],
  ["LON", "AMS", 1.1, 70, "British Airways", 370],
  ["LON", "BER", 1.7, 90, "EasyJet", 930],
  ["LON", "ROM", 2.5, 120, "British Airways", 1435],
  ["LON", "MAD", 2.4, 115, "Iberia", 1260],
  ["AMS", "BER", 1.3, 80, "KLM", 575],
  ["AMS", "MUC", 1.4, 85, "Lufthansa", 650],
  ["BER", "MUC", 1.1, 70, "Lufthansa", 504],
  ["BER", "VIE", 1.2, 75, "Austrian", 520],
  ["BER", "PRG", 0.9, 60, "EasyJet", 280],
  ["ROM", "MAD", 2.3, 105, "Iberia", 1360],
  ["ROM", "BCN", 1.6, 80, "Vueling", 860],
  ["ROM", "VIE", 1.5, 90, "Austrian", 765],
  ["MAD", "BCN", 1.2, 55, "Vueling", 505],
  ["VIE", "PRG", 0.8, 50, "Austrian", 250],
  ["VIE", "MUC", 1.0, 65, "Lufthansa", 355],
  ["PRG", "MUC", 0.9, 60, "Lufthansa", 300],
  ["MUC", "ZRH", 0.8, 70, "Swiss", 260],
  ["ZRH", "AMS", 1.3, 95, "Swiss", 600],
  ["BRU", "PAR", 0.9, 65, "Brussels Airlines", 265],
  ["BRU", "AMS", 0.7, 55, "KLM", 175],
  ["BRU", "LON", 1.0, 75, "British Airways", 320],
];

// Trains
const trains = [
  ["PAR", "AMS", 3.2, 45, 430],
  ["PAR", "BRU", 1.4, 35, 265],
  ["PAR", "LON", 2.5, 80, 344], // Eurostar
  ["AMS", "BRU", 1.8, 30, 175],
  ["BER", "PRG", 4.0, 40, 280],
  ["BER", "MUC", 4.5, 55, 504],
  ["MUC", "VIE", 4.0, 50, 355],
  ["VIE", "PRG", 4.0, 35, 250],
  ["ZRH", "MUC", 3.5, 45, 260],
  ["ROM", "MIL", 3.0, 40, 570], // we don't have Milan, skip or add later
];

async function seed() {
  const session = driver.session();

  try {
    console.log("Clearing existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating cities...");
    for (const city of cities) {
      await session.run(
        `
        CREATE (c:City {
          name: $name,
          country: $country,
          code: $code,
          lat: $lat,
          lng: $lng
        })
        `,
        city
      );
    }

    console.log("Creating flights...");
    for (const [from, to, duration, price, airline, distance] of flights) {
      // Create both directions
      await session.run(
        `
        MATCH (a:City {code: $from}), (b:City {code: $to})
        CREATE (a)-[:FLIGHT {
          duration_hours: $duration,
          price_usd: $price,
          airline: $airline,
          distance_km: $distance
        }]->(b)
        CREATE (b)-[:FLIGHT {
          duration_hours: $duration,
          price_usd: $price,
          airline: $airline,
          distance_km: $distance
        }]->(a)
        `,
        { from, to, duration, price, airline, distance }
      );
    }

    console.log("Creating trains...");
    for (const [from, to, duration, price, distance] of trains) {
      // Skip if city doesn't exist (e.g. MIL)
      const result = await session.run(
        `
        MATCH (a:City {code: $from}), (b:City {code: $to})
        CREATE (a)-[:TRAIN {
          duration_hours: $duration,
          price_usd: $price,
          distance_km: $distance
        }]->(b)
        CREATE (b)-[:TRAIN {
          duration_hours: $duration,
          price_usd: $price,
          distance_km: $distance
        }]->(a)
        RETURN count(*) as created
        `,
        { from, to, duration, price, distance }
      );
    }

    // Quick verification
    const countResult = await session.run(`
      MATCH (c:City) RETURN count(c) as cities
    `);
    const relResult = await session.run(`
      MATCH ()-[r]->() RETURN count(r) as relationships
    `);

    console.log("\n✅ Seed completed successfully!");
    console.log(`   Cities: ${countResult.records[0].get("cities")}`);
    console.log(`   Relationships: ${relResult.records[0].get("relationships")}`);
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();