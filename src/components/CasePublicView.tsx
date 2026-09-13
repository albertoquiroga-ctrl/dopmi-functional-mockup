import { useState } from "react";
import { LocationMap } from "./LocationMap";
import { resolveRescuerDisplayName, type Need, type PetCase } from "../data";
import { usePrototypeStore } from "../store";
import { TRANSACTION_FEE_MXN } from "../publish/types";

function NeedExpandChevron() {
  return (
    <span
      aria-hidden
      className="icon-mask"
      style={{
        width: 20,
        height: 20,
        maskImage: "url(/assets/icon-chevron-right.svg)",
        WebkitMaskImage: "url(/assets/icon-chevron-right.svg)",
      }}
    />
  );
}

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

function needEmoji(type: Need["type"]) {
  if (type === "Comida") return "🥣";
  if (type === "Medicina") return "💊";
  if (type === "Veterinario") return "🩺";
  return "🐾";
}

function NeedDetailFacts({ need }: { need: Need }) {
  if (need.type === "Comida") {
    return (
      <div className="need-facts-card">
        {need.brand ? (
          <div>
            <small>Marca</small>
            <strong>{need.brand}</strong>
          </div>
        ) : null}
        {need.weightKg != null ? (
          <div>
            <small>Peso</small>
            <strong>{need.weightKg} kg</strong>
          </div>
        ) : null}
        {need.units != null ? (
          <div>
            <small>Unidades</small>
            <strong>{need.units}</strong>
          </div>
        ) : null}
        <div>
          <small>Gasto comprobado</small>
          <strong>${(need.ticketSpend ?? need.requested).toLocaleString("es-MX")} MXN</strong>
        </div>
      </div>
    );
  }

  if (need.type === "Medicina") {
    return (
      <div className="need-facts-card">
        <div>
          <small>Nombre</small>
          <strong>{need.medicineName || need.title}</strong>
        </div>
        {need.treatment ? (
          <div>
            <small>Tratamiento</small>
            <strong>{need.treatment}</strong>
          </div>
        ) : null}
        <div>
          <small>Costo comprobado</small>
          <strong>${(need.ticketSpend ?? need.requested).toLocaleString("es-MX")} MXN</strong>
        </div>
      </div>
    );
  }

  if (need.type === "Veterinario") {
    return (
      <div className="need-facts-card">
        {need.clinicName ? (
          <div>
            <small>Consultorio / veterinario</small>
            <strong>{need.clinicName}</strong>
          </div>
        ) : null}
        {need.consultReason ? (
          <div>
            <small>Motivo</small>
            <strong>{need.consultReason}</strong>
          </div>
        ) : null}
        {need.clinicPhone ? (
          <div>
            <small>Teléfono</small>
            <strong>{need.clinicPhone}</strong>
          </div>
        ) : null}
        <div>
          <small>Monto comprobado</small>
          <strong>${(need.ticketSpend ?? need.requested).toLocaleString("es-MX")} MXN</strong>
        </div>
      </div>
    );
  }

  return null;
}

