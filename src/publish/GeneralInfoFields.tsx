import { LocationMap } from "../components/LocationMap";
import {
  PERSONALITY_OPTIONS,
  type AdoptionAgeBand,
  type AdoptionEnergy,
  type AdoptionSize,
  type PersonalityTrait,
  type PublishDraftState,
} from "./types";

type Props = {
  state: PublishDraftState;
  onChange: (partial: Partial<PublishDraftState>) => void;
  mode: "adoption" | "donation";
};

function Req({ label, required }: { label: string; required?: boolean }) {
  return (
    <h3>
      {label}
      {required ? (
        <>
          {" "}
          <em>*</em>
        </>
      ) : (
        <span className="publish-hint"> (opcional)</span>
      )}
    </h3>
  );
}

export function GeneralInfoFields({ state, onChange, mode }: Props) {
  const attrsRequired = mode === "adoption";

  return (
    <section className="publish-section">
      <h2>Información general</h2>
      {mode === "donation" ? (
        <p className="publish-hint">En donación, Tipo, Sexo, Edad, Tamaño, Salud y Social son opcionales.</p>
      ) : null}

      <label className="publish-field">
        <span>
          Nombre <em>*</em>
        </span>
        <input value={state.petName} onChange={(e) => onChange({ petName: e.target.value })} />
      </label>

      <article className="publish-trait-card">
        <Req label="Tipo" required={attrsRequired} />
        <div className="publish-choice-row">
          {([
            { value: "Perro" as const, label: "🐶 Perro" },
            { value: "Gato" as const, label: "🐱 Gato" },
          ]).map(({ value, label }) => (
            <button
              type="button"
              key={value}
              className={`publish-choice ${state.species === value ? "selected" : ""}`}
              onClick={() => onChange({ species: state.species === value && !attrsRequired ? "" : value })}
            >
              {label}
            </button>
          ))}
        </div>
      </article>

      <article className="publish-trait-card">
        <Req label="Sexo" required={attrsRequired} />
        <div className="publish-choice-row">
          {([
            { value: "Macho" as const, label: "♂ Macho" },
            { value: "Hembra" as const, label: "♀ Hembra" },
          ]).map(({ value, label }) => (
            <button
              type="button"
              key={value}
              className={`publish-choice ${state.sex === value ? "selected" : ""}`}
              onClick={() => onChange({ sex: state.sex === value && !attrsRequired ? "" : value })}
            >
              {label}
            </button>
          ))}
        </div>
      </article>

      <article className="publish-trait-card">
        <Req label="Edad" required={attrsRequired} />
        <div className="publish-choice-row three">
          {(["Cachorro", "Adulto", "Viejo"] as AdoptionAgeBand[]).map((value) => (
            <button
              type="button"
              key={value}
              className={`publish-choice ${state.ageBand === value ? "selected" : ""}`}
              onClick={() =>
                onChange(
                  state.ageBand === value && !attrsRequired
                    ? { ageBand: "", age: "" }
                    : { ageBand: value, age: value },
                )
              }
            >
              {value}
            </button>
          ))}
        </div>
      </article>

      <article className="publish-trait-card">
        <Req label="Tamaño" required={attrsRequired} />
        <div className="publish-choice-row three">
          {(["Chico", "Mediano", "Grande"] as AdoptionSize[]).map((value) => (
            <button
              type="button"
              key={value}
              className={`publish-choice ${state.size === value ? "selected" : ""}`}
              onClick={() => onChange({ size: state.size === value && !attrsRequired ? "" : value })}
            >
              {value}
            </button>
          ))}
        </div>
      </article>

      <article className="publish-trait-card">
        <Req label="Energía" required />
        <div className="publish-choice-row three">
          {(["Poco activo", "Activo", "Muy activo"] as AdoptionEnergy[]).map((value) => (
            <button
              type="button"
              key={value}
              className={`publish-choice ${state.energy === value ? "selected" : ""}`}
              onClick={() => onChange({ energy: value })}
            >
              {value}
            </button>
          ))}
        </div>
      </article>

      <article className="publish-trait-card">
        <Req label="Personalidad" required />
        <label className="publish-field">
          <span className="visually-hidden">Personalidad</span>
          <select
            value={state.personality || ""}
            onChange={(e) =>
              onChange({ personality: (e.target.value || "") as PersonalityTrait | "" })
            }
          >
            <option value="">Selecciona una personalidad</option>
            {PERSONALITY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </article>

      <label className="publish-field">
        <span>
          Descripción <em>*</em>
        </span>
        <textarea rows={4} value={state.story} onChange={(e) => onChange({ story: e.target.value })} />
      </label>

      <article className="publish-trait-card">
        <Req label="Salud" required={attrsRequired} />
        {(
          [
            ["vaccinated", "Vacunado"],
            ["sterilized", "Esterilizado"],
            ["specialCare", "Cuidados especiales"],
          ] as const
        ).map(([key, label]) => (
          <label className="publish-check" key={key}>
            <input
              type="checkbox"
              checked={Boolean(state[key])}
              onChange={(e) => onChange({ [key]: e.target.checked })}
            />
            <span>{label}</span>
          </label>
        ))}
      </article>

      <article className="publish-trait-card">
        <Req label="Social" required={attrsRequired} />
        {(
          [
            ["socialChildren", "Niños"],
            ["socialDogs", "Perros"],
            ["socialCats", "Gatos"],
          ] as const
        ).map(([key, label]) => (
          <label className="publish-check" key={key}>
            <input
              type="checkbox"
              checked={Boolean(state[key])}
              onChange={(e) => onChange({ [key]: e.target.checked })}
            />
            <span>{label}</span>
          </label>
        ))}
      </article>

      <label className="publish-field">
        <span>
          Ubicación <em>*</em>
        </span>
        <input
          value={state.location}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="Ciudad, Estado"
        />
      </label>
      {state.location.trim() ? (
        <LocationMap location={state.location} label="Vista previa del mapa" compact />
      ) : null}
    </section>
  );
}

export function isGeneralInfoComplete(state: PublishDraftState, mode: "adoption" | "donation") {
  const baseOk =
    Boolean(state.petName.trim()) &&
    Boolean(state.story.trim()) &&
    Boolean(state.energy) &&
    Boolean(state.personality) &&
    Boolean(state.location.trim());
  if (!baseOk) return false;
  if (mode === "donation") return true;
  return Boolean(state.species) && Boolean(state.sex) && Boolean(state.ageBand) && Boolean(state.size);
}
