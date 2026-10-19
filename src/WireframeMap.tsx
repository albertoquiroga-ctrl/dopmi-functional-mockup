import { Link, useNavigate } from "react-router-dom";
import baseScreens from "../scripts/figma-capture-screens.json";
import variationScreens from "../scripts/figma-capture-variations.json";
import { usePrototypeStore, type AccountMode, type Verification } from "./store";

type CatalogEntry = {
  section: string;
  name: string;
  path: string;
  persist?: Record<string, unknown>;
};

const catalog: CatalogEntry[] = [
  ...(baseScreens as CatalogEntry[]),
  ...(variationScreens as CatalogEntry[]),
].filter((entry, index, all) => {
  const key = `${entry.section}|${entry.name}|${entry.path}`;
  return all.findIndex((e) => `${e.section}|${e.name}|${e.path}` === key) === index;
});

const sectionOrder = ["Acceso", "Donante", "Rescatista"] as const;

function persistHint(entry: CatalogEntry): string | null {
  if (!entry.persist) return null;
  const parts: string[] = [];
  const p = entry.persist;
  if (p.emptyStates === true) parts.push("empty states");
  if (p.guardianActive === true) parts.push("Guardián activo");
  if (p.guardianActive === false) parts.push("sin Guardián");
  if (p.guardianNoSupportCases === true) parts.push("sin casos para apoyar");
  if (p.guardianImpactReady === false) parts.push("impacto vacío");
  if (p.guardianImpactReady === true) parts.push("impacto con historias");
  if (p.verification) parts.push(`verificación: ${p.verification}`);
  if (p.accountMode === "rescuer") parts.push("cuenta rescatista");
  if (Array.isArray(p.savedPetIds)) parts.push("mascotas guardadas");
  if (p.guardianSubscriptionPaymentFailed) parts.push("cobro fallido");
  return parts.length ? parts.join(" · ") : "estado simulado";
}

function applyPersist(persist: Record<string, unknown>) {
  const store = usePrototypeStore.getState();
  if (typeof persist.accountMode === "string") {
    store.setAccountMode(persist.accountMode as AccountMode);
  }
  if (typeof persist.verification === "string") {
    store.setVerification(persist.verification as Verification);
  }
  if (typeof persist.emptyStates === "boolean") {
    store.setEmptyStates(persist.emptyStates);
  }
  if (persist.guardianActive === false) {
    store.setGuardian(false);
  }
  if (persist.guardianActive === true) {
    store.setGuardian(true);
    if (persist.guardianNoSupportCases === true) {
      store.setGuardianSubscription("subscribed-no-cases");
    } else {
      store.setGuardianSubscription("subscribed");
    }
  }
  if (typeof persist.guardianImpactReady === "boolean") {
    usePrototypeStore.setState({ guardianImpactReady: persist.guardianImpactReady });
  }
  if (persist.guardianSubscriptionPaymentFailed === true) {
    store.setGuardianSubscriptionPaymentFailed(true);
  }
  if (Array.isArray(persist.savedPetIds)) {
    usePrototypeStore.setState({ savedPetIds: persist.savedPetIds as string[] });
  }
}

export default function WireframeMap() {
  const navigate = useNavigate();
  const bySection = sectionOrder.map((section) => ({
    section,
    items: catalog.filter((e) => e.section === section),
  }));

  return (
    <div className="wireframe-map">
      <header className="wireframe-map-header">
        <div>
          <p className="wireframe-map-eyebrow">Prototipo funcional</p>
          <h1>Mapa de wireframes</h1>
          <p className="wireframe-map-lead">
            {catalog.length} pantallas. Elige una para abrirla en el marco móvil. Usa{" "}
            <strong>Modo prueba</strong> (abajo a la derecha) para pagos, verificación y empty states.
          </p>
        </div>
        <Link className="wireframe-map-start" to="/">
          Iniciar flujo (Splash)
        </Link>
      </header>

      {bySection.map(({ section, items }) => (
        <section key={section} className="wireframe-map-section" aria-labelledby={`wf-${section}`}>
          <h2 id={`wf-${section}`}>{section}</h2>
          <ul className="wireframe-map-list">
            {items.map((entry) => {
              const hint = persistHint(entry);
              return (
                <li key={`${entry.section}-${entry.name}`}>
                  <button
                    type="button"
                    className="wireframe-map-link"
                    onClick={() => {
                      if (entry.persist) applyPersist(entry.persist);
                      navigate(entry.path);
                    }}
                  >
                    <span className="wireframe-map-name">{entry.name}</span>
                    <span className="wireframe-map-path">{entry.path}</span>
                    {hint ? <span className="wireframe-map-hint">{hint}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
