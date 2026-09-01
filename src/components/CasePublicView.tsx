import { LocationMap } from "./LocationMap";
import { resolveRescuerDisplayName, type Need, type PetCase } from "../data";
import { usePrototypeStore } from "../store";

export type CaseViewModel = {
  id: string;
  name: string;
  age?: string;
  sex?: "Macho" | "Hembra";
  species?: "Perro" | "Gato";
  image: string;
  photos?: string[];
  story: string;
  location?: string;
  rescuer: string;
  distance?: string;
  needs: Need[];
  feeMxn?: number;
  contextVideo?: string;
  categoryEvidence?: Array<{ category: string; photo?: string; caption?: string }>;
  size?: string;
  ageBand?: string;
  energy?: string;
  personality?: string;
  health?: { vaccinated: boolean; sterilized: boolean; specialCare: boolean | string };
  social?: { dogs: boolean; cats: boolean; children: boolean };
  showHealthSocial?: boolean;
};

export function caseToViewModel(item: PetCase): CaseViewModel {
  const special =
    typeof item.health.specialCare === "string"
      ? Boolean(item.health.specialCare && item.health.specialCare !== "Ninguno")
      : Boolean(item.health.specialCare);
  const showHealthSocial =
    item.health.vaccinated ||
    item.health.sterilized ||
    special ||
    item.social.dogs ||
    item.social.cats ||
    item.social.children ||
    Boolean(item.size || item.ageBand || item.energy || item.personality);

  return {
    id: item.id,
    name: item.name,
    age: item.ageBand || item.age || undefined,
    sex: item.sex,
    species: item.species,
    image: item.image,
    photos: item.photos?.length ? item.photos : [item.image],
    story: item.story,
    location: item.location || undefined,
    rescuer: item.rescuer,
    distance: item.distance,
    needs: item.needs,
    feeMxn: item.feeMxn,
    contextVideo: item.contextVideo,
    categoryEvidence: item.categoryEvidence?.filter((entry) => Boolean(entry.photo)),
    size: item.size,
    ageBand: item.ageBand,
    energy: item.energy,
    personality: item.personality,
    health: item.health,
    social: item.social,
    showHealthSocial,
  };
}

type Props = {
  data: CaseViewModel;
  preview?: boolean;
  onBack?: () => void;
  onDonateNeed?: (needId: string) => void;
  onOpenRescuer?: () => void;
};

function Trait({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p className={`trait-row ${ok ? "" : "off"}`}>
      <span aria-hidden>{ok ? "✓" : "–"}</span>
      {label}
    </p>
  );
}