function PublicNeedCard({
  need,
  onDonate,
}: {
  need: Need;
  onDonate?: (needId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const remaining = Math.max(0, need.requested - need.funded);
  const pct = need.requested ? Math.min(100, Math.round((need.funded / need.requested) * 100)) : 0;
  const fullyFunded = remaining === 0 || need.status === "funded" || need.status === "completed";
  const typeKey = need.type.toLowerCase();

  return (
    <article className={`need-card donor-need-card ${open ? "open" : ""}`}>
      <div className="need-card-head">
        <span className={`need-symbol soft ${typeKey}`}>{needEmoji(need.type)}</span>
        <div className="need-card-copy">
          <div className="need-card-title-row">
            <div>
              <strong>{need.title}</strong>
              <span className="need-type-row">
                <small>{need.type}</small>
              </span>
            </div>
            <div className="need-price-row">
              <b>${need.requested.toLocaleString("es-MX")}</b>
              <button
                type="button"
                className="need-expand"
                aria-expanded={open}
                aria-label={open ? "Ocultar detalle" : "Ver detalle"}
                onClick={() => setOpen((value) => !value)}
              >
                <NeedExpandChevron />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="split-meta">
        <span>${need.funded.toLocaleString("es-MX")} recaudados</span>
        <strong>${remaining.toLocaleString("es-MX")} por recaudar</strong>
      </div>
      <div className="progress">
        <i style={{ width: `${pct}%` }} />
      </div>
      {onDonate ? (
        <button
          type="button"
          className={`primary-button need-donate-btn ${fullyFunded ? "funded" : ""}`}
          disabled={fullyFunded}
          onClick={() => onDonate(need.id)}
        >
          {fullyFunded ? "Completamente fondeada" : "Donar"}
        </button>
      ) : null}
      {open ? (
        <div className="need-details">
          <h3>Detalle de la necesidad</h3>
          <NeedDetailFacts need={need} />
        </div>
      ) : null}
    </article>
  );
}

export function CasePublicView({ data, preview, onBack, onDonateNeed, onOpenRescuer }: Props) {
  const rescuerProfile = usePrototypeStore((state) => state.rescuerProfile);
  const rescuerLabel = resolveRescuerDisplayName(data.rescuer, rescuerProfile);
  const photos = data.photos?.length ? data.photos : [data.image];
  const subtotal = data.needs.reduce((sum, need) => sum + need.requested, 0);
  const funded = data.needs.reduce((sum, need) => sum + need.funded, 0);
  const fee = data.feeMxn ?? TRANSACTION_FEE_MXN;
  const goal = subtotal + (data.needs.length ? fee : 0);
  const pct = Math.round((funded / Math.max(goal, 1)) * 100);
  const meta = [data.species, data.sex, data.ageBand || data.age].filter(Boolean).join(" · ");
  const attrs = [data.size, data.energy, data.personality].filter(Boolean);
  const special =
    typeof data.health?.specialCare === "string"
      ? Boolean(data.health.specialCare && data.health.specialCare !== "Ninguno")
      : Boolean(data.health?.specialCare);
  const showHealth =
    Boolean(data.health) && Boolean(data.health?.vaccinated || data.health?.sterilized || special);
  const showSocial =
    Boolean(data.social) && Boolean(data.social?.dogs || data.social?.cats || data.social?.children);
  const visualEvidence = data.categoryEvidence?.filter((item) => item.photo) ?? [];

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

        {data.location ? (
          <article className="info-card location-card">
            <h3>Ubicación</h3>
            <p className="location-card-text">{data.location}</p>
            <LocationMap location={data.location} mapOnly />
          </article>
        ) : null}

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
          <p className="funding-overview-amount">
            ${funded.toLocaleString("es-MX")} de ${goal.toLocaleString("es-MX")}
          </p>
          <p className="funding-overview-pct">{pct}%</p>
          <div className="progress-track">
            <i style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </article>

        <section className="case-needs-stack">
          <h3>Necesidades</h3>
          {data.needs.map((need) => (
            <PublicNeedCard key={need.id} need={need} onDonate={onDonateNeed} />
          ))}
        </section>

        {visualEvidence.length ? (
          <section className="case-visual-evidence">
            <h3>Evidencia visual</h3>
            {visualEvidence.map((item) => (
              <article className="visual-evidence-card" key={item.category}>
                <h4>{item.category === "Comida" ? "Alimentación" : item.category}</h4>
                <img src={item.photo} alt={`Evidencia de ${item.category}`} />
                {item.caption ? <p>{item.caption}</p> : null}
              </article>
            ))}
          </section>
        ) : null}

        {data.contextVideo ? (
          <article className="info-card">
            <h3>Video de contexto</h3>
            <p className="publish-hint">Se agregó un video de contexto para este caso.</p>
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
