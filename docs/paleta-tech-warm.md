# DopMi — Look & feel **Tech warm**

**Preview en prototipo:** `?palette=warm-trust` (por defecto en primera visita) o Modo prueba → paleta **warm-trust**.  
**Referencia principal (look objetivo):** [Modern interface design — NextGen UI / glass warm](https://mx.pinterest.com/pin/1125337025675763302/) — paneles frost, arena, orbes naranja, cards oscuras tipo “New in”, botones pill espresso/blanco.  
Inspiración previa: [1](https://mx.pinterest.com/pin/444589794483954532/), [2](https://mx.pinterest.com/pin/433049320444857157/), [3](https://mx.pinterest.com/pin/401242648074098387/).

---

## Sensación que buscamos

| Dimensión | Clásico DopMi | Tech warm |
|-----------|---------------|-----------|
| Fondo | Blanco plano | Ivory + **mesh** (naranja abajo-izq, celeste arriba-der) |
| Jerarquía | Amarillo / morado | **Café** en texto y CTAs; **naranja** solo en micro-interacción |
| Superficies | Cards blancas | **Vidrio cálido** (blur + borde blanco suave) |
| “Tech” | — | **Celeste** en paneles informativos, notificaciones en proceso, Guardián |
| Tipografía UI | Inter | Inter + **Fraunces** en `h1` y titulares clave |

---

## Paleta y reparto sugerido (% del área visible en una sesión típica)

Los porcentajes no son píxeles exactos; guían decisiones de diseño para que nada compita con el CTA café.

| Color | Hex | ~% uso | Rol |
|-------|-----|--------|-----|
| **Arena / sand** | `#E8DDD2` → ivory | **40%** | Fondo mesh, ambiente 3D suave |
| **Glass blanco** | `rgba(255,255,255,0.46–0.62)` + blur 26px | **22%** | Cards swipe, login, perfil, nav, inputs pill |
| **Espresso** | `#3A1A06` | **10%** | **CTA primario**, cards destacadas (“New in”), texto fuerte |
| **Café** | `#663300` | **8%** | Cuerpo, links, iconos secundarios |
| **Stone mist** *(extra)* | `#E5D9CF` | **10%** | Bordes, divisores, chips inactivos, relleno sutil |
| **Celeste** | `#CBE8FA` | **8%** | Perfil, Guardián, banners “info”, notificaciones en curso |
| **Soft saffron + xanthous** | `#FCEB8E` / `#FAB919` | **9%** | Celebración, CTAs secundarios, chips activos, empty states |
| **Naranja** | `#F25116` | **≤4%** | Tab nav activo, chat FAB, barra de progreso donación, urgencia puntual |
| **Mesh / gradiente** | mezcla de lo anterior | **3%** | Siempre en `phone-frame` — no repetir en cada card |

### Colores adicionales (solo 2)

1. **Stone mist** `#E5D9CF` — neutro cálido (sustituye grises fríos en líneas y fondos de campo).  
2. **Espresso** `#3A1A06` — ancla de contraste en `h2` y sombras (`rgba(58,26,6,*)`); no sustituye al café en marca.

---

## Reglas de producto (sin cambiar)

- **Naranja no es CTA principal** de adoptar/donar (evita lectura de error). Café = confianza.  
- **Celeste = “estado / información / frescura”**, no botón de acción destructiva.  
- **Amarillo clásico (`#f7cb2d`) no se usa como texto** sobre blanco; en warm-trust `--yellow` mapea a café.  
- **Rescatista:** mismo sistema; morado clásico → café en preview; acento naranja en tab activo.

---

## Tokens en código (`html[data-palette="warm-trust"]`)

| Token | Uso |
|-------|-----|
| `--warm-ivory`, `--cafe`, `--naranja`, `--celeste`, `--xanthous`, `--saffron-soft` | Marca |
| `--stone-mist`, `--espresso` | Estructura y contraste |
| `--surface-glass`, `--surface-glass-strong` | Cards, topbar, dock Guardián |
| `--shadow-warm-sm/md/lg` | Elevación cálida (no negro puro) |
| `--line` | = stone mist |

Implementación principal: `src/styles.css` (bloque `warm-trust`) y `src/palettePreview.ts`.

---

## Checklist antes de aprobar una pantalla

1. ¿Se lee el mesh de fondo sin que las cards sean transparentes al punto de perder legibilidad?  
2. ¿Un solo elemento naranja compite por atención en viewport? (máx. uno fuerte)  
3. ¿Texto normal café/espresso sobre ivory/glass ≥ 4.5:1?  
4. ¿Copy 100% español MX?

---

## Relación con otros docs

- Detalle de contraste y variantes `warm` vs `warm-trust`: `docs/paleta-warm-ivory-propuesta.md`.  
- Identidad clásica amarillo/morado: `:root` sin `data-palette` o `?palette=classic`.
