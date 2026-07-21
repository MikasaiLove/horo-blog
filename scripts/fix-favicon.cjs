const fs = require("fs");
let lines = fs.readFileSync("src/config/siteConfig.ts", "utf8").split("\n");

// Find and remove the misplaced favicon at top (lines starting with tabs + "favicon: [")
let firstFaviconStart = -1;
let firstFaviconEnd = -1;
for (let i = 0; i < lines.length; i++) {
	if (lines[i].trimStart().startsWith("favicon: [") && firstFaviconStart < 0) {
		firstFaviconStart = i;
	}
	if (firstFaviconStart >= 0 && firstFaviconEnd < 0 && lines[i].trimStart() === "],") {
		// Check if this is the closing of the first favicon (contains sizes)
		if (lines[i - 1] && lines[i - 1].includes("sizes")) {
			firstFaviconEnd = i;
		}
	}
}
console.log("First favicon: lines", firstFaviconStart, "-", firstFaviconEnd);

// Remove lines firstFaviconStart through firstFaviconEnd
if (firstFaviconStart >= 0 && firstFaviconEnd >= 0) {
	lines.splice(firstFaviconStart, firstFaviconEnd - firstFaviconStart + 1);
	console.log("Removed misplaced favicon at top");
}

// Now find the second (old) favicon section
let secondFaviconStart = -1;
let secondFaviconEnd = -1;
for (let i = 0; i < lines.length; i++) {
	if (lines[i].includes("// Favicon 配置") || (lines[i].trimStart().startsWith("favicon: [") && secondFaviconStart < 0 && i > 5)) {
		if (secondFaviconStart < 0) {
			// Find the actual favicon: [ line
			for (let j = i; j < lines.length; j++) {
				if (lines[j].trimStart().startsWith("favicon: [")) {
					secondFaviconStart = j;
					break;
				}
			}
		}
	}
	if (secondFaviconStart >= 0 && secondFaviconEnd < 0 && lines[i].trimStart() === "],") {
		// Check previous non-empty line
		for (let j = i - 1; j >= 0; j--) {
			if (lines[j].trim() !== "") {
				if (lines[j].includes("favicon.ico") || lines[j].includes("// 图标文件路径")) {
					secondFaviconEnd = i;
				}
				break;
			}
		}
	}
}
console.log("Second favicon: lines", secondFaviconStart, "-", secondFaviconEnd);

if (secondFaviconStart >= 0 && secondFaviconEnd >= 0) {
	// Replace with proper favicon
	const indent = "\t\t";
	const newLines = [
		indent + "// Favicon 配置",
		indent + "// 如果启用了OpenGraph图片功能，数组中需要包含png格式的favicon图标",
		indent + "favicon: [",
		indent + "\t{ src: \"/favicon/favicon-light-32.png\", theme: \"light\", sizes: \"32x32\" },",
		indent + "\t{ src: \"/favicon/favicon-light-128.png\", theme: \"light\", sizes: \"128x128\" },",
		indent + "\t{ src: \"/favicon/favicon-light-180.png\", theme: \"light\", sizes: \"180x180\" },",
		indent + "\t{ src: \"/favicon/favicon-light-192.png\", theme: \"light\", sizes: \"192x192\" },",
		indent + "\t{ src: \"/favicon/favicon-dark-32.png\", theme: \"dark\", sizes: \"32x32\" },",
		indent + "\t{ src: \"/favicon/favicon-dark-128.png\", theme: \"dark\", sizes: \"128x128\" },",
		indent + "\t{ src: \"/favicon/favicon-dark-180.png\", theme: \"dark\", sizes: \"180x180\" },",
		indent + "\t{ src: \"/favicon/favicon-dark-192.png\", theme: \"dark\", sizes: \"192x192\" },",
		indent + "],",
	];
	lines.splice(secondFaviconStart, secondFaviconEnd - secondFaviconStart + 1, ...newLines);
	console.log("Replaced old favicon");
}

fs.writeFileSync("src/config/siteConfig.ts", lines.join("\n"));
console.log("Done!");
