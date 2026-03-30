import { db } from "./db";
import { organizationDocument } from "./db/schema";

async function checkDocs() {
  try {
    const docs = await db.select().from(organizationDocument);
    console.log("Total Documents in DB:", docs.length);
    if (docs.length > 0) {
      console.log("Sample Document:", JSON.stringify(docs[0], null, 2));
    }
  } catch (err) {
    console.error("DB Query Error:", err);
  }
  process.exit(0);
}

checkDocs();
