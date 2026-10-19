/**
 * Genera el código para use_figma (pegar en description + code).
 * Orden: scripts/figma-flow-order.json
 *
 * node scripts/figma-use-reorder-flows.mjs > scripts/figma-use-reorder-flows.generated.js
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const order = JSON.parse(readFileSync(join(dir, "figma-flow-order.json"), "utf8"));

const code = `const order = ${JSON.stringify(order, null, 2)};

const page =
  figma.root.children.find((p) => p.name === order.pageName) ?? figma.root.children[0];
await figma.setCurrentPageAsync(page);

const FRAME_W = 390;
const FRAME_H = 844;
const { frameGapX, frameGapY, sectionGapY, columnsPerSection, sectionPadding } = order.layout;

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function collectFrames(root) {
  const byNorm = new Map();
  const walk = (node) => {
    if (node.type === "FRAME" && node.width > 200 && node.height > 400) {
      const key = normalizeName(node.name);
      if (!byNorm.has(key)) byNorm.set(key, []);
      byNorm.get(key).push(node);
    }
    if ("children" in node) for (const c of node.children) walk(c);
  };
  for (const c of root.children) walk(c);
  return byNorm;
}

const frameMap = collectFrames(page);
const usedIds = new Set();
const pickFrame = (name) => {
  const list = frameMap.get(normalizeName(name));
  if (!list) return null;
  const node = list.find((n) => !usedIds.has(n.id)) ?? list[0];
  if (node) usedIds.add(node.id);
  return node;
};

const mutatedNodeIds = [];
let sectionY = 0;

for (const sectionName of order.sectionOrder) {
  const names = order.sections[sectionName] ?? [];
  const placed = [];
  for (const frameName of names) {
    const node = pickFrame(frameName);
    if (node) placed.push({ node, frameName });
  }
  if (!placed.length && sectionName === "Estados y vacíos") continue;

  let sectionNode = page.children.find(
    (n) => n.type === "SECTION" && normalizeName(n.name) === normalizeName(sectionName),
  );
  if (!sectionNode) {
    sectionNode = figma.createSection();
    sectionNode.name = sectionName;
    sectionNode.x = 0;
    sectionNode.y = sectionY;
    page.appendChild(sectionNode);
    mutatedNodeIds.push(sectionNode.id);
  }

  let col = 0;
  let row = 0;
  let maxRowH = 0;
  const startX = sectionPadding;
  let cursorY = sectionPadding;

  for (const { node, frameName } of placed) {
    if (node.parent !== sectionNode) sectionNode.appendChild(node);
    node.name = frameName;
    const x = startX + col * (FRAME_W + frameGapX);
    const y = cursorY + row * (FRAME_H + frameGapY);
    node.x = x;
    node.y = y;
    mutatedNodeIds.push(node.id);
    col += 1;
    if (col >= columnsPerSection) {
      col = 0;
      row += 1;
      cursorY += FRAME_H + frameGapY;
    }
  }

  const rows = Math.ceil(placed.length / columnsPerSection) || 1;
  const sectionH = sectionPadding * 2 + rows * (FRAME_H + frameGapY);
  const sectionW =
    sectionPadding * 2 +
    Math.min(placed.length, columnsPerSection) * (FRAME_W + frameGapX) -
    frameGapX;
  if ("resizeWithoutConstraints" in sectionNode) {
    sectionNode.resizeWithoutConstraints(Math.max(sectionW, 800), Math.max(sectionH, 200));
  }
  sectionNode.y = sectionY;
  sectionY += sectionH + sectionGapY;
}

return {
  mutatedNodeIds,
  pageId: page.id,
  sectionsProcessed: order.sectionOrder.length,
  framesPlaced: usedIds.size,
};
`;

const pluginDir = join(dir, "figma-plugin-reorder-flows");
mkdirSync(pluginDir, { recursive: true });
const pluginBody = code.replace(
  /^return \{/m,
  "const result = {",
).replace(
  /framesPlaced: usedIds\.size,\n\};\n$/m,
  "framesPlaced: usedIds.size,\n};\nfigma.notify('Reorden listo: ' + result.framesPlaced + ' pantallas');\nfigma.closePlugin();\n",
);
const pluginCode = `(async () => {\n${pluginBody}})();`;

writeFileSync(join(dir, "figma-use-reorder-flows.generated.js"), code, "utf8");
writeFileSync(
  join(pluginDir, "manifest.json"),
  JSON.stringify(
    {
      name: "DopMi — reordenar flujos",
      id: "dopmi-reorder-flows-dev",
      api: "1.0.0",
      main: "code.js",
      editorType: ["figma"],
    },
    null,
    2,
  ),
  "utf8",
);
writeFileSync(join(pluginDir, "code.js"), pluginCode, "utf8");
console.log("Wrote scripts/figma-use-reorder-flows.generated.js");
console.log("Wrote scripts/figma-plugin-reorder-flows/{manifest.json,code.js}");
