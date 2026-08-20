import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  adoptionPets,
  donationLog,
  donorFaqs,
  paymentHistory,
  rescuerAccount,
  rescuerFaqs,
  rescuers,
  savedCards,
  subscriptionPlans,
  type Need,
  type NotificationKind,
  type PetCase,
} from "./data";
import { usePrototypeStore, type AccountMode, type Verification } from "./store";

const A = "/assets/";

const caseStatusLabel: Record<PetCase["caseStatus"], string> = {
  draft: "Borrador",
  review: "En revisión",
  active: "Activo",
  rejected: "Rechazado",
  closed: "Cerrado",
};

function AssetIcon({ name, size = 20, alt = "" }: { name: string; size?: number; alt?: string }) {
  return <img src={`${A}${name}`} width={size} height={size} alt={alt} className="asset-icon" />;
}

/** Figma icon exports tinted with the current text color through a CSS mask. */
function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`icon-mask ${className}`.trim()}
      style={{
        width: size,
        height: size,
        maskImage: `url(${A}${name})`,
        WebkitMaskImage: `url(${A}${name})`,
      }}
    />
  );
}

function Chevron() {
  return <Icon name="icon-chevron-right.svg" size={20} className="row-chevron" />;
}

function BellButton({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <button className="bell-button" onClick={onClick} aria-label={`Notificaciones, ${count} sin leer`}>
      <Icon name="icon-bell.svg" size={24} />
      {count > 0 && <span className="bell-badge">{count}</span>}
    </button>
  );
}

function SimulatedBanner() {
  return (
    <div className="simulated-banner" data-simulated="true">
      <strong>ESTADO SIMULADO</strong>
      <span>No existe un frame aprobado en Figma · Requiere validación del equipo</span>
    </div>
  );
}

/** Header del flujo de acceso: ranuras laterales fijas de 40px con el logo centrado. */
function BrandHeader({ back, action }: { back?: string | (() => void); action?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="brand-header">
      {back ? (
        <button
          className="header-slot"
          onClick={() => (typeof back === "function" ? back() : navigate(back))}
          aria-label="Atrás"
        >
          <AssetIcon name="back.svg" size={24} />
        </button>
      ) : (
        <span className="header-slot" />
      )}
      <img className="header-logo" src={`${A}dopmi-wordmark.png`} alt="DopMi" width={144} height={48} />
      {action ? <span className="header-slot">{action}</span> : <span className="header-slot" />}
    </header>
  );
}

function TopBar({
  title,
  back,
  actions,
  icon,
}: {
  title?: string;
  back?: string | (() => void);
  actions?: ReactNode;
  icon?: string;
}) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      {back ? (
        <button
          className="icon-button"
          onClick={() => (typeof back === "function" ? back() : navigate(back))}
          aria-label="Regresar"
        >
          <AssetIcon name="back.svg" />
        </button>
      ) : (
        <span className="topbar-spacer" />
      )}
      <h1>
        {icon ? <Icon name={icon} size={20} className="title-icon" /> : null}
        {title}
      </h1>
      <div className="topbar-actions">{actions}</div>
    </header>
  );
}

const donorTabs = [
  { path: "/adoption", label: "Adopción", icon: "tab-adoption.svg", size: 20 },
  { path: "/impact", label: "Tu Impacto", icon: "tab-impact.svg", size: 20 },
  { path: "/donate", label: "Donar", icon: "tab-donate.svg", size: 24 },
  { path: "/profile", label: "Perfil", icon: "tab-profile.svg", size: 20 },
];

const rescuerTabs = [
  { path: "/rescuer", label: "Inicio", icon: "rtab-home.svg", size: 20 },
  { path: "/rescuer/cases", label: "Casos", icon: "rtab-cases.svg", size: 20 },
  { path: "/rescuer/publish", label: "Publicar", icon: "rtab-publish.svg", size: 20 },
  { path: "/rescuer/messages", label: "Mensajes", icon: "rtab-messages.svg", size: 20 },
  { path: "/rescuer/profile", label: "Perfil", icon: "rtab-profile.svg", size: 20 },
];

