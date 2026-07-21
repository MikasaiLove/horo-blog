const sharp = require("sharp");
const fs = require("fs");

async function removeWhiteBg(inputPath, outputPath, size) {
  // Get raw RGBA pixels
  const { data, info } = await sharp(inputPath)
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const out = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Calculate whiteness (0-255)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // Skip if it's not a white-ish pixel
    if (max < 200 || (max - min) > 30) {
      data.copy(out, i, i, i + 4);
      continue;
    }
    // White/gray pixel: make transparent based on brightness
    const alpha = Math.round(255 - max);
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = Math.max(0, Math.min(255, alpha));
  }

  return sharp(out, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

async function main() {
  const src = "D:/blog/image/tubiao.webp";

  // Generate favicon PNGs
  for (const s of [32, 128, 180, 192]) {
    const buf = await removeWhiteBg(src, null, s);
    fs.writeFileSync(`public/favicon/favicon-light-${s}.png`, buf);
    fs.writeFileSync(`public/favicon/favicon-dark-${s}.png`, buf);
    console.log(`favicon ${s}x${s}`);
  }

  // favicon.ico
  const ico = await removeWhiteBg(src, null, 32);
  fs.writeFileSync("public/favicon/favicon.ico", ico);
  console.log("favicon.ico");

  // Logo with alpha (save as PNG for transparency support)
  const logo = await removeWhiteBg(src, null, 256);
  // Save as webp WITH alpha
  const logoWebp = await sharp(logo).webp().toBuffer();
  fs.writeFileSync("public/assets/images/logo.webp", logoWebp);
  console.log("logo.webp (with alpha)");

  // Verify
  const meta = await sharp("public/assets/images/logo.webp").metadata();
  console.log("Verification - logo hasAlpha:", meta.hasAlpha, "channels:", meta.channels);
}

main().catch(e => { console.error(e); process.exit(1); });
