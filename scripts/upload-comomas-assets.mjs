import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const tmpDir = join(root, "tmp", "comomas");

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
const assetsDir =
  process.env.COMOMAS_ASSETS_DIR ||
  join(
    process.env.USERPROFILE || "",
    ".cursor",
    "projects",
    "c-Users-K3IN0X-Documents-workspace-Portfolios-portfoliOS",
    "assets",
  );

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("Missing R2_* env vars");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const screenshotMap = [
  { match: "iPhone-Ajustes", dest: "ComoMas_Gallery_Ajustes.png" },
  { match: "iPhone-Compra", dest: "ComoMas_Gallery_Compra.png" },
  { match: "iPhone-Nutricion", dest: "ComoMas_Gallery_Nutricion.png" },
  { match: "iPhone-Planificador", dest: "ComoMas_Gallery_Planificador.png" },
  { match: "iPhone-Premium", dest: "ComoMas_Gallery_Premium.png" },
];

const uploadManifest = [
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

async function prepareAssets() {
  const { writeFileSync, readdirSync } = await import("node:fs");
  mkdirSync(tmpDir, { recursive: true });

  const ogPath = join(tmpDir, "og.png");
  console.log("Downloading OG image…");
  const ogRes = await fetch("https://comomas.com/og-image.png");
  if (!ogRes.ok) throw new Error(`OG download failed: ${ogRes.status}`);
  const ogBuf = Buffer.from(await ogRes.arrayBuffer());
  writeFileSync(ogPath, ogBuf);

  const webpPath = join(tmpDir, "ComoMas_Project_Image.webp");
  await sharp(ogPath).webp({ quality: 85 }).toFile(webpPath);
  console.log("Converted OG → webp");

  if (!existsSync(assetsDir)) {
    throw new Error(
      `COMOMAS_ASSETS_DIR not found: ${assetsDir}. Set COMOMAS_ASSETS_DIR to the folder with iPhone-*.png screenshots.`,
    );
  }

  const names = readdirSync(assetsDir);
  for (const { match, dest } of screenshotMap) {
    const hit = names.find((n) => n.includes(match));
    if (!hit) throw new Error(`No screenshot matching "${match}" in ${assetsDir}`);
    copyFileSync(join(assetsDir, hit), join(tmpDir, dest));
    console.log(`Copied ${hit} → ${dest}`);
  }

  const landingPath = join(tmpDir, "ComoMas_Gallery_Landing.png");
  if (!existsSync(landingPath)) {
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch();
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto("https://www.comomas.com", { waitUntil: "networkidle" });
      await page.screenshot({ path: landingPath, type: "png" });
      await browser.close();
      console.log("Captured landing with Playwright");
    } catch (err) {
      throw new Error(
        `Landing screenshot missing at ${landingPath} and Playwright capture failed: ${err.message}. Place ComoMas_Gallery_Landing.png in tmp/comomas/ and re-run.`,
      );
    }
  } else {
    console.log("Using existing landing screenshot");
  }
}

async function uploadOne({ file, key, contentType }) {
  const path = join(tmpDir, file);
  if (!existsSync(path)) throw new Error(`Missing local asset: ${path}`);
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

async function main() {
  await prepareAssets();

  const urls = [];
  for (const asset of uploadManifest) {
    const url = await uploadOne(asset);
    urls.push(url);
    console.log(`uploaded ${asset.key} -> ${url}`);
  }

  let failed = 0;
  for (const url of urls) {
    const res = await fetch(url, { method: "HEAD" });
    console.log(`verify ${url} -> ${res.status}`);
    if (!res.ok) failed += 1;
  }

  if (failed) {
    console.error(`Verification failed for ${failed} URL(s)`);
    process.exit(1);
  }

  console.log(`OK: ${urls.length} assets live on CDN`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