function BottomNav({ mode }: { mode: AccountMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = mode === "donor" ? donorTabs : rescuerTabs;
  return (
    <nav className={`bottom-nav ${mode === "rescuer" ? "five" : ""}`}>
      {items.map((item) => {
        const active = item.path === "/rescuer" ? location.pathname === item.path : location.pathname.startsWith(item.path);
        return (
          <button key={item.path} className={active ? "active" : ""} onClick={() => navigate(item.path)}>
            <Icon name={item.icon} size={item.size} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function ScreenShell({
  mode = "donor",
  children,
  className = "",
  overlay = null,
}: {
  mode?: AccountMode;
  children: ReactNode;
  className?: string;
  overlay?: ReactNode;
}) {
  return (
    <div className={`screen-shell ${mode === "rescuer" ? "rescuer-theme" : ""} ${className}`.trim()}>
      <main className="screen-scroll">{children}</main>
      <BottomNav mode={mode} />
      {overlay}
    </div>
  );
}

function TestPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    paymentOutcome,
    verification,
    accountMode,
    setPaymentOutcome,
    setVerification,
    setAccountMode,
    resetPrototype,
  } = usePrototypeStore();
  const [open, setOpen] = useState(false);

  return (
    <aside className={`test-panel ${open ? "open" : ""}`}>
      <button className="test-panel-toggle" onClick={() => setOpen(!open)}>
        {open ? "Ocultar modo prueba" : "Modo prueba"}
      </button>
      {open && (
        <div className="test-panel-body">
          <div>
            <span className="eyebrow">Escenario</span>
            <strong>{location.pathname}</strong>
          </div>
          <label>
            Resultado de pago
            <select value={paymentOutcome} onChange={(event) => setPaymentOutcome(event.target.value as "success" | "error")}>
              <option value="success">Exitoso</option>
              <option value="error">Error</option>
            </select>
          </label>
          <label>
            Verificación
            <select value={verification} onChange={(event) => setVerification(event.target.value as Verification)}>
              <option value="unverified">Sin verificar</option>
              <option value="review">En revisión</option>
              <option value="verified">Verificado</option>
              <option value="rejected">Con errores</option>
            </select>
          </label>
          <label>
            Cuenta activa
            <select
              value={accountMode}
              onChange={(event) => {
                const mode = event.target.value as AccountMode;
                setAccountMode(mode);
                navigate(mode === "donor" ? "/adoption" : "/rescuer");
              }}
            >
              <option value="donor">Adoptante / Donante</option>
              <option value="rescuer">Rescatista</option>
            </select>
          </label>
          <div className="test-shortcuts">
            <button onClick={() => navigate("/donate")}>Donación</button>
            <button onClick={() => navigate("/rescuer/publish")}>Publicar</button>
            <button onClick={() => navigate("/notifications")}>Notificaciones</button>
          </div>
          <button
            className="link-danger"
            onClick={() => {
              resetPrototype();
              navigate("/");
            }}
          >
            Reiniciar prototipo
          </button>
        </div>
      )}
    </aside>
  );
}

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = window.setTimeout(() => navigate("/choose-intent"), 1200);
    return () => window.clearTimeout(timer);
  }, [navigate]);
  return (
    <button className="splash" onClick={() => navigate("/choose-intent")} aria-label="Continuar">
      <img className="splash-mark" src={`${A}dopmi-mark.png`} alt="" width="132" height="132" />
      <img className="splash-wordmark" src={`${A}dopmi-wordmark.png`} alt="DopMi" width="232" height="78" />
      <span>Adopta, dona y acompaña cada rescate</span>
    </button>
  );
}

function ChooseIntent() {
  const navigate = useNavigate();
  const { setAccountMode, setDonorIntent } = usePrototypeStore();
  const chooseDonor = (intent: "adopt" | "donate") => {
    setAccountMode("donor");
    setDonorIntent(intent);
    navigate("/onboarding/donor");
  };
  const roles = [
    {
      id: "donor",
      tone: "donor",
      icon: "intent-donor.svg",
      title: "Donante/Guardián",
      copy: "Apoyas económicamente a animales rescatados. Tu aportación tiene nombre, historia y seguimiento.",
      select: () => chooseDonor("donate"),
    },
    {
      id: "adopter",
      tone: "adopter",
      icon: "intent-adopter.svg",
      title: "Adoptante",
      copy: "Buscas darle un hogar de verdad a una mascotita rescatada.",
      select: () => chooseDonor("adopt"),
    },
    {
      id: "rescuer",
      tone: "rescuer",
      icon: "intent-rescuer.svg",
      eyebrow: "Rescatista Verificado",
      title: "Líder de la manada",
      copy: "Publicas tus casos, conectas con tu manada y recibes la ayuda que necesitas.",
      select: () => {
        setAccountMode("rescuer");
        navigate("/onboarding/rescuer");
      },
    },
  ];
  return (
    <div className="intent-screen">
      <BrandHeader />
      <div className="intent-body">
        <div className="intent-copy">
          <h1>¿Cómo quieres usar DopMi?</h1>
          <p>Elige tu rol. Podrás cambiarlo cuando quieras.</p>
        </div>
        <div className="intent-cards">
          {roles.map((role) => (
            <button className="intent-card" key={role.id} onClick={role.select}>
              <span className={`intent-chip ${role.tone}`}>
                <AssetIcon name={role.icon} size={28} />
              </span>
              <span className="intent-card-text">
                {role.eyebrow && <small>{role.eyebrow}</small>}
                <strong>{role.title}</strong>
                <p>{role.copy}</p>
              </span>
            </button>
          ))}
        </div>
        <p className="intent-footnote">
          Puedes cambiar tu selección en cualquier momento desde la configuración de tu cuenta.
        </p>
      </div>
    </div>
  );
}

type OnboardingSlide = { id: string; art: ReactNode; title: string; body: string; cta: string };

const onboardingTracks: Record<"adopter" | "donor" | "rescuer", OnboardingSlide[]> = {
  adopter: [
    {
      id: "adopt",
      art: (
        <div className="onb-art adopt">
          <span className="adopt-bubble lg">🐶</span>
          <span className="adopt-bubble sm">🐱</span>
          <span className="adopt-pill">
            <AssetIcon name="onb-adopt-heart.svg" size={18} />
            Nuevo hogar
            <AssetIcon name="onb-adopt-spark.svg" size={14} />
          </span>
        </div>
      ),
      title: "Encuentra a una mascota lista para unirse a tu familia",
      body: "Explora casos reales, conoce su historia y guarda tus favoritos.",
      cta: "Siguiente",
    },
    {
      id: "contact",
      art: (
        <div className="onb-art contact">
          <span className="contact-list">
            <span className="contact-pill">
              <em>🐾</em>Bella, 2 años
            </span>
            <span className="contact-pill">
              <em>🐾</em>Max, 6 meses
            </span>
          </span>
          <span className="contact-cta">
            <AssetIcon name="onb-contact.svg" size={16} />
            Contactar
          </span>
        </div>
      ),
      title: "Te respaldamos a ti y a tu nuevo amigo.",
      body: "Contacta al rescatista directamente desde Dopmi, sin intermediarios ni dudas.",
      cta: "Encontrar mi match",
    },
  ],
  donor: [
    {
      id: "needs",
      art: (
        <div className="onb-art needs">
          {[
            { emoji: "🥘", label: "Comida" },
            { emoji: "💊", label: "Medicina" },
            { emoji: "🏥", label: "Veterinario" },
          ].map((need) => (
            <span className="need-tile" key={need.label}>
              <em>{need.emoji}</em>
              <small>{need.label}</small>
            </span>
          ))}
        </div>
      ),
      title: "Tu apoyo llega donde más se necesita",
      body: "Elige casos activos y destina tu aportación a alimento, salud o cuidados urgentes.",
      cta: "Siguiente",
    },
    {
      id: "impact",
      art: (
        <div className="onb-art impact">
          <span className="impact-row">
            <span className="impact-chip green">
              <AssetIcon name="onb-check.svg" size={16} />
            </span>
            <span className="impact-text">
              <strong>Luna recibió su comida</strong>
              <small>Hace 2 días · $200 MXN</small>
            </span>
          </span>
          <span className="impact-row">
            <span className="impact-chip yellow">
              <AssetIcon name="onb-syringe.svg" size={16} />
            </span>
            <span className="impact-text">
              <strong>Milo completó su vacuna</strong>
              <small>Hace 5 días · Tratamiento</small>
            </span>
          </span>
        </div>
      ),
      title: "Ve el impacto de tu ayuda",
      body: "Dopmi te muestra actualizaciones reales para que veas el impacto de cada peso que donas.",
      cta: "Comenzar a donar",
    },
  ],
  rescuer: [
    {
      id: "publish",
      art: (
        <div className="onb-art publish">
          <span className="publish-card">
            <span className="publish-line">
              <em>🐾</em>
              <i className="bar purple" />
            </span>
            <i className="bar gray" />
            <span className="publish-tags">
              <small className="tag purple">🥘 Comida</small>
              <small className="tag red">💊 Urgente</small>
            </span>
          </span>
          <span className="publish-cta">Publicar caso</span>
        </div>
      ),
      title: "Dale voz a cada caso que rescatas",
      body: "Comparte la historia, fotos y necesidades de cada animalito — Dopmi se encarga de darle visibilidad.",
      cta: "Siguiente",
    },
    {
      id: "support",
      art: (
        <div className="onb-art support">
          <span className="impact-row">
            <span className="impact-chip purple">
              <AssetIcon name="onb-shield.svg" size={16} />
            </span>
            <span className="impact-text">
              <strong>Cuenta verificada</strong>
              <small>Comunidad confía en ti</small>
            </span>
            <AssetIcon name="onb-verified.svg" size={16} />
          </span>
          <span className="impact-row">
            <span className="impact-chip yellow">
              <AssetIcon name="onb-camera.svg" size={16} />
            </span>
            <span className="impact-text">
              <strong>Evidencia subida</strong>
              <small>Donantes notificados</small>
            </span>
          </span>
        </div>
      ),
      title: "La transparencia es tu mayor activo",
      body: "Verifica tu cuenta, recibe respaldo de la manada y sube evidencia para que la confianza crezca contigo.",
      cta: "Publicar mi caso",
    },
  ],
};

function Onboarding({ mode }: { mode: AccountMode }) {
  const navigate = useNavigate();
  const donorIntent = usePrototypeStore((state) => state.donorIntent);
  const track = mode === "rescuer" ? "rescuer" : donorIntent === "adopt" ? "adopter" : "donor";
  const slides = onboardingTracks[track];
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const goBack = () => (step === 0 ? navigate("/choose-intent") : setStep(step - 1));
  const goNext = () => (step === slides.length - 1 ? navigate(`/welcome/${mode}`) : setStep(step + 1));
  return (
    <div className={`onb-screen ${track}`}>
      <BrandHeader back={goBack} />
      <div className="onb-body">
        {slide.art}
        <div className="onb-copy">
          <h1>{slide.title}</h1>
          <p>{slide.body}</p>
        </div>
        <div className="onb-dots">
          {slides.map((item, index) => (
            <span key={item.id} className={index === step ? "active" : ""} />
          ))}
        </div>
      </div>
      <div className="onb-footer">
        <button className="primary-button" onClick={goNext}>
          {slide.cta}
        </button>
      </div>
    </div>
  );
}

function SocialButtons({ variant, onPick }: { variant: "solid" | "outline"; onPick: () => void }) {
  return (
    <div className="social-stack">
      <button type="button" className={`social-button ${variant}`} onClick={onPick}>
        <AssetIcon name="icon-google.svg" size={16} />
        Continuar con Google
      </button>
      <button type="button" className={`social-button ${variant}`} onClick={onPick}>
        <AssetIcon name="icon-apple.svg" size={16} />
        Continuar con Apple
      </button>
    </div>
  );
}

function Welcome({ mode }: { mode: AccountMode }) {
  const navigate = useNavigate();
  const enter = () => navigate(mode === "donor" ? "/adoption" : "/rescuer");
  return (
    <div className="welcome-screen">
      <div className="welcome-hero">
        <img className="header-logo" src={`${A}dopmi-wordmark.png`} alt="DopMi" width={144} height={48} />
        <div className="welcome-copy">
          <h1>¡Guau guau!</h1>
          <p>
            Gracias por hacer la diferencia.
            <br />
            Una última cosa:
          </p>
        </div>
        <img className="welcome-image" src={`${A}welcome-pets.png`} alt="" />
      </div>
      <div className="welcome-actions">
        <SocialButtons variant="solid" onPick={enter} />
        <div className="or-divider"><span>O continúa con</span></div>
        <button className="secondary-button" onClick={() => navigate(`/login/${mode}`)}>Iniciar sesión</button>
        <button className="secondary-button" onClick={() => navigate(`/signup/${mode}`)}>Crear cuenta</button>
      </div>
    </div>
  );
}

function Login({ mode, signup = false }: { mode: AccountMode; signup?: boolean }) {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const enter = () => navigate(mode === "donor" ? "/adoption" : "/rescuer");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    enter();
  };
  return (
    <div className="plain-screen auth-flow">
      <BrandHeader back={`/welcome/${mode}`} />
      <form className="form-stack auth-form" onSubmit={submit}>
        <div className="auth-form-head">
          <h1>{signup ? "Crear cuenta" : "Iniciar sesión"}</h1>
          <p>{signup ? "Únete a la comunidad de DopMi" : "Bienvenido de vuelta"}</p>
        </div>
        {signup && <label>Nombre completo *<input required placeholder="Tu nombre" /></label>}
        <label>Correo electrónico{signup ? " *" : ""}<input required type="email" placeholder="tu@email.com" /></label>
        {signup && <label>Teléfono (opcional)<input inputMode="tel" placeholder="+52 123 456 7890" /></label>}
        <label>
          Contraseña{signup ? " *" : ""}
          <input required type="password" placeholder={signup ? "Mínimo 6 caracteres" : "Tu contraseña"} />
        </label>
        {signup && <label>Confirmar contraseña *<input required type="password" placeholder="Confirma tu contraseña" /></label>}
        {signup ? (
          <label className="check-row">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>
              Acepto los{" "}
              <button type="button" className="inline-link" onClick={() => navigate("/terms")}>
                términos y condiciones
              </button>
            </span>
          </label>
        ) : (
          <button type="button" className="inline-link" onClick={() => navigate("/forgot-password")}>
            Olvidé mi contraseña
          </button>
        )}
        <button className="primary-button" disabled={signup && !accepted}>{signup ? "Crear cuenta" : "Iniciar sesión"}</button>
        <div className="or-divider"><span>O continúa con</span></div>
        <SocialButtons variant="outline" onPick={enter} />
        <p className="auth-switch">
          {signup ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
          <button type="button" className="inline-link" onClick={() => navigate(signup ? `/login/${mode}` : `/signup/${mode}`)}>
            {signup ? "Inicia sesión" : "Crear cuenta"}
          </button>
        </p>
      </form>
    </div>
  );
}

function StaticSimulated({ title, children, back }: { title: string; children: ReactNode; back: string }) {
  return (
    <div className="plain-screen">
      <TopBar title={title} back={back} />
      <SimulatedBanner />
      <div className="content-pad">{children}</div>
    </div>
  );
}

function AdoptionHome() {
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet, notifications } = usePrototypeStore();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<"Todos" | "Perro" | "Gato">("Todos");
  const pets = adoptionPets.filter((pet) => filter === "Todos" || pet.type === filter);
  return (
    <ScreenShell className="adoption-shell">
      <div className="adoption-feed">
        {!pets.length ? (
          <section className="adoption-empty">
            <h1>Adopción</h1>
            <article className="empty-card">
              <span className="empty-chip yellow">
                <Icon name="icon-heart.svg" size={28} />
              </span>
              <h2>No hay mascotas disponibles</h2>
              <p>Actualmente no se han publicado mascotas disponibles para adopción.</p>
              <button className="secondary-button" onClick={() => setFilter("Todos")}>Quitar filtros</button>
            </article>
          </section>
        ) : null}
        {pets.map((pet) => (
          <section className="adoption-slide" key={pet.id}>
            <img className="adoption-image" src={pet.image} alt={pet.name} />
            <div className="adoption-shade" />
            <div className="floating-actions">
              <button onClick={() => setFilterOpen(true)} aria-label="Filtros"><AssetIcon name="filter.svg" /></button>
              <button onClick={() => navigate("/messages/luna")} aria-label="Mensajes">
                <AssetIcon name="messages.svg" />
                {notifications.filter((item) => !item.read).length > 0 && <span className="notification-dot">{notifications.filter((item) => !item.read).length}</span>}
              </button>
            </div>
            <div className="swipe-hint"><AssetIcon name="swipe.svg" size={16} /><span>Desliza</span></div>
            <div className="adoption-info">
              <h1>{pet.name}</h1>
              <span>{pet.sex}</span>
              <p>{pet.story}</p>
              <div className="meta-row"><AssetIcon name="location.svg" size={14} /> {pet.distance} · {pet.rescuer}</div>
            </div>
            <div className="adoption-cta">
              <button
                className={`round-action ${savedPetIds.includes(pet.id) ? "selected" : ""}`}
                onClick={() => toggleSavedPet(pet.id)}
                aria-label={savedPetIds.includes(pet.id) ? "Quitar de guardados" : "Guardar"}
              >
                <AssetIcon name="bookmark.svg" />
              </button>
              <button className="primary-button" onClick={() => navigate(`/adoption/${pet.id}`)}>Conocer más de {pet.name}</button>
            </div>
          </section>
        ))}
      </div>
      {filterOpen && (
        <div className="modal-backdrop" onClick={() => setFilterOpen(false)}>
          <div className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <h2>Filtrar mascotas</h2>
            <div className="segmented-control">
              {(["Todos", "Perro", "Gato"] as const).map((option) => (
                <button key={option} className={filter === option ? "active" : ""} onClick={() => setFilter(option)}>{option}</button>
              ))}
            </div>
            <button className="primary-button" onClick={() => setFilterOpen(false)}>Ver resultados</button>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

function AdoptionDetail() {
  const { petId = "rocky" } = useParams();
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet } = usePrototypeStore();
  const pet = adoptionPets.find((item) => item.id === petId) ?? adoptionPets[0];
  const isSaved = savedPetIds.includes(pet.id);
  return (
    <div className="plain-screen">
      <div className="detail-hero">
        <img src={pet.image} alt={pet.name} />
        <button className="hero-back" onClick={() => navigate("/adoption")}><AssetIcon name="back-light.svg" /></button>
        <button className={`hero-save ${isSaved ? "selected" : ""}`} onClick={() => toggleSavedPet(pet.id)}><AssetIcon name="bookmark.svg" /></button>
      </div>
      <div className="detail-content">
        <div className="title-row"><div><h1>{pet.name}</h1><p>{pet.sex} · {pet.type}</p></div><span className="distance-pill">{pet.distance}</span></div>
        <p>{pet.story}</p>
        <div className="info-card"><strong>{pet.rescuer}</strong><span>Rescatista verificado · Monterrey, MX</span></div>
        <h2>Salud</h2>
        <div className="status-grid">
          <span className="positive">Vacunado</span><span className="positive">Desparasitado</span><span>Cuidados al día</span>
        </div>
        <h2>Convive con</h2>
        <div className="status-grid">
          <span className="positive">Perros</span><span className="positive">Niños</span><span>Gatos: por conocer</span>
        </div>
        <button className="primary-button sticky-action" onClick={() => navigate("/messages/luna")}>Contactar al rescatista</button>
      </div>
    </div>
  );
}

function DonationHome() {
  const navigate = useNavigate();
  const { cases, savedPetIds, toggleSavedPet, notifications } = usePrototypeStore();
  const unread = notifications.filter((item) => !item.read).length;
  return (
    <ScreenShell>
      <div className="content-pad donation-list">
        <div className="section-heading">
          <div><h1>Apoya a la manada DopMi</h1><p>Elige a quien más conecte contigo. Cada peso ayuda a mantenerlos sanos y fuertes.</p></div>
          <BellButton count={unread} onClick={() => navigate("/notifications")} />
        </div>
        {cases
          .filter((item) => item.caseStatus === "active" && item.needs.some((need) => need.status === "active"))
          .map((item) => {
            const need = item.needs.find((entry) => entry.status === "active")!;
            return (
          <article className="case-card" key={item.id}>
            <div className="case-image">
              <img src={item.image} alt={item.name} />
              {item.needs.some((entry) => entry.urgent && entry.status === "active") && <span className="urgent-badge">Urgente</span>}
              <button className={savedPetIds.includes(item.id) ? "selected" : ""} onClick={() => toggleSavedPet(item.id)}><AssetIcon name="bookmark.svg" /></button>
              <div className="case-title"><strong>{item.name}, {item.age}</strong><span>{item.distance}</span></div>
            </div>
              <div className="need-summary" key={need.id}>
                <div><strong>{need.title}</strong><b>${need.funded} / ${need.requested}</b></div>
                <div className="progress"><i style={{ width: `${(need.funded / need.requested) * 100}%` }} /></div>
                <div className="card-actions">
                  <button className="primary-button" onClick={() => navigate(`/donate/${item.id}/${need.id}`)}>Donar</button>
                  <button className="secondary-button" onClick={() => navigate(`/case/${item.id}`)}>Ver caso</button>
                </div>
              </div>
          </article>
            );
          })}
      </div>
    </ScreenShell>
  );
}

function NeedCard({ need, caseId }: { need: Need; caseId: string }) {
  const navigate = useNavigate();
  const remaining = Math.max(0, need.requested - need.funded);
  return (
    <article className="need-card">
      <div className="need-card-title">
        <span className={`need-symbol ${need.type.toLowerCase()}`}>
          <Icon name={need.type === "Comida" ? "tab-donate.svg" : need.type === "Medicina" ? "notif-donation.svg" : "icon-shield.svg"} size={22} />
        </span>
        <div><strong>{need.title}</strong><small>{need.type}</small></div>
        <b>${need.requested}</b>
      </div>
      <div className="split-meta"><span>${need.requested} total</span><strong>${remaining} por recaudar</strong></div>
      <div className="progress"><i style={{ width: `${(need.funded / need.requested) * 100}%` }} /></div>
      <button className="primary-button" disabled={remaining === 0} onClick={() => navigate(`/donate/${caseId}/${need.id}`)}>
        {remaining === 0 ? "Necesidad fondeada" : "Donar"}
      </button>
    </article>
  );
}

function CaseDetail() {
  const { caseId = "luna" } = useParams();
  const navigate = useNavigate();
  const { cases, savedPetIds, savedRescuerIds, toggleSavedPet, toggleSavedRescuer } = usePrototypeStore();
  const item = cases.find((entry) => entry.id === caseId) ?? cases[0];
  const total = item.needs.reduce((sum, need) => sum + need.requested, 0);
  const funded = item.needs.reduce((sum, need) => sum + need.funded, 0);
  const [report, setReport] = useState(false);
  const [toast, setToast] = useState("");
  return (
    <div className="plain-screen detail-screen">
      <div className="detail-hero compact">
        <img src={item.id === "luna" ? `${A}luna-detail.png` : item.image} alt={item.name} />
        <button className="hero-back" onClick={() => navigate("/donate")}><AssetIcon name="back-light.svg" /></button>
        <button className={`hero-save ${savedPetIds.includes(item.id) ? "selected" : ""}`} onClick={() => toggleSavedPet(item.id)}><AssetIcon name="bookmark.svg" /></button>
      </div>
      <div className="detail-content">
        <div className="title-row"><div><h1>{item.name}, {item.age}</h1><p>{item.story}</p></div><span className="distance-pill">{item.distance}</span></div>
        <button className="rescuer-card" onClick={() => navigate(`/rescuer-profile/${item.id}`)}>
          <span className="avatar">{item.rescuer.charAt(0)}</span><span><strong>{item.rescuer}</strong><small>{item.location} · Confianza 96%</small></span>
        </button>
        <article className="funding-card">
          <h3>Progreso total de la misión</h3>
          <div className="split-meta"><span>Financiamiento</span><strong>{Math.round((funded / total) * 100)}%</strong></div>
          <div className="progress"><i style={{ width: `${(funded / total) * 100}%` }} /></div>
        </article>
        <h2>Necesidades activas</h2>
        <div className="needs-stack">{item.needs.map((need) => <NeedCard key={need.id} need={need} caseId={item.id} />)}</div>
        <button className="text-action" onClick={() => setToast("Enlace del caso copiado")}>Compartir caso</button>
        <button className="text-action danger" onClick={() => setReport(true)}>Reportar</button>
        <button className="secondary-button" onClick={() => toggleSavedRescuer(item.rescuer)}>
          {savedRescuerIds.includes(item.rescuer) ? "Quitar rescatista de guardados" : "Guardar rescatista"}
        </button>
      </div>
      {report ? (
        <ReportDialog
          title="Reportar caso"
          onClose={(sent) => {
            setReport(false);
            if (sent) setToast("Reporte enviado, lo revisaremos pronto");
          }}
        />
      ) : null}
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}

function DonationFlow() {
  const { caseId = "luna", needId = "luna-vet" } = useParams();
  const navigate = useNavigate();
  const { cases, paymentOutcome, donate } = usePrototypeStore();
  const item = cases.find((entry) => entry.id === caseId) ?? cases[0];
  const need = item.needs.find((entry) => entry.id === needId) ?? item.needs[0];
  const [step, setStep] = useState<"amount" | "review">("amount");
  const [amount, setAmount] = useState(150);
  const remaining = Math.max(1, need.requested - need.funded);
  const confirm = () => {
    if (paymentOutcome === "error") {
      navigate(`/payment-error/${caseId}/${needId}?amount=${amount}`);
      return;
    }
    donate(caseId, needId, amount);
    navigate(`/donation-success/${caseId}?amount=${amount}`);
  };
  return (
    <div className="plain-screen">
      <TopBar title={step === "amount" ? "Elige tu aportación" : "Revisa tu donación"} back={() => (step === "review" ? setStep("amount") : navigate(`/case/${caseId}`))} />
      <div className="content-pad payment-flow">
        <div className="mini-case">
          <img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{need.title}</span></div>
        </div>
        {step === "amount" ? (
          <>
            <h2>¿Cuánto quieres donar?</h2>
            <div className="amount-grid">
              {[50, 150, 300, remaining].map((value) => <button key={value} className={amount === value ? "selected" : ""} onClick={() => setAmount(value)}>${value}</button>)}
            </div>
            <label>Monto personalizado<input type="number" min="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
            <p className="supporting-copy">Esta es una operación simulada. No se realizará ningún cargo real.</p>
            <button className="primary-button" onClick={() => setStep("review")}>Continuar</button>
          </>
        ) : (
          <>
            <h2>Resumen</h2>
            <article className="summary-card">
              <div><span>Caso</span><strong>{item.name}</strong></div>
              <div><span>Necesidad</span><strong>{need.title}</strong></div>
              <div><span>Monto</span><strong>${amount} MXN</strong></div>
              <div><span>Método</span><strong>Visa •••• 4242</strong></div>
            </article>
            <button className="primary-button" onClick={confirm}>Confirmar donación</button>
            <button className="secondary-button" onClick={() => setStep("amount")}>Cambiar monto</button>
          </>
        )}
      </div>
    </div>
  );
}

function DonationSuccess() {
  const { caseId = "luna" } = useParams();
  const navigate = useNavigate();
  const amount = new URLSearchParams(useLocation().search).get("amount") ?? "150";
  return (
    <div className="plain-screen success-screen">
      <div className="success-icon"><AssetIcon name="check.svg" size={32} /></div>
      <h1>¡Eres mi héroe, choca esas huellitas!</h1>
      <p>Gracias por apoyar. Tu donación de ${amount} MXN ya fue asignada y el progreso del caso se actualizó.</p>
      <button className="primary-button" onClick={() => navigate(`/case/${caseId}`)}>Ver caso actualizado</button>
      <button className="secondary-button" onClick={() => navigate("/history")}>Ir al historial</button>
    </div>
  );
}

function PaymentError() {
  const { caseId = "luna", needId = "luna-vet" } = useParams();
  const navigate = useNavigate();
  const amount = new URLSearchParams(useLocation().search).get("amount") ?? "150";
  return (
    <div className="plain-screen">
      <TopBar title="Pago no completado" back={`/case/${caseId}`} />
      <div className="payment-error">
        <div className="error-icon"><AssetIcon name="payment-card-error.svg" size={48} /></div>
        <h1>No pudimos procesar tu pago</h1>
        <p>Tu donación no fue realizada. Puedes intentarlo nuevamente o usar otro método de pago.</p>
        <article className="summary-card">
          <span className="eyebrow">Resumen de la donación</span>
          <div><span>Caso</span><strong>Luna</strong></div>
          <div><span>Monto</span><strong>${amount} MXN</strong></div>
          <div><span>Método de pago</span><strong>Visa •••• 4242</strong></div>
          <div><span>Estado</span><strong className="failed-pill">Fallido</strong></div>
        </article>
        <button className="primary-button" onClick={() => navigate(`/donate/${caseId}/${needId}`)}>Intentar de nuevo</button>
        <button className="secondary-button" onClick={() => navigate(`/donate/${caseId}/${needId}`)}>Cambiar método de pago</button>
        <button className="text-action" onClick={() => navigate(`/case/${caseId}`)}>Volver al caso</button>
      </div>
    </div>
  );
}

const guardianBenefits = ["Reporte personalizado", "Cancela cuando quieras", "Monto ajustable"];

function nextChargeDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  const month = new Intl.DateTimeFormat("es-MX", { month: "long" }).format(date);
  return `${date.getDate()} de ${month}, ${date.getFullYear()}`;
}

function GuardianCommunity() {
  return (
    <div className="guardian-community">
      <span className="avatar-stack" aria-hidden="true">
        <i style={{ background: "#ffe08a" }}>A</i>
        <i style={{ background: "#ffb7a1" }}>B</i>
        <i style={{ background: "#a9d7ff" }}>C</i>
      </span>
      <p><strong>248 personas</strong> ya forman parte de la comunidad</p>
    </div>
  );
}

type GuardianSlideProps = {
  photo?: string;
  light?: boolean;
  stage: string;
  tag: string;
  lead: string;
  highlight: string;
  copy: string;
  children: ReactNode;
};

function GuardianSlide({ photo, light, stage, tag, lead, highlight, copy, children }: GuardianSlideProps) {
  return (
    <article className={`guardian-slide${light ? " light" : ""}`}>
      {photo && <img className="gs-photo" src={`${A}${photo}`} alt="" />}
      <div className="gs-inner">
        <div className={`gs-stage ${stage}`}>{children}</div>
        <div className="gs-copy">
          <span className="gs-tag"><Icon name="icon-verified.svg" size={13} />{tag}</span>
          <h3>{lead} <em>{highlight}</em></h3>
          <p>{copy}</p>
        </div>
      </div>
    </article>
  );
}

const guardianReports = [
  { title: "Luna recibió su consulta", time: "Hace 2 días", tag: "Completado", tone: "done", image: "guardian-report-luna.jpg" },
  { title: "Milo completó su tratamiento", time: "Hace 5 días", tag: "Completado", tone: "done", image: "guardian-report-milo.jpg" },
  { title: "Rocky sigue en recuperación", time: "Hace 1 día", tag: "Nuevo avance", tone: "new", image: "guardian-report-rocky.jpg" },
];

const guardianTiers = [
  { value: "$50", label: "al mes" },
  { value: "$100", label: "al mes" },
  { value: "$200", label: "al mes" },
  { value: "+245", label: "personas más" },
];

function GuardianCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="guardian-carousel">
      <div className="carousel-track" ref={trackRef} onScroll={onScroll}>
        <GuardianSlide
          photo="guardian-urgent.jpg"
          stage="stage-case"
          tag="Rescatista verificada"
          lead="Tu ayuda llega a"
          highlight="casos urgentes"
          copy="Cada aporte mensual ayuda a cubrir necesidades reales de perros que necesitan apoyo inmediato."
        >
          <div className="gs-badges">
            <span className="gs-chip danger"><Icon name="notif-case.svg" size={11} />Urgente</span>
            <span className="gs-chip light"><Icon name="icon-shield.svg" size={11} />Medicina</span>
          </div>
          <div className="gs-duo">
            <div className="gs-stat">
              <b>$840 <span>de $1,600 MXN</span></b>
              <div className="gs-bar"><i style={{ width: "52%" }} /></div>
              <small>52% del objetivo · 5 días</small>
            </div>
            <div className="gs-mini">
              <img src={`${A}guardian-milo.jpg`} alt="" />
              <strong>Milo</strong>
              <small>Spray para herida</small>
              <span className="gs-flag"><i />Caso activo</span>
            </div>
          </div>
        </GuardianSlide>

        <GuardianSlide
          light
          stage="stage-fund"
          tag="Fondo siempre disponible"
          lead="Un fondo para"
          highlight="ayudar más rápido"
          copy="Las suscripciones forman un fondo comunitario que permite responder cuando un caso no puede esperar."
        >
          <div className="gs-badges">
            <span className="gs-chip yellow"><Icon name="icon-bolt.svg" size={11} />Respuesta rápida</span>
          </div>
          <div className="gs-diagram">
            <div className="gs-tiers">
              {guardianTiers.map((tier) => (
                <span key={tier.value}><i />{tier.value}<small>{tier.label}</small></span>
              ))}
            </div>
            <div className="gs-fund">
              <span className="gs-shield"><Icon name="icon-shield.svg" size={16} /></span>
              <strong>Fondo Guardián</strong>
              <small>Disponible este mes</small>
              <b>$24,500</b>
              <div className="gs-bar"><i style={{ width: "82%" }} /></div>
              <small>82% del objetivo</small>
              <span className="gs-subs"><Icon name="icon-user.svg" size={9} />248 suscriptores</span>
            </div>
            <div className="gs-aside">
              <p className="gs-note"><Icon name="icon-clock.svg" size={12} />El fondo está siempre listo para actuar</p>
              <div className="gs-case">
                <span className="gs-chip danger tiny">Caso urgente</span>
                <img src={`${A}guardian-luna.jpg`} alt="" />
                <strong>Luna</strong>
                <small>Apoyo liberado</small>
                <b>$2,000 MXN</b>
              </div>
            </div>
          </div>
          <p className="gs-footnote">El apoyo llega en horas, no días.</p>
        </GuardianSlide>

        <GuardianSlide
          photo="guardian-reports.jpg"
          stage="stage-reports"
          tag="Evidencias verificadas"
          lead="Ves el impacto"
          highlight="de tu aporte"
          copy="Recibe reportes claros sobre los casos apoyados con el fondo Guardián."
        >
          <div className="gs-reports">
            <div className="gs-card-head">
              <span className="gs-card-icon"><Icon name="tab-impact.svg" size={13} /></span>
              <div><strong>Reportes de impacto</strong><small>Fondo Guardián</small></div>
            </div>
            {guardianReports.map((report) => (
              <div className="gs-row" key={report.title}>
                <img src={`${A}${report.image}`} alt="" />
                <div className="gs-row-text">
                  <strong>{report.title}</strong>
                  <span><small>{report.time}</small><em className={report.tone}>{report.tag}</em></span>
                </div>
              </div>
            ))}
          </div>
        </GuardianSlide>
      </div>
      <div className="carousel-dots">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            className={active === index ? "active" : ""}
            aria-label={`Ir al slide ${index + 1}`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  );
}

function Impact() {
  const navigate = useNavigate();
  const { guardianActive } = usePrototypeStore();
  if (guardianActive) {
    const stories = [
      { name: "Luna", image: "impact-luna.png", type: "Suscripción mensual", amount: 200, author: "Ana García", time: "Hace 2 días", copy: "Luna recibió su comida mensual gracias a tu suscripción. ¡Ya está mucho más fuerte!" },
      { name: "Milo", image: "impact-milo.png", type: "Donación directa", amount: 500, author: "Carlos Ruiz", time: "Hace 5 días", copy: "Milo completó su tratamiento de vacunas. Tu donación directa ayudó a proteger su salud." },
      { name: "Max", image: "impact-max.png", type: "Suscripción mensual", amount: 150, author: "María López", time: "Hace 1 semana", copy: "Max recibió atención veterinaria de emergencia. Tu contribución mensual hizo la diferencia." },
      { name: "Bella", image: "impact-bella.png", type: "Suscripción mensual", amount: 100, author: "Ana García", time: "Hace 2 semanas", copy: "Bella está lista para adopción gracias a las donaciones de la comunidad. ¡Tu ayuda fue clave!" },
    ];
    return (
      <ScreenShell>
        <div className="content-pad impact-page">
          <div className="impact-heading"><h1>Vidas que continúan gracias a ti.</h1><p>Todas estas huellitas recibieron tu impacto, Guardián! Gracias por confiar en nosotros.</p></div>
          {stories.map((item) => (
            <article className="impact-card" key={item.name}>
              <img src={`${A}${item.image}`} alt={item.name} />
              <div>
                <div className="title-row"><strong>{item.name}</strong><span>{item.type}</span></div>
                <p>{item.copy}</p>
                <div className="impact-meta"><small>Por {item.author}</small><small>{item.time}</small></div>
                <div className="impact-foot">
                  <span className="impact-amount">${item.amount} MXN</span>
                  <button className="secondary-button compact"><Icon name="icon-share.svg" size={14} />Compartir</button>
                </div>
              </div>
            </article>
          ))}
          <button className="secondary-button" onClick={() => navigate("/settings/billing")}>Administrar suscripción</button>
        </div>
      </ScreenShell>
    );
  }
  return (
    <ScreenShell>
      <div className="guardian-conversion">
        <div className="guardian-intro-head">
          <h1>Conviértete en Guardián</h1>
          <p>Desde $50 MXN al mes, tu aportación entra a nuestro fondo comunitario que responde en casos que no pueden esperar.</p>
        </div>
        <GuardianCarousel />
        <GuardianCommunity />
        <ul className="benefit-row">
          {guardianBenefits.map((benefit) => (
            <li key={benefit}><Icon name="check-circle.svg" size={16} />{benefit}</li>
          ))}
        </ul>
        <button className="primary-button" onClick={() => navigate("/impact/support")}>Unirme como Guardián</button>
      </div>
    </ScreenShell>
  );
}

function ImpactSupport() {
  const navigate = useNavigate();
  const { paymentOutcome, setGuardian } = usePrototypeStore();
  const presets = [50, 200, 500];
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState(false);
  const [method, setMethod] = useState<"card" | "apple" | "google">("card");
  const total = `$${amount.toFixed(2)} MXN`;
  const confirm = () => {
    if (paymentOutcome === "error") {
      navigate(`/impact/error?amount=${amount}`);
      return;
    }
    setGuardian(true, amount);
    navigate(`/impact/success?amount=${amount}&method=${method}`);
  };
  return (
    <div className="plain-screen">
      <TopBar back="/impact" />
      <div className="content-pad support-flow">
        <div className="support-intro">
          <h1>Elige tu apoyo</h1>
          <p>Selecciona cuánto quieres aportar cada mes.</p>
        </div>
        <div className="amount-grid three">
          {presets.map((value) => (
            <button
              key={value}
              className={!custom && amount === value ? "selected" : ""}
              onClick={() => { setAmount(value); setCustom(false); }}
            >
              <strong>${value}</strong>
              <small>MXN / mes</small>
            </button>
          ))}
        </div>
        {custom ? (
          <>
            <label className="amount-input">
              <span>$</span>
              <input type="number" min="20" autoFocus value={amount} onChange={(event) => setAmount(Number(event.target.value) || 0)} />
              <span>MXN</span>
            </label>
            <button className="inline-link center" onClick={() => { setCustom(false); setAmount(50); }}>Volver a cantidades sugeridas</button>
          </>
        ) : (
          <button className="inline-link center" onClick={() => setCustom(true)}>Otra cantidad</button>
        )}

        <article className="summary-card">
          <h2>Resumen</h2>
          <div><span>Apoyo mensual</span><strong>{total}</strong></div>
          <div><span>Frecuencia</span><strong>Mensual</strong></div>
          <div className="summary-total"><span>Total de hoy</span><strong>{total}</strong></div>
        </article>

        <h2 className="support-section">Selecciona método de pago</h2>
        <div className="wallet-grid">
          <button className={`wallet-button ${method === "apple" ? "selected" : ""}`} onClick={() => setMethod("apple")}>
            <AssetIcon name="icon-apple.svg" size={18} />Apple Pay
          </button>
          <button className={`wallet-button ${method === "google" ? "selected" : ""}`} onClick={() => setMethod("google")}>
            <AssetIcon name="icon-google.svg" size={18} />Google Pay
          </button>
        </div>
        <button className={`pay-card ${method === "card" ? "selected" : ""}`} onClick={() => setMethod("card")}>
          <span className="row-tile gray"><Icon name="icon-card.svg" size={18} /></span>
          <span className="nav-row-text"><strong>Visa •••• 4242</strong><small>Predeterminada</small></span>
          {method === "card" ? <span className="pay-check"><Icon name="check.svg" size={14} /></span> : null}
        </button>
        <button className="dashed-button" onClick={() => navigate("/settings/payment-methods")}>
          <Icon name="icon-card.svg" size={16} />Agregar nueva tarjeta
        </button>

        <p className="support-note">Al confirmar, autorizas a DopMi a realizar un cargo mensual. Puedes ajustar o cancelar tu apoyo en cualquier momento desde Ajustes.</p>
        <button className="primary-button" onClick={confirm}>Confirmar apoyo · {total}</button>
      </div>
    </div>
  );
}

function ImpactSuccess() {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const amount = Number(params.get("amount") ?? "200");
  const method = params.get("method") ?? "card";
  const [toast, setToast] = useState(method === "apple" ? "Procesando con Apple Pay…" : method === "google" ? "Procesando con Google Pay…" : "");
  return (
    <div className="plain-screen guardian-success">
      <div className="guardian-success-body">
        <div className="success-icon big"><AssetIcon name="check.svg" size={36} /></div>
        <h1>¡Ya eres Guardián!</h1>
        <p>Gracias por formar parte de DopMi, la manada ya sabe que estás aquí. Desde hoy, tu aportación mensual nos ayuda a que más mascotas tengan una vida digna.</p>
        <article className="membership-card">
          <small>Membresía activa</small>
          <strong>Guardián</strong>
          <b>${amount.toFixed(2)} <small>MXN / mes</small></b>
          <span>Próximo cargo: {nextChargeDate()}</span>
        </article>
        <button className="primary-button" onClick={() => navigate("/impact")}>Ver mi impacto</button>
      </div>
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}

function ImpactError() {
  const navigate = useNavigate();
  const amount = new URLSearchParams(useLocation().search).get("amount") ?? "200";
  return (
    <div className="plain-screen">
      <TopBar title="Pago no completado" back="/impact" />
      <div className="payment-error">
        <div className="error-icon"><AssetIcon name="payment-card-error.svg" size={48} /></div>
        <h1>No pudimos procesar tu pago</h1>
        <p>Tu suscripción no fue activada. Puedes intentarlo nuevamente o usar otro método de pago.</p>
        <article className="summary-card">
          <span className="eyebrow">Resumen de la suscripción</span>
          <div><span>Membresía</span><strong>Guardián</strong></div>
          <div><span>Monto mensual</span><strong>${amount} MXN</strong></div>
          <div><span>Método de pago</span><strong>Visa •••• 4242</strong></div>
          <div><span>Estado</span><strong className="failed-pill">Fallido</strong></div>
        </article>
        <button className="primary-button" onClick={() => navigate(`/impact/support`)}>Intentar de nuevo</button>
        <button className="secondary-button" onClick={() => navigate(`/impact/support`)}>Cambiar método de pago</button>
        <button className="text-action" onClick={() => navigate("/impact")}>Volver a Tu Impacto</button>
      </div>
    </div>
  );
}

function Messages() {
  const navigate = useNavigate();
  const { messages, sendMessage, accountMode } = usePrototypeStore();
  const [text, setText] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    sendMessage(accountMode, text.trim());
    setText("");
  };
  return (
    <div className="plain-screen chat-screen">
      <TopBar title="Ana P." back={accountMode === "donor" ? "/adoption" : "/rescuer/messages"} actions={<span className="online-label">En línea</span>} />
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`bubble ${message.author === accountMode ? "mine" : ""}`}>
            <p>{message.text}</p><span>{message.time}</span>
          </div>
        ))}
      </div>
      <form className="chat-compose" onSubmit={submit}>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Escribe un mensaje..." />
        <button disabled={!text.trim()} aria-label="Enviar"><AssetIcon name="send.svg" /></button>
      </form>
      <BottomNav mode={accountMode} />
    </div>
  );
}

