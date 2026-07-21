const fs = require("fs");
let c = fs.readFileSync("src/components/pages/dynamic/DynamicItem.astro", "utf8");

const marker = '<a class="dynamic-time"';
const idx = c.indexOf(marker);
if (idx < 0) { console.log("Not found"); process.exit(1); }

// Find the closing </a> of the dynamic-time link
const linkEnd = c.indexOf("</a>", idx);
if (linkEnd < 0) { console.log("</a> not found"); process.exit(1); }
const insertAt = linkEnd + "</a>".length;

const counterHtml = `\n\t\t\t\t\t<span class="dynamic-views">\n\t\t\t\t\t\t<Icon is:inline name="material-symbols:visibility-outline-rounded" class="text-sm inline align-middle mr-0.5" />\n\t\t\t\t\t\t<PageViewCounter path={permalink} client:load />\n\t\t\t\t\t</span>`;

c = c.substring(0, insertAt) + counterHtml + c.substring(insertAt);
fs.writeFileSync("src/components/pages/dynamic/DynamicItem.astro", c);
console.log("OK");
