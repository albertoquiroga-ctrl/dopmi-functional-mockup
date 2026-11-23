/**
 * Genera docs/Matriz_Pruebas_DopMi_Mockup.xlsx desde el catálogo visible del prototipo.
 * Solo pantallas enlazadas en /mapa + rutas accesibles en UI (Stripe, historial rescatista).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(readFileSync(join(root, "scripts/figma-capture-screens.json"), "utf8"));
const variations = JSON.parse(readFileSync(join(root, "scripts/figma-capture-variations.json"), "utf8"));

const extras = [
  { section: "Sistema", name: "Mapa de wireframes", path: "/mapa" },
  { section: "Rescatista", name: "Registro Stripe Connect", path: "/rescuer/stripe-onboarding" },
  { section: "Rescatista", name: "Historial pagos recibidos", path: "/rescuer/history" },
];

function dedupeCatalog(entries) {
  const seen = new Set();
  return entries.filter((e) => {
    const key = `${e.section}|${e.name}|${e.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const catalog = dedupeCatalog([...base, ...variations, ...extras]);

function persistHint(entry) {
  if (!entry.persist) return "";
  const p = entry.persist;
  const parts = [];
  if (p.emptyStates === true) parts.push("Empty states ON");
  if (p.guardianActive === true) parts.push("Guardián activo");
  if (p.guardianActive === false) parts.push("Sin Guardián");
  if (p.guardianNoSupportCases === true) parts.push("Guardián sin casos para apoyar");
  if (p.guardianImpactReady === false) parts.push("Impacto Guardián vacío");
  if (p.guardianImpactReady === true) parts.push("Impacto Guardián con historias");
  if (p.verification) parts.push(`Verificación: ${p.verification}`);
  if (p.accountMode === "rescuer") parts.push("Cuenta rescatista");
  if (p.accountMode === "donor") parts.push("Cuenta donante");
  if (Array.isArray(p.savedPetIds)) parts.push(`Guardados: ${p.savedPetIds.join(", ")}`);
  if (p.guardianSubscriptionPaymentFailed) parts.push("Cobro Guardián fallido");
  return parts.join(" · ");
}

function roleForSection(section, name) {
  if (section === "Acceso") return "Todos";
  if (section === "Sistema") return "QA / PM";
  if (section === "Donante") return "Donante / Adoptante";
  if (section === "Rescatista") return "Rescatista";
  return section;
}

/** Copy y controles visibles documentados en el mockup (no backend). */
const UI_BY_NAME = {
  Splash: "Logo DopMi; botón «Continuar a DopMi»; botón «Modo prueba» (flotante)",
  "Elegir cuenta":
    "Logo; tabs «Adoptar» / «Dar en adopción»; resumen del rol; CTA «Continuar»; nota de cambio en perfil",
  "Elegir intención": "Redirige a /choose-account (sin pantalla propia)",
  "Onboarding donante": "2 slides con ilustración; título y cuerpo; «Siguiente» / CTA final hacia bienvenida",
  "Onboarding rescatista": "2 slides (voz del caso, transparencia); «Siguiente» / «Publicar mi caso»",
  "Bienvenida donante":
    "Saludo; imagen mascotas; botones Google y Apple; «Iniciar sesión»; «Crear cuenta»",
  "Bienvenida rescatista": "Igual estructura que bienvenida donante",
  "Iniciar sesión donante": "Formulario email/contraseña; enlace recuperar; CTA ingresar; términos",
  "Iniciar sesión rescatista": "Formulario login rescatista",
  "Registro donante": "Formulario alta; términos y privacidad",
  "Registro rescatista": "Formulario alta rescatista",
  "Recuperar contraseña": "Campo email; enviar enlace",
  "Recuperar contraseña — enlace enviado": "Confirmación de envío; volver a login",
  "Términos donante": "Texto legal; navegación atrás",
  "Términos rescatista": "Texto legal rescatista",
  "Privacidad donante": "Aviso de privacidad",
  "Privacidad rescatista": "Aviso de privacidad rescatista",
  "Adoptar — inicio": "Lista/cards de mascotas; filtros; nav inferior «Adoptar»",
  "Adoptar — detalle Toby": "Ficha Toby; historia; CTA contacto/guardar; rescatista",
  "Adoptar — detalle Rocky": "Ficha Rocky",
  "Adoptar — empty state": "Estado vacío sin mascotas disponibles",
  "Apoyar — inicio": "Casos para donar; rail Guardián si aplica; nav «Apoyar»",
  "Apoyar — empty state": "Sin casos para apoyar",
  "Apoyar — Guardián activo": "Vista con membresía activa",
  "Apoyar — Guardián sin casos": "Guardián activo sin casos en rail",
  "Caso Luna": "Detalle caso Luna; necesidades; progreso; donar",
  "Caso Rocky": "Detalle caso Rocky",
  "Flujo donación": "Selección monto; método de pago simulado",
  "Donación — revisar monto": "Paso revisión antes de pagar",
  "Checkout Stripe": "Pantalla checkout simulada Stripe",
  "Checkout Guardián": "Checkout suscripción Guardián",
  "Procesando pago": "Estado procesamiento",
  "Donación exitosa": "Confirmación éxito",
  "Error de pago": "Pantalla error; reintentar",
  Impacto: "Tu Impacto; carrusel o historias según Guardián",
  "Impacto — apoyo": "Elige tu apoyo (montos Guardián)",
  "Impacto — éxito": "¡Ya eres Guardián!",
  "Impacto — error": "Error al suscribirse",
  "Guardián — conversión": "Impacto sin suscripción (carrusel conversión)",
  "Impacto Guardián — vacío": "Guardián activo sin historias listas",
  "Impacto Guardián — con historias": "Tarjetas Luna, Milo, Max, Bella",
  "Mis match": "Lista conversaciones adoptantes",
  "Mis match — empty state": "Sin conversaciones",
  "Donante|Chat Luna": "Hilo mensajes adoptante; campo enviar",
  "Rescatista|Chat Luna": "Hilo mensajes con adoptante (shell rescatista)",
  Notificaciones: "Lista notificaciones; marcas leído/no leído",
  Historial: "Historial donaciones (donante) o pagos (si accountMode rescuer en misma ruta)",
  "Historial — vacío": "Sin movimientos",
  "Tienda Apoya causa": "Catálogo Apoya causa; nav «Tienda»",
  Guardados: "Mascotas guardadas",
  "Guardados — empty state": "Sin guardados",
  "Guardados — con mascotas": "Lista Toby, Luna",
  "Info básica": "Datos personales editables",
  "Métodos de pago": "Tarjetas Apple/Google/Visa simuladas",
  "Pago actualizado": "Confirmación método actualizado",
  "Pago actualizado — Apple Pay": "Confirmación Apple Pay",
  Facturación: "Suscripción Guardián; cambio monto; cancelar; historial cobros",
  "Facturación — cobro fallido": "Alerta cobro fallido",
  "Centro de ayuda": "FAQs donante y rescatista",
  "Sobre nosotros": "Contenido institucional",
  Transparencia: "Contenido transparencia",
  "Perfil público rescatista": "Perfil María; tabs En Adopción / Casos / Actividad; reportar",
  Inicio: "Home rescatista; Cuenta Dopmi o tarjeta verificación; pendientes; actividad",
  "Inicio — sin casos publicados": "Empty home rescatista",
  Verificación: "Modal reembolso o formulario según estado",
  "Verificación — intro": "Modal «Cómo funciona el reembolso»",
  "Verificación — formulario": "Formulario verificación; CLABE; documentos; progreso",
  "Verificación — con errores": "Errores simulados; corregir",
  "Verificación — en revisión": "Pantalla bloqueada «ESTADO SIMULADO»",
  "Verificación — verificada": "Estado verificado; CTA publicar",
  Casos: "Lista casos; filtros; estados Borrador/Rechazado/Activo",
  "Casos — empty state": "Sin casos publicados",
  "Casos — programa adopción": "Filtro programa adopción",
  "Casos — programa apoyo": "Filtro programa apoyo económico",
  "Detalle caso Luna": "Necesidades; progreso fondeo; toggle adopción; acciones",
  "Detalle caso Milo": "Detalle Milo",
  Publicar: "Elegir adopción vs donaciones; wizard pasos; guardar borrador",
  Evidencia: "Wizard «Desbloquea las donaciones»; pasos recibo/ID/foto",
  "Ciclo alimento": "«¿Qué comida necesitas ahora?» — ESTADO SIMULADO",
  Mensajes: "Lista mensajes rescatista",
  "Rescatista|Perfil": "Perfil rescatista; Mi cuenta; historial pagos; cambiar a donante",
  "Donante|Perfil": "Menú perfil donante; settings; campana notificaciones",
  "Editar perfil público": "Formulario perfil público",
  "Mi cuenta": "Verificación; datos personales; redes; CLABE; cambiar a donante",
  "Apoya causa": "Tienda desde shell rescatista",
  "Historial pagos — vacío": "Sin pagos recibidos (ruta /history modo rescuer)",
  "Mapa de wireframes": "Listado 86+ pantallas por sección; enlaces directos",
  "Registro Stripe Connect": "Flujo Stripe simulado (OTP, identidad, banco); nota prototipo",
  "Historial pagos recibidos": "«Mi historial»; lista pagos o vacío; enlace portal Stripe",
};