export function CasePublicView({ data, preview, onBack, onDonateNeed, onOpenRescuer }: Props) {
  const rescuerProfile = usePrototypeStore((state) => state.rescuerProfile);
  const rescuerLabel = resolveRescuerDisplayName(data.rescuer, rescuerProfile);
  const photos = data.photos?.length ? data.photos : [data.image];
  const subtotal = data.needs.reduce((sum, need) => sum + need.requested, 0);
  const funded = data.needs.reduce((sum, need) => sum + need.funded, 0);
  const fee = data.feeMxn ?? 50;
  const goal = subtotal + (data.needs.length ? fee : 0);
  const pct = Math.round((funded / Math.max(goal, 1)) * 100);
  const meta = [data.species, data.sex, data.ageBand || data.age].filter(Boolean).join(" · ");
  const attrs = [data.size, data.energy, data.personality].filter(Boolean);
  const special =
    typeof data.health?.specialCare === "string"
      ? Boolean(data.health.specialCare && data.health.specialCare !== "Ninguno")
      : Boolean(data.health?.specialCare);
  const showHealth =
    Boolean(data.health) &&
    Boolean(data.health?.vaccinated || data.health?.sterilized || special);
  const showSocial =
    Boolean(data.social) &&
    Boolean(data.social?.dogs || data.social?.cats || data.social?.children);

  return (
    <div className={`detail-screen donor-case-detail ${preview ? "is-preview" : ""}`}>
      {preview ? <p className="notice-card preview-banner">Así verán tu caso los donantes</p> : null}
      <div className="detail-hero compact">
        <img src={photos[0]} alt={data.name} />
        {onBack ? (
          <button className="hero-back" type="button" onClick={onBack} aria-label="Volver">
            <img src="/assets/back-light.svg" width={20} height={20} alt="" />
          </button>
        ) : null}
        <span className="hero-counter">
          1 / {photos.length}
        </span>
      </div>
      <div className="detail-content">
        <article className="info-card case-summary-card">
          <div className="title-row">
            <h1>
              {data.name}
              {data.ageBand || data.age ? `, ${data.ageBand || data.age}` : ""}
            </h1>
            {data.distance ? <span className="distance-pill">{data.distance}</span> : null}
          </div>
          {meta ? <p className="pet-sex">{meta}</p> : null}
          <p>{data.story}</p>
          {attrs.length ? (
            <div className="adoption-attr-badges">
              {data.size ? <span className="publish-need-badge">Tamaño: {data.size}</span> : null}
              {data.energy ? <span className="publish-need-badge">Energía: {data.energy}</span> : null}
              {data.personality ? <span className="publish-need-badge">{data.personality}</span> : null}
            </div>
          ) : null}
        </article>

        <button type="button" className="rescuer-card" onClick={onOpenRescuer}>
          <span className="avatar yellow">{rescuerLabel.charAt(0)}</span>
          <span>
            <strong>{rescuerLabel}</strong>
            {data.location ? <small>{data.location}</small> : null}
          </span>
        </button>

        {data.location ? <LocationMap location={data.location} /> : null}

        {showHealth && data.health ? (
          <article className="info-card trait-card">
            <h3>Salud</h3>
            <Trait ok={data.health.vaccinated} label="Vacunado" />
            <Trait ok={data.health.sterilized} label="Esterilizado" />
            <Trait ok={Boolean(special)} label="Cuidados especiales" />
          </article>
        ) : null}

        {showSocial && data.social ? (
          <article className="info-card trait-card">
            <h3>Social</h3>
            <Trait ok={data.social.children} label="Niños" />
            <Trait ok={data.social.dogs} label="Perros" />
            <Trait ok={data.social.cats} label="Gatos" />
          </article>
        ) : null}

        <article className="info-card funding-card">
          <h3>Meta de recaudación</h3>
          <div className="progress-track">
            <i style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p>
            ${funded.toLocaleString("es-MX")} de ${goal.toLocaleString("es-MX")} MXN ({pct}%)
          </p>
          {data.needs.length ? (
            <div className="publish-review-card">
              <div>
                <span>Necesidades</span>
                <strong>${subtotal.toLocaleString("es-MX")}</strong>
              </div>
              <div>
                <span>Fees DopMi</span>
                <strong>${fee.toLocaleString("es-MX")}</strong>
              </div>
              <div>
                <span>Meta pública</span>
                <strong>${goal.toLocaleString("es-MX")}</strong>
              </div>
            </div>
          ) : null}
        </article>

        <section className="publish-needs-list">
          <h3>Necesidades</h3>
          {data.needs.map((need) => (
            <article className="publish-need-row" key={need.id}>
              <span className={`need-symbol soft ${need.type.toLowerCase()}`}>{need.type === "Comida" ? "🥣" : need.type === "Medicina" ? "💊" : "🩺"}</span>
              <div>
                <strong>{need.title}</strong>
                <p>
                  {need.type} · ${need.funded.toLocaleString("es-MX")} / ${need.requested.toLocaleString("es-MX")}
                </p>
              </div>
              {onDonateNeed ? (
                <button type="button" className="primary-button compact" onClick={() => onDonateNeed(need.id)}>
                  Donar
                </button>
              ) : null}
            </article>
          ))}
        </section>

        {data.categoryEvidence?.filter((item) => item.photo).length ? (
          <section className="publish-section">
            <h3>Evidencia visual</h3>
            {data.categoryEvidence
              .filter((item) => item.photo)
              .map((item) => (
              <article className="publish-need-row" key={item.category}>
                <img className="publish-evidence-thumb" src={item.photo} alt="" />
                <div>
                  <strong>{item.category}</strong>
                  {item.caption ? <p>{item.caption}</p> : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {data.contextVideo ? (
          <article className="info-card">
            <h3>Video de contexto</h3>
            <p className="publish-hint">Video cargado para dar contexto al caso.</p>
          </article>
        ) : null}

        {photos.length > 1 ? (
          <section className="publish-section">
            <h3>Más fotos</h3>
            <div className="publish-photo-grid compact">
              {photos.slice(1).map((src) => (
                <article className="publish-photo-thumb" key={src}>
                  <img src={src} alt="" />
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
