const fs = require("fs");
let c = fs.readFileSync("src/components/pages/music/MusicPageContent.svelte", "utf8");

// 1. Remove dead errorMsg
c = c.replace("  let errorMsg = null;\n", "");
c = c.replace("    errorMsg = s.error;\n", "");
c = c.replace("  function onFmError(e) { errorMsg = e.detail.message; }\n", "");

// 2. Make hoverTime derivable
c = c.replace("  let hoverPct = -1;\n  let hoverTime = 0;", "  let hoverPct = -1;");
// Add reactive hoverTime after the existing reactive block
c = c.replace(
  "$: if (currentPage > totalPages) currentPage = totalPages;",
  "$: if (currentPage > totalPages) currentPage = totalPages;\n  $: hoverTime = hoverPct >= 0 ? hoverPct / 100 * duration : 0;"
);

// 3. Remove redundant hoverTime assignment in pointermove
c = c.replace(
  "            hoverPct = ((e.clientX - r.left) / r.width) * 100;\n            hoverTime = (e.clientX - r.left) / r.width * duration;",
  "            hoverPct = ((e.clientX - r.left) / r.width) * 100;"
);

// 4. Simplify onDestroy (Svelte 5 handles single-call)
c = c.replace("  let cleanupDone = false;\n  ", "");
c = c.replace("  onDestroy(() => {\n    if (cleanupDone || !isBrowser) return;\n    cleanupDone = true;\n    clearTimeout(retryTimer);", "  onDestroy(() => {\n    if (!isBrowser) return;\n    clearTimeout(retryTimer);");

fs.writeFileSync("src/components/pages/music/MusicPageContent.svelte", c);
console.log("MusicPageContent simplified");
