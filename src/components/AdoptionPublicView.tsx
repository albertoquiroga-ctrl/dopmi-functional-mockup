import { LocationMap } from "./LocationMap";
import { resolveRescuerDisplayName } from "../data";
import { usePrototypeStore } from "../store";

export type AdoptionViewModel = {
  id: string;
  name: string;
  sex: "Macho" | "Hembra";
  species: "Perro" | "Gato";
  image: string;
  photos?: string[];
  story: string;
  location: string;
  rescuer: string;
  distance?: string;
  verified?: boolean;
  age?: string;
  size?: string;
  ageBand?: string;
  energy?: string;
  personality?: string;
  health: { vaccinated: boolean; sterilized: boolean; specialCare: boolean | string };
  social: { dogs: boolean; cats: boolean; children: boolean };
};

type Props = {
  data: AdoptionViewModel;
  preview?: boolean;
  onBack?: () => void;
  onOpenRescuer?: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
};

function Trait({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p className={`trait-row ${ok ? "" : "off"}`}>
      <span aria-hidden>{ok ? "✓" : "–"}</span>
      {label}
    </p>
  );
}

export function AdoptionPublicView({ data, preview, onBack, onOpenRescuer, saved, onToggleSave }: Props) {
  const rescuerProfile = usePrototypeStore((state) => state.rescuerProfile);
  const rescuerLabel = resolveRescuerDisplayName(data.rescuer, rescuerProfile);
  const photos = data.photos?.length ? data.photos : [data.image];
  const special =
    typeof data.health.specialCare === "string"
      ? Boolean(data.health.specialCare && data.health.specialCare !== "Ninguno")
      : data.health.specialCare;
  const ageLabel = data.ageBand || data.age;

  return (
    <div className={`adoption-detail ${preview ? "is-preview" : ""}`}>
      {preview ? <p className="notice-card preview-banner">Así verán tu publicación los adoptantes</p> : null}
      <div className="detail-hero compact">
        <img src={photos[0]} alt={data.name} />
        {onBack ? (
          <button className="hero-back" type="button" onClick={onBack} aria-label="Volver">
            <img src="/assets/back-light.svg" width={20} height={20} alt="" />
          </button>
        ) : null}
      </div>
      <div className="detail-content adoption-detail-content">
        <article className="info-card case-summary-card">
          <div className="title-row">
            <h1>{data.name}</h1>
            {data.distance ? <span className="distance-pill">{data.distance}</span> : null}
          </div>
          <p className="pet-sex">
            {data.species} · {data.sex}
            {ageLabel ? ` · ${ageLabel}` : ""}
          </p>
          <p>{data.story}</p>
          <div className="adoption-attr-badges">
            {data.size ? <span className="publish-need-badge">Tamaño: {data.size}</span> : null}
            {data.energy ? <span className="publish-need-badge">Energía: {data.energy}</span> : null}
            {data.personality ? <span className="publish-need-badge">{data.personality}</span> : null}
          </div>
        </article>

        <button type="button" className="rescuer-card" onClick={onOpenRescuer}>
          <span className="avatar yellow">{rescuerLabel.charAt(0)}</span>
          <span>
            <strong>
              {rescuerLabel}
              {data.verified ? " ✓" : ""}
            </strong>
            <small>{data.location}</small>
          </span>
        </button>

        <LocationMap location={data.location} />

        <article className="info-card trait-card">
          <h3>Salud</h3>
          <Trait ok={data.health.vaccinated} label="Vacunado" />
          <Trait ok={data.health.sterilized} label="Esterilizado" />
          <Trait ok={Boolean(special)} label="Cuidados especiales" />
        </article>

        <article className="info-card trait-card">
          <h3>Social</h3>
          <Trait ok={data.social.children} label="Niños" />
          <Trait ok={data.social.dogs} label="Perros" />
          <Trait ok={data.social.cats} label="Gatos" />
        </article>

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

        {onToggleSave ? (
          <button type="button" className={`secondary-button ${saved ? "selected" : ""}`} onClick={onToggleSave}>
            {saved ? "Guardado" : "Guardar"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