function simulatedFlag(name, path) {
  if (/empty state|vacío|simulad|Stripe|Ciclo alimento|en revisión|con errores/i.test(name)) return "Sí";
  if (path.includes("stripe") || path.includes("/food/")) return "Sí";
  return "No";
}

function priorityFor(entry) {
  const high = [
    "Splash",
    "Elegir cuenta",
    "Flujo donación",
    "Donación exitosa",
    "Publicar",
    "Verificación — formulario",
    "Evidencia",
    "Inicio",
    "Impacto — apoyo",
  ];
  if (high.some((h) => entry.name.includes(h))) return "Alta";
  if (entry.name.includes("empty") || entry.name.includes("vacío") || entry.name.includes("error")) return "Media";
  return "Media";
}

function buildCatalogRows() {
  return catalog.map((entry, index) => {
    const id = `DP-${String(index + 1).padStart(3, "0")}`;
    const ui =
      UI_BY_NAME[`${entry.section}|${entry.name}`] ??
      UI_BY_NAME[entry.name] ??
      "Contenido principal de la pantalla según título en header";
    const persist = persistHint(entry);
    const pre =
      persist ||
      (entry.name === "Elegir intención"
        ? "Abrir ruta legacy; debe redirigir a Elegir cuenta"
        : "Servidor dev activo; abrir desde /mapa o navegar URL");
    const steps =
      entry.name === "Elegir intención"
        ? "1) Ir a /choose-intent. 2) Confirmar redirección a /choose-account."
        : `1) En /mapa, aplicar estado si aplica (${persist || "ninguno"}). 2) Abrir «${entry.name}». 3) Validar elementos visibles. 4) Probar CTA principal si existe.`;
    const expected =
      entry.name === "Elegir intención"
        ? "URL final /choose-account; se muestra «¿Cómo quieres ayudar hoy?»"
        : "Pantalla renderiza en marco móvil; copy en español (MX); sin error en blanco; elementos listados visibles";
    return {
      ID: id,
      Sección: entry.section,
      Pantalla: entry.name,
      Ruta: entry.path,
      Rol: roleForSection(entry.section, entry.name),
      "Tipo de prueba": "Smoke — UI visible",
      Prioridad: priorityFor(entry),
      Precondiciones: pre,
      "Elementos UI visibles (validar)": ui,
      "Pasos para ejecutar": steps,
      "Resultado esperado": expected,
      "¿Requiere Modo prueba?": persist ? "Recomendado (aplicar en mapa o panel)" : "Opcional",
      "¿Estado simulado en UI?": simulatedFlag(entry.name, entry.path),
      "Estatus QA": "",
      Notas: "",
    };
  });
}

