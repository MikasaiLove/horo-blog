/**
 * Firefly 图片一键转换脚本
 * 用法: node scripts/convert-images.js
 *
 * 把你的高清原图放到 source-images/ 目录下:
 *   source-images/logo.png       → Logo 原图（建议 2K，自动缩到 512×512）
 *   source-images/avatar.png     → 头像原图（正方形，自动缩到 400×400）
 *   source-images/cover.png      → 封面原图（自动缩到 1200×630）
 *   source-images/favicon.png    → 图标原图（自动生成各种尺寸 favicon）
 *
 * 支持格式: PNG, JPG, WebP, AVIF
 * 输出: 自动转为目标格式（PNG 保持透明，AVIF 高效压缩）
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "source-images");

const tasks = [
	// ==================== Logo ====================
	{
		name: "Logo",
		source: "logo.png",
		output: "src/assets/images/firefly.png",
		width: 512,
		height: 512,
		format: "png",
		fit: "contain",       // 保持比例，不裁切
		background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明背景
	},
	// ==================== Avatar ====================
	{
		name: "Avatar",
		source: "avatar.png",
		output: "src/assets/images/avatar.avif",
		width: 400,
		height: 400,
		format: "avif",
		fit: "cover",         // 居中裁切正方形
		avif: { quality: 80 },
	},
	// ==================== Cover ====================
	{
		name: "Cover",
		source: "cover.png",
		output: "src/assets/images/cover.avif",
		width: 1200,
		height: 630,
		format: "avif",
		fit: "cover",
		avif: { quality: 80 },
	},
	// ==================== Favicons ====================
	...[
		{ name: "favicon-dark-32.png",   size: 32  },
		{ name: "favicon-dark-128.png",  size: 128 },
		{ name: "favicon-dark-180.png",  size: 180 },
		{ name: "favicon-dark-192.png",  size: 192 },
		{ name: "favicon-light-32.png",  size: 32  },
		{ name: "favicon-light-128.png", size: 128 },
		{ name: "favicon-light-180.png", size: 180 },
		{ name: "favicon-light-192.png", size: 192 },
	].map(({ name, size }) => ({
		name: `Favicon ${name}`,
		source: "favicon.png",
		output: `public/favicon/${name}`,
		width: size,
		height: size,
		format: "png",
		fit: "cover",
	})),
	// ==================== favicon.ico ====================
	{
		name: "Favicon ICO",
		source: "favicon.png",
		output: "public/favicon/favicon.ico",
		width: 32,
		height: 32,
		format: "png",  // sharp 不支持 .ico，输出 png 再改名
		fit: "cover",
		renameTo: "favicon.ico",
	},
];

async function main() {
	console.log("🖼️  Firefly 图片转换工具\n");

	let success = 0;
	let skipped = 0;
	const errors = [];

	for (const task of tasks) {
		const srcPath = path.join(SOURCE, task.source);
		const outPath = path.join(ROOT, task.output);

		if (!fs.existsSync(srcPath)) {
			skipped++;
			console.log(`  ⏭️  跳过 ${task.name} — 未找到 source-images/${task.source}`);
			continue;
		}

		// 确保输出目录存在
		fs.mkdirSync(path.dirname(outPath), { recursive: true });

		try {
			let pipeline = sharp(srcPath)
				.resize({
					width: task.width,
					height: task.height,
					fit: task.fit || "cover",
					withoutEnlargement: true,
				});

			if (task.format === "avif") {
				pipeline = pipeline.avif(task.avif || { quality: 80 });
			} else if (task.format === "png") {
				pipeline = pipeline.png({ compressionLevel: 6 });
			} else if (task.format === "webp") {
				pipeline = pipeline.webp({ quality: 85 });
			} else if (task.format === "jpg" || task.format === "jpeg") {
				pipeline = pipeline.jpeg({ quality: 90 });
			}

			const finalOut = task.renameTo
				? path.join(path.dirname(outPath), task.renameTo)
				: outPath;

			await pipeline.toFile(finalOut);

			const stats = fs.statSync(finalOut);
			const sizeKB = (stats.size / 1024).toFixed(1);
			const dims = `${task.width}×${task.height}`;
			console.log(`  ✅ ${task.name.padEnd(22)} → ${dims.padEnd(12)} ${sizeKB.padStart(6)} KB  ${path.relative(ROOT, finalOut)}`);
			success++;
		} catch (err) {
			errors.push({ name: task.name, error: err.message });
			console.log(`  ❌ ${task.name} — ${err.message}`);
		}
	}

	console.log(`\n${"─".repeat(60)}`);
	console.log(`  成功: ${success}  跳过: ${skipped}  失败: ${errors.length}`);

	if (skipped > 0) {
		console.log(`\n  💡 提示: 把原图放到 source-images/ 目录即可`);
		console.log(`      logo.png  /  avatar.png  /  cover.png  /  favicon.png`);
	}
}

main().catch(console.error);
