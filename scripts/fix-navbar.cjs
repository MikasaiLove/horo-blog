const fs = require("fs");
let c = fs.readFileSync("src/config/navBarConfig.ts", "utf8");

// Replace getDynamicNavBarConfig function
const startMarker = "const getDynamicNavBarConfig = (): NavBarConfig => {";
const endMarker = "\n\treturn { links } as NavBarConfig;\n};";

let start = c.indexOf(startMarker);
let end = c.indexOf(endMarker, start) + endMarker.length;

const newFunc = [
'const getDynamicNavBarConfig = (): NavBarConfig => {',
'\tconst links: NavBarLink[] = [',
'\t\tLinkPresets.Home,',
'\t];',
'',
'\t// 文章及其子菜单',
'\tlinks.push({',
'\t\tname: "文章",',
'\t\turl: "#",',
'\t\ticon: "material-symbols:article",',
'\t\tchildren: [',
'\t\t\tLinkPresets.Archive,',
'\t\t\tLinkPresets.Categories,',
'\t\t\tLinkPresets.Tags,',
'\t\t],',
'\t});',
'',
'\t// 动态',
'\tlinks.push(LinkPresets.Dynamic);',
'',
'\t// ACGN 大类',
'\tlinks.push({',
'\t\tname: "ACGN",',
'\t\turl: "#",',
'\t\ticon: "material-symbols:movie",',
'\t\tchildren: [',
'\t\t\tLinkPresets.Anime,',
'\t\t\tLinkPresets.Bangumi,',
'\t\t\t{',
'\t\t\t\tname: "小黑盒",',
'\t\t\t\turl: "https://www.xiaoheihe.cn/app/user/profile/59981066",',
'\t\t\t\ticon: "simple-icons:steam",',
'\t\t\t},',
'\t\t],',
'\t});',
'',
'\t// 中转站',
'\tlinks.push(LinkPresets.Hub);',
'',
'\t// 音乐',
'\tlinks.push({',
'\t\tname: "音乐",',
'\t\turl: "/music/",',
'\t\ticon: "material-symbols:music-note",',
'\t});',
'',
'\t// 相册',
'\tlinks.push(LinkPresets.Gallery);',
'',
'\t// 留言',
'\tlinks.push(LinkPresets.Guestbook);',
'',
'\t// 关于及其子菜单',
'\tlinks.push({',
'\t\tname: "关于",',
'\t\turl: "#",',
'\t\ticon: "material-symbols:info",',
'\t\tchildren: [',
'\t\t\tLinkPresets.About,',
'\t\t],',
'\t});',
'',
'\treturn { links } as NavBarConfig;',
'};',
].join("\n");

c = c.substring(0, start) + newFunc + c.substring(end);

// Add Hub to LinkPresets (before Anime)
c = c.replace(
  "\tAnime: {",
  '\tHub: {\n\t\tname: "中转站",\n\t\turl: "/hub/",\n\t\ticon: "material-symbols:bookmark",\n\t\tpageKey: "hub",\n\t},\n\tAnime: {'
);

fs.writeFileSync("src/config/navBarConfig.ts", c);
console.log("OK");