const e2eRows = [
  {
    ID: "E2E-001",
    Sección: "Acceso",
    Pantalla: "Flujo Splash → cuenta",
    Ruta: "/ → /choose-account",
    Rol: "Todos",
    "Tipo de prueba": "E2E — Navegación",
    Prioridad: "Alta",
    Precondiciones: "Reiniciar prototipo desde Modo prueba",
    "Elementos UI visibles (validar)": "Splash; Elegir cuenta",
    "Pasos para ejecutar":
      "1) Splash → Continuar a DopMi. 2) Elegir Adoptar o Dar en adopción. 3) Continuar.",
    "Resultado esperado": "Llega a onboarding correspondiente",
    "¿Requiere Modo prueba?": "Sí (reiniciar)",
    "¿Estado simulado en UI?": "No",
    "Estatus QA": "",
    Notas: "",
  },
  {
    ID: "E2E-002",
    Sección: "Donante",
    Pantalla: "Donación exitosa",
    Ruta: "/donate/luna/luna-food → success",
    Rol: "Donante",
    "Tipo de prueba": "E2E — Pago",
    Prioridad: "Alta",
    Precondiciones: "Modo prueba: Resultado de pago = Exitoso; cuenta donante",
    "Elementos UI visibles (validar)": "Flujo donación; procesando; éxito",
    "Pasos para ejecutar":
      "1) Apoyar → caso → donar necesidad. 2) Completar checkout simulado. 3) Ver confirmación.",
    "Resultado esperado": "Pantalla donación exitosa; regreso a flujo donante",
    "¿Requiere Modo prueba?": "Sí",
    "¿Estado simulado en UI?": "Sí (pago simulado)",
    "Estatus QA": "",
    Notas: "",
  },
  {
    ID: "E2E-003",
    Sección: "Donante",
    Pantalla: "Donación con error",
    Ruta: "/payment-error/...",
    Rol: "Donante",
    "Tipo de prueba": "E2E — Pago",
    Prioridad: "Alta",
    Precondiciones: "Modo prueba: Resultado de pago = Error",
    "Elementos UI visibles (validar)": "Error de pago; reintentar",
    "Pasos para ejecutar": "Repetir flujo donación con pago en error.",
    "Resultado esperado": "Muestra error de pago; permite reintentar",
    "¿Requiere Modo prueba?": "Sí",
    "¿Estado simulado en UI?": "Sí",
    "Estatus QA": "",
    Notas: "",
  },
  {
    ID: "E2E-004",
    Sección: "Donante",
    Pantalla: "Suscripción Guardián",
    Ruta: "/impact/support → /impact/success",
    Rol: "Donante",
    "Tipo de prueba": "E2E — Guardián",
    Prioridad: "Alta",
    Precondiciones: "Sin Guardián; pago exitoso",
    "Elementos UI visibles (validar)": "Elige monto; checkout; ¡Ya eres Guardián!",
    "Pasos para ejecutar": "Impacto → apoyo → elegir monto → pagar.",
    "Resultado esperado": "Impacto muestra vista suscrito",
    "¿Requiere Modo prueba?": "Sí",
    "¿Estado simulado en UI?": "Sí",
    "Estatus QA": "",
    Notas: "",
  },
  {
    ID: "E2E-005",
    Sección: "Rescatista",
    Pantalla: "Publicar caso adopción",
    Ruta: "/rescuer/publish",
    Rol: "Rescatista",
    "Tipo de prueba": "E2E — Publicación",
    Prioridad: "Alta",
    Precondiciones: "Cuenta rescatista; verificación verificada",
    "Elementos UI visibles (validar)": "Wizard adopción 3 pasos; publicar",
    "Pasos para ejecutar": "Publicar → Dar en adopción → completar pasos → Publicar caso.",
    "Resultado esperado": "Caso aparece en Mis Casos (revisión/activo según mock)",
    "¿Requiere Modo prueba?": "Opcional",
    "¿Estado simulado en UI?": "Parcial",
    "Estatus QA": "",
    Notas: "",
  },
  {
    ID: "E2E-006",
    Sección: "Rescatista",
    Pantalla: "Publicar recibir donaciones sin verificar",
    Ruta: "/rescuer/publish",
    Rol: "Rescatista",
    "Tipo de prueba": "E2E — Regla negocio",
    Prioridad: "Alta",
    Precondiciones: "Verificación = Sin verificar",
    "Elementos UI visibles (validar)": "Bloqueo o redirección a verificación",
    "Pasos para ejecutar": "Publicar → Recibir donaciones.",
    "Resultado esperado": "No publica donaciones sin verificación; guía a verificar",
    "¿Requiere Modo prueba?": "Sí",
    "¿Estado simulado en UI?": "Parcial",
    "Estatus QA": "",
    Notas: "",
  },
  {
    ID: "E2E-007",
    Sección: "Rescatista",
    Pantalla: "Evidencia necesidad",
    Ruta: "/rescuer/evidence/:case/:need",
    Rol: "Rescatista",
    "Tipo de prueba": "E2E — Evidencia",
    Prioridad: "Alta",
    Precondiciones: "Necesidad con botón Desbloquear visible (ej. Milo comida)",
    "Elementos UI visibles (validar)": "Wizard pasos; Enviar a revisión",
    "Pasos para ejecutar": "Casos → detalle → Desbloquear → completar pasos → enviar.",
    "Resultado esperado": "Estado «Evidencia en revisión» en tarjeta necesidad",
    "¿Requiere Modo prueba?": "Opcional",
    "¿Estado simulado en UI?": "Parcial",
    "Estatus QA": "",
    Notas: "Aprobación final no simulada",
  },
  {
    ID: "E2E-008",
    Sección: "Sistema",
    Pantalla: "Nav inferior donante (5 tabs)",
    Ruta: "/* donor tabs",
    Rol: "Donante",
    "Tipo de prueba": "Navegación global",
    Prioridad: "Alta",
    Precondiciones: "Cuenta donante logueada simulada",
    "Elementos UI visibles (validar)": "Adoptar; Mis match; Apoyar; Tienda; Perfil",
    "Pasos para ejecutar": "Tocar cada tab y verificar ruta activa.",
    "Resultado esperado": "Cada tab abre su pantalla; ícono activo correcto",
    "¿Requiere Modo prueba?": "Sí (cuenta donante)",
    "¿Estado simulado en UI?": "No",
    "Estatus QA": "",
    Notas: "",
  },
  {
    ID: "E2E-009",
    Sección: "Sistema",
    Pantalla: "Nav inferior rescatista (5 tabs)",
    Ruta: "/* rescuer tabs",
    Rol: "Rescatista",
    "Tipo de prueba": "Navegación global",
    Prioridad: "Alta",
    Precondiciones: "Cuenta rescatista",
    "Elementos UI visibles (validar)": "Inicio; Casos; Publicar (FAB); Mensajes; Perfil",
    "Pasos para ejecutar": "Tocar cada tab.",
    "Resultado esperado": "Rutas /rescuer, /cases, /publish, /messages, /profile",
    "¿Requiere Modo prueba?": "Sí",
    "¿Estado simulado en UI?": "No",
    "Estatus QA": "",
    Notas: "",
  },
  {
    ID: "E2E-010",
    Sección: "Sistema",
    Pantalla: "Cambio donante ↔ rescatista",
    Ruta: "Modo prueba",
    Rol: "Todos",
    "Tipo de prueba": "E2E — Cambio rol",
    Prioridad: "Media",
    Precondiciones: "Panel Modo prueba abierto",
    "Elementos UI visibles (validar)": "Select Cuenta activa",
    "Pasos para ejecutar": "Cambiar Cuenta activa donante/rescatista.",
    "Resultado esperado": "Navega a /adoption o /rescuer; nav correspondiente",
    "¿Requiere Modo prueba?": "Sí",
    "¿Estado simulado en UI?": "No",
    "Estatus QA": "",
    Notas: "",
  },
];

