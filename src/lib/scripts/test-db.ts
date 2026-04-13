import { MongoClient } from "mongodb";
import * as dns from "dns";
import * as net from "net";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const uri = process.env.MONGODB_URI;

async function runDiagnostics() {
  console.log("--- MongoDB Connectivity Diagnostics ---");
  
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    return;
  }

  console.log(`Checking URI: ${uri.replace(/:([^@]+)@/, ":****@")}`);

  // 1. Parse Host
  const hostMatch = uri.match(/@([^/?#]+)/);
  const host = hostMatch ? hostMatch[1] : null;

  if (!host) {
    console.error("❌ Could not parse host from URI");
    return;
  }

  console.log(`Target Host: ${host}`);

  // 2. DNS Check
  console.log("\n1. Testing DNS Resolution...");
  try {
    const addresses = await dns.promises.resolve4(host).catch(() => []);
    if (addresses.length > 0) {
      console.log(`✅ DNS Resolved to: ${addresses.join(", ")}`);
    } else {
      // Try SRV if it's a +srv URI
      const srvRecords = await dns.promises.resolveSrv(`_mongodb._tcp.${host}`).catch(() => []);
      if (srvRecords.length > 0) {
        console.log(`✅ SRV Records Found: ${srvRecords.length} records`);
        srvRecords.forEach(r => console.log(`   - ${r.name}:${r.port}`));
      } else {
        console.error("❌ DNS Resolution failed for both A and SRV records.");
      }
    }
  } catch (err: any) {
    console.error(`❌ DNS Error: ${err.message}`);
  }

  // 3. Port Check (Standard 27017)
  console.log("\n2. Testing Port 27017 (Standard MongoDB)...");
  const socket = new net.Socket();
  const timeout = 5000;
  
  socket.setTimeout(timeout);
  socket.on("connect", () => {
    console.log("✅ Successfully reached Port 27017.");
    socket.destroy();
  }).on("timeout", () => {
    console.error("❌ Connection timed out on Port 27017 (Check Firewall/VPN).");
    socket.destroy();
  }).on("error", (err) => {
    console.error(`❌ Connection refused on Port 27017: ${err.message}`);
  }).connect(27017, host.startsWith("cluster") ? host : host.split('.')[0] + ".mongodb.net");

  // 4. Actual Client Connect attempt
  console.log("\n3. Attempting full MongoClient connection...");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log("✅ SUCCESS: Connected to MongoDB Atlas!");
    await client.db().admin().ping();
    console.log("✅ SUCCESS: Database ping successful.");
  } catch (err: any) {
    console.error(`❌ Full Connection Failed: ${err.message}`);
    console.log("\nSuggested Fixes:");
    if (err.message.includes("ECONNREFUSED")) {
      console.log("- Check if your IP is whitelisted in Atlas Network Access.");
      console.log("- Check if a VPN or Firewall is blocking the connection.");
    }
  } finally {
    await client.close();
  }
}

runDiagnostics();
