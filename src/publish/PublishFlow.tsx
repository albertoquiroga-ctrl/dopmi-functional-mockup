import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AdoptionPublicView } from "../components/AdoptionPublicView";
import { CasePublicView } from "../components/CasePublicView";
import { usePrototypeStore } from "../store";
import { GeneralInfoFields, isGeneralInfoComplete } from "./GeneralInfoFields";
import {
  TRANSACTION_FEE_MXN,
  categoriesUsed,
  emptyPublishDraft,
  needsSubtotal,
  newNeedId,
  publicGoal,
  type DraftNeedItem,
  type NeedCategory,
  type PersonalityTrait,
  type PublishDraftState,
} from "./types";

const SAMPLE_PHOTO = "/assets/luna-card.png";
const A = "/assets/";

type DonationStep = "general" | "needs" | "evidences" | "visual" | "preview" | "submit";
type AdoptionStep = "general" | "visual" | "preview";

const NEED_EMOJI: Record<NeedCategory, string> = {
  Comida: "🥣",
  Medicina: "💊",
  Veterinario: "🩺",
};

function PublishIcon({ name, size = 20 }: { name: string; size?: number }) {
  return <img src={`${A}${name}`} width={size} height={size} alt="" className="asset-icon" />;
}

function PublishStepper({ step, total }: { step: number; total: number }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="publish-stepper" aria-label={`Paso ${step} de ${total}`}>
      {steps.map((n) => {
        const done = n < step;
        const active = n === step;
        return (
          <div className="publish-step-seg" key={n}>
            <span className={`publish-step-dot ${done || active ? "on" : ""}`}>
              {done ? <PublishIcon name="publish-step-check.svg" size={16} /> : n}
            </span>
            {n < total ? <span className={`publish-step-line ${n < step ? "on" : ""}`} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function PublishShell({
  title,
  step,
  total,
  onBack,
  children,
  footer,
  overlay,
}: {
  title: string;
  step: number;
  total: number;
  onBack: () => void;
  children: ReactNode;
  footer: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className="plain-screen rescuer-theme publish-case-shell">
      <header className="publish-case-header">
        <button type="button" className="publish-header-back" onClick={onBack} aria-label="Volver">
          <PublishIcon name="back.svg" size={24} />
          <h1>{title}</h1>
        </button>
        <PublishStepper step={step} total={total} />
      </header>
      <div className="publish-case-body">{children}</div>
      <footer className="publish-case-footer">{footer}</footer>
      {overlay}
    </div>
  );
}

function UploadDrop({
  title,
  copy,
  actionLabel,
  onAction,
  doneLabel,
  onClear,
  preview,
}: {
  title: string;
  copy?: string;
  actionLabel: string;
  onAction: () => void;
  doneLabel?: string;
  onClear?: () => void;
  preview?: string;
}) {
  if (preview || doneLabel) {
    return (
      <article className="publish-urgent-video-done">
        <div>
          <strong>{title}</strong>
          <small>{doneLabel || "Archivo cargado"}</small>
        </div>
        {onClear ? (
          <button type="button" className="publish-need-remove" onClick={onClear}>
            Quitar
          </button>
        ) : null}
      </article>
    );
  }
  return (
    <div className="publish-photo-drop">
      <PublishIcon name="publish-upload.svg" size={28} />
      <div>
        <p className="publish-drop-title">{title}</p>
        {copy ? <p className="publish-drop-copy">{copy}</p> : null}
      </div>
      <div className="publish-photo-actions">
        <button type="button" className="publish-outline-btn" onClick={onAction}>
          <PublishIcon name="onb-camera.svg" size={16} />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function loadDraft(raw: Record<string, string | boolean | string[]>): PublishDraftState {
  const base = emptyPublishDraft();
  try {
    if (typeof raw.publishDraftJson === "string" && raw.publishDraftJson) {
      const parsed = JSON.parse(raw.publishDraftJson) as Partial<PublishDraftState> & {
        personality?: PersonalityTrait | PersonalityTrait[] | "";
      };
      const personality = Array.isArray(parsed.personality)
        ? parsed.personality[0] || ""
        : parsed.personality || "";
      return { ...base, ...parsed, personality };
    }
  } catch {
    /* ignore corrupt draft */
  }
  return {
    ...base,
    publishMode: raw.publishMode === "adoption" ? "adoption" : "donation",
    petName: String(raw.petName || ""),
    species: (raw.species as PublishDraftState["species"]) || "",
    sex: (raw.sex as PublishDraftState["sex"]) || "",
    age: String(raw.age || ""),
    story: String(raw.story || ""),
    location: String(raw.location || base.location),
    mainPhoto: Array.isArray(raw.photos) ? String(raw.photos[0] || "") : "",
    extraPhotos: Array.isArray(raw.photos) ? (raw.photos as string[]).slice(1) : [],
  };
}

function NeedEditor({
  items,
  onChange,
}: {
  items: DraftNeedItem[];
  onChange: (next: DraftNeedItem[]) => void;
}) {
  const [openType, setOpenType] = useState<NeedCategory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const empty: DraftNeedItem = {
    id: "",
    type: "Comida",
    title: "",
    amount: 0,
  };
  const [form, setForm] = useState<DraftNeedItem>(empty);

  const startCreate = (type: NeedCategory) => {
    setOpenType(type);
    setEditingId(null);
    setForm({ ...empty, id: newNeedId(), type });
  };

  const startEdit = (item: DraftNeedItem) => {
    setOpenType(item.type);
    setEditingId(item.id);
    setForm({ ...item });
  };

  const save = () => {
    if (!openType) return;
    const amount = Number(form.amount || form.ticketSpend || 0);
    if (!amount) return;
    let title = form.title.trim();
    if (openType === "Comida") {
      if (!form.brand?.trim()) return;
      title = title || `${form.brand}${form.weightKg ? ` ${form.weightKg} kg` : ""}`.trim();
    }
    if (openType === "Medicina") {
      if (!form.medicineName?.trim()) return;
      title = title || form.medicineName;
    }
    if (openType === "Veterinario") {
      if (!form.clinicName?.trim() || !form.consultReason?.trim()) return;
      title = title || `${form.clinicName} · ${form.consultReason}`;
    }
    const next: DraftNeedItem = { ...form, type: openType, title, amount, id: form.id || newNeedId() };
    onChange(editingId ? items.map((item) => (item.id === editingId ? next : item)) : [...items, next]);
    setOpenType(null);
    setEditingId(null);
  };

  const remove = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;
    if (!window.confirm(`¿Eliminar “${target.title}”? También se borrarán sus evidencias.`)) return;
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <>
      <div className="publish-section">
        <button type="button" className="publish-need-card" onClick={() => startCreate("Comida")}>
          <span aria-hidden>{NEED_EMOJI.Comida}</span>
          <span>
            <strong>Comida</strong>
            <p>Agrega marca, peso, unidades y monto del ticket.</p>
          </span>
        </button>
        <button type="button" className="publish-need-card" onClick={() => startCreate("Medicina")}>
          <span aria-hidden>{NEED_EMOJI.Medicina}</span>
          <span>
            <strong>Medicina</strong>
            <p>Nombre, costo según ticket y tratamiento.</p>
          </span>
        </button>
        <button type="button" className="publish-need-card" onClick={() => startCreate("Veterinario")}>
          <span aria-hidden>{NEED_EMOJI.Veterinario}</span>
          <span>
            <strong>Veterinario</strong>
            <p>Consultorio, motivo, teléfono y monto del ticket.</p>
          </span>
        </button>
      </div>

      {items.length ? (
        <div className="publish-needs-list">
          <h3>Necesidades agregadas</h3>
          {items.map((item) => (
            <article className="publish-need-row" key={item.id}>
              <span className="publish-need-emoji" aria-hidden>
                {NEED_EMOJI[item.type]}
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>
                  {item.type} · ${item.amount.toLocaleString("es-MX")} MXN
                </p>
              </div>
              <button type="button" className="publish-edit-link" onClick={() => startEdit(item)}>
                Editar
              </button>
              <button type="button" className="publish-need-remove" onClick={() => remove(item.id)}>
                Eliminar
              </button>
            </article>
          ))}
        </div>
      ) : null}

      <p className="publish-hint">
        Subtotal solicitado: <strong>${needsSubtotal(items).toLocaleString("es-MX")} MXN</strong>
      </p>

      {openType ? (
        <div className="modal-backdrop center" onClick={() => setOpenType(null)}>
          <div
            className={`dialog-card publish-med-dialog ${openType === "Veterinario" ? "publish-vet-dialog" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="dialog-close" onClick={() => setOpenType(null)} aria-label="Cerrar">
              ×
            </button>
            <header className="publish-med-head">
              <h2>
                {editingId ? "Editar" : "Agregar"} {openType}
              </h2>
              <p>Completa los datos de esta necesidad. El ID se mantiene si la editas.</p>
            </header>

            {openType === "Comida" ? (
              <>
                <label className="publish-field">
                  <span>Marca</span>
                  <input value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                </label>
                <label className="publish-field">
                  <span>Peso (kg)</span>
                  <input
                    type="number"
                    value={form.weightKg ?? ""}
                    onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) || undefined })}
                  />
                </label>
                <label className="publish-field">
                  <span>Unidades</span>
                  <input
                    type="number"
                    value={form.units ?? ""}
                    onChange={(e) => setForm({ ...form, units: Number(e.target.value) || undefined })}
                  />
                </label>
                <label className="publish-field">
                  <span>Cantidad gastada según ticket</span>
                  <span className="publish-amount-wrap">
                    <em>$</em>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={form.ticketSpend ?? form.amount ?? ""}
                      onChange={(e) => {
                        const value = Number(e.target.value) || 0;
                        setForm({ ...form, ticketSpend: value, amount: value });
                      }}
                    />
                  </span>
                  <small>Monto en MXN</small>
                </label>
              </>
            ) : null}

            {openType === "Medicina" ? (
              <>
                <label className="publish-field">
                  <span>Nombre</span>
                  <input
                    value={form.medicineName || ""}
                    onChange={(e) => setForm({ ...form, medicineName: e.target.value, title: e.target.value })}
                  />
                </label>
                <label className="publish-field">
                  <span>Costo según ticket</span>
                  <span className="publish-amount-wrap">
                    <em>$</em>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={form.amount || ""}
                      onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
                    />
                  </span>
                  <small>Monto en MXN</small>
                </label>
                <label className="publish-field">
                  <span>¿Para qué tratamiento es?</span>
                  <textarea rows={3} value={form.treatment || ""} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
                </label>
              </>
            ) : null}

            {openType === "Veterinario" ? (
              <>
                <label className="publish-field">
                  <span>Nombre del consultorio o veterinario</span>
                  <input value={form.clinicName || ""} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} />
                </label>
                <label className="publish-field">
                  <span>Motivo de consulta</span>
                  <input
                    value={form.consultReason || ""}
                    onChange={(e) => setForm({ ...form, consultReason: e.target.value })}
                  />
                </label>
                <label className="publish-field">
                  <span>Teléfono del consultorio/veterinario</span>
                  <input type="tel" value={form.clinicPhone || ""} onChange={(e) => setForm({ ...form, clinicPhone: e.target.value })} />
                </label>
                <label className="publish-field">
                  <span>Monto gastado según ticket</span>
                  <span className="publish-amount-wrap">
                    <em>$</em>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={form.amount || ""}
                      onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
                    />
                  </span>
                  <small>Monto en MXN</small>
                </label>
              </>
            ) : null}

            <button type="button" className="purple-button" onClick={save}>
              Guardar necesidad
            </button>
            <button type="button" className="secondary-button" onClick={() => setOpenType(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function PublishFlow() {
  const navigate = useNavigate();
  const { draft, updateDraft, publishDraft, rescuerProfile, stripeStatus } = usePrototypeStore();
  const [phase, setPhase] = useState<"pick" | "flow">("pick");
  const [state, setState] = useState<PublishDraftState>(() => loadDraft(draft));
  const [donationStep, setDonationStep] = useState<DonationStep>("general");
  const [adoptionStep, setAdoptionStep] = useState<AdoptionStep>("general");

  const persist = (next: PublishDraftState) => {
    setState(next);
    updateDraft({
      publishMode: next.publishMode,
      publishDraftJson: JSON.stringify(next),
      petName: next.petName,
      species: next.species,
      sex: next.sex,
      age: next.age,
      story: next.story,
      location: next.location,
      photos: next.mainPhoto ? [next.mainPhoto, ...next.extraPhotos] : next.extraPhotos,
    });
  };

  const patch = (partial: Partial<PublishDraftState>) => persist({ ...state, ...partial });

  const donationSteps: DonationStep[] = ["general", "needs", "evidences", "visual", "preview", "submit"];
  const adoptionSteps: AdoptionStep[] = ["general", "visual", "preview"];

  const canGeneral = isGeneralInfoComplete(state, state.publishMode);

  const cats = categoriesUsed(state.needItems);
  const evidencesOk =
    state.needItems.length > 0 &&
    state.needItems.every((item) => Boolean(state.needTicketById[item.id])) &&
    Boolean(state.thankYouVideo);
  const visualOk = Boolean(state.mainPhoto);
  const visibleCategoryEvidence = state.categoryEvidence.filter((entry) => Boolean(entry.photo));

  const casePreview = useMemo(
    () => ({
      id: "preview-donation",
      name: state.petName || "Sin nombre",
      age: state.ageBand || state.age || undefined,
      sex: state.sex || undefined,
      species: state.species || undefined,
      image: state.mainPhoto || SAMPLE_PHOTO,
      photos: [state.mainPhoto || SAMPLE_PHOTO, ...state.extraPhotos],
      story: state.story || "Sin historia",
      location: state.location.trim() || undefined,
      rescuer: rescuerProfile.name,
      distance: "Cerca de ti",
      needs: state.needItems.map((item) => ({
        id: item.id,
        title: item.title,
        type: (item.type === "Veterinario" ? "Veterinario" : item.type === "Medicina" ? "Medicina" : "Comida") as
          | "Veterinario"
          | "Medicina"
          | "Comida",
        requested: item.amount,
        funded: 0,
        status: "active" as const,
      })),
      feeMxn: TRANSACTION_FEE_MXN,
      contextVideo: state.contextVideo || undefined,
      categoryEvidence: visibleCategoryEvidence,
      size: state.size || undefined,
      ageBand: state.ageBand || undefined,
      energy: state.energy || undefined,
      personality: state.personality || undefined,
      health: {
        vaccinated: state.vaccinated,
        sterilized: state.sterilized,
        specialCare: state.specialCare,
      },
      social: {
        dogs: state.socialDogs,
        cats: state.socialCats,
        children: state.socialChildren,
      },
      showHealthSocial: state.vaccinated || state.sterilized || state.specialCare || state.socialDogs || state.socialCats || state.socialChildren,
    }),
    [state, rescuerProfile.name, visibleCategoryEvidence],
  );

  const adoptionPreview = useMemo(
    () => ({
      id: "preview-adoption",
      name: state.petName || "Sin nombre",
      sex: (state.sex || "Macho") as "Macho" | "Hembra",
      species: (state.species || "Perro") as "Perro" | "Gato",
      image: state.mainPhoto || SAMPLE_PHOTO,
      photos: [state.mainPhoto || SAMPLE_PHOTO, ...state.extraPhotos],
      story: state.story || "Sin historia",
      location: state.location,
      rescuer: rescuerProfile.name,
      distance: "Cerca de ti",
      verified: false,
      age: state.ageBand || state.age,
      size: state.size || undefined,
      ageBand: state.ageBand || undefined,
      energy: state.energy || undefined,
      personality: state.personality || undefined,
      health: {
        vaccinated: state.vaccinated,
        sterilized: state.sterilized,
        specialCare: state.specialCare,
      },
      social: {
        dogs: state.socialDogs,
        cats: state.socialCats,
        children: state.socialChildren,
      },
    }),
    [state, rescuerProfile.name],
  );

  const saveAndExit = () => {
    persist(state);
    navigate("/rescuer/cases");
  };

  const submitForReview = (goToStripe = false) => {
    persist(state);
    const id = publishDraft("review");
    if (goToStripe) {
      navigate(`/rescuer/profile/payments?case=${typeof id === "string" ? id : ""}`);
      return;
    }
    navigate("/rescuer/cases");
  };

  if (phase === "pick") {
    return (
      <div className="plain-screen rescuer-theme publish-type-shell">
        <div className="publish-type-screen">
          <div className="intent-copy">
            <h1>¿Qué quieres publicar?</h1>
            <p>Puedes publicar adopciones sin verificarte ni configurar Stripe.</p>
          </div>
          <div className="publish-type-cards">
            <button
              type="button"
              className="intent-card publish-type-card"
              onClick={() => {
                patch({ publishMode: "adoption" });
                setPhase("flow");
                setAdoptionStep("general");
              }}
            >
              <span className="intent-chip publish-adopt">
                <PublishIcon name="intent-adopter.svg" size={28} />
              </span>
              <span className="intent-card-text">
                <strong>Dar en adopción</strong>
                <p>Publica una mascota lista para encontrar hogar</p>
              </span>
            </button>
            <button
              type="button"
              className="intent-card publish-type-card"
              onClick={() => {
                patch({ publishMode: "donation" });
                setPhase("flow");
                setDonationStep("general");
              }}
            >
              <span className="intent-chip publish-donate">
                <PublishIcon name="intent-donor.svg" size={28} />
              </span>
              <span className="intent-card-text">
                <strong>Caso de donación</strong>
                <p>Recauda con evidencias cargadas antes del envío</p>
              </span>
            </button>
          </div>
          <button type="button" className="publish-cancel" onClick={() => navigate("/rescuer")}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  const generalForm = (
    <GeneralInfoFields state={state} onChange={patch} mode={state.publishMode} />
  );

  const visualForm = (
    <section className="publish-section">
      <h2>Contenido visual</h2>
      <UploadDrop
        title="Imagen principal"
        copy="Obligatoria. Esta será la foto destacada del caso."
        actionLabel={state.mainPhoto ? "Reemplazar imagen principal" : "Subir imagen principal"}
        onAction={() => patch({ mainPhoto: SAMPLE_PHOTO })}
        preview={state.mainPhoto}
        doneLabel={state.mainPhoto ? "Imagen principal lista" : undefined}
        onClear={state.mainPhoto ? () => patch({ mainPhoto: "" }) : undefined}
      />
      {state.mainPhoto ? (
        <div className="publish-photo-grid">
          <article className="publish-photo-thumb">
            <img src={state.mainPhoto} alt="" />
            <span className="publish-photo-badge">Principal</span>
          </article>
        </div>
      ) : null}

      <h3>Imágenes adicionales</h3>
      <UploadDrop
        title="Agregar imágenes"
        copy="Puedes subir varias fotos del caso."
        actionLabel="Agregar imagen"
        onAction={() => patch({ extraPhotos: [...state.extraPhotos, SAMPLE_PHOTO] })}
      />
      {state.extraPhotos.length ? (
        <div className="publish-photo-grid compact">
          {state.extraPhotos.map((src, index) => (
            <article className="publish-photo-thumb" key={`${src}-${index}`}>
              <img src={src} alt="" />
              <button
                type="button"
                className="publish-photo-remove"
                aria-label="Quitar foto"
                onClick={() => patch({ extraPhotos: state.extraPhotos.filter((_, i) => i !== index) })}
              >
                ×
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {state.publishMode === "donation" ? (
        <>
          <h3>Video de contexto (opcional)</h3>
          <p className="publish-hint">
            Agregar contexto puede ayudar a que el caso se considere para donaciones prioritarias según la situación, sin
            garantizarlo.
          </p>
          <UploadDrop
            title="Video de contexto"
            copy="Opcional."
            actionLabel={state.contextVideo ? "Reemplazar video" : "Subir video de contexto"}
            onAction={() => patch({ contextVideo: "context-video.mp4" })}
            doneLabel={state.contextVideo ? "Video de contexto cargado" : undefined}
            onClear={state.contextVideo ? () => patch({ contextVideo: "" }) : undefined}
            preview={state.contextVideo || undefined}
          />
        </>
      ) : null}
    </section>
  );

  if (state.publishMode === "adoption") {
    const stepIndex = adoptionSteps.indexOf(adoptionStep);
    return (
      <PublishShell
        title="Publicar adopción"
        step={stepIndex + 1}
        total={adoptionSteps.length}
        onBack={() => {
          if (stepIndex <= 0) setPhase("pick");
          else setAdoptionStep(adoptionSteps[stepIndex - 1]);
        }}
        footer={
          <>
            {adoptionStep !== "preview" ? (
              <button
                type="button"
                className="purple-button publish-continue"
                disabled={adoptionStep === "general" ? !canGeneral : !visualOk}
                onClick={() => setAdoptionStep(adoptionSteps[stepIndex + 1])}
              >
                Continuar
              </button>
            ) : (
              <button type="button" className="purple-button publish-continue" onClick={submitForReview}>
                Enviar a revisión
              </button>
            )}
            <button type="button" className="publish-draft-link" onClick={saveAndExit}>
              Guardar borrador
            </button>
          </>
        }
      >
        {adoptionStep === "general" ? generalForm : null}
        {adoptionStep === "visual" ? visualForm : null}
        {adoptionStep === "preview" ? (
          <AdoptionPublicView data={adoptionPreview} preview onBack={() => setAdoptionStep("visual")} />
        ) : null}
      </PublishShell>
    );
  }

  const dIndex = donationSteps.indexOf(donationStep);
  const subtotal = needsSubtotal(state.needItems);
  const goal = publicGoal(state.needItems);

  return (
    <PublishShell
      title="Publicar donación"
      step={dIndex + 1}
      total={donationSteps.length}
      onBack={() => {
        if (dIndex <= 0) setPhase("pick");
        else setDonationStep(donationSteps[dIndex - 1]);
      }}
      footer={
        <>
          {donationStep !== "submit" ? (
            <button
              type="button"
              className="purple-button publish-continue"
              disabled={
                donationStep === "general"
                  ? !canGeneral
                  : donationStep === "needs"
                    ? state.needItems.length === 0
                    : donationStep === "evidences"
                      ? !evidencesOk
                      : donationStep === "visual"
                        ? !visualOk
                        : false
              }
              onClick={() => setDonationStep(donationSteps[dIndex + 1])}
            >
              Continuar
            </button>
          ) : stripeStatus === "linked" ? (
            <button type="button" className="purple-button publish-continue" onClick={() => submitForReview(false)}>
              Enviar a revisión
            </button>
          ) : (
            <>
              <button type="button" className="purple-button publish-continue" onClick={() => submitForReview(true)}>
                Vincular Stripe
              </button>
              <button type="button" className="secondary-button" onClick={() => submitForReview(false)}>
                Hacerlo después
              </button>
            </>
          )}
          <button type="button" className="publish-draft-link" onClick={saveAndExit}>
            Guardar borrador
          </button>
        </>
      }
    >
      {donationStep === "general" ? generalForm : null}
      {donationStep === "needs" ? (
        <section className="publish-section">
          <h2>Necesidades</h2>
          <div className="publish-needs-note">
            <strong>Puedes combinar categorías</strong> y agregar varias del mismo tipo. Cada necesidad conserva un ID
            estable.
          </div>
          <NeedEditor
            items={state.needItems}
            onChange={(needItems) => {
              const ids = new Set(needItems.map((item) => item.id));
              const needTicketById = Object.fromEntries(
                Object.entries(state.needTicketById).filter(([id]) => ids.has(id)),
              );
              const used = categoriesUsed(needItems);
              const categoryEvidence = used.map(
                (category) =>
                  state.categoryEvidence.find((entry) => entry.category === category) || {
                    category,
                    photo: "",
                    caption: "",
                  },
              );
              patch({ needItems, needTicketById, categoryEvidence });
            }}
          />
        </section>
      ) : null}
      {donationStep === "evidences" ? (
        <section className="publish-section">
          <h2>Evidencias</h2>
          <p className="publish-hint">Se cargan antes de enviar. Cada ticket queda ligado al ID de su necesidad.</p>
          {state.needItems.map((item) => (
            <article className="publish-trait-card" key={item.id}>
              <h3>Evidencia de “{item.title}”</h3>
              <UploadDrop
                title="Foto del ticket"
                copy="Obligatoria para esta necesidad."
                actionLabel={state.needTicketById[item.id] ? "Reemplazar ticket" : "Subir foto del ticket"}
                onAction={() =>
                  patch({
                    needTicketById: {
                      ...state.needTicketById,
                      [item.id]: SAMPLE_PHOTO,
                    },
                  })
                }
                preview={state.needTicketById[item.id]}
                doneLabel={state.needTicketById[item.id] ? "Ticket cargado" : undefined}
                onClear={
                  state.needTicketById[item.id]
                    ? () => {
                        const next = { ...state.needTicketById };
                        delete next[item.id];
                        patch({ needTicketById: next });
                      }
                    : undefined
                }
              />
            </article>
          ))}
          <article className="publish-trait-card">
            <h3>Video de agradecimiento</h3>
            <p className="publish-hint">
              <strong>La mascota tiene que aparecer en el video.</strong>
            </p>
            <UploadDrop
              title="Video de agradecimiento"
              copy="Puedes subir, reemplazar o eliminar antes de enviar."
              actionLabel={state.thankYouVideo ? "Reemplazar video" : "Subir video de agradecimiento"}
              onAction={() => patch({ thankYouVideo: "thanks-video.mp4" })}
              preview={state.thankYouVideo || undefined}
              doneLabel={state.thankYouVideo ? "Video de agradecimiento cargado" : undefined}
              onClear={state.thankYouVideo ? () => patch({ thankYouVideo: "" }) : undefined}
            />
          </article>
          <h3>Evidencia visual por categoría</h3>
          <p className="publish-hint">Opcional. Si no subes foto, esa categoría no aparecerá en la publicación.</p>
          {cats.map((category) => {
            const row = state.categoryEvidence.find((entry) => entry.category === category) || {
              category,
              photo: "",
              caption: "",
            };
            return (
              <article className="publish-trait-card" key={category}>
                <h3>Evidencia de {category}</h3>
                <UploadDrop
                  title={`Foto de la mascota · ${category} (opcional)`}
                  copy="Opcional. Una foto visual de la mascota asociada a esta categoría."
                  actionLabel={row.photo ? "Reemplazar foto" : "Subir foto de evidencia"}
                  onAction={() => {
                    const exists = state.categoryEvidence.some((entry) => entry.category === category);
                    patch({
                      categoryEvidence: exists
                        ? state.categoryEvidence.map((entry) =>
                            entry.category === category ? { ...entry, photo: SAMPLE_PHOTO } : entry,
                          )
                        : [...state.categoryEvidence, { category, photo: SAMPLE_PHOTO, caption: "" }],
                    });
                  }}
                  preview={row.photo}
                  doneLabel={row.photo ? "Evidencia visual cargada" : undefined}
                  onClear={
                    row.photo
                      ? () =>
                          patch({
                            categoryEvidence: state.categoryEvidence.map((entry) =>
                              entry.category === category ? { ...entry, photo: "", caption: "" } : entry,
                            ),
                          })
                      : undefined
                  }
                />
                {row.photo ? (
                  <label className="publish-field">
                    <span>Descripción (opcional)</span>
                    <input
                      value={row.caption || ""}
                      onChange={(e) => {
                        patch({
                          categoryEvidence: state.categoryEvidence.map((entry) =>
                            entry.category === category ? { ...entry, caption: e.target.value } : entry,
                          ),
                        });
                      }}
                      placeholder="Describe la evidencia"
                    />
                  </label>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}
      {donationStep === "visual" ? visualForm : null}
      {donationStep === "preview" ? (
        <CasePublicView data={casePreview} preview onBack={() => setDonationStep("visual")} />
      ) : null}
      {donationStep === "submit" ? (
        <section className="publish-section">
          <h2>Enviar a revisión</h2>
          <article className="publish-trait-card">
            <h3>Fees de transacción</h3>
            <p className="publish-hint">
              DopMi agregará <strong>$50 MXN</strong> a la meta que verán los donantes para cubrir costos de transacción.
              Ese monto no forma parte del gasto que reportaste.
            </p>
            <article className="publish-review-card">
              <div>
                <span>Necesidades</span>
                <strong>${subtotal.toLocaleString("es-MX")}</strong>
              </div>
              <div>
                <span>Fees de transacción</span>
                <strong>${TRANSACTION_FEE_MXN}</strong>
              </div>
              <div>
                <span>Meta total</span>
                <strong>${goal.toLocaleString("es-MX")}</strong>
              </div>
            </article>
          </article>
          <article className="publish-trait-card">
            <h3>Stripe</h3>
            {stripeStatus === "linked" ? (
              <p className="publish-hint">
                Tu cuenta de Stripe ya está vinculada. Cuando DopMi apruebe el caso, se publicará y podrás recibir donaciones.
              </p>
            ) : (
              <p className="publish-hint">
                <strong>Para que el caso pueda publicarse y recibir donaciones, debes tener una cuenta de Stripe vinculada.</strong>{" "}
                Stripe no es obligatorio para mandar el caso a revisión. Si lo envías ahora, tendrás que vincular Stripe
                antes de que el caso se publique.
              </p>
            )}
          </article>
          <article className="publish-trait-card">
            <h3>Transferencias</h3>
            <p className="publish-hint">
              Las donaciones se irán transfiriendo a tu cuenta conforme las vayas recibiendo; no necesitas esperar a
              completar la meta.
            </p>
          </article>
        </section>
      ) : null}
    </PublishShell>
  );
}