const modoPruebaRows = [
  {
    ID: "MP-001",
    Control: "Resultado de pago",
    Valores: "Exitoso | En procesamiento | Error",
    "Qué validar": "Flujos donación, Guardián, checkout",
  },
  {
    ID: "MP-002",
    Control: "Verificación",
    Valores: "Sin verificar | En revisión | Verificado | Con errores",
    "Qué validar": "Home rescatista, publicar donaciones, formulario",
  },
  {
    ID: "MP-003",
    Control: "Registro de cuenta en Stripe",
    Valores: "Sin registrar | En revisión | Dato pendiente | Aprobada",
    "Qué validar": "Flujo /rescuer/stripe-onboarding",
  },
  {
    ID: "MP-004",
    Control: "Cuenta activa",
    Valores: "Adoptante/Donante | Rescatista",
    "Qué validar": "Nav y rutas home",
  },
  {
    ID: "MP-005",
    Control: "Suscripción Guardián",
    Valores: "No suscrito | Suscrito | Suscrito sin casos",
    "Qué validar": "Impacto, Apoyar, Facturación",
  },
  {
    ID: "MP-006",
    Control: "Cobro Guardián fallido",
    Valores: "On/Off (requiere Guardián)",
    "Qué validar": "Facturación — cobro fallido",
  },
  {
    ID: "MP-007",
    Control: "Empty states",
    Valores: "On/Off",
    "Qué validar": "Listas vacías donante y rescatista",
  },
  {
    ID: "MP-008",
    Control: "Atajos",
    Valores: "Donación | Publicar | Stripe | Notificaciones",
    "Qué validar": "Salto directo a rutas",
  },
  {
    ID: "MP-009",
    Control: "Reiniciar prototipo",
    Valores: "Acción",
    "Qué validar": "Vuelve a Splash; datos demo iniciales",
  },
];

