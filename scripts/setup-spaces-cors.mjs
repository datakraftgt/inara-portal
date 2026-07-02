// Configura CORS en el Space de DigitalOcean para permitir la subida directa
// de adjuntos de reclamos desde el browser (presigned PUT URLs).
//
// Uso: node --env-file=.env.local scripts/setup-spaces-cors.mjs

import {
  S3Client,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";

const { DO_SPACES_REGION, DO_SPACES_ENDPOINT, DO_SPACES_ACCESS_KEY, DO_SPACES_SECRET_KEY, DO_SPACES_BUCKET } = process.env;

if (!DO_SPACES_REGION || !DO_SPACES_ENDPOINT || !DO_SPACES_ACCESS_KEY || !DO_SPACES_SECRET_KEY || !DO_SPACES_BUCKET) {
  console.error("Faltan variables de entorno DO_SPACES_*");
  process.exit(1);
}

const client = new S3Client({
  region: DO_SPACES_REGION,
  endpoint: DO_SPACES_ENDPOINT.replace(/\/$/, ""),
  credentials: { accessKeyId: DO_SPACES_ACCESS_KEY, secretAccessKey: DO_SPACES_SECRET_KEY },
  forcePathStyle: false,
});

const UPLOAD_RULE = {
  ID: "reclamos-direct-upload",
  AllowedOrigins: [
    "http://localhost:3000",
    "https://inara-portal.vercel.app",
    "https://*.vercel.app",
  ],
  AllowedMethods: ["PUT"],
  AllowedHeaders: ["*"],
  MaxAgeSeconds: 3600,
};

// Preservar reglas existentes que no sean la nuestra
let existing = [];
try {
  const res = await client.send(new GetBucketCorsCommand({ Bucket: DO_SPACES_BUCKET }));
  existing = (res.CORSRules ?? []).filter(r => r.ID !== UPLOAD_RULE.ID);
  console.log(`Reglas CORS existentes preservadas: ${existing.length}`);
} catch (err) {
  if (err.name !== "NoSuchCORSConfiguration") throw err;
  console.log("El bucket no tenía configuración CORS previa.");
}

await client.send(
  new PutBucketCorsCommand({
    Bucket: DO_SPACES_BUCKET,
    CORSConfiguration: { CORSRules: [...existing, UPLOAD_RULE] },
  })
);

console.log(`CORS configurado en el bucket "${DO_SPACES_BUCKET}":`);
console.log(JSON.stringify(UPLOAD_RULE, null, 2));