const notificationIcons: Record<NotificationKind, string> = {
  message: "notif-message.svg",
  donation: "notif-donation.svg",
  case: "notif-case.svg",
  pet: "notif-pet.svg",
};

function NotificationList() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead } = usePrototypeStore();
  return (
    <div className="plain-screen">
      <TopBar title="Notificaciones" back="/profile" />
      <div className="content-pad notification-stack">
        {notifications.map((item) => (
          <button
            key={item.id}
            className={`notification-card ${item.read ? "" : "unread"}`}
            onClick={() => {
              markNotificationRead(item.id);
              navigate(item.target);
            }}
          >
            <span className={`notif-chip ${item.kind ?? "case"}`}>
              <AssetIcon name={notificationIcons[item.kind] ?? notificationIcons.case} size={20} />
            </span>
            <span className="notif-body">
              <span className="notif-head">
                <strong>{item.title}</strong>
                <time>{item.time}</time>
              </span>
              <p>{item.body}</p>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function History() {
  const rows = useDonationLogRows();
  return (
    <div className="plain-screen">
      <TopBar title="Historial de donaciones" back="/profile" />
      <div className="content-pad log-section">
        <p>Cada aportación registrada con su caso, concepto y estado.</p>
        <DonationLogTable rows={rows} />
      </div>
    </div>
  );
}

function DonationLogTable({ rows }: { rows: { id: string; date: string; caseId: string; caseName: string; concept: string; amount: string; status: "completada" | "activa" }[] }) {
  const navigate = useNavigate();
  return (
    <div className="log-table">
      <div className="log-head">
        <span>Fecha</span>
        <span>Caso</span>
        <span>Monto</span>
      </div>
      {rows.map((row) => (
        <button className="log-row" key={row.id} onClick={() => navigate(`/case/${row.caseId}`)}>
          <span className="log-date">{row.date}</span>
          <span className="log-case">
            <strong>{row.caseName}</strong>
            <small>{row.concept}</small>
          </span>
          <span className="log-amount">
            <b>{row.amount}</b>
            <i className={`log-pill ${row.status}`}>{row.status}</i>
          </span>
        </button>
      ))}
    </div>
  );
}

function useDonationLogRows(limit?: number) {
  const { donations, cases } = usePrototypeStore();
  const live = donations.map((donation) => {
    const item = cases.find((entry) => entry.id === donation.caseId) ?? cases[0];
    const need = item.needs.find((entry) => entry.id === donation.needId);
    return {
      id: donation.id,
      date: donation.date,
      caseId: item.id,
      caseName: item.name,
      concept: need?.title ?? "Aportación",
      amount: `$${donation.amount}`,
      status: "completada" as const,
    };
  });
  const rows = [...live, ...donationLog];
  return limit ? rows.slice(0, limit) : rows;
}

function DonorProfile() {
  const navigate = useNavigate();
  const { savedPetIds, savedRescuerIds, notifications, setAccountMode, guardianActive } = usePrototypeStore();
  const unread = notifications.filter((item) => !item.read).length;
  const rows = useDonationLogRows(5);
  const switchToRescuer = () => {
    setAccountMode("rescuer");
    navigate("/rescuer");
  };
  return (
    <ScreenShell>
      <div className="content-pad profile-page">
        <header className="page-head">
          <h1>Perfil</h1>
          <BellButton count={unread} onClick={() => navigate("/notifications")} />
        </header>

        <article className="member-card">
          <span className="member-avatar">A</span>
          <div>
            <strong>Alberto Quiroga</strong>
            <span>{guardianActive ? "Community Member" : "Starter"}</span>
          </div>
        </article>

        <section className="log-section">
          <h2>Registro de donaciones</h2>
          <DonationLogTable rows={rows} />
          <button className="ghost-button" onClick={() => navigate("/history")}>Ver más</button>
        </section>

        <section className="list-stack">
          <button className="nav-row" onClick={() => navigate("/saved")}>
            <span className="nav-row-main">
              <Icon name="icon-bookmark.svg" size={20} />
              <strong>Mascotas guardadas</strong>
            </span>
            <span className="nav-row-end">
              <small>{savedPetIds.length}</small>
              <Chevron />
            </span>
          </button>
          <button className="nav-row" onClick={() => navigate("/saved-rescuers")}>
            <span className="nav-row-main">
              <Icon name="icon-bookmark.svg" size={20} />
              <strong>Rescatistas guardados</strong>
            </span>
            <span className="nav-row-end">
              <small>{savedRescuerIds.length}</small>
              <Chevron />
            </span>
          </button>
          <button className="nav-row" onClick={() => navigate("/settings")}>
            <span className="nav-row-main">
              <Icon name="icon-settings.svg" size={20} />
              <strong>Configuración</strong>
            </span>
            <span className="nav-row-end">
              <Chevron />
            </span>
          </button>
        </section>

        <article className="switch-card">
          <div>
            <strong>Cambiar a modo rescatista</strong>
            <small>Cambia tu experiencia en la app</small>
          </div>
          <button className="switch" role="switch" aria-checked="false" aria-label="Cambiar a modo rescatista" onClick={switchToRescuer}>
            <i />
          </button>
        </article>
      </div>
    </ScreenShell>
  );
}

function SavedPets() {
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet, cases } = usePrototypeStore();
  const [tab, setTab] = useState<"donation" | "adoption">("adoption");
  const items = tab === "adoption" ? adoptionPets.filter((item) => savedPetIds.includes(item.id)) : cases.filter((item) => savedPetIds.includes(item.id));
  return (
    <div className="plain-screen">
      <TopBar title="Mascotas guardadas" back="/profile" />
      <div className="content-pad">
        <div className="segmented-control"><button className={tab === "donation" ? "active" : ""} onClick={() => setTab("donation")}>Casos de donación</button><button className={tab === "adoption" ? "active" : ""} onClick={() => setTab("adoption")}>En adopción</button></div>
        {!items.length ? <div className="empty-state"><h2>Aún no guardas mascotas</h2><p>Usa el marcador en cards y detalles para encontrarlas aquí.</p><button className="primary-button" onClick={() => navigate(tab === "adoption" ? "/adoption" : "/donate")}>Explorar</button></div> : items.map((item) => <article className="saved-row" key={item.id}><img src={item.image} alt="" /><button onClick={() => navigate(tab === "adoption" ? `/adoption/${item.id}` : `/case/${item.id}`)}><strong>{item.name}</strong><span>Ver detalle</span></button><button className="icon-button" onClick={() => toggleSavedPet(item.id)}><AssetIcon name="bookmark.svg" /></button></article>)}
      </div>
    </div>
  );
}

function SettingsRow({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button className="nav-row" onClick={onClick}>
      <span className="nav-row-main">
        <span className="row-tile">
          <Icon name={icon} size={20} />
        </span>
        <span className="nav-row-text">
          <strong>{title}</strong>
          {subtitle ? <small>{subtitle}</small> : null}
        </span>
      </span>
      <Chevron />
    </button>
  );
}

function Settings() {
  const navigate = useNavigate();
  const { accountMode, setAccountMode } = usePrototypeStore();
  const switchMode = () => {
    const next = accountMode === "donor" ? "rescuer" : "donor";
    setAccountMode(next);
    navigate(next === "donor" ? "/adoption" : "/rescuer");
  };
  return (
    <div className="plain-screen">
      <TopBar title="Configuración" back={accountMode === "donor" ? "/profile" : "/rescuer/profile"} />
      <div className="content-pad settings-menu">
        <SettingsRow icon="icon-user.svg" title="Información básica" subtitle="Edita tu perfil y datos personales" onClick={() => navigate("/settings/basic-info")} />
        <SettingsRow icon="icon-card.svg" title="Métodos de pago" subtitle="Administra tus tarjetas y métodos de pago" onClick={() => navigate("/settings/payment-methods")} />
        <SettingsRow icon="icon-billing.svg" title="Suscripción y pagos" subtitle="Consulta tu suscripción, pagos y facturación" onClick={() => navigate("/settings/billing")} />
        <h2 className="settings-heading">Ayuda</h2>
        <SettingsRow icon="icon-help.svg" title="Centro de ayuda" onClick={() => navigate("/help")} />
        <h2 className="settings-heading">Cuenta</h2>
        <SettingsRow
          icon={accountMode === "donor" ? "icon-shield.svg" : "icon-user.svg"}
          title="Cambiar tipo de cuenta"
          subtitle={accountMode === "donor" ? "Ir a cuenta Rescatista" : "Ir a cuenta Donante"}
          onClick={switchMode}
        />
        <button className="nav-row danger-row" onClick={() => navigate("/")}>
          <span className="nav-row-main">
            <Icon name="icon-logout.svg" size={20} />
            <strong>Cerrar sesión</strong>
          </span>
          <Chevron />
        </button>
      </div>
      <BottomNav mode={accountMode} />
    </div>
  );
}

function BasicInfo() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="plain-screen">
      <TopBar title="Información básica" back="/settings" />
      <div className="content-pad form-stack">
        <div className="photo-card">
          <span className="avatar large">
            A
            <span className="avatar-camera">
              <AssetIcon name="onb-camera.svg" size={12} />
            </span>
          </span>
          <span className="nav-row-text">
            <strong>Foto de perfil</strong>
            <small>Cambia tu foto de perfil</small>
          </span>
        </div>
        <label>Nombre<input defaultValue="Alberto" /></label>
        <label>Correo electrónico<input defaultValue="alberto@email.com" /></label>
        <label>Teléfono<input defaultValue="+52 55 1234 5678" /></label>
        <label>Ciudad / estado<input defaultValue="Ciudad de México" /></label>
        <button className="primary-button" onClick={() => setSaved(true)}>Guardar cambios</button>
      </div>
      {saved ? <Toast text="Cambios guardados" onDone={() => setSaved(false)} /> : null}
    </div>
  );
}

function PaymentMethods() {
  const [cards, setCards] = useState(savedCards);
  const [toast, setToast] = useState("");
  const makeDefault = (id: string) => {
    setCards((current) => current.map((card) => ({ ...card, default: card.id === id })));
    setToast("Método predeterminado actualizado");
  };
  return (
    <div className="plain-screen">
      <TopBar title="Métodos de pago" back="/settings" />
      <div className="content-pad list-stack">
        <h2 className="settings-heading first">Tarjetas guardadas</h2>
        {cards.map((card) => (
          <article className="card-row" key={card.id}>
            <span className="row-tile gray">
              <Icon name="icon-card.svg" size={18} />
            </span>
            <span className="nav-row-text">
              <strong>{card.brand} •••• {card.digits}</strong>
              {card.default ? <small>Predeterminada</small> : null}
            </span>
            {card.default ? null : (
              <>
                <button className="inline-link small" onClick={() => makeDefault(card.id)}>Hacer predeterminada</button>
                <button className="icon-button danger" onClick={() => setCards((current) => current.filter((item) => item.id !== card.id))} aria-label="Eliminar tarjeta">
                  <Icon name="icon-trash.svg" size={18} />
                </button>
              </>
            )}
          </article>
        ))}
        <button className="dashed-button" onClick={() => setToast("Alta de tarjeta simulada")}>
          <Icon name="icon-plus.svg" size={18} />
          Agregar tarjeta
        </button>
        <h2 className="settings-heading">Billeteras digitales</h2>
        <div className="wallet-grid">
          <button className="wallet-button" onClick={() => setToast("Apple Pay vinculado (simulado)")}>
            <AssetIcon name="icon-apple.svg" size={18} />
            Apple Pay
          </button>
          <button className="wallet-button" onClick={() => setToast("Google Pay vinculado (simulado)")}>
            <AssetIcon name="icon-google.svg" size={18} />
            Google Pay
          </button>
        </div>
      </div>
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(timer);
  }, [onDone, text]);
  return (
    <div className="toast">
      <Icon name="check.svg" size={16} />
      {text}
    </div>
  );
}

