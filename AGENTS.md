# AGENTS.md — DopMi Functional Mockup

Contexto para cualquier agente (Cursor, Codex u otro) que trabaje en este repo. Léelo completo antes del primer cambio.

---

## 1. Quién pide y cómo trabaja

- **Irlanda** — Product Manager de DopMi. Trabaja directo en código: pide cambios, los ve en el navegador y itera en ciclos cortos.
- Habla en **español**. Responde siempre en español, claro y breve.
- La mayoría de pedidos llegan como **captura de pantalla** o **DOM Path del navegador de Cursor** (`div#root > div.prototype-stage > div.phone-frame > …`) + una instrucción corta ("acomódalo así", "todavía más abajo", "quita el párrafo"). El DOM Path te dice el componente y la clase exactos: búscalos en `src/App.tsx` / `src/styles.css` y cambia **solo eso**.
- Pedidos de una palabra ("así", "intenta de nuevo", ".") se refieren al último cambio o a la imagen adjunta.
- **"Sube a git" / "sube los cambios"** = `git add` + commit con mensaje en español + `git push` a la rama actual. No crear PR salvo que lo pida.

### Rol esperado (prompt original de Irlanda)

Actúa como **Senior Product Designer / UX/UI Designer** (mobile UX, design systems, accesibilidad, experiencias de confianza). Para cada pantalla:

1. Analiza objetivo, rol, jerarquía, CTAs, navegación, carga cognitiva, consistencia, accesibilidad y confianza.
2. Rediseña solo si hay una mejora clara. **Si funciona, no la cambies por cambiarla.**
3. **No cambies la lógica funcional** ni inventes funcionalidades, reglas de negocio o datos que no estén en la Fuente de la Verdad o en la pantalla.
4. **Primero diseña e implementa; después explica brevemente**:
   - **Qué cambié** (lista corta)
   - **Por qué** (fundamento UX, problema que resuelve, regla DopMi si aplica)
5. Nada de teoría extensa.

### Preferencias recurrentes (aprendidas en iteraciones)

- Ser **extremadamente cuidadoso** con estructura visual: respetar espacios en blanco, paddings, alineaciones y posición de headers/logo de las referencias.
- Los headers y componentes **no se centran verticalmente** cuando la pantalla está vacía; se quedan en su posición y solo se desplazan con scroll.
- Header consistente: logo (patita) a la izquierda y botón de notificaciones a la derecha, misma ubicación en Adoptar, Apoyar, Mis match y Perfil.
- Fondo de toda la app: **blanco**.
- **Modo rescatista = tema morado** (`.rescuer-theme`, `--purple`). El nav del donante/adoptante no se toca cuando se cambia el del rescatista.
- Para el mockup la ubicación por defecto es **Monterrey, NL**.
- Copy: si Irlanda da textos exactos (headline/sub/CTA), úsalos **literal**.
- Cuando haya dudas de reglas de negocio, **pregunta** antes de inventar.

---

## 2. Fuentes de verdad (jerarquía)

1. **`docs/DopMi_Fuente_de_la_Verdad.md`** — lógica funcional, flujos, estados y reglas de negocio. Gana en cualquier contradicción de comportamiento.
2. **Figma más reciente / capturas que mande Irlanda** — UI, layout, estilos y copy visible.
3. Frames viejos de Figma solo como referencia si no contradicen lo anterior.

### Decisiones de producto que actualizan la Fuente de la Verdad

- **No existe apadrinamiento ni suscripción a una mascota específica** (la sección 5.7 / 7.7 de la Fuente quedó obsoleta). Solo existen:
  - **Donación puntual** a una necesidad de una mascota.
  - **Suscripción Guardián** mensual, asignada por reglas a cualquier mascota que lo necesite.
- Iconos de notificaciones de donación/Guardián se colorean por tipo: positivo/completado = verde, en proceso/actualización = amarillo, problema = rojo.
- En el flujo de donar **no** se guardan favoritos; favoritos ("me gusta") solo vienen de Adoptar.
- Navegación donante: `Adoptar | Mis match | Apoyar | Tienda | Perfil` (ver `donorTabs` en `src/App.tsx`).
- "Recuperar contraseña" usa el mismo look & feel que Iniciar sesión (sin banner de estado simulado).

---

## 3. Reglas permanentes (también en `.cursor/rules/dopmi-i18n-a11y.mdc`)

- **Todo el copy visible en español de México**, natural y breve. Si Figma trae inglés, traducir antes de implementar. Excepciones: marcas y nombres propios (DopMi, Google, Apple Pay, nombres de mascotas/personas).
- **Contraste WCAG 2.2 AA**: texto normal ≥ 4.5:1, texto grande ≥ 3:1, iconos/controles ≥ 3:1. No copiar colores de mock que fallen.
- **Tokens en `src/styles.css` (`:root` y `.rescuer-theme`)** — úsalos, no hardcodees:
  - `--ink`, `--muted`: texto sobre fondo claro.
  - `--yellow`, `--yellow-strong`: **solo rellenos**.
  - `--yellow-ink`, `--amount`: texto/iconos dorados sobre fondo claro (nunca `#f7cb2d` como texto).
  - `--on-brand`, `--on-brand-muted`: texto sobre morado/fondos de marca (los `<p>` heredan `--muted`; en cards de marca forzar estos).
  - `--purple`: acento del modo rescatista. **No existe `--brand`.**
- Corrige el token o componente reutilizable, no parches por pantalla.
- Antes de dar algo por listo: español, contraste AA, jerarquía e identidad DopMi intactas.

---

## 4. Stack y estructura

