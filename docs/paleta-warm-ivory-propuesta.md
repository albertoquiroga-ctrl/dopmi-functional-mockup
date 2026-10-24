# Propuesta de look & feel — Warm Ivory + Café

**Estado:** preview en prototipo (`?palette=warm-trust` recomendado; `?palette=warm` o Modo prueba).  
**Look completo Tech warm:** ver `docs/paleta-tech-warm.md`.  
**No sustituye** la identidad amarillo/morado actual hasta aprobación pantalla por pantalla.

## Idea rectora

El **café** sostiene tipografía, navegación y **acciones principales** (confianza, calidez, seriedad sin parecer error). El **naranja vivo** es **apoyo**: urgencia suave, progreso de meta, “hay algo que necesita atención” — no el botón por defecto de adoptar/donar. **Xanthous** y **soft saffron** celebran logros. **Celeste** refresca información y estados en proceso.

Reparto sugerido: ~55 % warm ivory, ~25 % café, ~10 % xanthous + saffron, ~5 % naranja (acento), ~5 % celeste.

### ¿Por qué no naranja como primario?

En interfaces, el naranja/rojo vivo suele asociarse a **advertencia, error o “algo salió mal”** (cerca del espectro de `--danger`). En DopMi, adoptar y donar deben sentirse **seguros y positivos**; un CTA café sobre ivory comunica “acción con respaldo”, no alarma. El naranja funciona mejor en **dosis pequeñas**: anillo de avance de donación, chip “urgente”, highlight en carrusel Guardián — siempre con copy claro y sin competir con el CTA principal.

**Recomendación de producto:** preview **`warm-trust`** (café primario). El preview `warm` (naranja en CTA) queda solo para comparar.

---

## Tokens propuestos (capa semántica)

| Token | Hex | Uso |
|-------|-----|-----|
| `--warm-ivory` | `#FDF6F1` | Fondo de app, cards, descanso visual |
| `--cafe` | `#663300` | Texto principal, montos, nav pill donante, acento rescatista (sustituye morado en preview) |
| `--naranja` | `#F25116` | **Acento** (urgencia, progreso, celebración puntual) — no CTA principal |
| `--naranja-strong` | `#D94512` | Hover en elementos de acento naranja |
| `--cafe-strong` | `#522900` | Hover en CTAs café |
| `--xanthous` | `#FAB919` | Chips activos, celebración, ícono activo en nav |
| `--saffron-soft` | `#FCEB8E` | Fondos suaves, empty states, apoyos |
| `--celeste` | `#CBE8FA` | Banners informativos, badges “en revisión”, highlights frescos |

Mapeo a tokens existentes del mock (preview):

| Token actual | Clásico | Propuesta warm |
|--------------|---------|----------------|
| `--surface` / `--card` | `#FFFFFF` | `--warm-ivory` |
| `--ink` | `#15110D` | `--cafe` |
| `--muted` | `#554E48` | `#8F5F33` (café atenuado, ≥4.5:1 sobre ivory) |
| `--line` | `#E6E2DD` | `#E5D5C8` |
| `--yellow` (relleno CTA) | amarillo | **`--cafe`** en `warm-trust`; `--naranja` solo en preview `warm` |
| `--yellow-strong` | | `--cafe-strong` o `--naranja-strong` según variante |
| `--yellow-ink` / `--amount` | dorado oscuro | `--cafe` |
| `--purple` (rescatista) | morado | `--cafe` (identidad unificada en café) |

---

## Reglas de uso (alineadas a `dopmi-i18n-a11y`)

1. **Café** en CTAs principales (relleno) con texto blanco; hover `--cafe-strong`.
2. **Naranja** solo en acentos (progreso, urgencia, detalles), nunca como color por defecto de “Donar” / “Adoptar”.
3. **Xanthous / saffron** en chips y celebración; café como texto sobre saffron en chips pequeños.
4. **Café** también en párrafos, títulos, montos y nav pill.
5. **Warm ivory** sustituye el blanco puro; evita “parches” `#fff` sueltos en una migración completa.
6. **Celeste** nunca como único color de texto largo; combinar con café o usar como fondo con texto café.
7. **Éxito / error** se mantienen verdes y rojos funcionales; el rojo de error sigue reservado — no confundir con naranja de marca.

---

## Por superficie (guía visual)

| Superficie | Propuesta |
|------------|-----------|
| Adoptar / Apoyar / Perfil | Fondo ivory; header patita + café; **CTA café**; naranja solo en detalles (p. ej. progreso) |
| Nav donante (pill) | Fondo café; tab activo con pastilla xanthous + ícono café |
| Tarjetas swipe | Foto + pie ivory; botón donar naranja; chip “Apoya” con borde café |
| Guardián / impacto | Hero con saffron suave; acentos xanthous; montos en café |
| Rescatista | Deja de usar morado: FAB y activos en café; chips celeste en “en revisión” |
| Auth / onboarding | Primario naranja; secundarios borde café; fondo ivory |
| Notificaciones | Completado verde; en proceso fondo celeste + texto café; problema rojo |

---

## Contraste (objetivo WCAG 2.2 AA)

| Par | Uso | Nota |
|-----|-----|------|
| Café `#663300` sobre ivory `#FDF6F1` | Texto normal | ~8.5:1 ✓ |
| `#8F5F33` sobre ivory | Texto secundario | ~4.6:1 ✓ |
| Blanco sobre naranja `#F25116` | CTA | ~4.5:1 ✓ |
| Café sobre xanthous | Chips pequeños | Revisar en implementación final |
| Café sobre celeste | Texto en banner | Verificar; preferir café sobre ivory con borde celeste |

---

## Cómo ver el preview

```text
# Recomendado (mock: café + ivory, celeste donde iba rosa, naranja de apoyo)
http://127.0.0.1:5173/adoption?palette=warm-trust

Rutas útiles para comparar con el board: `/login/donor`, `/adoption`, `/messages`, `/adoption/toby`, `/donate`, `/profile`.

# Comparación (naranja en CTA — puede leerse como alerta)
http://127.0.0.1:5173/adoption?palette=warm
```

Modo prueba → **Paleta cálida** (selector: Confianza / Naranja CTA / Clásica). Se guarda en `localStorage` (`dopmi-palette-preview`).

---

## Migración completa (si se aprueba)

1. Mover tokens de `:root` a los valores warm y renombrar `--yellow` → `--primary` / `--accent-warm` para claridad.
2. Sustituir ~100 hardcodes (`#15110d`, `#f7cb2d`, sombras moradas) por variables.
3. Actualizar Figma `Dopmi_2.1` y regla `.cursor/rules/dopmi-i18n-a11y.mdc`.
4. Revalidar iconos monocromo (`Icon`) en nav rescatista y estados de notificación.
