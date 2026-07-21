const fs = require("fs");
let c = fs.readFileSync("src/components/pages/music/MusicPageContent.svelte", "utf8");

// Replace controls CSS section
const controlsStart = c.indexOf("/* 控制 */");
const lyricsStart = c.indexOf("/* ====== 右侧：歌词");
if (controlsStart < 0 || lyricsStart < 0) { console.log("Not found"); process.exit(1); }

const before = c.substring(0, controlsStart);
const after = c.substring(lyricsStart);

const newCSS = `  /* 控制 */
  .controls { display: flex; align-items: center; justify-content: center; gap: 12px; }
  .c-btn {
    width: 30px; height: 30px; border-radius: 50%; border: none;
    background: transparent; color: #6b7280; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; position: relative;
  }
  .c-btn svg { width: 16px; height: 16px; }
  .c-btn:hover { background: #e5e7eb; color: #374151; transform: scale(1.1); }
  .c-btn:active { transform: scale(.9); }
  .badge { position: absolute; bottom: 0; right: 0; font-size: 7px; font-weight: 900; color: #6366f1; }
  .p-btn {
    width: 45px; height: 45px; border-radius: 50%; border: none;
    background: #374151; color: #f9fafb; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; box-shadow: 0 2px 12px rgba(0,0,0,.12);
  }
  .p-btn svg { width: 20px; height: 20px; }
  .p-btn:hover { transform: scale(1.06); box-shadow: 0 4px 20px rgba(0,0,0,.2); }
  .p-btn:active { transform: scale(.94); }
  .p-btn.is-playing { background: #6366f1; animation: pulse 2s ease-out infinite; }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(99,102,241,.4); }
    100% { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
  }
  .vol { display: flex; align-items: center; gap: 6px; color: #6b7280; margin-left: 6px; }
  .vol svg { width: 15px; height: 15px; flex-shrink: 0; }
  .vol input[type=range] { width: 72px; accent-color: #374151; }

`;

c = before + newCSS + after;
fs.writeFileSync("src/components/pages/music/MusicPageContent.svelte", c);
console.log("Controls updated");