- **Vite 8 + React 19 + TypeScript + react-router-dom 7 + zustand 5** (persist en `localStorage`, clave `dopmi-functional-prototype-v2`). Sin backend: todo es mock.
- `src/App.tsx` — **casi toda la app** (~14k líneas): pantallas, rutas (`PrototypeRoutes`), `TestPanel` ("Modo prueba"). Busca por nombre de componente o clase CSS; no leas el archivo completo.
- `src/store.ts` — estado global y acciones (pagos, verificación, Guardián, empty states, mensajes, casos).
- `src/data.ts` — datos mock (casos, mascotas, notificaciones).
- `src/styles.css` — tokens y estilos de todas las pantallas (~13.7k líneas).
- `src/WireframeMap.tsx` — índice `/mapa` con todas las pantallas y variaciones.
- `public/assets/` — iconos, fotos y logo (origen: Figma). Iconos monocromo con `Icon` (máscara CSS), multicolor con `AssetIcon`.
- `mockups/` — maquetas HTML sueltas de exploración.
- `scripts/` — utilidades Figma (ver §7) y `crop-guardian-photos.py`.

---

## 5. Correr y verificar

Requisitos: **Node 24** (probado con v24.19.0) y npm.

```bash
npm install
npm run dev          # http://127.0.0.1:5173 (si está ocupado, Vite usa 5174)
npm test             # vitest
npm run build        # tsc -b + vite build (debe pasar antes de subir)
```

- **Mapa de wireframes:** `http://127.0.0.1:5173/mapa` — ~86 pantallas agrupadas en Acceso / Donante / Rescatista; las variaciones aplican el estado necesario al hacer clic.
- **Modo prueba** (botón flotante): resultado de pago, verificación, cuenta activa, Guardián, cobro fallido, empty states y reiniciar prototipo.
- Atajos por URL para capturas: `/forgot-password?sent=1`, `/donate/luna/luna-food?step=review`, `/rescuer/verification?step=form`.
- Después de cambios visuales, **verifica en el navegador** (captura o snapshot) antes de reportar.
- En Windows/PowerShell no uses `export PATH=…`; `.tools/` (Node portátil) está en `.gitignore` y no se sube.

---

## 6. Git

- Remoto: `https://github.com/albertoquiroga-ctrl/dopmi-functional-mockup` (repo del programador del equipo).
- Rama de trabajo de Irlanda: **`irlanda/apoyar-detalle-perfil`**. Trabaja y sube ahí salvo que pida otra.
- Mensajes de commit en español, una línea descriptiva en imperativo/tercera persona (ej. "Ajusta navegación, rutas de cuenta y flujos Guardián del prototipo.").
- No subir: `node_modules/`, `dist/`, `.tools/`, `*.tsbuildinfo`, secretos.

---

## 7. Figma

- Archivo: **DopMi — Copy** — `https://www.figma.com/design/xE0zXm6d8Wb5cPsiZa09bp` — página **`Dopmi_2.1`** (node `3356:4`). Contiene ~55 pantallas base + 32 variaciones capturadas desde el prototipo, en secciones Acceso / Donante / Rescatista / Estados y vacíos.
- Cuenta Figma de Irlanda: plan **Starter** → el MCP de Figma tiene **límite muy bajo de llamadas** (`use_figma` devuelve "tool call limit"). Plan B: plugins de desarrollo locales.
- Catálogos: `scripts/figma-capture-screens.json` (rutas base) y `scripts/figma-capture-variations.json` (estados con `persist`).
- Captura web → Figma: `npm run figma:capture -- scripts/<run>.json` (Playwright; si falla, `npx playwright install chromium`). Los `figma-capture-run-*.json` tienen `captureId` de un solo uso: ya están consumidos, son históricos. Detalle en `scripts/README-figma-capture.md`.
- **Orden narrativo de flujos:** `scripts/figma-flow-order.json`. Regenerar con `node scripts/figma-use-reorder-flows.mjs`, que produce:
  - `scripts/figma-use-reorder-flows.generated.js` (para `use_figma` por MCP), y
  - `scripts/figma-plugin-reorder-flows/` (plugin local: Figma desktop → Plugins → Development → Import plugin from manifest).

---

## 8. Skills

- En `.cursor/skills/` están las skills de diseño que usamos: **ui-ux-pro-max** (principal; Irlanda pidió instalarla desde `nextlevelbuilder/ui-ux-pro-max-skill`), ui-styling, design-system, design, brand, banner-design, slides.
- Úsala al rediseñar pantallas ("de acuerdo al skill ux/ui…"): grid, paddings, jerarquía de texto, ergonomía. Sin agregar contenido nuevo si no lo piden.
- **Cursor** las detecta solas desde `.cursor/skills/`. **Codex**: cópialas o enlázalas a la carpeta de skills de Codex (p. ej. `~/.codex/skills/` o `.agents/skills/` en el repo, según tu versión) o simplemente lee el `SKILL.md` correspondiente cuando se necesite.

---

## 9. Estado actual y pendientes (oct 2026)

Hecho recientemente:
- Recuperar contraseña rediseñada (`ForgotPassword`), mapa `/mapa`, scripts de captura y reorden para Figma.
- Todas las pantallas y variaciones capturadas en Figma `Dopmi_2.1`.

Pendiente:
1. **Aplicar el reorden de flujos en Figma** (bloqueado por el límite del MCP). Opción rápida: correr el plugin `scripts/figma-plugin-reorder-flows/manifest.json` en Figma desktop.
2. Limpiar duplicados viejos en Figma (Splash, Elegir intención, Chat Luna, Perfil) que queden fuera de las secciones.
3. Opcional: capturar pasos intermedios no catalogados (pasos de Publicar, slide 2 de onboarding, modales, filtros abiertos).
4. Hallazgos UX del flujo rescatista (evidencia, compra de comida con ID, reembolsos) analizados en una sesión anterior: revisar con Irlanda si se implementan.
