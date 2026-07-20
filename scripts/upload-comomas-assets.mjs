import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(join(root, ".env.local"));
loadEnvFile(join(root, ".env"));

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicDomain = process.env.R2_PUBLIC_DOMAIN || "cdn.danielcabrera.es";

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("Missing R2_* env vars");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const assets = [
  {
    file: "ComoMas_Project_Image.webp",
    key: "img/ComoMas_Project_Image.webp",
    contentType: "image/webp",
  },
  {
    file: "ComoMas_Gallery_Landing.png",
    key: "img/ComoMas_Gallery_Landing.png",
    contentType: "image/png",
  },
  {
    file: "ComoMas_Gallery_Planificador.png",
    key: "img/ComoMas_Gallery_Planificador.png",
    contentType: "image/png",
  },
  {
    file: "ComoMas_Gallery_Compra.png",
    key: "img/ComoMas_Gallery_Compra.png",
    contentType: "image/png",
  },
  {
    file: "ComoMas_Gallery_Ajustes.png",
    key: "img/ComoMas_Gallery_Ajustes.png",
    contentType: "image/png",
  },
  {
    file: "ComoMas_Gallery_Nutricion.png",
    key: "img/ComoMas_Gallery_Nutricion.png",
    contentType: "image/png",
  },
  {
    file: "ComoMas_Gallery_Premium.png",
    key: "img/ComoMas_Gallery_Premium.png",
    contentType: "image/png",
  },
];

async function uploadOne({ file, key, contentType }) {
  const path = join(root, "tmp", "comomas", file);
  if (!existsSync(path)) {
    throw new Error(`Missing local asset: ${path}`);
  }
  const body = readFileSync(path);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `https://${publicDomain}/${key}`;
}

const urls = [];
for (const asset of assets) {
  const url = await uploadOne(asset);
  urls.push(url);
  console.log(`uploaded ${asset.key} -> ${url}`);
}

let failed = 0;
for (const url of urls) {
  const res = await fetch(url, { method: "HEAD" });
  const ok = res.ok;
  console.log(`verify ${url} -> ${res.status}`);
  if (!ok) failed += 1;
}

if (failed) {
  console.error(`Verification failed for ${failed} URL(s)`);
  process.exit(1);
}

console.log(`OK: ${urls.length} assets live on CDN`);
