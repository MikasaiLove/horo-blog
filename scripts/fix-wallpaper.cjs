const fs = require("fs");
let content = fs.readFileSync("src/config/backgroundWallpaper.ts", "utf8");

// Fix desktop wallpaper array — remove d3-d6 references
content = content.replace(
	/desktop:\s*\[[\s\S]*?\],\s*\/\/\s*移动背景/,
	'desktop: [\n\t\t\t"assets/images/DesktopWallpaper/d1.avif",\n\t\t\t"assets/images/DesktopWallpaper/d2.avif",\n\t\t],\n\t\t// 移动背景'
);

fs.writeFileSync("src/config/backgroundWallpaper.ts", content);
console.log("Desktop wallpaper fixed!");
