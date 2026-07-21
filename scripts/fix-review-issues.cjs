const fs = require("fs");

// === Fix 1: Add res.ok check to PageViewCounter.svelte ===
let pvc = fs.readFileSync("src/components/features/PageViewCounter.svelte", "utf8");
// Find unique patterns and add error checks
pvc = pvc.replace(
  'const data = await res.json();\n\t        count = typeof data === "number"',
  'if (!res.ok) throw new Error("fetch failed");\n\t        const data = await res.json();\n\t        count = typeof data === "number"'
);
pvc = pvc.replace(
  'const data = await res.json();\n\t        count = data?.[0]?.count ?? 0;',
  'if (!res.ok) throw new Error("fetch failed");\n\t        const data = await res.json();\n\t        count = data?.[0]?.count ?? 0;'
);
fs.writeFileSync("src/components/features/PageViewCounter.svelte", pvc);
console.log("1. Added res.ok checks to PageViewCounter.svelte");

// === Fix 2: Add res.ok check to dynamic-views.ts ===
let dv = fs.readFileSync("src/components/pages/dynamic/dynamic-views.ts", "utf8");
dv = dv.replace(
  'const data = await res.json();\n\t        const count =',
  'if (!res.ok) throw new Error("fetch failed");\n\t        const data = await res.json();\n\t        const count ='
);
dv = dv.replace(
  'const data = await res.json();\n\t        span.textContent = String(data?.[0]?.count ?? 0);',
  'if (!res.ok) throw new Error("fetch failed");\n\t        const data = await res.json();\n\t        span.textContent = String(data?.[0]?.count ?? 0);'
);
fs.writeFileSync("src/components/pages/dynamic/dynamic-views.ts", dv);
console.log("2. Added res.ok checks to dynamic-views.ts");

// === Fix 3: Remove dead code from DynamicItem.astro ===
let di = fs.readFileSync("src/components/pages/dynamic/DynamicItem.astro", "utf8");
// Remove the import
di = di.replace('import PageViewCounter from "@components/features/PageViewCounter.svelte";\n', '');
// Remove the viewPath variable
di = di.replace('\nconst viewPath = "/dynamic/" + entry.id.replace(/\\.md$/, "");\n', '\n');
// Remove the counter HTML block
di = di.replace(
  '\t\t\t\t\t<span class="dynamic-views">\n\t\t\t\t\t\t<Icon is:inline name="material-symbols:visibility-outline-rounded" class="text-sm inline align-middle mr-0.5" />\n\t\t\t\t\t\t<PageViewCounter path={viewPath} client:load />\n\t\t\t\t\t</span>\n',
  ''
);
fs.writeFileSync("src/components/pages/dynamic/DynamicItem.astro", di);
console.log("3. Removed dead code from DynamicItem.astro");

// === Fix 4: Fix indentation in DynamicFeed.svelte ===
let df = fs.readFileSync("src/components/pages/dynamic/DynamicFeed.svelte", "utf8");
df = df.replace('\t\timport { initDynamicViews }', '\timport { initDynamicViews }');
fs.writeFileSync("src/components/pages/dynamic/DynamicFeed.svelte", df);
console.log("4. Fixed indentation in DynamicFeed.svelte");

console.log("\nAll fixes applied!");
