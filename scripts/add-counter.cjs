const fs = require("fs");
let c = fs.readFileSync("src/components/layout/PostMeta.astro", "utf8");

// Find the showWords block start
const marker = 'showWords && typeof words === "number"';
const idx = c.indexOf(marker);
if (idx < 0) { console.log("Not found"); process.exit(1); }

// Go back to find the line start with {
const before = c.substring(0, idx);
const lastBrace = before.lastIndexOf('\t{\n\t    ');
const insertAt = lastBrace >= 0 ? lastBrace : idx - 4;

const newBlock = `\t{\n\t\t!isHome &&\n\t\t\tid &&\n\t\t\tcommentConfig.type !== "waline" &&\n\t\t\tcommentConfig.type !== "twikoo" &&\n\t\t\tcommentConfig.type !== "artalk" && (\n\t\t\t\t<div class="flex items-center">\n\t\t\t\t\t<div class="meta-icon">\n\t\t\t\t\t\t<Icon\n\t\t\t\t\t\t\tis:inline\n\t\t\t\t\t\t\tname="material-symbols:visibility-outline-rounded"\n\t\t\t\t\t\t\tclass="text-xl"\n\t\t\t\t\t\t/>\n\t\t\t\t\t</div>\n\t\t\t\t\t<span class="text-50 text-sm font-medium mr-1">\n\t\t\t\t\t\t{i18n(I18nKey.pageViews)}\n\t\t\t\t\t</span>\n\t\t\t\t\t<PageViewCounter path={path} client:load />\n\t\t\t\t</div>\n\t\t\t)\n\t}\n\n\t`;

c = c.substring(0, insertAt) + newBlock + c.substring(insertAt);
fs.writeFileSync("src/components/layout/PostMeta.astro", c);
console.log("OK inserted at", insertAt);
