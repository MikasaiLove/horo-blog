const fs = require("fs");
let lines = fs.readFileSync("src/components/layout/PostMeta.astro", "utf8").split("\n");

// Find the bad block: a line that is just "{" followed by a line that is just "{"
// (tab indentation difference)
let badStart = -1;
for (let i = 0; i < lines.length; i++) {
	if (lines[i].trim() === "{" && lines[i + 1] && lines[i + 1].trim() === "{") {
		badStart = i;
		break;
	}
}

if (badStart < 0) { console.log("Bad block not found"); process.exit(1); }

// Remove the outer wrapping: delete line badStart (the outer "{")
// And change line badStart+1 from "\t\t{" to "\t{"
lines.splice(badStart, 1); // remove outer "{"

// Now line badStart has the inner "{" — it should be the only block start
// Find the matching closing: after the counter block there's "\t\t}" followed by "\t}"
// We need to remove the inner closing "\t\t}" or change it

// Find lines that are just "}" with different indent levels after badStart
let innerClose = -1;
let outerClose = -1;
for (let i = badStart; i < lines.length; i++) {
	const t = lines[i].trim();
	if (t === "}" && innerClose < 0) {
		innerClose = i;
	} else if (t === "}" && innerClose >= 0 && outerClose < 0) {
		outerClose = i;
		break;
	}
}

// Remove the extra closing (innerClose)
if (innerClose >= 0) {
	lines.splice(innerClose, 1);
}

fs.writeFileSync("src/components/layout/PostMeta.astro", lines.join("\n"));
console.log("Fixed: removed badStart line", badStart, "and innerClose line", innerClose);
