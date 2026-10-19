(async () => {
const order = {
  "pageName": "Dopmi_2.1",
  "sectionOrder": [
    "Acceso",
    "Donante",
    "Rescatista"
  ],
  "sections": {
    "Acceso": [
      "Splash",
      "Elegir cuenta",
      "Elegir intención",
      "Onboarding donante",
      "Onboarding rescatista",
      "Bienvenida donante",
      "Bienvenida rescatista",
      "Iniciar sesión donante",
      "Iniciar sesión rescatista",
      "Registro donante",
      "Registro rescatista",
      "Recuperar contraseña",
      "Recuperar contraseña — enlace enviado",
      "Términos donante",
      "Privacidad donante",
      "Términos rescatista",
      "Privacidad rescatista"
    ],
    "Donante": [
      "Adoptar — inicio",
      "Adoptar — detalle Toby",
      "Adoptar — detalle Rocky",
      "Adoptar — empty state",
      "Apoyar — inicio",
      "Apoyar — Guardián activo",
      "Apoyar — Guardián sin casos",
      "Apoyar — empty state",
      "Caso Luna",
      "Caso Rocky",
      "Flujo donación",
      "Donación — revisar monto",
      "Checkout Stripe",
      "Procesando pago",
      "Donación exitosa",
      "Error de pago",
      "Guardián — conversión",
      "Impacto — apoyo",
      "Checkout Guardián",
      "Impacto — éxito",
      "Impacto — error",
      "Impacto",
      "Impacto Guardián — vacío",
      "Impacto Guardián — con historias",
      "Mis match",
      "Mis match — empty state",
      "Chat Luna",
      "Notificaciones",
      "Historial",
      "Historial — vacío",
      "Perfil",
      "Guardados",
      "Guardados — empty state",
      "Guardados — con mascotas",
      "Info básica",
      "Métodos de pago",
      "Pago actualizado",
      "Pago actualizado — Apple Pay",
      "Facturación",
      "Facturación — cobro fallido",
      "Tienda Apoya causa",
      "Centro de ayuda",
      "Sobre nosotros",
      "Transparencia",
      "Perfil público rescatista"
    ],
    "Rescatista": [
      "Verificación — intro",
      "Verificación",
      "Verificación — formulario",
      "Verificación — con errores",
      "Verificación — en revisión",
      "Verificación — verificada",
      "Inicio",
      "Inicio — sin casos publicados",
      "Casos",
      "Casos — programa adopción",
      "Casos — programa apoyo",
      "Casos — empty state",
      "Detalle caso Luna",
      "Detalle caso Milo",
      "Publicar",
      "Evidencia",
      "Ciclo alimento",
      "Mensajes",
      "Chat Luna",
      "Perfil",
      "Editar perfil público",
      "Mi cuenta",
      "Apoya causa",
      "Historial pagos — vacío"
    ]
  },
  "layout": {
    "frameGapX": 48,
    "frameGapY": 48,
    "sectionGapY": 120,
    "columnsPerSection": 6,
    "sectionPadding": 40
  }
};

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

const result = {
  mutatedNodeIds,
  pageId: page.id,
  sectionsProcessed: order.sectionOrder.length,
  framesPlaced: usedIds.size,
};
figma.notify('Reorden listo: ' + result.framesPlaced + ' pantallas');
figma.closePlugin();
})();