const matrizRows = [...buildCatalogRows(), ...e2eRows];

const wb = XLSX.utils.book_new();

const wsMatriz = XLSX.utils.json_to_sheet(matrizRows);
wsMatriz["!cols"] = [
  { wch: 10 },
  { wch: 12 },
  { wch: 36 },
  { wch: 42 },
  { wch: 18 },
  { wch: 22 },
  { wch: 10 },
  { wch: 36 },
  { wch: 48 },
  { wch: 52 },
  { wch: 44 },
  { wch: 28 },
  { wch: 22 },
  { wch: 12 },
  { wch: 24 },
];
XLSX.utils.book_append_sheet(wb, wsMatriz, "Matriz_Pruebas");

const catalogExport = catalog.map((e, i) => ({
  "#": i + 1,
  Sección: e.section,
  Pantalla: e.name,
  Ruta: e.path,
  "Estado previo (mapa)": persistHint(e) || "—",
}));
const wsCat = XLSX.utils.json_to_sheet(catalogExport);
wsCat["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 38 }, { wch: 48 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, wsCat, "Catalogo_Pantallas");

const wsMp = XLSX.utils.json_to_sheet(modoPruebaRows);
wsMp["!cols"] = [{ wch: 8 }, { wch: 28 }, { wch: 52 }, { wch: 40 }];
XLSX.utils.book_append_sheet(wb, wsMp, "Modo_Prueba");

const instrucciones = [
  {
    Campo: "Alcance",
    Valor:
      "Solo UI visible en el prototipo funcional (marzo 2026). No incluye admin, landing pública ni backend real.",
  },
  {
    Campo: "Cómo abrir pantallas",
    Valor: "http://127.0.0.1:5173/mapa (o puerto dev activo). Clic en pantalla aplica estado persist si existe.",
  },
  {
    Campo: "Modo prueba",
    Valor: "Botón flotante en todas las pantallas. Ver hoja Modo_Prueba.",
  },
  {
    Campo: "Columna Estatus QA",
    Valor: "Pendiente | Pasó | Falló | N/A",
  },
  {
    Campo: "Idioma",
    Valor: "Validar copy en español de México (marcas exceptuadas).",
  },
  {
    Campo: "Accesibilidad",
    Valor: "Contraste AA en textos críticos (regla dopmi-i18n-a11y).",
  },
  {
    Campo: "Total pantallas catálogo",
    Valor: String(catalog.length),
  },
];
const wsInst = XLSX.utils.json_to_sheet(instrucciones);
wsInst["!cols"] = [{ wch: 22 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, wsInst, "Instrucciones");

const outPath = join(root, "docs", "Matriz_Pruebas_DopMi_Mockup.xlsx");
XLSX.writeFile(wb, outPath);
console.log(`Generado: ${outPath}`);
console.log(`Filas matriz: ${matrizRows.length} (${catalog.length} smoke + ${e2eRows.length} E2E)`);