function Billing() {
  const { guardianActive, guardianAmount, setGuardian } = usePrototypeStore();
  const [dialog, setDialog] = useState<"none" | "amount" | "cancel">("none");
  const [choice, setChoice] = useState(guardianAmount);
  const [toast, setToast] = useState("");
  const [justChanged, setJustChanged] = useState(false);
  const plan = subscriptionPlans.find((item) => item.amount === guardianAmount) ?? subscriptionPlans[1];
  return (
    <div className="plain-screen">
      <TopBar title="Suscripción y pagos" back="/settings" />
      <div className="content-pad list-stack">
        <h2 className="settings-heading first">Suscripción DopMi</h2>
        {guardianActive ? (
          <article className="billing-card">
            <div className="billing-head">
              <span className="status-chip green">Suscripción activa</span>
              <span className="billing-star">
                <Icon name="icon-star.svg" size={18} />
              </span>
            </div>
            <strong className="billing-plan">{plan.name}</strong>
            <p className="billing-amount">
              ${guardianAmount.toFixed(2)} <small>MXN / mes</small>
            </p>
            <div className="billing-meta">
              <span>Próximo cobro</span>
              <strong>3 julio 2026</strong>
            </div>
            <div className="billing-meta">
              <span>Método de pago</span>
              <strong>Visa 4242</strong>
            </div>
          </article>
        ) : (
          <article className="billing-card">
            <div className="billing-head">
              <strong>Suscripción mensual</strong>
              <span className="status-chip">Sin Subscripción</span>
            </div>
            <button className="primary-button" onClick={() => { setGuardian(true, 50); setToast("Suscripción activada"); }}>Suscribirme</button>
          </article>
        )}
        {justChanged ? (
          <p className="notice-card">✓ Tu nueva cantidad se aplicará a partir del próximo ciclo de facturación.</p>
        ) : null}
        {guardianActive ? (
          <>
            <button className="primary-button" onClick={() => { setChoice(guardianAmount); setDialog("amount"); }}>Cambiar cantidad</button>
            <button className="secondary-button" onClick={() => setDialog("cancel")}>Cancelar suscripción</button>
          </>
        ) : null}
        <h2 className="settings-heading">Historial de pagos</h2>
        <div className="history-card">
          {paymentHistory.map((row) => (
            <div className="history-row" key={row.id}>
              <span className="nav-row-text">
                <strong>{row.date}</strong>
                <small>{row.method}</small>
              </span>
              <span className="nav-row-text right">
                <strong>{row.amount}</strong>
                <small className="paid">Pagado</small>
              </span>
            </div>
          ))}
        </div>
      </div>
      {dialog === "amount" ? (
        <div className="modal-backdrop center">
          <div className="dialog-card">
            <button className="dialog-close" onClick={() => setDialog("none")} aria-label="Cerrar">×</button>
            <h2>Cambiar cantidad</h2>
            <p>Tu nueva cantidad se aplicará a partir del próximo ciclo de facturación.</p>
            <div className="plan-list">
              {subscriptionPlans.map((item) => (
                <button
                  key={item.id}
                  className={`plan-option ${choice === item.amount ? "selected" : ""}`}
                  onClick={() => setChoice(item.amount)}
                >
                  {item.recommended ? <span className="plan-flag"><Icon name="icon-star.svg" size={12} />Recomendado</span> : null}
                  <span className="plan-text">
                    <strong>{item.name}</strong>
                    <span className="plan-amount">${item.amount} <small>MXN / mes</small></span>
                  </span>
                  {item.amount === guardianAmount ? <span className="plan-current">Actual</span> : null}
                  <span className="plan-radio" />
                </button>
              ))}
            </div>
            <button
              className="primary-button"
              disabled={choice === guardianAmount}
              onClick={() => {
                setGuardian(true, choice);
                setDialog("none");
                setJustChanged(true);
                setToast("Cantidad actualizada correctamente");
              }}
            >
              Guardar nueva cantidad
            </button>
            <button className="secondary-button" onClick={() => setDialog("none")}>Cancelar</button>
          </div>
        </div>
      ) : null}
      {dialog === "cancel" ? (
        <div className="modal-backdrop center">
          <div className="dialog-card">
            <button className="dialog-close" onClick={() => setDialog("none")} aria-label="Cerrar">×</button>
            <h2>¿Cancelar suscripción?</h2>
            <p>Al cancelar, dejarás de apoyar mensualmente a mascotas que lo necesitan. Podrás volver a suscribirte cuando quieras.</p>
            <button
              className="destructive-button"
              onClick={() => {
                setGuardian(false);
                setDialog("none");
                setJustChanged(false);
                setToast("Suscripción cancelada");
              }}
            >
              Cancelar suscripción
            </button>
            <button className="secondary-button" onClick={() => setDialog("none")}>Mantener suscripción</button>
          </div>
        </div>
      ) : null}
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}

const rescuerActivity = [
  { amount: "+$40", title: "Donaciones de 6 personas", meta: "Para Luna · Esta semana" },
  { amount: "+$15", title: "Ana P. — Antiparasitario", meta: "Para Luna · Hace 2 días" },
  { amount: "+$75", title: "Donaciones de 9 personas", meta: "Para Milo · Esta semana" },
  { amount: "+$42", title: "Donaciones de 5 personas", meta: "Para Rocky · El mes pasado" },
];

function RescuerHome() {
  const navigate = useNavigate();
  const { verification, setVerification } = usePrototypeStore();
  const verified = verification === "verified";
  const pendingActions = verified
    ? [
        {
          id: "messages",
          tone: "message" as const,
          icon: "icon-chat-yellow.svg",
          title: "Responde mensajes pendientes",
          copy: "Tienes conversaciones que necesitan respuesta.",
          detail: "3 mensajes pendientes",
          cta: "Ir a mensajes",
          badge: "3",
          target: "/rescuer/messages",
        },
        {
          id: "evidence-draft",
          tone: "danger" as const,
          icon: "icon-camera-red.svg",
          title: "Termina una evidencia pendiente",
          copy: "Ya empezaste este formulario. Complétalo para enviarlo.",
          detail: "Caso: Rocky · Necesidad: Veterinario · Progreso: incompleto",
          cta: "Continuar evidencia",
          target: "/rescuer/evidence/rocky/rocky-vet",
        },
        {
          id: "evidence-new",
          tone: "purple" as const,
          icon: "icon-receipt-purple.svg",
          title: "Sube evidencia de una necesidad cubierta",
          copy: "Completa el formulario para comprobar cómo se usó el dinero.",
          detail: "Caso: Luna · Necesidad: Alimento · Monto cubierto: $450 MXN",
          cta: "Llenar evidencia",
          target: "/rescuer/evidence/luna/luna-food",
        },
      ]
    : [
        {
          id: "messages",
          tone: "message" as const,
          icon: "icon-chat-yellow.svg",
          title: "Responde mensajes pendientes",
          copy: "Tienes conversaciones que necesitan respuesta.",
          detail: "3 mensajes pendientes",
          cta: "Ir a mensajes",
          badge: "3",
          target: "/rescuer/messages",
        },
      ];

  return (
    <ScreenShell mode="rescuer">
      <div className="content-pad rescuer-home">
        <header className="rh-greeting">
          <h1>Hola, María</h1>
          <p>Tu panel de rescate</p>
        </header>

        {verified ? (
          <article className="dopmi-wallet">
            <div className="dopmi-wallet-top">
              <span className="dopmi-wallet-label">
                <AssetIcon name="icon-wallet.svg" size={20} />
                Cuenta Dopmi
              </span>
              <span className="dopmi-wallet-badge">3 Casos activos</span>
            </div>
            <strong className="dopmi-wallet-balance">$68</strong>
            <p>Disponible para tus mascotas</p>
            <div className="dopmi-wallet-bar"><i style={{ width: "40%" }} /></div>
            <div className="dopmi-wallet-stats">
              <div>
                <span>Total de donaciones</span>
                <b>$172</b>
              </div>
              <div>
                <span>Usado</span>
                <b>$69</b>
              </div>
            </div>
          </article>
        ) : verification === "review" ? (
          <article className="verify-card review">
            <div className="verify-head">
              <span className="verify-chip">
                <AssetIcon name="icon-alert-circle.svg" size={24} />
              </span>
              <strong>Verificación en proceso</strong>
            </div>
            <p>Estamos revisando tu información. Te avisaremos cuando tu cuenta esté lista para recibir donaciones.</p>
            <button className="purple-button" onClick={() => setVerification("verified")}>
              Simular verificación
            </button>
          </article>
        ) : (
          <button
            className={`verify-card link-card ${verification}`}
            onClick={() => navigate("/rescuer/verification")}
          >
            <div className="verify-head">
              <span className="verify-chip">
                <Icon name="icon-shield.svg" size={24} />
              </span>
              <strong>
                {verification === "rejected" ? "Corrige tu información" : "Verificar para recibir donaciones"}
              </strong>
              <Chevron />
            </div>
            <p>
              {verification === "rejected"
                ? "El comprobante no es legible y falta vincular una red social."
                : "Completa tu verificación para desbloquear donaciones y reembolsos."}
            </p>
            {verification === "unverified" ? <span className="bonus-badge">Bono de $350 MXN al aprobar</span> : null}
          </button>
        )}

        <section className="rh-section">
          <div className="rh-section-head">
            <AssetIcon name="icon-alert-circle.svg" size={20} />
            <h2>Acciones pendientes</h2>
            <span className="rh-count">{pendingActions.length}</span>
          </div>
          <div className="rh-action-list">
            {pendingActions.map((item) => (
              <button
                key={item.id}
                className={`rh-action ${item.tone}`}
                onClick={() => navigate(item.target)}
              >
                <AssetIcon name={item.icon} size={20} />
                <span className="rh-action-body">
                  <strong>{item.title}</strong>
                  <small>{item.copy}</small>
                  {item.detail ? <small>{item.detail}</small> : null}
                  <em>{item.cta}</em>
                </span>
                {"badge" in item && item.badge ? (
                  <span className="rh-action-badge">{item.badge}</span>
                ) : (
                  <Chevron />
                )}
              </button>
            ))}
          </div>
        </section>

        {verified ? (
          <section className="rh-section">
            <h2>Actividad reciente</h2>
            <div className="rh-activity-list">
              {rescuerActivity.map((item) => (
                <article className="rh-activity" key={`${item.amount}-${item.meta}`}>
                  <span className="rh-activity-icon">
                    <AssetIcon name="icon-donation-in.svg" size={20} />
                  </span>
                  <div>
                    <strong>
                      {item.amount} · {item.title}
                    </strong>
                    <small>{item.meta}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </ScreenShell>
  );
}

function VerificationIntro({ onContinue, onLater }: { onContinue: () => void; onLater: () => void }) {
  return (
    <div className="modal-backdrop center">
      <div className="dialog-card verify-intro">
        <button className="dialog-close" onClick={onLater} aria-label="Cerrar">×</button>
        <span className="verify-chip large">
          <Icon name="icon-shield.svg" size={28} />
        </span>
        <h2>Verifícate para recibir donaciones</h2>
        <article className="intro-card">
          <Icon name="icon-shield.svg" size={18} />
          <div>
            <strong>Protege a donadores y mascotas</strong>
            <p>La verificación ayuda a DopMi a garantizar que las donaciones lleguen a rescatistas reales.</p>
          </div>
        </article>
        <h3>Cómo funciona el reembolso</h3>
        <p className="dialog-copy">Para recibir el dinero donado, deberás comprobar los gastos con evidencia:</p>
        <ul className="check-list">
          <li>
            <Icon name="check-circle.svg" size={16} />
            <div><strong>Para comida:</strong><p>Foto del recibo, ID de compra, y foto/video de la mascota con la comida</p></div>
          </li>
          <li>
            <Icon name="check-circle.svg" size={16} />
            <div><strong>Para medicina o veterinario:</strong><p>Foto del recibo, descripción del gasto, y evidencia fotográfica cuando aplique</p></div>
          </li>
        </ul>
        <article className="notice-card">
          <Icon name="icon-doc.svg" size={18} />
          <div>
            <strong>Revisión manual</strong>
            <p>El equipo DopMi revisa manualmente cada evidencia. La aprobación puede tardar. Los fondos se liberan solo después de la revisión.</p>
          </div>
        </article>
        <button className="purple-button" onClick={onContinue}>Continuar a verificación</button>
        <button className="ghost-button" onClick={onLater}>Después</button>
      </div>
    </div>
  );
}

function VerificationFlow() {
  const navigate = useNavigate();
  const { verification, setVerification } = usePrototypeStore();
  const [intro, setIntro] = useState(verification === "unverified");
  const [form, setForm] = useState({ name: "", phone: "", location: "", experience: "" });
  const [socials, setSocials] = useState({ instagram: false, facebook: false });
  const [docs, setDocs] = useState({ id: false, address: false, bank: false });
  const filled = [form.name, form.phone, form.location, form.experience].filter(Boolean).length;
  const linked = socials.instagram || socials.facebook ? 1 : 0;
  const uploaded = Object.values(docs).filter(Boolean).length;
  const progress = Math.round(((filled + linked + uploaded) / 8) * 100);
  const complete = progress === 100;
  if (verification === "review") return <StaticSimulated title="Verificación en revisión" back="/rescuer"><div className="center-state"><h1>Estamos revisando tu información</h1><p>La decisión se simula desde Modo prueba.</p><button className="secondary-button" onClick={() => navigate("/rescuer")}>Volver al inicio</button></div></StaticSimulated>;
  if (verification === "verified") return <div className="plain-screen rescuer-theme"><TopBar title="Verificación" back="/rescuer" /><div className="center-state"><div className="success-icon"><AssetIcon name="check.svg" /></div><h1>Cuenta verificada</h1><p>Ya puedes publicar y administrar casos con donaciones.</p><button className="primary-button" onClick={() => navigate("/rescuer/publish")}>Publicar un caso</button></div></div>;
  if (intro) return <VerificationIntro onContinue={() => setIntro(false)} onLater={() => navigate("/rescuer")} />;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setVerification("review");
  };
  return (
    <div className="plain-screen rescuer-theme">
      <TopBar title="Formulario de verificación" back="/rescuer" />
      {verification === "rejected" && <SimulatedBanner />}
      <form className="content-pad form-stack" onSubmit={submit}>
        <p className="dialog-copy">Completa tu información para verificar tu cuenta de rescatista</p>
        {verification === "rejected" && <div className="error-callout"><strong>Se requieren correcciones</strong><span>Comprobante de domicilio ilegible · Falta vincular una red social.</span></div>}
        <h2>Información básica</h2>
        <label>Nombre completo *<input required placeholder="Tu nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Teléfono *<input required placeholder="+52 123 456 7890" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label>Ubicación *<input required placeholder="Ciudad, Estado" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>

        <h2>Experiencia de rescate</h2>
        <label>Cuéntanos sobre tu experiencia *<textarea required rows={3} placeholder="¿Cuánto tiempo llevas rescatando? ¿Cuántas mascotas has ayudado?" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></label>

        <h2>Redes sociales</h2>
        <p className="field-hint">Vincula al menos una red social para comprobar que eres la dueña de la cuenta. Lo ideal es vincular Instagram y Facebook.</p>
        <article className="card-row">
          <span className="nav-row-text"><strong>Instagram</strong><small>Vincula tu cuenta de Instagram</small></span>
          <button type="button" className="purple-button compact" onClick={() => setSocials({ ...socials, instagram: true })}>
            {socials.instagram ? "Vinculado" : "Vincular Instagram"}
          </button>
        </article>
        <article className="card-row">
          <span className="nav-row-text"><strong>Facebook</strong><small>Vincula tu cuenta de Facebook</small></span>
          <button type="button" className="purple-button compact" onClick={() => setSocials({ ...socials, facebook: true })}>
            {socials.facebook ? "Vinculado" : "Vincular Facebook"}
          </button>
        </article>

        <h2>Documentos</h2>
        <article className="card-row">
          <span className="nav-row-text"><strong>Identificación oficial *</strong><small>INE, pasaporte o licencia</small></span>
          <button type="button" className="secondary-button compact" onClick={() => setDocs({ ...docs, id: true })}>{docs.id ? "Subido" : "Subir"}</button>
        </article>
        <article className={`card-row ${verification === "rejected" ? "invalid" : ""}`}>
          <span className="nav-row-text"><strong>Comprobante de domicilio *</strong><small>Recibo de luz, agua, teléfono, etc.</small></span>
          <button type="button" className="secondary-button compact" onClick={() => setDocs({ ...docs, address: true })}>{docs.address ? "Subido" : "Subir"}</button>
        </article>
        <article className="card-row">
          <span className="nav-row-text"><strong>Información bancaria *</strong><small>CLABE para recibir reembolsos</small></span>
          <button type="button" className="secondary-button compact" onClick={() => setDocs({ ...docs, bank: true })}>{docs.bank ? "Agregada" : "Agregar"}</button>
        </article>

        <article className="progress-card">
          <div className="progress-head">
            <span>Progreso del formulario</span>
            <strong>{complete ? "Completo" : "Incompleto"}</strong>
          </div>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
        </article>
        <button className="primary-button">Enviar a revisión</button>
        <button type="button" className="ghost-button" onClick={() => navigate("/rescuer")}>Guardar y continuar después</button>
      </form>
    </div>
  );
}

function needEmoji(type: Need["type"]) {
  if (type === "Comida") return "🥣";
  if (type === "Medicina") return "💊";
  if (type === "Veterinario") return "🩺";
  return "✨";
}

function needFrequency(need: Need) {
  if (need.type === "Comida") return need.recurring ? "Cada mes" : "Quincenal";
  if (need.recurring) return "Cada mes";
  return "Única vez";
}

function EditCaseModal({
  item,
  onClose,
}: {
  item: PetCase;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { updateCase, updateCaseStatus } = usePrototypeStore();
  const [name, setName] = useState(item.name);
  const [age, setAge] = useState(item.age);
  const [story, setStory] = useState(item.story);
  const [adoption, setAdoption] = useState(item.adoption);
  const [needs, setNeeds] = useState(item.needs);
  const [closing, setClosing] = useState(false);
  const photos = [item.image, item.id === "milo" ? "/assets/guardian-milo.jpg" : item.image, item.id === "luna" ? "/assets/luna-detail.png" : item.image];

  const save = () => {
    updateCase(item.id, { name, age, story, adoption, needs });
    onClose();
  };

  if (closing) {
    return (
      <div className="modal-backdrop center" onClick={() => setClosing(false)}>
        <div className="dialog-card" onClick={(event) => event.stopPropagation()}>
          <button className="dialog-close" onClick={() => setClosing(false)} aria-label="Cerrar">×</button>
          <h2>Cerrar caso</h2>
          <p>Esta acción archiva el caso. Puedes subir un video de despedida opcional.</p>
          <label className="dialog-field">Motivo<select defaultValue="adoptada"><option value="adoptada">Ya fue adoptada</option><option value="otro">Otro motivo</option></select></label>
          <label className="upload-field">Video de despedida (opcional)<input type="file" accept="video/*" /></label>
          <button
            className="danger-button"
            onClick={() => {
              updateCaseStatus(item.id, "closed");
              onClose();
              navigate("/rescuer/cases");
            }}
          >
            Confirmar cierre
          </button>
          <button className="secondary-button" onClick={() => setClosing(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div className="dialog-card edit-case-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Cerrar">×</button>
        <header className="edit-case-header">
          <h2>Editar caso</h2>
          <p>Actualiza la información del caso. Todos los cambios se guardarán al confirmar.</p>
        </header>

        <section className="edit-case-section">
          <h3>Fotos del caso</h3>
          <div className="edit-photo-grid">
            {photos.map((src, index) => (
              <div className="edit-photo" key={`${src}-${index}`}>
                <img src={src} alt="" />
                <button type="button" className="edit-photo-remove" aria-label="Quitar foto">×</button>
                {index === 0 ? <span className="edit-photo-badge">Principal</span> : null}
              </div>
            ))}
            <button type="button" className="edit-photo-add">
              <Icon name="onb-camera.svg" size={24} />
              <span>Agregar</span>
            </button>
          </div>
        </section>

        <section className="edit-case-section">
          <h3>Información básica</h3>
          <label>Nombre<input value={name} maxLength={25} onChange={(event) => setName(event.target.value)} /></label>
          <label>Edad estimada<input value={age} onChange={(event) => setAge(event.target.value)} /></label>
          <label>Historia del rescate<textarea rows={3} value={story} placeholder="Cuéntanos la historia..." onChange={(event) => setStory(event.target.value)} /></label>
          <div className="switch-card">
            <div>
              <strong>Listo para adopción</strong>
              <small>Marca si el caso está disponible para adopción</small>
            </div>
            <button
              type="button"
              className={`switch ${adoption ? "on" : ""}`}
              role="switch"
              aria-checked={adoption}
              onClick={() => setAdoption((value) => !value)}
            >
              <i />
            </button>
          </div>
        </section>

        <section className="edit-case-section">
          <div className="edit-needs-head">
            <h3>Necesidades activas</h3>
            <p>{needs.length >= 3 ? "Ya agregaste todas las necesidades disponibles" : "Puedes quitar o revisar las necesidades del caso"}</p>
          </div>
          <div className="edit-needs-list">
            {needs.map((need) => (
              <article className="edit-need-row" key={need.id}>
                <span className="edit-need-emoji" aria-hidden="true">{needEmoji(need.type)}</span>
                <span className="edit-need-copy">
                  <strong>{need.type}</strong>
                  <b>${need.requested}</b>
                  <small>Frecuencia: {needFrequency(need)}</small>
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Quitar ${need.title}`}
                  onClick={() => setNeeds((list) => list.filter((entry) => entry.id !== need.id))}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="edit-case-advanced">
          <h3>Acciones avanzadas</h3>
          <button type="button" className="danger-outline-button" onClick={() => setClosing(true)}>Cerrar caso</button>
        </section>

        <div className="edit-case-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="button" className="purple-button" onClick={save}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

function RescuerCases() {
  const navigate = useNavigate();
  const { cases, updateCaseStatus, toggleCaseAdoption } = usePrototypeStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const visible = cases.filter((item) => item.caseStatus !== "closed");
  const editing = editId ? cases.find((item) => item.id === editId) : null;
  return (
    <ScreenShell
      mode="rescuer"
      overlay={
        <>
          {deleteId ? (
            <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
              <div className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
                <SimulatedBanner />
                <h2>¿Eliminar este caso?</h2>
                <p>Esta acción quitará el borrador de Mis Casos.</p>
                <button className="danger-button" onClick={() => { updateCaseStatus(deleteId, "closed"); setDeleteId(null); }}>Sí, eliminar</button>
                <button className="secondary-button" onClick={() => setDeleteId(null)}>Cancelar</button>
              </div>
            </div>
          ) : null}
          {editing ? <EditCaseModal item={editing} onClose={() => setEditId(null)} /> : null}
        </>
      }
    >
      <div className="content-pad">
        <div className="section-heading">
          <div><h1>Mis Casos</h1><p>{visible.length} mascotas a tu cuidado</p></div>
          <button className="purple-button compact" onClick={() => navigate("/rescuer/publish")}>
            <Icon name="icon-plus-circle.svg" size={16} />
            Nuevo
          </button>
        </div>
        <div className="list-stack">
          {visible.map((item) => {
            const requested = item.needs.reduce((total, need) => total + need.requested, 0);
            const funded = item.needs.reduce((total, need) => total + need.funded, 0);
            const percent = requested ? Math.round((funded / requested) * 100) : 0;
            return (
              <article className="manage-case" key={item.id}>
                <button
                  type="button"
                  className="manage-case-top linkish"
                  onClick={() => {
                    if (item.caseStatus === "draft") navigate(`/rescuer/publish?draft=${item.id}`);
                    else if (item.caseStatus === "rejected") navigate(`/rescuer/publish?correct=${item.id}`);
                    else navigate(`/rescuer/cases/${item.id}`);
                  }}
                >
                  <img src={item.image} alt="" />
                  <div className="manage-case-body">
                    <div className="manage-case-head">
                      <h3>{item.name}</h3>
                      <span className={`status-pill ${item.caseStatus}`}>{caseStatusLabel[item.caseStatus]}</span>
                    </div>
                    <p>{[item.breed, item.age].filter(Boolean).join(" · ")}</p>
                    {requested > 0 && item.caseStatus === "active" ? (
                      <>
                        <div className="funding-line">
                          <span>Progreso de fondeo</span>
                          <strong>{percent}%</strong>
                        </div>
                        <div className="progress-track"><i style={{ width: `${percent}%` }} /></div>
                        <small className="funding-meta">
                          <Icon name="icon-billing.svg" size={14} />
                          ${funded} recaudados · ${Math.max(requested - funded, 0)} restantes
                        </small>
                      </>
                    ) : null}
                  </div>
                </button>
                <div className="manage-case-actions">
                  {item.caseStatus === "draft" ? (
                    <>
                      <button className="icon-button danger" aria-label={`Eliminar ${item.name}`} onClick={() => setDeleteId(item.id)}>
                        <Icon name="icon-trash.svg" size={18} />
                      </button>
                      <button className="purple-button grow" onClick={() => navigate(`/rescuer/publish?draft=${item.id}`)}>Continuar publicación</button>
                    </>
                  ) : item.caseStatus === "rejected" ? (
                    <>
                      <button className="icon-button danger" aria-label={`Eliminar ${item.name}`} onClick={() => setDeleteId(item.id)}>
                        <Icon name="icon-trash.svg" size={18} />
                      </button>
                      <button className="purple-button grow" onClick={() => navigate(`/rescuer/publish?correct=${item.id}`)}>Corregir publicación</button>
                    </>
                  ) : (
                    <>
                      <label className="adoption-toggle">
                        <button
                          className={`switch ${item.adoption ? "on" : ""}`}
                          role="switch"
                          aria-checked={item.adoption}
                          aria-label={`Listo para adopción: ${item.name}`}
                          onClick={() => toggleCaseAdoption(item.id)}
                        >
                          <i />
                        </button>
                        <span>Listo para adopción</span>
                      </label>
                      <button className="secondary-button compact" onClick={() => setEditId(item.id)}>
                        <Icon name="icon-edit.svg" size={14} />
                        Editar caso
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </ScreenShell>
  );
}

function RescuerNeedCard({ need, caseId }: { need: Need; caseId: string }) {
  const navigate = useNavigate();
  const remaining = Math.max(0, need.requested - need.funded);
  const funded = remaining === 0 || need.status === "funded" || need.status === "evidence" || need.status === "completed";
  const progress = need.requested ? need.funded / need.requested : 0;
  const canUnlock = funded || progress >= 0.65;
  return (
    <article className="need-card rescuer-need-card">
      <div className="need-card-title">
        <span className="need-symbol soft">{needEmoji(need.type)}</span>
        <div>
          <strong>{need.title}</strong>
          <small>{need.type}</small>
          {need.urgent ? <span className="urgent-inline">Urgente</span> : null}
        </div>
        <b>${need.requested}</b>
      </div>
      <div className="split-meta">
        <span>${need.requested} total</span>
        <strong>${remaining} restantes</strong>
      </div>
      <div className="progress purple"><i style={{ width: `${Math.min(100, (need.funded / need.requested) * 100)}%` }} /></div>
      {canUnlock ? (
        <div className={`card-actions ${need.type === "Comida" && funded ? "" : "single"}`}>
          {need.type === "Comida" && funded ? (
            <button className="secondary-button" onClick={() => navigate(`/rescuer/food/${caseId}/${need.id}`)}>Comprar</button>
          ) : null}
          <button className="purple-button" onClick={() => navigate(`/rescuer/evidence/${caseId}/${need.id}`)}>Desbloquear</button>
        </div>
      ) : (
        <button className="purple-button soft" disabled>Esperando donaciones</button>
      )}
    </article>
  );
}

function RescuerCaseDetail() {
  const { caseId = "luna" } = useParams();
  const navigate = useNavigate();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const { cases, updateCaseStatus } = usePrototypeStore();
  const item = cases.find((entry) => entry.id === caseId) ?? cases[0];
  const photos = item.id === "milo"
    ? [item.image, "/assets/guardian-milo.jpg", item.image]
    : item.id === "luna"
      ? ["/assets/luna-detail.png", item.image, "/assets/guardian-luna.jpg"]
      : [item.image, item.image, item.image];
  const stories = [
    {
      id: "s1",
      when: "Hoy",
      tag: "Recuperación",
      text: item.id === "milo"
        ? "Mira quién ya ronronea otra vez. Milo ya apoya la patita."
        : `${item.name} sigue mejorando gracias al apoyo de la comunidad.`,
      thanks: "Gracias a Lucía G.",
      image: photos[0],
      need: item.needs[0] ? `${item.needs[0].title} · $${item.needs[0].requested}` : undefined,
    },
    {
      id: "s2",
      when: "Hace 3 días",
      tag: "Recuperación",
      text: item.id === "milo"
        ? "Cambio de vendaje #4: la herida cierra muy bien."
        : `Actualización del cuidado de ${item.name}.`,
      thanks: "Gracias a Lucía G.",
      image: photos[1],
      need: item.needs[0] ? `${item.needs[0].title} · $${item.needs[0].requested}` : undefined,
    },
  ];

  return (
    <ScreenShell
      mode="rescuer"
      overlay={
        <>
          {editOpen ? <EditCaseModal item={item} onClose={() => setEditOpen(false)} /> : null}
          {closeOpen ? (
            <div className="modal-backdrop center" onClick={() => setCloseOpen(false)}>
              <div className="dialog-card" onClick={(event) => event.stopPropagation()}>
                <button className="dialog-close" onClick={() => setCloseOpen(false)} aria-label="Cerrar">×</button>
                <h2>Cerrar caso</h2>
                <p>Sube un video de despedida opcional y confirma el cierre del caso.</p>
                <label className="dialog-field">Motivo<select defaultValue="adoptada"><option value="adoptada">Ya fue adoptada</option><option value="otro">Otro motivo</option></select></label>
                <label className="upload-field">Video de despedida (opcional)<input type="file" accept="video/*" /></label>
                <button
                  className="danger-button"
                  onClick={() => {
                    updateCaseStatus(item.id, "closed");
                    setCloseOpen(false);
                    navigate("/rescuer/cases");
                  }}
                >
                  Confirmar cierre
                </button>
                <button className="secondary-button" onClick={() => setCloseOpen(false)}>Cancelar</button>
              </div>
            </div>
          ) : null}
        </>
      }
    >
      <div className="detail-screen">
      <div className="detail-hero compact">
        <img src={photos[photoIndex]} alt={item.name} />
        <button className="hero-back" onClick={() => navigate("/rescuer/cases")} aria-label="Volver">
          <AssetIcon name="back-light.svg" />
        </button>
        <span className="hero-counter">{photoIndex + 1} / {photos.length}</span>
        <div className="hero-dots">
          {photos.map((_, index) => (
            <button
              key={index}
              type="button"
              className={index === photoIndex ? "active" : ""}
              aria-label={`Foto ${index + 1}`}
              onClick={() => setPhotoIndex(index)}
            />
          ))}
        </div>
      </div>
      <div className="detail-content">
        <article className="info-card case-summary-card">
          <div className="title-row">
            <h1>{item.name}, {item.age}</h1>
            <span className="distance-pill">
              <Icon name="location.svg" size={12} />
              {item.distance}
            </span>
          </div>
          <p>{item.story}</p>
        </article>

        <h2>Necesidades activas</h2>
        <div className="needs-stack">
          {item.needs.length
            ? item.needs.map((need) => <RescuerNeedCard key={need.id} need={need} caseId={item.id} />)
            : <p className="supporting-copy">Este caso aún no tiene necesidades activas.</p>}
        </div>

        <button className="secondary-button goodbye-video" onClick={() => setCloseOpen(true)}>
          <Icon name="onb-camera.svg" size={18} />
          Subir video de despedida
        </button>

        <h2>La historia hasta ahora</h2>
        <div className="story-stack">
          {stories.map((entry) => (
            <article className="story-card" key={entry.id}>
              <div className="story-media">
                <img src={entry.image} alt="" />
                <span className="story-when"><Icon name="icon-clock.svg" size={12} />{entry.when}</span>
                <span className="story-tag">{entry.tag}</span>
              </div>
              <div className="story-body">
                <p>{entry.text}</p>
                {entry.need ? <span className="story-need">{entry.need}</span> : null}
                <small><span className="avatar tiny">L</span>{entry.thanks}</small>
              </div>
            </article>
          ))}
        </div>

        <button className="secondary-button compact" onClick={() => setEditOpen(true)}>
          <Icon name="icon-edit.svg" size={14} />
          Editar caso
        </button>
      </div>
      </div>
    </ScreenShell>
  );
}

function PublishFlow() {
  const navigate = useNavigate();
  const { verification, draft, updateDraft, publishDraft } = usePrototypeStore();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"adoption" | "donation">((draft.publishMode as "adoption" | "donation") || "adoption");
  const correcting = location.search.includes("correct");
  const continuing = location.search.includes("draft");
  const needsVerification = verification !== "verified";

  const pickType = (nextMode: "adoption" | "donation") => {
    if (nextMode === "donation" && needsVerification) {
      navigate("/rescuer/verification");
      return;
    }
    setMode(nextMode);
    updateDraft({ publishMode: nextMode });
    setStep(1);
  };

  const next = (event?: FormEvent) => {
    event?.preventDefault();
    if (step < (mode === "adoption" ? 4 : 3)) setStep(step + 1);
    else {
      publishDraft("review");
      navigate("/rescuer/cases");
    }
  };

  const title = correcting
    ? "Corregir caso"
    : continuing
      ? "Continuar publicación"
      : "Publicar caso";

  if (step === 0 && !correcting && !continuing) {
    return (
      <ScreenShell mode="rescuer" className="publish-type-shell">
        <div className="publish-type-screen">
          <div className="intent-copy">
            <h1>¿Qué quieres publicar?</h1>
            <p>Selecciona el tipo de publicación que deseas crear</p>
          </div>
          <div className="publish-type-cards">
            <button type="button" className="intent-card publish-type-card" onClick={() => pickType("adoption")}>
              <span className="intent-chip publish-adopt">
                <AssetIcon name="intent-adopter.svg" size={28} />
              </span>
              <span className="intent-card-text">
                <strong>Dar en adopción</strong>
                <p>Publica una mascota que esté lista para encontrar un hogar</p>
              </span>
            </button>
            <button type="button" className="intent-card publish-type-card" onClick={() => pickType("donation")}>
              <span className="intent-chip publish-donate">
                <AssetIcon name="intent-donor.svg" size={28} />
              </span>
              <span className="intent-card-text">
                <strong>Recibir donaciones</strong>
                <p>Crea un caso de donación para cubrir necesidades de una mascota</p>
                <span className="publish-verify-hint">⚠️ Requiere verificación</span>
              </span>
            </button>
          </div>
          <button type="button" className="publish-cancel" onClick={() => navigate("/rescuer")}>
            Cancelar
          </button>
        </div>
      </ScreenShell>
    );
  }

  if (needsVerification && mode === "donation") {
    return (
      <StaticSimulated title="Publicar caso" back="/rescuer/publish">
        <div className="center-state">
          <h1>Verifica tu cuenta para publicar</h1>
          <p>Necesitamos validar tu identidad antes de activar un caso de donaciones.</p>
          <button className="primary-button" onClick={() => navigate("/rescuer/verification")}>Ir a verificación</button>
        </div>
      </StaticSimulated>
    );
  }

  return (
    <div className="plain-screen rescuer-theme publish-flow">
      <TopBar title={title} back={step > 1 || correcting || continuing ? () => setStep(Math.max(1, step - 1)) : () => setStep(0)} />
      {correcting && <SimulatedBanner />}
      <form className="content-pad form-stack" onSubmit={next}>
        {correcting && (
          <div className="error-callout">
            <strong>Corrige antes de reenviar</strong>
            <span>La historia necesita más detalle y la evidencia de urgencia no permite identificar a la mascota.</span>
          </div>
        )}
        <div className="step-indicator">
          <span style={{ width: `${(step / (mode === "adoption" ? 4 : 3)) * 100}%` }} />
        </div>
        {step === 1 && (
          <>
            <h2>Información básica</h2>
            <label>Fotos<input type="file" multiple /></label>
            <label>Nombre de la mascota<input maxLength={25} required defaultValue={String(draft.petName || "")} onChange={(event) => updateDraft({ petName: event.target.value })} /></label>
            <label>Historia<textarea required defaultValue={String(draft.story || "")} onChange={(event) => updateDraft({ story: event.target.value })} /></label>
            <div className="field-grid">
              <label>Edad<input defaultValue={String(draft.age || "")} onChange={(event) => updateDraft({ age: event.target.value })} /></label>
              <label>Especie<select defaultValue={String(draft.species || "Perro")} onChange={(event) => updateDraft({ species: event.target.value })}><option>Perro</option><option>Gato</option><option>Otro</option></select></label>
            </div>
            <div className="field-grid">
              <label>Sexo<select defaultValue={String(draft.sex || "Macho")} onChange={(event) => updateDraft({ sex: event.target.value })}><option>Macho</option><option>Hembra</option></select></label>
              <label>Ubicación<input defaultValue={String(draft.location || "")} onChange={(event) => updateDraft({ location: event.target.value })} /></label>
            </div>
          </>
        )}
        {step === 2 && mode === "adoption" && (
          <>
            <h2>Salud y convivencia</h2>
            <label className="check-row"><input type="checkbox" defaultChecked={Boolean(draft.vaccinated)} onChange={(event) => updateDraft({ vaccinated: event.target.checked })} />Vacunado</label>
            <label className="check-row"><input type="checkbox" defaultChecked={Boolean(draft.sterilized)} onChange={(event) => updateDraft({ sterilized: event.target.checked })} />Esterilizado</label>
            <label>Cuidados especiales<textarea placeholder="Describe cuidados o escribe “Ninguno”" /></label>
            <h3>Convive con</h3>
            <div className="check-grid">
              <label className="check-row"><input type="checkbox" />Perros</label>
              <label className="check-row"><input type="checkbox" />Gatos</label>
              <label className="check-row"><input type="checkbox" />Niños</label>
            </div>
          </>
        )}
        {((step === 2 && mode === "donation") || (step === 3 && mode === "adoption")) && (
          <>
            <h2>Necesidades de la mascota</h2>
            {mode === "adoption" && <p className="supporting-copy">Son opcionales. Puedes publicar solo para adopción.</p>}
            <label>Tipo<select><option>Veterinario</option><option>Medicina</option><option>Comida</option><option>Otra necesidad</option></select></label>
            <label>Descripción<input defaultValue={String(draft.needTitle || "")} onChange={(event) => updateDraft({ needTitle: event.target.value })} /></label>
            <label>Monto requerido<input type="number" defaultValue={String(draft.amount || "")} onChange={(event) => updateDraft({ amount: event.target.value })} /></label>
            <label className="check-row"><input type="checkbox" />Marcar como urgente</label>
            <button type="button" className="secondary-button">Agregar otra necesidad</button>
          </>
        )}
        {((step === 3 && mode === "donation") || (step === 4 && mode === "adoption")) && (
          <>
            <h2>Revisa tu publicación</h2>
            <article className="summary-card">
              <div><span>Mascota</span><strong>{String(draft.petName || "Sin nombre")}</strong></div>
              <div><span>Objetivo</span><strong>{mode === "adoption" ? "Dar en adopción" : "Recibir donaciones"}</strong></div>
              <div><span>Necesidad</span><strong>{String(draft.needTitle || (mode === "adoption" ? "Sin necesidades" : "Por completar"))}</strong></div>
              <div><span>Estado inicial</span><strong>En revisión</strong></div>
            </article>
            <p className="supporting-copy">Al enviar, el caso aparecerá en Mis Casos con estado En revisión.</p>
          </>
        )}
        <div className="publish-actions">
          <button type="button" className="text-action" onClick={() => { updateDraft({ publishMode: mode }); navigate("/rescuer/cases"); }}>Guardar borrador</button>
          <button className="primary-button">{step === (mode === "adoption" ? 4 : 3) ? "Enviar a revisión" : "Continuar"}</button>
        </div>
      </form>
    </div>
  );
}

function EvidenceFlow() {
  const navigate = useNavigate();
  const { caseId = "luna", needId = "luna-food" } = useParams();
  const [step, setStep] = useState<"choice" | "upload" | "review" | "done">("choice");
  if (step === "done") return <StaticSimulated title="Evidencia enviada" back={`/rescuer/cases/${caseId}`}><div className="center-state"><h1>Evidencia en revisión</h1><p>Al aprobarse, se publicará y notificará a quienes apoyaron este caso.</p><button className="primary-button" onClick={() => navigate(`/rescuer/food/${caseId}/${needId}`)}>Continuar ciclo de comida</button></div></StaticSimulated>;
  return (
    <div className="plain-screen rescuer-theme">
      <TopBar title="Gestionar necesidad fondeada" back={`/rescuer/cases/${caseId}`} />
      <div className="content-pad form-stack">
        {step === "choice" && <><h2>¿Cómo cubrirás esta necesidad?</h2><button className="choice-card selected" onClick={() => setStep("upload")}><strong>Recibir fondos</strong><span>Sube evidencia para solicitar liberación.</span></button><button className="choice-card" onClick={() => setStep("upload")}><strong>Comprar</strong><span>Simula una compra externa y vuelve para cargar evidencia.</span></button><SimulatedBanner /></>}
        {step === "upload" && <><h2>Sube evidencia</h2><label className="upload-field">Ticket o recibo<input required type="file" /></label><label className="upload-field">Foto o video con la mascota<input required type="file" /></label><label>Descripción<textarea placeholder="Explica cómo se utilizó el apoyo" /></label><button className="primary-button" onClick={() => setStep("review")}>Revisar evidencia</button></>}
        {step === "review" && <><h2>Confirma la evidencia</h2><article className="summary-card"><div><span>Necesidad</span><strong>Alimento</strong></div><div><span>Ticket</span><strong>ticket-compra.jpg</strong></div><div><span>Evidencia</span><strong>video-luna.mp4</strong></div></article><button className="primary-button" onClick={() => setStep("done")}>Enviar a revisión</button><button className="secondary-button" onClick={() => setStep("upload")}>Corregir</button></>}
      </div>
    </div>
  );
}

function FoodCycle() {
  const navigate = useNavigate();
  const { caseId = "luna" } = useParams();
  return <StaticSimulated title="Solicitar comida" back={`/rescuer/cases/${caseId}`}><div className="form-stack"><h1>¿Qué comida necesitas ahora?</h1><p>Puedes volver al catálogo o reactivar exactamente la necesidad anterior.</p><button className="primary-button" onClick={() => navigate("/rescuer/cases")}>Elegir otro producto</button><button className="secondary-button" onClick={() => navigate("/rescuer/cases")}>Misma comida</button><button className="text-action" onClick={() => navigate("/rescuer/cases")}>Salir sin reactivar</button></div></StaticSimulated>;
}

function RescuerMessages() {
  const navigate = useNavigate();
  const messages = usePrototypeStore((state) => state.messages);
  const last = messages[messages.length - 1];
  const threads = [
    { id: "ana", initial: "A", name: "Ana P.", about: "re: Luna", preview: last?.text ?? "", time: last?.time ?? "5m", unread: last?.author === "donor" ? 1 : 0 },
    { id: "carlos", initial: "C", name: "Carlos M.", about: "re: Rocky", preview: "¿Puedo visitarlo este fin de semana?", time: "1h", unread: 0 },
    { id: "lucia", initial: "L", name: "Lucía G.", about: "re: Milo", preview: "¡Gracias por la actualización!", time: "Ayer", unread: 0 },
  ];
  return (
    <ScreenShell mode="rescuer">
      <header className="rescuer-header with-icon">
        <Icon name="icon-messages.svg" size={24} />
        <h1>Mensajes</h1>
      </header>
      <div className="content-pad">
        <p className="section-lead">Conversa con adoptantes y donantes</p>
        <div className="thread-list">
          {threads.map((thread) => (
            <button className="thread-row" key={thread.id} onClick={() => navigate("/messages/luna")}>
              <span className="thread-avatar">{thread.initial}</span>
              <span className="thread-main">
                <span className="thread-head">
                  <strong>{thread.name}</strong>
                  <time>{thread.time}</time>
                </span>
                <small>{thread.about}</small>
                <p>{thread.preview}</p>
              </span>
              {thread.unread > 0 && <span className="thread-badge">{thread.unread}</span>}
            </button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function RescuerProfile() {
  const navigate = useNavigate();
  const verification = usePrototypeStore((state) => state.verification);
  const setAccountMode = usePrototypeStore((state) => state.setAccountMode);
  return (
    <ScreenShell mode="rescuer">
      <div className="content-pad profile-page">
        <header className="page-head">
          <h1>Perfil</h1>
        </header>
        {verification === "verified" ? (
          <article className="public-card">
            <div className="public-card-head">
              <h2>Perfil público</h2>
              <button className="icon-button" onClick={() => navigate("/rescuer/settings")} aria-label="Editar perfil público">
                <Icon name="icon-edit.svg" size={18} />
              </button>
            </div>
            <div className="public-card-id">
              <span className="avatar large purple">M</span>
              <div>
                <strong>{rescuerAccount.name}</strong>
                <span className="status-chip green">Verificado</span>
              </div>
            </div>
            <div className="field-row">
              <Icon name="location.svg" size={16} />
              <span className="nav-row-text"><small>Dirección</small><strong>{rescuerAccount.address}</strong></span>
            </div>
            <div className="field-row">
              <Icon name="icon-phone.svg" size={16} />
              <span className="nav-row-text"><small>Teléfono</small><strong>{rescuerAccount.phone}</strong></span>
            </div>
            <div className="field-row">
              <Icon name="icon-mail.svg" size={16} />
              <span className="nav-row-text"><small>Email</small><strong>{rescuerAccount.email}</strong></span>
            </div>
            <div className="field-row column">
              <small>Descripción</small>
              <p>{rescuerAccount.description}</p>
            </div>
          </article>
        ) : (
          <article className="public-card">
            <div className="public-card-id">
              <span className="avatar large purple">M</span>
              <strong>{rescuerAccount.name}</strong>
            </div>
            <div className="field-row">
              <Icon name="icon-mail.svg" size={16} />
              <span className="nav-row-text"><small>Email</small><strong>{rescuerAccount.email}</strong></span>
            </div>
          </article>
        )}
        <section className="list-stack">
          <button className="nav-row" onClick={() => navigate("/rescuer/settings")}>
            <span className="nav-row-main">
              <Icon name="icon-shield.svg" size={20} />
              <strong>Configuración</strong>
            </span>
            <Chevron />
          </button>
        </section>
        <article className="switch-card">
          <div>
            <strong>Volver a modo donante</strong>
            <small>Conserva los datos de ambos perfiles</small>
          </div>
          <button
            className="switch on"
            role="switch"
            aria-checked="true"
            aria-label="Volver a modo donante"
            onClick={() => {
              setAccountMode("donor");
              navigate("/adoption");
            }}
          >
            <i />
          </button>
        </article>
      </div>
    </ScreenShell>
  );
}

function RescuerSettings() {
  const navigate = useNavigate();
  const { verification, setAccountMode } = usePrototypeStore();
  const verified = verification === "verified";
  const statusCard = {
    unverified: { title: "No verificada", copy: "Completa tu verificación para desbloquear donaciones y reembolsos.", cta: "Iniciar verificación" },
    review: { title: "Verificación en proceso", copy: "Estamos revisando tu información. Te avisaremos en cuanto termine.", cta: "Ver estado" },
    rejected: { title: "Verificación con errores", copy: "Hay información que debes corregir para continuar.", cta: "Corregir información" },
    verified: { title: "Cuenta verificada", copy: "Tu cuenta está activa y puede recibir donaciones.", cta: "" },
  }[verification];
  return (
    <ScreenShell mode="rescuer">
      <TopBar title="Configuración" back="/rescuer/profile" />
      <div className="content-pad list-stack">
        <h2 className="settings-heading first">Estado de verificación</h2>
        <article className={`verify-card ${verification}`}>
          <div className="verify-head">
            <span className="verify-chip">
              <Icon name="icon-shield.svg" size={20} />
            </span>
            <strong>{statusCard.title}</strong>
            {statusCard.cta ? <Chevron /> : null}
          </div>
          <p>{statusCard.copy}</p>
          {statusCard.cta ? (
            <button className="purple-button compact self-start" onClick={() => navigate("/rescuer/verification")}>{statusCard.cta}</button>
          ) : null}
        </article>
        {verified ? (
          <>
            <h2 className="settings-heading">Información personal modificable</h2>
            <article className="public-card">
              <div className="field-row">
                <Icon name="icon-phone.svg" size={16} />
                <span className="nav-row-text"><small>Teléfono</small><strong>{rescuerAccount.phone}</strong></span>
              </div>
              <div className="field-row">
                <Icon name="icon-mail.svg" size={16} />
                <span className="nav-row-text"><small>Email</small><strong>{rescuerAccount.email}</strong></span>
              </div>
              <div className="field-row">
                <Icon name="location.svg" size={16} />
                <span className="nav-row-text"><small>Dirección del refugio</small><strong>{rescuerAccount.address}</strong></span>
              </div>
            </article>
            <h2 className="settings-heading">Redes sociales</h2>
            <article className="card-row">
              <span className="row-tile gray"><Icon name="icon-instagram.svg" size={18} /></span>
              <span className="nav-row-text"><small>Instagram</small><strong>{rescuerAccount.instagram}</strong></span>
              <button className="icon-button" aria-label="Editar Instagram"><Icon name="icon-edit.svg" size={16} /></button>
            </article>
            <article className="card-row">
              <span className="row-tile gray"><Icon name="icon-facebook.svg" size={18} /></span>
              <span className="nav-row-text"><small>Facebook</small><strong>{rescuerAccount.facebook}</strong></span>
              <button className="icon-button" aria-label="Editar Facebook"><Icon name="icon-edit.svg" size={16} /></button>
            </article>
            <p className="field-hint">Vincula tus cuentas para comprobar que eres el dueño. Es ideal agregar ambas.</p>
            <h2 className="settings-heading">Datos bancarios</h2>
            <article className="card-row">
              <span className="nav-row-text"><small>CLABE</small><strong>{rescuerAccount.clabe}</strong></span>
              <button className="icon-button" aria-label="Editar CLABE"><Icon name="icon-edit.svg" size={16} /></button>
            </article>
            <p className="field-hint">La CLABE solo es visible para ti y nunca se muestra a los donantes.</p>
          </>
        ) : null}
        <article className="switch-card">
          <div>
            <strong>Cambiar a usuario donante</strong>
            <small>Cambia tu experiencia en la app</small>
          </div>
          <button
            className="switch on"
            role="switch"
            aria-checked="true"
            aria-label="Cambiar a usuario donante"
            onClick={() => {
              setAccountMode("donor");
              navigate("/adoption");
            }}
          >
            <i />
          </button>
        </article>
        <SettingsRow icon="icon-help.svg" title="Centro de ayuda" onClick={() => navigate("/help")} />
        <button className="nav-row danger-row" onClick={() => navigate("/")}>
          <span className="nav-row-main">
            <Icon name="icon-logout.svg" size={20} />
            <strong>Cerrar sesión</strong>
          </span>
          <Chevron />
        </button>
      </div>
    </ScreenShell>
  );
}

function HelpCenter() {
  const accountMode = usePrototypeStore((state) => state.accountMode);
  const faqs = accountMode === "rescuer" ? rescuerFaqs : donorFaqs;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="plain-screen">
      <TopBar title="Centro de ayuda" back="/settings" />
      <div className="content-pad list-stack">
        {faqs.map((item) => (
          <article className={`faq-row ${open === item.q ? "open" : ""}`} key={item.q}>
            <button onClick={() => setOpen(open === item.q ? null : item.q)}>
              <strong>{item.q}</strong>
              <Chevron />
            </button>
            {open === item.q ? <p>{item.a}</p> : null}
          </article>
        ))}
        <p className="help-footnote">¿No encontraste respuesta? Escríbenos a hola@dopmi.mx</p>
      </div>
    </div>
  );
}

function SavedRescuers() {
  const navigate = useNavigate();
  const { savedRescuerIds, toggleSavedRescuer } = usePrototypeStore();
  const saved = rescuers.filter((item) => savedRescuerIds.includes(item.name));
  return (
    <div className="plain-screen">
      <TopBar title="Rescatistas guardados" back="/profile" icon="icon-bookmark.svg" />
      <div className="content-pad list-stack">
        {saved.length ? (
          saved.map((item) => (
            <article className="card-row" key={item.name}>
              <button className="card-row-main" onClick={() => navigate(`/rescuer-profile/${encodeURIComponent(item.name)}`)}>
                <span className="avatar">{item.name.charAt(0)}</span>
                <span className="nav-row-text">
                  <strong>
                    {item.name}
                    {item.verified ? <AssetIcon name="icon-verified.svg" size={14} alt="Verificado" /> : null}
                  </strong>
                  <small>
                    <Icon name="location.svg" size={12} /> {item.city}
                  </small>
                  <small>{item.publishedCases} casos publicados</small>
                </span>
              </button>
              <button className="icon-button" onClick={() => toggleSavedRescuer(item.name)} aria-label={`Quitar a ${item.name}`}>
                ×
              </button>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-chip yellow">
              <Icon name="icon-bookmark.svg" size={28} />
            </span>
            <h2>Aún no guardas rescatistas</h2>
            <p>Guarda perfiles desde el detalle de un caso.</p>
            <button className="primary-button" onClick={() => navigate("/donate")}>Explorar casos</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportDialog({ title, onClose }: { title: string; onClose: (sent: boolean) => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-backdrop center">
      <div className="dialog-card">
        <button className="dialog-close" onClick={() => onClose(false)} aria-label="Cerrar">×</button>
        <h2>{title}</h2>
        <p>Cuéntanos por qué quieres reportar este perfil. Revisaremos la información para mantener segura a la manada.</p>
        <label className="dialog-field">
          Motivo del reporte
          <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe el motivo del reporte" />
        </label>
        <button className="primary-button" disabled={!reason.trim()} onClick={() => onClose(true)}>Enviar reporte</button>
        <button className="secondary-button" onClick={() => onClose(false)}>Cancelar</button>
      </div>
    </div>
  );
}

function PublicRescuerProfile() {
  const navigate = useNavigate();
  const { caseId = "" } = useParams();
  const { cases, savedRescuerIds, toggleSavedRescuer } = usePrototypeStore();
  const fromCase = cases.find((item) => item.id === caseId);
  const name = fromCase?.rescuer ?? decodeURIComponent(caseId);
  const rescuer = rescuers.find((item) => item.name === name) ?? rescuers[0];
  const [tab, setTab] = useState<"adoption" | "cases" | "activity">("cases");
  const [report, setReport] = useState(false);
  const [toast, setToast] = useState("");
  const saved = savedRescuerIds.includes(rescuer.name);
  const ownCases = cases.filter((item) => item.rescuer === rescuer.name);
  const adoptionList = [
    ...ownCases.filter((item) => item.adoption).map((item) => ({ id: item.id, name: item.name, age: item.age, image: item.image, distance: item.distance, link: `/case/${item.id}` })),
    ...adoptionPets
      .filter((item) => item.rescuer === rescuer.name)
      .map((item) => ({ id: item.id, name: item.name, age: item.sex, image: item.image, distance: item.distance, link: `/adoption/${item.id}` })),
  ];
  const donationCases = ownCases.filter((item) => item.needs.length);
  return (
    <div className="plain-screen">
      <TopBar
        back={fromCase ? `/case/${fromCase.id}` : "/saved-rescuers"}
        actions={
          <>
            <button className="icon-button" onClick={() => setToast("Enlace del perfil copiado")} aria-label="Compartir">
              <Icon name="send.svg" size={20} />
            </button>
            <button className={`icon-button ${saved ? "selected" : ""}`} onClick={() => toggleSavedRescuer(rescuer.name)} aria-label="Guardar rescatista">
              <Icon name="icon-bookmark.svg" size={20} />
            </button>
          </>
        }
      />
      <div className="content-pad rescuer-public">
        <div className="public-profile">
          <span className="avatar xl">{rescuer.name.charAt(0)}</span>
          <h1>
            {rescuer.name}
            {rescuer.verified ? <AssetIcon name="icon-verified.svg" size={20} alt="Verificado" /> : null}
          </h1>
          <p className="public-city">
            <Icon name="location.svg" size={14} /> {rescuer.city}
          </p>
          <strong className="public-count">{rescuer.publishedCases} casos publicados</strong>
          <p className="public-bio">{rescuer.bio}</p>
        </div>
        <h2 className="settings-heading first">Redes sociales</h2>
        <div className="social-links">
          <button onClick={() => setToast(`Instagram ${rescuer.social.instagram} (simulado)`)}>
            <Icon name="icon-instagram.svg" size={18} />
            Instagram
          </button>
          <button onClick={() => setToast(`Facebook ${rescuer.social.facebook} (simulado)`)}>
            <Icon name="icon-facebook.svg" size={18} />
            Facebook
          </button>
        </div>
        <div className="profile-tabs">
          <button className={tab === "adoption" ? "active" : ""} onClick={() => setTab("adoption")}>En adopción</button>
          <button className={tab === "cases" ? "active" : ""} onClick={() => setTab("cases")}>Casos</button>
          <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>Actividad</button>
          <button className="report-link" onClick={() => setReport(true)}>Reportar</button>
        </div>
        {tab === "adoption" ? (
          adoptionList.length ? (
            adoptionList.map((item) => (
              <article className="case-card" key={item.id}>
                <div className="case-image">
                  <img src={item.image} alt={item.name} />
                  <div className="case-title"><strong>{item.name}, {item.age}</strong><span>{item.distance}</span></div>
                </div>
                <div className="need-summary">
                  <div className="card-actions">
                    <button className="primary-button" onClick={() => navigate(item.link)}>Ver ficha</button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-inline">Este rescatista no tiene mascotas en adopción por ahora.</p>
          )
        ) : null}
        {tab === "cases" ? (
          donationCases.length ? (
            donationCases.map((item) => (
              <article className="case-card" key={item.id}>
                <div className="case-image">
                  <img src={item.image} alt={item.name} />
                  <div className="case-title"><strong>{item.name}, {item.age}</strong><span>{item.distance}</span></div>
                </div>
                {item.needs.slice(0, 1).map((need) => (
                  <div className="need-summary" key={need.id}>
                    <div><strong>{need.title}</strong><b>${need.funded} / ${need.requested}</b></div>
                    <div className="progress"><i style={{ width: `${(need.funded / need.requested) * 100}%` }} /></div>
                    <div className="card-actions">
                      <button className="primary-button" onClick={() => navigate(`/donate/${item.id}/${need.id}`)}>Donar</button>
                      <button className="secondary-button" onClick={() => navigate(`/case/${item.id}`)}>Ver caso</button>
                    </div>
                  </div>
                ))}
              </article>
            ))
          ) : (
            <p className="empty-inline">Sin casos de donación activos.</p>
          )
        ) : null}
        {tab === "activity" ? (
          <div className="activity-stack">
            {ownCases.map((item) => (
              <article className="activity-card" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div>
                  <strong>Actualización de {item.name}</strong>
                  <small>Evidencia publicada · hace 2 días</small>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
      {report ? (
        <ReportDialog
          title="Reportar rescatista"
          onClose={(sent) => {
            setReport(false);
            if (sent) setToast("Reporte enviado, lo revisaremos pronto");
          }}
        />
      ) : null}
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}

export default function App() {
  return (
    <div className="prototype-stage">
      <div className="phone-frame">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/choose-intent" element={<ChooseIntent />} />
          <Route path="/onboarding/donor" element={<Onboarding mode="donor" />} />
          <Route path="/onboarding/rescuer" element={<Onboarding mode="rescuer" />} />
          <Route path="/welcome/donor" element={<Welcome mode="donor" />} />
          <Route path="/welcome/rescuer" element={<Welcome mode="rescuer" />} />
          <Route path="/login/donor" element={<Login mode="donor" />} />
          <Route path="/login/rescuer" element={<Login mode="rescuer" />} />
          <Route path="/signup/donor" element={<Login mode="donor" signup />} />
          <Route path="/signup/rescuer" element={<Login mode="rescuer" signup />} />
          <Route path="/forgot-password" element={<StaticSimulated title="Recuperar contraseña" back="/login/donor"><div className="form-stack"><h1>Recupera el acceso</h1><p>Te enviaremos un enlace simulado a tu correo.</p><label>Correo<input type="email" placeholder="nombre@correo.com" /></label><button className="primary-button">Enviar enlace</button></div></StaticSimulated>} />
          <Route path="/terms" element={<StaticSimulated title="Términos y Condiciones" back="/signup/donor"><div className="legal-copy"><h1>Términos de uso de DopMi</h1><p>Contenido provisional para validar la apertura, lectura y retorno al registro. El texto legal final requiere aprobación del equipo.</p><h2>Uso del prototipo</h2><p>No se procesan pagos, documentos ni verificaciones reales.</p></div></StaticSimulated>} />
          <Route path="/adoption" element={<AdoptionHome />} />
          <Route path="/adoption/:petId" element={<AdoptionDetail />} />
          <Route path="/donate" element={<DonationHome />} />
          <Route path="/case/:caseId" element={<CaseDetail />} />
          <Route path="/donate/:caseId/:needId" element={<DonationFlow />} />
          <Route path="/donation-success/:caseId" element={<DonationSuccess />} />
          <Route path="/payment-error/:caseId/:needId" element={<PaymentError />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/impact/support" element={<ImpactSupport />} />
          <Route path="/impact/success" element={<ImpactSuccess />} />
          <Route path="/impact/error" element={<ImpactError />} />
          <Route path="/messages/:threadId" element={<Messages />} />
          <Route path="/notifications" element={<NotificationList />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<DonorProfile />} />
          <Route path="/saved" element={<SavedPets />} />
          <Route path="/saved-rescuers" element={<SavedRescuers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/basic-info" element={<BasicInfo />} />
          <Route path="/settings/payment-methods" element={<PaymentMethods />} />
          <Route path="/settings/billing" element={<Billing />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/rescuer-profile/:caseId" element={<PublicRescuerProfile />} />
          <Route path="/rescuer" element={<RescuerHome />} />
          <Route path="/rescuer/verification" element={<VerificationFlow />} />
          <Route path="/rescuer/cases" element={<RescuerCases />} />
          <Route path="/rescuer/cases/:caseId" element={<RescuerCaseDetail />} />
          <Route path="/rescuer/publish" element={<PublishFlow />} />
          <Route path="/rescuer/evidence/:caseId/:needId" element={<EvidenceFlow />} />
          <Route path="/rescuer/food/:caseId/:needId" element={<FoodCycle />} />
          <Route path="/rescuer/messages" element={<RescuerMessages />} />
          <Route path="/rescuer/profile" element={<RescuerProfile />} />
          <Route path="/rescuer/settings" element={<RescuerSettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <TestPanel />
    </div>
  );
}
