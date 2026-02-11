import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

// Validate required environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2 configuration:");
  console.error("R2_ACCOUNT_ID:", !!R2_ACCOUNT_ID);
  console.error("R2_ACCESS_KEY_ID:", !!R2_ACCESS_KEY_ID);
  console.error("R2_SECRET_ACCESS_KEY:", !!R2_SECRET_ACCESS_KEY);
  
  throw new Error(
    "R2 configuration is incomplete. Please check your environment variables."
  );
}

// Create a custom HTTPS agent with relaxed SSL options
const httpsAgent = new https.Agent({
  rejectUnauthorized: true,
  secureProtocol: 'TLSv1_2_method',
  keepAlive: true,
});

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({
    httpsAgent,
    connectionTimeout: 30000,
    requestTimeout: 30000,
  }),
  forcePathStyle: false,
});

console.log("R2 client initialized successfully");