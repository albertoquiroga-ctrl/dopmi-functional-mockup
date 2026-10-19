# Capturas Figma del mockup

Catálogo base: `figma-capture-screens.json` (~56 rutas felices).

Variaciones (estados, vacíos, Guardián, verificación): `figma-capture-variations.json`.

## Requisitos

1. `npm run dev` en `http://127.0.0.1:5174`
2. Script de captura en `index.html` (Figma html-to-design)
3. `npx playwright install chromium`

## Flujo

1. Por pantalla: `generate_figma_design` en Figma MCP → `captureId`
2. Armar JSON `{ name, path, captureId, persist? }`
3. `node scripts/figma-browser-capture.mjs <archivo-run.json>`
4. Poll `generate_figma_design` con `captureId` hasta `completed`

`persist` fusiona flags en `localStorage` (`dopmi-functional-prototype-v2`), p. ej. `emptyStates`, `guardianActive`, `verification`.

Query útiles en rutas: `?sent=1` (recuperar contraseña), `?step=review` (donación), `?step=form` (verificación).

Archivo Figma: `xE0zXm6d8Wb5cPsiZa09bp`, página **Dopmi_2.1**.

## Reordenar flujos (orden de lectura)

El orden narrativo está en `figma-flow-order.json` (Acceso → Donante → Rescatista, con subflujos: adopción, apoyo/pago, Guardián, match, perfil, verificación, casos, etc.).

1. Regenerar script: `node scripts/figma-use-reorder-flows.mjs`
2. Con Figma MCP disponible, ejecutar el contenido de `figma-use-reorder-flows.generated.js` vía herramienta **use_figma** (mueve frames a secciones, renombra y dispone en grilla 6 columnas).

**Si MCP está en rate limit (plan Starter):** en Figma desktop → *Plugins* → *Development* → *Import plugin from manifest…* → elige `scripts/figma-plugin-reorder-flows/manifest.json`. Abre el archivo [DopMi — Copy](https://www.figma.com/design/xE0zXm6d8Wb5cPsiZa09bp), página **Dopmi_2.1**, y ejecuta **DopMi — reordenar flujos**.

Los empty states y variantes van **junto al flujo** al que pertenecen (no en un anexo suelto).
