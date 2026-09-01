import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  adoptionPets,
  donationLog,
  donorFaqs,
  mergeAdoptionListings,
  paymentHistory,
  rescuerFaqs,
  rescuers,
  rescuerDisplayName,
  rescuerPaymentMovements,
  savedCards,
  subscriptionPlans,
  type Need,
  type NotificationKind,
  type PetCase,
} from "./data";
import { usePrototypeStore, type AccountMode, type Verification } from "./store";
import { PublishFlow as PublishFlowWizard } from "./publish/PublishFlow";
import {
  PERSONALITY_OPTIONS,
  type AdoptionAgeBand,
  type AdoptionEnergy,
  type AdoptionSize,
  type PersonalityTrait,
} from "./publish/types";
import { LocationMap } from "./components/LocationMap";
import { CasePublicView, caseToViewModel } from "./components/CasePublicView";
import { AdoptionPublicView } from "./components/AdoptionPublicView";

const A = "/assets/";

const caseStatusLabel: Record<PetCase["caseStatus"], string> = {
  draft: "Borrador",
  review: "En revisión",
  needs_corrections: "Requiere correcciones",
  approved_stripe_pending: "Aprobado · Acción pendiente",
  active: "Esperando donaciones",
  funded: "Meta cumplida",
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
    emptyStates,
    cases,
    setPaymentOutcome,
    setVerification,
    setAccountMode,
    setEmptyStates,
    resetPrototype,
    approveCaseForPublish,
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
          <label className="test-toggle-row">
            <span>Empty states (incl. movimientos)</span>
            <button
              type="button"
              className={`switch ${emptyStates ? "on" : ""}`}
              role="switch"
              aria-checked={emptyStates}
              aria-label="Mostrar empty states"
              onClick={() => {
                setEmptyStates(!emptyStates);
              }}
            >
              <i />
            </button>
          </label>
          <div className="test-shortcuts">
            <button onClick={() => navigate("/donate")}>Donación</button>
            <button onClick={() => navigate("/rescuer/publish")}>Publicar</button>
            <button onClick={() => navigate("/rescuer/profile/payments")}>Pagos</button>
            <button onClick={() => navigate("/notifications")}>Notificaciones</button>
            <button
              onClick={() => {
                cases
                  .filter((item) => item.caseStatus === "review")
                  .forEach((item) => approveCaseForPublish(item.id));
              }}
            >
              Aprobar casos en revisión
            </button>
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
    <button className="splash" onClick={() => navigate("/choose-intent")} aria-label="Continuar a DopMi">
      <img
        className="splash-wordmark"
        src={`${A}splash-wordmark.png`}
        alt="DopMi"
        width={258}
        height={86}
      />
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
          <h1>¡Woof woof!</h1>
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
  const { setPhoneVerification, phoneVerification, setAccountMode } = usePrototypeStore();
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState<"form" | "phone" | "code" | "done">("form");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const demoCode = "123456";

  const finish = () => {
    setAccountMode(mode);
    setPhoneVerification({ status: "verified", phone });
    navigate(mode === "donor" ? "/adoption" : "/rescuer");
  };

  const submitForm = (event: FormEvent) => {
    event.preventDefault();
    setStep("phone");
  };

  const sendCode = (event: FormEvent) => {
    event.preventDefault();
    if (!phone.trim()) return;
    setPhoneVerification({ status: "code_sent", phone: phone.trim() });
    setError("");
    setStep("code");
  };

  const verifyCode = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim() === "000000") {
      setError("El código expiró. Solicita uno nuevo.");
      setPhoneVerification({ status: "expired", phone });
      return;
    }
    if (code.trim() !== demoCode) {
      setError("Código incorrecto. Intenta de nuevo.");
      setPhoneVerification({ status: "wrong_code", phone });
      return;
    }
    setError("");
    setStep("done");
  };

  if (step === "phone") {
    return (
      <div className="plain-screen auth-flow">
        <BrandHeader back={() => setStep("form")} />
        <form className="form-stack auth-form" onSubmit={sendCode}>
          <div className="auth-form-head">
            <h1>Verifica tu celular</h1>
            <p>Te enviaremos un código de 6 dígitos por SMS (simulado).</p>
          </div>
          <label>
            Número
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 55 1234 5678" />
          </label>
          <button className="primary-button" type="submit">Enviar código</button>
        </form>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="plain-screen auth-flow">
        <BrandHeader back={() => setStep("phone")} />
        <form className="form-stack auth-form" onSubmit={verifyCode}>
          <div className="auth-form-head">
            <h1>Ingresa el código</h1>
            <p>Enviado a {phone}. Usa 123456 para éxito, 000000 para expirado.</p>
          </div>
          <label>
            Código
            <input required inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 dígitos" />
          </label>
          {error ? <p className="field-error">{error}</p> : null}
          <button className="primary-button" type="submit">Verificar</button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setError("");
              setCode("");
              setPhoneVerification({ status: "code_sent", phone });
            }}
          >
            Reenviar código
          </button>
        </form>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="plain-screen auth-flow">
        <BrandHeader />
        <div className="form-stack auth-form">
          <div className="auth-form-head">
            <h1>Celular verificado</h1>
            <p>Tu número quedó confirmado. Ya puedes continuar.</p>
          </div>
          <button className="primary-button" type="button" onClick={finish}>Continuar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="plain-screen auth-flow">
      <BrandHeader back={`/welcome/${mode}`} />
      <form className="form-stack auth-form" onSubmit={submitForm}>
        <div className="auth-form-head">
          <h1>{signup ? "Crear cuenta" : "Iniciar sesión"}</h1>
          <p>{signup ? "Únete a la comunidad de DopMi" : "Bienvenido de vuelta"}</p>
        </div>
        {signup ? <label>Nombre completo *<input required placeholder="Tu nombre" /></label> : null}
        <label>Correo electrónico{signup ? " *" : ""}<input required type="email" placeholder="tu@email.com" /></label>
        <label>
          Contraseña{signup ? " *" : ""}
          <input required type="password" placeholder={signup ? "Mínimo 6 caracteres" : "Tu contraseña"} />
        </label>
        {signup ? <label>Confirmar contraseña *<input required type="password" placeholder="Confirma tu contraseña" /></label> : null}
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
          <button type="button" className="inline-link" onClick={() => navigate(`/forgot-password?mode=${mode}`)}>
            Olvidé mi contraseña
          </button>
        )}
        <button className="primary-button" disabled={signup && !accepted} type="submit">
          {signup ? "Continuar" : "Iniciar sesión"}
        </button>
        <div className="or-divider"><span>O continúa con</span></div>
        <SocialButtons variant="outline" onPick={() => setStep("phone")} />
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


function ForgotPasswordFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const modeParam = new URLSearchParams(location.search).get("mode");
  const mode: AccountMode = modeParam === "rescuer" ? "rescuer" : "donor";
  const loginPath = `/login/${mode}`;
  const qs = `?mode=${mode}`;
  const step = forgotStepFromPath(location.pathname);
  const stateEmail = (location.state as { email?: string } | null)?.email ?? "";

  const [email, setEmail] = useState(stateEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (stateEmail) setEmail(stateEmail);
  }, [stateEmail]);

  const go = (next: ForgotStep, nextEmail = email) => {
    const path =
      next === "request"
        ? `/forgot-password${qs}`
        : next === "sent"
          ? `/forgot-password/sent${qs}`
          : next === "reset"
            ? `/forgot-password/reset${qs}`
            : `/forgot-password/done${qs}`;
    navigate(path, { state: { email: nextEmail } });
  };

  const backForStep =
    step === "request"
      ? loginPath
      : step === "sent"
        ? () => go("request")
        : step === "reset"
          ? () => go("sent")
          : () => go("reset");

  const submitRequest = (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;
    go("sent", value);
  };

  const submitReset = (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      setError("Usa al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    go("done");
  };

  return (
    <div className="plain-screen auth-flow">
      <BrandHeader back={backForStep} />
      <SimulatedBanner />
      {step === "request" ? (
        <form className="form-stack auth-form" onSubmit={submitRequest}>
          <div className="auth-form-head">
            <h1>Recuperar contraseña</h1>
            <p>Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.</p>
          </div>
          <label>
            Correo electrónico
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </label>
          <button type="submit" className="primary-button">
            Enviar
          </button>
          <button type="button" className="inline-link auth-back-link" onClick={() => navigate(loginPath)}>
            Volver a iniciar sesión
          </button>
        </form>
      ) : null}

      {step === "sent" ? (
        <div className="form-stack auth-form">
          <div className="auth-form-head">
            <h1>Revisa tu correo</h1>
            <p>
              Si hay una cuenta con <strong>{email || "tu correo"}</strong>, te enviamos un enlace para restablecer tu
              contraseña. Revisa también la carpeta de spam.
            </p>
          </div>
          <button type="button" className="primary-button" onClick={() => go("reset")}>
            Abrir enlace del correo
          </button>
          <button
            type="button"
            className="inline-link auth-back-link"
            onClick={() => setToast("Enlace reenviado")}
          >
            Reenviar enlace
          </button>
          <button type="button" className="inline-link auth-back-link" onClick={() => navigate(loginPath)}>
            Volver a iniciar sesión
          </button>
        </div>
      ) : null}

      {step === "reset" ? (
        <form className="form-stack auth-form" onSubmit={submitReset}>
          <div className="auth-form-head">
            <h1>Crea una nueva contraseña</h1>
            <p>Debe tener al menos 6 caracteres.</p>
          </div>
          <label>
            Nueva contraseña
            <input
              required
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirmar contraseña
            <input
              required
              type="password"
              value={confirm}
              onChange={(event) => {
                setConfirm(event.target.value);
                setError("");
              }}
              placeholder="Confirma tu contraseña"
              autoComplete="new-password"
            />
          </label>
          {error ? <p className="field-error">{error}</p> : null}
          <button type="submit" className="primary-button">
            Guardar contraseña
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="form-stack auth-form">
          <div className="auth-form-head">
            <h1>Contraseña actualizada</h1>
            <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
          </div>
          <button type="button" className="primary-button" onClick={() => navigate(loginPath)}>
            Iniciar sesión
          </button>
        </div>
      ) : null}

      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
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

function LegalTermsPage() {
  const accountMode = usePrototypeStore((state) => state.accountMode);
  const back = accountMode === "rescuer" ? "/rescuer/profile/legal" : "/signup/donor";
  return (
    <StaticSimulated title="Términos y Condiciones" back={back}>
      <div className="legal-copy">
        <h1>Términos de uso de DopMi</h1>
        <p>Contenido provisional para validar la apertura, lectura y retorno. El texto legal final requiere aprobación del equipo.</p>
        <h2>Uso del prototipo</h2>
        <p>No se procesan pagos, documentos ni verificaciones reales.</p>
      </div>
    </StaticSimulated>
  );
}

function LegalPrivacyPage() {
  const accountMode = usePrototypeStore((state) => state.accountMode);
  const back = accountMode === "rescuer" ? "/rescuer/profile/legal" : "/settings";
  return (
    <StaticSimulated title="Aviso de privacidad" back={back}>
      <div className="legal-copy">
        <h1>Aviso de privacidad</h1>
        <p>Contenido provisional. DopMi trata los datos del prototipo solo para validar la experiencia; no se procesan datos reales.</p>
      </div>
    </StaticSimulated>
  );
}

function AdoptionHome() {
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet, notifications, emptyStates, cases } = usePrototypeStore();
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftSex, setDraftSex] = useState<Array<"Macho" | "Hembra">>([]);
  const [draftType, setDraftType] = useState<Array<"Perro" | "Gato">>([]);
  const [draftNameQuery, setDraftNameQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [sexFilter, setSexFilter] = useState<Array<"Macho" | "Hembra">>([]);
  const [typeFilter, setTypeFilter] = useState<Array<"Perro" | "Gato">>([]);
  const unread = notifications.filter((item) => !item.read).length;
  const filtersActive = sexFilter.length > 0 || typeFilter.length > 0 || Boolean(nameQuery.trim());

  const allPets = useMemo(() => mergeAdoptionListings(adoptionPets, cases), [cases]);
  const pets = emptyStates
    ? []
    : allPets.filter((pet) => {
        const sexOk = !sexFilter.length || sexFilter.includes(pet.sex);
        const typeOk = !typeFilter.length || typeFilter.includes(pet.type);
        const nameOk = !nameQuery.trim() || pet.name.toLowerCase().includes(nameQuery.trim().toLowerCase());
        return sexOk && typeOk && nameOk;
      });

  const openFilters = () => {
    setDraftSex(sexFilter);
    setDraftType(typeFilter);
    setDraftNameQuery(nameQuery);
    setFilterOpen(true);
  };

  const toggleDraft = <T extends string>(value: T, list: T[], setList: (next: T[]) => void) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const applyFilters = () => {
    setSexFilter(draftSex);
    setTypeFilter(draftType);
    setNameQuery(draftNameQuery);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftSex([]);
    setDraftType([]);
    setDraftNameQuery("");
    setSexFilter([]);
    setTypeFilter([]);
    setNameQuery("");
    setFilterOpen(false);
  };

  return (
    <ScreenShell
      className="adoption-shell"
      overlay={
        filterOpen ? (
          <div className="modal-backdrop center" onClick={() => setFilterOpen(false)}>
            <div className="dialog-card adoption-filter-dialog" onClick={(event) => event.stopPropagation()}>
              <button className="dialog-close" onClick={() => setFilterOpen(false)} aria-label="Cerrar">×</button>
              <header className="adoption-filter-header">
                <h2>Filtros de adopción</h2>
                <p>Filtra las mascotas disponibles para adopción</p>
              </header>
              <div className="adoption-filter-grid">
                <section>
                  <h3>Buscar por nombre</h3>
                  <label className="filter-search">
                    <span className="visually-hidden">Nombre de la mascota</span>
                    <input
                      value={draftNameQuery}
                      onChange={(event) => setDraftNameQuery(event.target.value)}
                      placeholder="Nombre de la mascota"
                    />
                  </label>
                </section>
                <section>
                  <h3>Sexo</h3>
                  <div className="filter-options">
                    <label className="filter-check">
                      <input
                        type="checkbox"
                        checked={draftSex.includes("Macho")}
                        onChange={() => toggleDraft("Macho", draftSex, setDraftSex)}
                      />
                      <span>Macho</span>
                    </label>
                    <label className="filter-check">
                      <input
                        type="checkbox"
                        checked={draftSex.includes("Hembra")}
                        onChange={() => toggleDraft("Hembra", draftSex, setDraftSex)}
                      />
                      <span>Hembra</span>
                    </label>
                  </div>
                </section>
                <section>
                  <h3>Tipo</h3>
                  <div className="filter-options">
                    <label className="filter-check">
                      <input
                        type="checkbox"
                        checked={draftType.includes("Gato")}
                        onChange={() => toggleDraft("Gato", draftType, setDraftType)}
                      />
                      <span>Gato</span>
                    </label>
                    <label className="filter-check">
                      <input
                        type="checkbox"
                        checked={draftType.includes("Perro")}
                        onChange={() => toggleDraft("Perro", draftType, setDraftType)}
                      />
                      <span>Perro</span>
                    </label>
                  </div>
                </section>
              </div>
              <div className="adoption-filter-actions">
                <button type="button" className="primary-button" onClick={applyFilters}>Aplicar filtros</button>
                <button type="button" className="secondary-button" onClick={clearFilters}>Limpiar filtros</button>
              </div>
            </div>
          </div>
        ) : null
      }
    >
      <div className="adoption-feed">
        {filtersActive ? (
          <div className="filter-chip-row">
            {nameQuery.trim() ? (
              <button type="button" className="filter-chip" onClick={() => setNameQuery("")}>
                Nombre: {nameQuery.trim()} ×
              </button>
            ) : null}
            <button type="button" className="text-button" onClick={clearFilters}>Limpiar filtros</button>
          </div>
        ) : null}
        {!pets.length ? (
          <section className="adoption-empty">
            <div className="adoption-empty-top">
              <h1>Adopción</h1>
              <button type="button" className="icon-button" onClick={openFilters} aria-label="Filtros">
                <AssetIcon name="filter.svg" size={20} />
              </button>
            </div>
            <article className="empty-card donor-empty-card">
              <span className="empty-chip yellow">
                <Icon name="icon-heart.svg" size={28} />
              </span>
              <h2>No hay mascotas disponibles</h2>
              <p>
                {filtersActive && !emptyStates
                  ? "Prueba otros filtros o limpia la selección para ver más opciones."
                  : "Por ahora no hay mascotas en adopción. Vuelve pronto o apoya a quienes ya buscan ayuda."}
              </p>
              {filtersActive && !emptyStates ? (
                <button type="button" className="secondary-button" onClick={clearFilters}>Limpiar filtros</button>
              ) : (
                <button type="button" className="primary-button" onClick={() => navigate("/donate")}>
                  Ir a Donar
                </button>
              )}
            </article>
          </section>
        ) : null}
        {pets.map((pet) => {
          const attrs = [pet.ageBand, pet.size, pet.energy].filter(Boolean).join(" · ");
          return (
            <section className="adoption-slide" key={pet.id}>
              <img className="adoption-image" src={pet.image} alt={pet.name} />
              <div className="adoption-shade" />
              <div className="floating-actions">
                <button onClick={openFilters} aria-label="Filtros"><AssetIcon name="filter.svg" /></button>
                <button onClick={() => navigate("/messages")} aria-label="Mensajes">
                  <AssetIcon name="messages.svg" />
                  {unread > 0 && <span className="notification-dot">{unread}</span>}
                </button>
              </div>
              <div className="swipe-hint"><AssetIcon name="swipe.svg" size={16} /><span>Desliza</span></div>
              <div className="adoption-info">
                <h1>{pet.name}</h1>
                {attrs ? <span>{attrs}</span> : <span>{pet.sex}</span>}
                <p>{pet.story}</p>
                <div className="meta-row"><AssetIcon name="location.svg" size={14} /> {pet.location}</div>
              </div>
              <div className="adoption-cta">
                <button
                  className={`round-action ${savedPetIds.includes(pet.id) ? "selected" : ""}`}
                  onClick={() => toggleSavedPet(pet.id)}
                  aria-label={savedPetIds.includes(pet.id) ? "Quitar de guardados" : "Guardar"}
                >
                  <Icon name="icon-bookmark.svg" size={20} />
                </button>
                <button className="primary-button" onClick={() => navigate(`/adoption/${pet.id}`)}>Conocer más de {pet.name}</button>
              </div>
            </section>
          );
        })}
      </div>
    </ScreenShell>
  );
}

function TraitRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`trait-row ${ok ? "ok" : "off"}`}>
      <AssetIcon name={ok ? "onb-check.svg" : "icon-x-muted.svg"} size={20} />
      <span>{label}</span>
    </div>
  );
}


function AdoptionDetail() {
  const { petId = "rocky" } = useParams();
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet, cases } = usePrototypeStore();
  const listings = useMemo(() => mergeAdoptionListings(adoptionPets, cases), [cases]);
  const pet = listings.find((item) => item.id === petId) ?? listings[0];
  const saved = savedPetIds.includes(pet.id);
  return (
    <ScreenShell mode="donor">
      <AdoptionPublicView
        data={{
          id: pet.id,
          name: pet.name,
          sex: pet.sex,
          species: pet.type,
          image: pet.image,
          story: pet.story,
          location: pet.location,
          rescuer: pet.rescuer,
          distance: pet.distance,
          verified: pet.verified,
          ageBand: pet.ageBand,
          age: pet.ageBand,
          size: pet.size,
          energy: pet.energy,
          personality: pet.personality,
          health: pet.health,
          social: pet.social,
        }}
        onBack={() => navigate("/adoption")}
        onOpenRescuer={() => navigate(`/rescuer-profile/${encodeURIComponent(pet.rescuer)}`)}
        saved={saved}
        onToggleSave={() => toggleSavedPet(pet.id)}
      />
    </ScreenShell>
  );
}


function DonationHome() {
  const navigate = useNavigate();
  const { cases, savedPetIds, toggleSavedPet, emptyStates } = usePrototypeStore();
  const openCases = emptyStates
    ? []
    : cases.filter((item) => item.caseStatus === "active" && item.needs.some((need) => need.status === "active"));
  return (
    <ScreenShell>
      <div className="content-pad donation-list">
        <div className="section-heading">
          <div>
            <h1>Apoya a la manada DopMi</h1>
            <p>
              {openCases.length
                ? "Elige a quien más conecte contigo. Cada peso ayuda a mantenerlos sanos y fuertes."
                : "Cuando haya mascotas que necesiten apoyo, aparecerán aquí."}
            </p>
          </div>
        </div>
        {!openCases.length ? (
          <article className="empty-card donor-empty-card">
            <span className="empty-chip yellow">
              <Icon name="tab-donate.svg" size={28} />
            </span>
            <h2>No hay casos para donar</h2>
            <p>Por ahora no hay necesidades abiertas. Mientras tanto, puedes conocer mascotas en adopción.</p>
            <button type="button" className="primary-button" onClick={() => navigate("/adoption")}>
              Ir a Adopción
            </button>
          </article>
        ) : (
          openCases.map((item) => {
            const need = item.needs.find((entry) => entry.status === "active")!;
            return (
              <article className="case-card" key={item.id}>
                <div className="case-image">
                  <img src={item.image} alt={item.name} />
                  {null}
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
          })
        )}
      </div>
    </ScreenShell>
  );
}

function NeedCard({ need, caseId, defaultOpen = false }: { need: Need; caseId: string; defaultOpen?: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(defaultOpen);
  const remaining = Math.max(0, need.requested - need.funded);
  const fullyFunded = remaining === 0 || need.status === "funded" || need.status === "completed" || need.status === "evidence";
  const pct = need.requested ? Math.min(100, Math.round((need.funded / need.requested) * 100)) : 0;
  const typeLabel =
    need.type === "Comida" ? "comida" : need.type === "Medicina" ? "medicina" : need.type === "Veterinario" ? "veterinario" : "otra";

  return (
    <article className={`need-card donor-need-card ${open ? "open" : ""}`}>
      <div className="need-card-head">
        <span className={`need-symbol soft ${typeLabel}`}>{needEmoji(need.type)}</span>
        <div className="need-card-copy">
          <div className="need-card-title-row">
            <div>
              <strong>{need.title}</strong>
              <span className="need-type-row">
                <small>{typeLabel}</small>
                {null}
              </span>
            </div>
            <div className="need-price-row">
              <b>${need.requested}</b>
              <button
                type="button"
                className="need-expand"
                aria-expanded={open}
                aria-label={open ? "Ocultar detalle" : "Ver detalle"}
                onClick={() => setOpen((value) => !value)}
              >
                <Chevron />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="split-meta">
        <span>${need.requested} total</span>
        <strong>${remaining} por recaudar</strong>
      </div>
      <div className="progress"><i style={{ width: `${pct}%` }} /></div>
      <button
        type="button"
        className={`primary-button need-donate-btn ${fullyFunded ? "funded" : ""}`}
        disabled={fullyFunded}
        onClick={() => navigate(`/donate/${caseId}/${need.id}`)}
      >
        {fullyFunded ? "Completamente fondeada" : "Donar"}
      </button>
      {open ? (
        <div className="need-details">
          <h3>Detalle de la necesidad</h3>
          {need.type === "Comida" ? (
            <>
              <div className="need-product-row">
                <span aria-hidden="true">🍖</span>
                <div>
                  <strong>{need.title}</strong>
                  <small>Alimento para cachorro</small>
                  <div className="need-product-meta">
                    <b>${need.requested} MXN</b>
                  </div>
                </div>
              </div>
            </>
          ) : need.type === "Medicina" ? (
            <div className="need-facts-card">
              <div>
                <small>Medicina</small>
                <strong>{need.title}</strong>
              </div>
              <div>
                <small>Costo a cubrir</small>
                <strong>${need.requested} MXN</strong>
              </div>
              <div>
                <small>Propósito del tratamiento</small>
                <strong>Desparasitación inicial</strong>
              </div>
            </div>
          ) : (
            <div className="need-facts-card">
              <div>
                <small>Tipo de servicio</small>
                <strong>Consulta</strong>
              </div>
              <div>
                <small>Costo</small>
                <strong>${need.requested} MXN</strong>
              </div>
            </div>
          )}
          <div className="need-totals-card">
            <div>
              <small>Total necesario</small>
              <strong>${need.requested}</strong>
            </div>
            <div>
              <small>Recaudado</small>
              <strong className="amount">${need.funded}</strong>
            </div>
            <div>
              <small>Por recaudar</small>
              <strong>${remaining}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}


function CaseDetail() {
  const { caseId = "luna" } = useParams();
  const navigate = useNavigate();
  const { cases, savedPetIds, toggleSavedPet } = usePrototypeStore();
  const item = cases.find((entry) => entry.id === caseId) ?? cases[0];
  return (
    <ScreenShell mode="donor">
      <CasePublicView
        data={caseToViewModel(item)}
        onBack={() => navigate(-1)}
        onDonateNeed={(needId) => navigate(`/donate/${item.id}/${needId}`)}
        onOpenRescuer={() => navigate(`/rescuer-profile/${item.id}`)}
      />
    </ScreenShell>
  );
}


function DonationFlow() {
  const { caseId = "luna", needId = "luna-food" } = useParams();
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
  const { guardianActive, emptyStates, guardianImpactReady } = usePrototypeStore();
  if (guardianActive) {
    const showEmpty = emptyStates || !guardianImpactReady;
    const stories = [
      { name: "Luna", image: "impact-luna.png", type: "Suscripción mensual", amount: 200, author: "Ana García", time: "Hace 2 días", copy: "Luna recibió su comida mensual gracias a tu suscripción. ¡Ya está mucho más fuerte!" },
      { name: "Milo", image: "impact-milo.png", type: "Donación directa", amount: 500, author: "Carlos Ruiz", time: "Hace 5 días", copy: "Milo completó su tratamiento de vacunas. Tu donación directa ayudó a proteger su salud." },
      { name: "Max", image: "impact-max.png", type: "Suscripción mensual", amount: 150, author: "María López", time: "Hace 1 semana", copy: "Max recibió atención veterinaria de emergencia. Tu contribución mensual hizo la diferencia." },
      { name: "Bella", image: "impact-bella.png", type: "Suscripción mensual", amount: 100, author: "Ana García", time: "Hace 2 semanas", copy: "Bella está lista para adopción gracias a las donaciones de la comunidad. ¡Tu ayuda fue clave!" },
    ];
    return (
      <ScreenShell>
        <div className="content-pad impact-page">
          <div className="impact-heading">
            <h1>Vidas que continúan gracias a ti.</h1>
            <p>Todas estas huellitas recibieron tu impacto, Guardián! Gracias por confiar en nosotros.</p>
          </div>
          {showEmpty ? (
            <article className="empty-card donor-empty-card impact-empty-card">
              <span className="empty-chip yellow">
                <AssetIcon name="empty-impact-paw.svg" size={32} />
              </span>
              <h2>Aquí verás las mascotas que hayas apoyado</h2>
              <p>Actualmente no hay registro de donaciones.</p>
            </article>
          ) : (
            stories.map((item) => (
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
            ))
          )}
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
  const location = useLocation();
  const { paymentOutcome, setGuardian } = usePrototypeStore();
  const presets = [50, 200, 500];
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState(false);
  const [method, setMethod] = useState<"card" | "apple" | "google">("card");
  const total = `$${amount.toFixed(2)} MXN`;
  const backPath =
    typeof location.state === "object" &&
    location.state &&
    "from" in location.state &&
    typeof (location.state as { from?: unknown }).from === "string"
      ? (location.state as { from: string }).from
      : "/impact";
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
      <TopBar back={backPath} />
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
    <div className={`plain-screen chat-screen ${accountMode === "donor" ? "adopter-chat" : "rescuer-chat"}`}>
      <TopBar title="Ana P." back={accountMode === "donor" ? "/messages" : "/rescuer/messages"} actions={<span className="online-label">En línea</span>} />
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

function DonorMessages() {
  const navigate = useNavigate();
  const { messages, emptyStates } = usePrototypeStore();
  const last = messages[messages.length - 1];
  const threads = emptyStates
    ? []
    : [
        { id: "luna", initial: "M", name: "María R.", about: "re: Luna", preview: last?.text ?? "¡Hola! ¿Te interesa conocer más de Luna?", time: last?.time ?? "5m", unread: last?.author === "rescuer" ? 1 : 0 },
        { id: "rocky", initial: "C", name: "Carlos Ruiz", about: "re: Rocky", preview: "Puedes visitarlo el sábado por la mañana.", time: "2h", unread: 0 },
        { id: "milo", initial: "L", name: "Laura V.", about: "re: Milo", preview: "Gracias por tu interés en adoptar.", time: "Ayer", unread: 0 },
      ];
  return (
    <ScreenShell>
      <TopBar title="Mensajes" back="/adoption" />
      <div className="content-pad donor-messages">
        <p className="section-lead">Habla con rescatistas</p>
        {threads.length === 0 ? (
          <article className="empty-card donor-empty-card messages-empty-card">
            <span className="empty-chip yellow">
              <Icon name="icon-messages.svg" size={28} />
            </span>
            <h2>No tienes mensajes</h2>
            <p>Cuando contactes a un rescatista sobre una mascota, verás las conversaciones aquí.</p>
            <button type="button" className="primary-button" onClick={() => navigate("/adoption")}>
              Ir a Adopción
            </button>
          </article>
        ) : (
          <div className="thread-list donor-thread-list">
            {threads.map((thread) => (
              <button className="thread-row" key={thread.id} onClick={() => navigate(`/messages/${thread.id}`)}>
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
        )}
      </div>
    </ScreenShell>
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
  const { notifications, markNotificationRead, emptyStates } = usePrototypeStore();
  const items = emptyStates ? [] : notifications;
  return (
    <div className="plain-screen">
      <TopBar title="Notificaciones" back="/profile" />
      <div className="content-pad notification-stack">
        {items.length === 0 ? (
          <article className="empty-card donor-empty-card notifications-empty">
            <span className="empty-chip yellow">
              <Icon name="icon-bell.svg" size={28} />
            </span>
            <h2>No tienes notificaciones</h2>
            <p>Cuando haya novedades de donaciones, mensajes o casos, aparecerán aquí.</p>
            <button type="button" className="primary-button" onClick={() => navigate("/donate")}>
              Ir a Donar
            </button>
          </article>
        ) : (
          items.map((item) => (
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
          ))
        )}
      </div>
    </div>
  );
}

function History() {
  const navigate = useNavigate();
  const rows = useDonationLogRows();
  return (
    <div className="plain-screen">
      <TopBar title="Historial de donaciones" back="/profile" />
      <div className="content-pad log-section">
        {rows.length ? (
          <>
            <p>Cada aportación registrada con su caso, concepto y estado.</p>
            <DonationLogTable rows={rows} />
          </>
        ) : (
          <article className="empty-card donor-empty-card donation-log-empty">
            <span className="empty-chip yellow">
              <Icon name="tab-donate.svg" size={28} />
            </span>
            <h2>Aún no tienes donaciones</h2>
            <p>Cuando apoyes un caso, verás aquí el registro de tus aportaciones.</p>
            <button type="button" className="primary-button" onClick={() => navigate("/donate")}>
              Ir a Donar
            </button>
          </article>
        )}
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
  const { donations, cases, emptyStates } = usePrototypeStore();
  if (emptyStates) return [];
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
  const { savedPetIds, savedRescuerIds, notifications, setAccountMode, guardianActive, donorProfile } = usePrototypeStore();
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
          <span className={`member-avatar ${donorProfile.avatar ? "has-photo" : ""}`}>
            {donorProfile.avatar ? <img src={donorProfile.avatar} alt="" /> : donorProfile.name.charAt(0)}
          </span>
          <div>
            <strong>{donorProfile.name}</strong>
            <span>{guardianActive ? "Guardián" : "Miembro de la Comunidad"}</span>
          </div>
        </article>

        <section className="log-section">
          <h2>Registro de donaciones</h2>
          {rows.length ? (
            <>
              <DonationLogTable rows={rows} />
              <button className="ghost-button" onClick={() => navigate("/history")}>Ver más</button>
            </>
          ) : (
            <article className="empty-card donor-empty-card donation-log-empty">
              <span className="empty-chip yellow">
                <Icon name="tab-donate.svg" size={28} />
              </span>
              <h2>Aún no tienes donaciones</h2>
              <p>Cuando apoyes un caso, verás aquí el registro de tus aportaciones.</p>
              <button type="button" className="primary-button" onClick={() => navigate("/donate")}>
                Ir a Donar
              </button>
            </article>
          )}
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
  const { savedPetIds, toggleSavedPet, cases, emptyStates } = usePrototypeStore();
  const [tab, setTab] = useState<"donation" | "adoption">("adoption");
  const adoptionList = useMemo(() => mergeAdoptionListings(adoptionPets, cases), [cases]);
  const items = emptyStates
    ? []
    : tab === "adoption"
      ? adoptionList.filter((item) => savedPetIds.includes(item.id))
      : cases.filter((item) => savedPetIds.includes(item.id));
  const explorePath = tab === "donation" ? "/donate" : "/adoption";
  return (
    <div className="plain-screen">
      <TopBar title="Mascotas guardadas" back="/profile" />
      <div className="content-pad">
        <div className="segmented-control">
          <button className={tab === "donation" ? "active" : ""} onClick={() => setTab("donation")}>
            Casos de donación
          </button>
          <button className={tab === "adoption" ? "active" : ""} onClick={() => setTab("adoption")}>
            En adopción
          </button>
        </div>
        {!items.length ? (
          <div className="empty-state">
            <h2>Aún no guardas mascotas</h2>
            <p>Usa el marcador en cards y detalles para encontrarlas aquí.</p>
            <button type="button" className="primary-button" onClick={() => navigate(explorePath)}>
              Explorar
            </button>
          </div>
        ) : (
          items.map((item) => (
            <article className="saved-row" key={item.id}>
              <img src={item.image} alt="" />
              <button onClick={() => navigate(tab === "adoption" ? `/adoption/${item.id}` : `/case/${item.id}`)}>
                <strong>{item.name}</strong>
                <span>
                  {tab === "adoption" && "ageBand" in item && item.ageBand
                    ? [item.ageBand, "size" in item ? item.size : null, "energy" in item ? item.energy : null]
                        .filter(Boolean)
                        .join(" · ")
                    : "Ver detalle"}
                </span>
              </button>
              <button className="icon-button" onClick={() => toggleSavedPet(item.id)}>
                <AssetIcon name="bookmark.svg" />
              </button>
            </article>
          ))
        )}
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
  if (accountMode === "rescuer") return <Navigate to="/rescuer/profile" replace />;
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
  const navigate = useNavigate();
  const { donorProfile, updateDonorProfile } = usePrototypeStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: donorProfile.name,
    email: donorProfile.email,
    phone: donorProfile.phone,
    city: donorProfile.city,
    avatar: donorProfile.avatar ?? "",
  });
  const [toast, setToast] = useState("");
  const canSave = form.name.trim() && form.email.trim() && form.phone.trim() && form.city.trim();

  const pickPhoto = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setForm((current) => ({ ...current, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!canSave) return;
    updateDonorProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      avatar: form.avatar || undefined,
    });
    setToast("Cambios guardados");
    window.setTimeout(() => navigate("/settings"), 500);
  };

  return (
    <div className="plain-screen">
      <TopBar title="Información básica" back="/settings" />
      <div className="content-pad form-stack">
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => pickPhoto(event.target.files?.[0])}
        />
        <button type="button" className="photo-card profile-photo-card" onClick={() => fileRef.current?.click()}>
          <span className={`avatar large ${form.avatar ? "has-photo" : ""}`}>
            {form.avatar ? <img src={form.avatar} alt="" /> : (form.name.trim().charAt(0) || "A")}
            <span className="avatar-camera">
              <AssetIcon name="onb-camera.svg" size={12} />
            </span>
          </span>
          <span className="nav-row-text">
            <strong>Foto de perfil</strong>
            <small>Cambia tu foto de perfil</small>
          </span>
        </button>
        <label>
          Nombre
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" />
        </label>
        <label>
          Correo electrónico
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            autoComplete="email"
          />
        </label>
        <label>
          Teléfono
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            autoComplete="tel"
          />
        </label>
        <label>
          Ciudad / estado
          <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} autoComplete="address-level2" />
        </label>
        <button type="button" className="primary-button" disabled={!canSave} onClick={save}>
          Guardar cambios
        </button>
      </div>
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
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
  const navigate = useNavigate();
  const { guardianActive, guardianAmount, setGuardian, emptyStates } = usePrototypeStore();
  const [dialog, setDialog] = useState<"none" | "amount" | "cancel">("none");
  const [choice, setChoice] = useState(guardianAmount);
  const [toast, setToast] = useState("");
  const [justChanged, setJustChanged] = useState(false);
  const plan = subscriptionPlans.find((item) => item.amount === guardianAmount) ?? subscriptionPlans[1];
  const history = emptyStates ? [] : paymentHistory;
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
            <button
              className="primary-button"
              onClick={() => navigate("/impact/support", { state: { from: "/settings/billing" } })}
            >
              Suscribirme
            </button>
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
        {history.length ? (
          <div className="history-card">
            {history.map((row) => (
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
        ) : (
          <article className="empty-card donor-empty-card billing-history-empty">
            <span className="empty-chip yellow">
              <Icon name="icon-star.svg" size={28} />
            </span>
            <h2>Aún no hay pagos</h2>
            <p>Cuando se cobren tus suscripciones, verás aquí el historial.</p>
          </article>
        )}
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
  const { verification, setVerification, emptyStates, pendingActions: storePending } = usePrototypeStore();
  const verified = verification === "verified";
  const showEmptyPending = emptyStates;
  const pendingActions = showEmptyPending
    ? []
    : [
        ...storePending.map((item) => ({
          id: item.id,
          tone: "purple" as const,
          icon: "icon-receipt-purple.svg",
          title: item.title,
          copy: item.body,
          detail: "",
          cta: item.kind === "stripe" ? "Vincular Stripe" : "Ver",
          target: "/rescuer/profile/payments",
        })),
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
          <p>{showEmptyPending ? "Panel de Rescatista" : "Tu panel de rescate"}</p>
        </header>

        {verified ? (
          <article className="dopmi-wallet">
            <div className="dopmi-wallet-top">
              <span className="dopmi-wallet-label">
                <AssetIcon name="icon-wallet.svg" size={20} />
                Cuenta Dopmi
              </span>
              <span className="dopmi-wallet-badge">
                {showEmptyPending ? "0 Casos activos" : "3 Casos activos"}
              </span>
            </div>
            <strong className="dopmi-wallet-balance">{showEmptyPending ? "$0" : "$68"}</strong>
            <p>Las donaciones se transfieren vía Stripe conforme llegan</p>
            <div className="dopmi-wallet-bar">
              <i style={{ width: showEmptyPending ? "0%" : "40%" }} />
            </div>
            <div className="dopmi-wallet-stats">
              <div>
                <span>Total recibido</span>
                <b>{showEmptyPending ? "$0" : "$172"}</b>
              </div>
              <div>
                <span>Transferido</span>
                <b>{showEmptyPending ? "$0" : "$172"}</b>
              </div>
            </div>
          </article>
        ) : verification === "review" && !showEmptyPending ? (
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
        ) : showEmptyPending && !verified ? (
          <article className="verify-card verify-card-cta">
            <div className="verify-head">
              <span className="verify-chip">
                <AssetIcon name="verify-shield-purple.svg" size={24} />
              </span>
              <strong>
                {verification === "rejected"
                  ? "Corrige tu información"
                  : "Verificar perfil (opcional)"}
              </strong>
            </div>
            <p>
              {verification === "rejected"
                ? "El comprobante no es legible y falta vincular una red social."
                : "La verificación es opcional. Puedes solicitarla desde tu perfil cuando quieras."}
            </p>
            <button type="button" className="purple-button" onClick={() => navigate("/rescuer/profile")}>
              {verification === "rejected" ? "Corregir información" : "Verificarme"}
            </button>
          </article>
        ) : !verified ? (
          <button
            className={`verify-card link-card ${verification}`}
            onClick={() => navigate("/rescuer/profile")}
          >
            <div className="verify-head">
              <span className="verify-chip">
                <Icon name="icon-shield.svg" size={24} />
              </span>
              <strong>
                {verification === "rejected" ? "Corrige tu información" : "Verificar perfil"}
              </strong>
              <Chevron />
            </div>
            <p>
              {verification === "rejected"
                ? "El comprobante no es legible y falta vincular una red social."
                : "La verificación es opcional. Solicítala desde Perfil si quieres que DopMi revise tu evidencia."}
            </p>
            {verification === "unverified" ? <span className="bonus-badge">Bono de $350 MXN al aprobar</span> : null}
          </button>
        ) : null}

        <section className="rh-section">
          {showEmptyPending ? (
            <h2>Acciones pendientes</h2>
          ) : (
            <div className="rh-section-head">
              <AssetIcon name="icon-alert-circle.svg" size={20} />
              <h2>Acciones pendientes</h2>
              <span className="rh-count">{pendingActions.length}</span>
            </div>
          )}
          {showEmptyPending ? (
            <article className="rh-empty-card">
              <span className="rh-empty-icon">
                <AssetIcon name="empty-pending-heart.svg" size={32} />
              </span>
              <h3>No tienes acciones pendientes</h3>
              <p>
                Cuando publiques casos o recibas mensajes, tus acciones pendientes aparecerán aquí.
              </p>
              <button type="button" className="purple-button" onClick={() => navigate("/rescuer/publish")}>
                <AssetIcon name="empty-publish-plus.svg" size={16} />
                Publicar caso
              </button>
            </article>
          ) : (
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
          )}
        </section>

        {verified && !showEmptyPending ? (
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
  return <Navigate to="/rescuer/profile" replace />;
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
  const [ageBand, setAgeBand] = useState<AdoptionAgeBand | "">(item.ageBand || "");
  const [size, setSize] = useState<AdoptionSize | "">(item.size || "");
  const [energy, setEnergy] = useState<AdoptionEnergy | "">(item.energy || "");
  const [personality, setPersonality] = useState<PersonalityTrait | "">(
    item.personality && (PERSONALITY_OPTIONS as readonly string[]).includes(item.personality)
      ? (item.personality as PersonalityTrait)
      : "",
  );
  const [story, setStory] = useState(item.story);
  const [adoption, setAdoption] = useState(item.adoption);
  const [needs, setNeeds] = useState(item.needs);
  const [closing, setClosing] = useState(false);
  const photos = [item.image, item.id === "milo" ? "/assets/guardian-milo.jpg" : item.image, item.id === "luna" ? "/assets/luna-detail.png" : item.image];

  const save = () => {
    updateCase(item.id, {
      name,
      age: adoption && ageBand ? ageBand : age,
      story,
      adoption,
      needs,
      ...(adoption
        ? {
            ageBand: ageBand || undefined,
            size: size || undefined,
            energy: energy || undefined,
            personality: personality || undefined,
          }
        : {}),
    });
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
          {adoption ? (
            <>
              <div className="publish-trait-card">
                <h3>Edad</h3>
                <div className="publish-choice-row three">
                  {(["Cachorro", "Adulto", "Viejo"] as AdoptionAgeBand[]).map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={`publish-choice ${ageBand === value ? "selected" : ""}`}
                      onClick={() => setAgeBand(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="publish-trait-card">
                <h3>Tamaño</h3>
                <div className="publish-choice-row three">
                  {(["Chico", "Mediano", "Grande"] as AdoptionSize[]).map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={`publish-choice ${size === value ? "selected" : ""}`}
                      onClick={() => setSize(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="publish-trait-card">
                <h3>Energía</h3>
                <div className="publish-choice-row three">
                  {(["Poco activo", "Activo", "Muy activo"] as AdoptionEnergy[]).map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={`publish-choice ${energy === value ? "selected" : ""}`}
                      onClick={() => setEnergy(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="publish-trait-card">
                <h3>Personalidad</h3>
                <div className="publish-choice-row wrap">
                  {PERSONALITY_OPTIONS.map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={`publish-choice ${personality === value ? "selected" : ""}`}
                      onClick={() => setPersonality(personality === value ? "" : value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <label>Edad estimada<input value={age} onChange={(event) => setAge(event.target.value)} /></label>
          )}
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
  const { cases, updateCaseStatus, toggleCaseAdoption, emptyStates } = usePrototypeStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const visible = emptyStates ? [] : cases.filter((item) => item.caseStatus !== "closed");
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
          <div>
            <h1>Mis Casos</h1>
            <p>{visible.length === 0 ? "Aún no tienes mascotas publicadas" : `${visible.length} mascotas a tu cuidado`}</p>
          </div>
          {visible.length > 0 ? (
            <button className="purple-button compact" onClick={() => navigate("/rescuer/publish")}>
              <Icon name="icon-plus-circle.svg" size={16} />
              Nuevo
            </button>
          ) : null}
        </div>
        {visible.length === 0 ? (
          <article className="rh-empty-card cases-empty-card">
            <span className="rh-empty-icon">
              <Icon name="rtab-cases.svg" size={32} />
            </span>
            <h3>No tienes casos todavía</h3>
            <p>
              Cuando publiques una mascota para adopción o donaciones, tus casos aparecerán aquí para que puedas darles seguimiento.
            </p>
            <button type="button" className="purple-button" onClick={() => navigate("/rescuer/publish")}>
              <AssetIcon name="empty-publish-plus.svg" size={16} />
              Publicar caso
            </button>
          </article>
        ) : (
        <div className="list-stack">
          {visible.map((item) => {
            const requested = item.needs.reduce((total, need) => total + need.requested, 0);
            const funded = item.needs.reduce((total, need) => total + need.funded, 0);
            const percent = requested ? Math.round((funded / requested) * 100) : 0;
            return (
              <article className="manage-case" key={item.id}>
                {item.caseStatus === "review" ? (
                  <div className="manage-case-top">
                    <img src={item.image} alt="" />
                    <div className="manage-case-body">
                      <div className="manage-case-head">
                        <h3>{item.name}</h3>
                        <span className="status-pill review">
                          <AssetIcon name="icon-info-blue.svg" size={9} />
                          {caseStatusLabel.review}
                        </span>
                      </div>
                      <p className="manage-case-review-note">El equipo DopMi lo revisará a la brevedad.</p>
                    </div>
                  </div>
                ) : (
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
                )}
                {item.caseStatus === "review" ? null : (
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
                )}
              </article>
            );
          })}
        </div>
        )}
      </div>
    </ScreenShell>
  );
}

function RescuerNeedCard({ need }: { need: Need }) {
  const remaining = Math.max(0, need.requested - need.funded);
  const covered = remaining === 0 || need.status === "funded" || need.status === "completed";
  return (
    <article className="need-card rescuer-need-card">
      <div className="need-card-title">
        <span className="need-symbol soft">{needEmoji(need.type)}</span>
        <div>
          <strong>{need.title}</strong>
          <small>{need.type}</small>
        </div>
        <b>${need.requested}</b>
      </div>
      <div className="split-meta">
        <span>${need.funded} recaudados</span>
        <strong>{covered ? "Cubierta" : `$${remaining} restantes`}</strong>
      </div>
      <div className="progress purple"><i style={{ width: `${Math.min(100, (need.funded / Math.max(need.requested, 1)) * 100)}%` }} /></div>
    </article>
  );
}

function RescuerCaseDetail() {
  const { caseId = "luna" } = useParams();
  const navigate = useNavigate();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const { cases, updateCaseStatus, donations } = usePrototypeStore();
  const item = cases.find((entry) => entry.id === caseId) ?? cases[0];
  const photos = item.id === "milo"
    ? [item.image, "/assets/guardian-milo.jpg", item.image]
    : item.id === "luna"
      ? ["/assets/luna-detail.png", item.image, "/assets/guardian-luna.jpg"]
      : [item.image, item.image, item.image];
  const subtotal = item.needs.reduce((sum, need) => sum + need.requested, 0);
  const funded = item.needs.reduce((sum, need) => sum + need.funded, 0);
  const fee = item.feeMxn ?? (item.needs.length ? 50 : 0);
  const goal = subtotal + (item.needs.length ? fee : 0);
  const pct = Math.round((funded / Math.max(goal, 1)) * 100);
  const donationCount = donations.filter((entry) => entry.caseId === item.id).length;
  const goalMet =
    item.caseStatus === "funded" || (item.needs.length > 0 && item.needs.every((need) => need.funded >= need.requested));
  const published = item.caseStatus === "active" || item.caseStatus === "funded";
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

        {published ? (
          <article className="info-card funding-card">
            <h3>{goalMet ? "Meta cumplida" : "Esperando donaciones"}</h3>
            <p className="publish-hint">
              {goalMet
                ? "La cantidad necesaria ya fue cubierta. Las donaciones se transfirieron a tu cuenta de Stripe conforme llegaron."
                : "El caso está publicado y recibiendo apoyo. Las donaciones se van transfiriendo a tu cuenta conforme las recibes; no hace falta esperar al 100% de la meta."}
            </p>
            <div className="progress-track">
              <i style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <p>
              ${funded.toLocaleString("es-MX")} de ${goal.toLocaleString("es-MX")} MXN ({pct}%)
            </p>
            {donationCount ? <p className="publish-hint">{donationCount} {donationCount === 1 ? "donación recibida" : "donaciones recibidas"}</p> : null}
          </article>
        ) : null}

        <h2>Necesidades</h2>
        <div className="needs-stack">
          {item.needs.length
            ? item.needs.map((need) => <RescuerNeedCard key={need.id} need={need} />)
            : <p className="supporting-copy">Este caso aún no tiene necesidades activas.</p>}
        </div>

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

function PublishStepper({ step, total = 3 }: { step: number; total?: number }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="publish-stepper" aria-label={`Paso ${step} de ${total}`}>
      {steps.map((n) => {
        const done = n < step;
        const active = n === step;
        return (
          <div className="publish-step-seg" key={n}>
            <span className={`publish-step-dot ${done || active ? "on" : ""}`}>
              {done ? <AssetIcon name="publish-step-check.svg" size={16} /> : n}
            </span>
            {n < total ? <span className={`publish-step-line ${n < step ? "on" : ""}`} /> : null}
          </div>
        );
      })}
    </div>
  );
}

type DraftNeedItem = {
  id: string;
  type: "Comida" | "Medicina" | "Veterinario";
  title: string;
  amount: number;
  detail?: string;
  badge?: string;
};

const FOOD_CATALOG = [
  { id: "food-adult", title: "Premium Adult Dog Food 3kg", brand: "PawNutri", amount: 280 },
  { id: "food-puppy", title: "Puppy Dry Food 1.5kg", brand: "LittlePaws", amount: 180 },
  { id: "food-kitten-wet", title: "Kitten Wet Food Pack x12", brand: "MeowChef", amount: 220 },
  { id: "food-kitten-dry", title: "Kitten Dry Food 1kg", brand: "MeowChef", amount: 160 },
];

const NEED_EMOJI: Record<DraftNeedItem["type"], string> = {
  Comida: "🥣",
  Medicina: "💊",
  Veterinario: "🩺",
};

function PublishFlow() {
  return <PublishFlowWizard />;
}


function EvidenceFlow() {
  const { caseId = "luna" } = useParams();
  return <Navigate to={`/rescuer/cases/${caseId}`} replace />;
}


function FoodCycle() {
  const { caseId = "luna" } = useParams();
  return <Navigate to={`/rescuer/cases/${caseId}`} replace />;
}


function RescuerMessages() {
  const navigate = useNavigate();
  const { messages, emptyStates } = usePrototypeStore();
  const last = messages[messages.length - 1];
  const threads = emptyStates
    ? []
    : [
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
        <p className="section-lead">Habla con adoptantes</p>
        {threads.length === 0 ? (
          <article className="rh-empty-card messages-empty-card">
            <span className="rh-empty-icon">
              <Icon name="rtab-messages.svg" size={32} />
            </span>
            <h3>No tienes mensajes</h3>
            <p>
              Cuando adoptantes te escriban sobre tus mascotas, verás las conversaciones aquí.
            </p>
            <button type="button" className="purple-button" onClick={() => navigate("/rescuer/publish")}>
              <AssetIcon name="empty-publish-plus.svg" size={16} />
              Publicar caso
            </button>
          </article>
        ) : (
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
        )}
      </div>
    </ScreenShell>
  );
}


function RescuerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { rescuerProfile, setAccountMode } = usePrototypeStore();
  const params = new URLSearchParams(location.search);
  if (params.get("stripe") === "1") {
    const caseId = params.get("case");
    return <Navigate to={caseId ? `/rescuer/profile/payments?case=${caseId}` : "/rescuer/profile/payments"} replace />;
  }

  const displayName = rescuerDisplayName(rescuerProfile) || "Rescatista";
  const description = rescuerProfile.description?.trim();
  const locationLabel = rescuerProfile.address?.trim();
  const phone = rescuerProfile.phone?.trim();
  const email = rescuerProfile.email?.trim();
  const instagram = rescuerProfile.instagram?.trim();
  const facebook = rescuerProfile.facebook?.trim();

  return (
    <ScreenShell mode="rescuer">
      <div className="content-pad profile-page">
        <header className="page-head">
          <h1>Perfil</h1>
        </header>

        <article className="public-card profile-peek">
          <div className="profile-peek-identity">
            <span className={`avatar large purple ${rescuerProfile.avatar ? "has-photo" : ""}`}>
              {rescuerProfile.avatar ? <img src={rescuerProfile.avatar} alt="" /> : (displayName.charAt(0) || "R")}
            </span>
            <strong className="profile-peek-name">{displayName}</strong>
            {description ? <p className="profile-peek-description">{description}</p> : null}
          </div>

          {(locationLabel || phone || email || instagram || facebook) ? (
            <div className="profile-peek-contact">
              {locationLabel ? (
                <div className="profile-contact-item">
                  <Icon name="location.svg" size={16} />
                  <div>
                    <small>Ubicación</small>
                    <strong>{locationLabel}</strong>
                  </div>
                </div>
              ) : null}
              {phone ? (
                <div className="profile-contact-item">
                  <Icon name="icon-phone.svg" size={16} />
                  <div>
                    <small>Teléfono</small>
                    <strong>{phone}</strong>
                  </div>
                </div>
              ) : null}
              {email ? (
                <div className="profile-contact-item">
                  <Icon name="icon-mail.svg" size={16} />
                  <div>
                    <small>Correo</small>
                    <strong>{email}</strong>
                  </div>
                </div>
              ) : null}
              {instagram || facebook ? (
                <div className="profile-contact-item">
                  <Icon name="icon-instagram.svg" size={16} />
                  <div>
                    <small>Redes sociales</small>
                    <strong>
                      {[instagram, facebook].filter(Boolean).join(" · ")}
                    </strong>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <button type="button" className="secondary-button" onClick={() => navigate("/rescuer/profile/edit")}>
            Editar perfil
          </button>
        </article>

        <section className="list-stack profile-menu">
          <button type="button" className="nav-row" onClick={() => navigate("/help")}>
            <span className="nav-row-main">
              <Icon name="icon-help.svg" size={20} />
              <strong>Centro de ayuda</strong>
            </span>
            <Chevron />
          </button>
          <button type="button" className="nav-row" onClick={() => navigate("/rescuer/profile/payments")}>
            <span className="nav-row-main">
              <Icon name="icon-billing.svg" size={20} />
              <strong>Pagos</strong>
            </span>
            <Chevron />
          </button>
          <button type="button" className="nav-row" onClick={() => navigate("/rescuer/profile/legal")}>
            <span className="nav-row-main">
              <Icon name="icon-doc.svg" size={20} />
              <strong>Legal</strong>
            </span>
            <Chevron />
          </button>
        </section>

        <section className="list-stack profile-session">
          <button
            type="button"
            className="nav-row danger-row"
            onClick={() => {
              setAccountMode("donor");
              navigate("/");
            }}
          >
            <span className="nav-row-main">
              <Icon name="icon-logout.svg" size={20} />
              <strong>Cerrar sesión</strong>
            </span>
            <Chevron />
          </button>
        </section>
      </div>
    </ScreenShell>
  );
}


function RescuerEditProfile() {
  const navigate = useNavigate();
  const { rescuerProfile, updateRescuerProfile } = usePrototypeStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: rescuerProfile.name,
    orgName: rescuerProfile.orgName || "",
    description: rescuerProfile.description,
    address: rescuerProfile.address,
    phone: rescuerProfile.phone,
    email: rescuerProfile.email,
    instagram: rescuerProfile.instagram || "",
    facebook: rescuerProfile.facebook || "",
    avatar: rescuerProfile.avatar ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const pickPhoto = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setForm((current) => ({ ...current, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Escribe tu nombre";
    if (!form.description.trim()) next.description = "Agrega una descripción";
    if (!form.address.trim()) next.address = "Agrega tu ubicación";
    if (!form.phone.trim()) next.phone = "Agrega un teléfono";
    if (!form.email.trim()) next.email = "Agrega un correo";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) {
      setToast("Revisa los campos marcados");
      return;
    }
    updateRescuerProfile({
      name: form.name.trim(),
      orgName: form.orgName.trim() || undefined,
      description: form.description.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      instagram: form.instagram.trim(),
      facebook: form.facebook.trim(),
      avatar: form.avatar || undefined,
      profileComplete: true,
    });
    setToast("Perfil actualizado");
    window.setTimeout(() => navigate("/rescuer/profile"), 450);
  };

  return (
    <div className="plain-screen rescuer-theme">
      <TopBar title="Editar perfil" back="/rescuer/profile" />
      <div className="content-pad form-stack edit-public-profile">
        <p className="section-lead">Estos datos alimentan tu perfil y la ficha pública que ven adoptantes y donantes.</p>
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => pickPhoto(event.target.files?.[0])}
        />
        <button type="button" className="photo-card profile-photo-card" onClick={() => fileRef.current?.click()}>
          <span className={`avatar large purple ${form.avatar ? "has-photo" : ""}`}>
            {form.avatar ? <img src={form.avatar} alt="" /> : (form.name.trim().charAt(0) || "M")}
            <span className="avatar-camera purple">
              <AssetIcon name="onb-camera.svg" size={12} />
            </span>
          </span>
          <span className="nav-row-text">
            <strong>Foto de perfil</strong>
            <small>Cambia la foto que ven adoptantes y donantes</small>
          </span>
        </button>

        <label className="publish-field">
          <span>Nombre</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" autoComplete="name" />
          {errors.name ? <small className="field-error">{errors.name}</small> : null}
        </label>
        <label className="publish-field">
          <span>Nombre del refugio / organización (opcional)</span>
          <input value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} placeholder="Opcional" />
          <small className="field-hint">
            Si agregas un nombre de refugio, este será el nombre que verán los adoptantes en tu perfil y publicaciones.
          </small>
        </label>
        <label className="publish-field">
          <span>Descripción</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Cuéntanos quién eres, qué rescates haces y qué debe saber un adoptante"
          />
          {errors.description ? <small className="field-error">{errors.description}</small> : null}
        </label>
        <label className="publish-field">
          <span>Ubicación</span>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Ciudad, Estado"
            autoComplete="address-level2"
          />
          {errors.address ? <small className="field-error">{errors.address}</small> : null}
        </label>
        <LocationMap location={form.address} compact />
        <label className="publish-field">
          <span>Teléfono</span>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
          {errors.phone ? <small className="field-error">{errors.phone}</small> : null}
        </label>
        <label className="publish-field">
          <span>Correo</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          {errors.email ? <small className="field-error">{errors.email}</small> : null}
        </label>
        <label className="publish-field">
          <span>Instagram (opcional)</span>
          <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@tuusuario" />
        </label>
        <label className="publish-field">
          <span>Facebook (opcional)</span>
          <input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="Tu página o perfil" />
        </label>

        <button type="button" className="purple-button" onClick={save}>
          Guardar cambios
        </button>
        <button type="button" className="secondary-button" onClick={() => navigate("/rescuer/profile")}>
          Cancelar
        </button>
      </div>
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}


function RescuerPayments() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    stripeStatus,
    completeStripeAndPublish,
    pendingActions,
    dismissPendingAction,
    emptyStates,
  } = usePrototypeStore();
  const caseId = new URLSearchParams(location.search).get("case") || undefined;
  const [toast, setToast] = useState("");

  const stripeCopy =
    stripeStatus === "linked"
      ? {
          title: "Stripe conectado",
          body: "La cuenta está lista para recibir fondos de casos aprobados.",
          cta: "Administrar Stripe",
        }
      : stripeStatus === "pending"
        ? {
            title: "Configuración pendiente",
            body: "Continúa el proceso en Stripe para terminar de vincular tu cuenta.",
            cta: "Continuar configuración",
          }
        : stripeStatus === "error"
          ? {
              title: "Acción requerida",
              body: "Stripe necesita que revises tu cuenta para poder recibir donaciones.",
              cta: "Resolver problema",
            }
          : {
              title: "No vinculado",
              body: "Conecta Stripe para recibir las donaciones de tus casos aprobados en DopMi.",
              cta: "Vincular Stripe",
            };

  const stripeActions = pendingActions.filter((item) => item.kind === "stripe");
  const movements = emptyStates ? [] : rescuerPaymentMovements;

  return (
    <div className="plain-screen rescuer-theme">
      <TopBar title="Pagos" back="/rescuer/profile" />
      <div className="content-pad form-stack">
        <p className="section-lead">
          Vincula Stripe para recibir donaciones. No mostramos datos bancarios; Stripe los administra.
        </p>

        {stripeActions.length ? (
          <section className="pending-actions">
            <h2>Acciones pendientes</h2>
            {stripeActions.map((item) => (
              <article className="pending-card" key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <button
                  type="button"
                  className="purple-button"
                  onClick={() => {
                    completeStripeAndPublish(item.caseId || caseId);
                    setToast("Stripe vinculado. El caso aprobado se publica automáticamente.");
                  }}
                >
                  Vincular Stripe
                </button>
                <button type="button" className="secondary-button" onClick={() => dismissPendingAction(item.id)}>
                  Entendido
                </button>
              </article>
            ))}
          </section>
        ) : null}

        <section className="payments-stripe-card">
          <h2>Stripe</h2>
          <p className="payments-stripe-status">{stripeCopy.title}</p>
          <p className="publish-hint">{stripeCopy.body}</p>
          <p className="publish-hint">Las donaciones se transfieren conforme llegan. No hay liberación manual al final.</p>
          {stripeStatus !== "linked" ? (
            <button
              type="button"
              className="purple-button"
              onClick={() => {
                completeStripeAndPublish(caseId);
                setToast("Cuenta de Stripe vinculada.");
              }}
            >
              {stripeCopy.cta}
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setToast("Se abre Stripe para administrar tu cuenta (simulado).")}
            >
              {stripeCopy.cta}
            </button>
          )}
        </section>

        <section className="payments-movements">
          <h2>Movimientos</h2>
          {movements.length ? (
            movements.map((item) => (
              <article className="payments-movement-row" key={item.id}>
                <strong>
                  {item.caseName} — {item.needTitle}
                </strong>
                <b>+${item.amount.toLocaleString("es-MX")} MXN</b>
                <div className="movement-meta">
                  <span>{item.date}</span>
                  <span>{item.status === "received" ? "Recibido" : "En proceso"}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="payments-empty">
              <span className="empty-chip">
                <Icon name="icon-wallet.svg" size={22} />
              </span>
              <h3>Aún no tienes movimientos</h3>
              <p>Cuando recibas donaciones, podrás consultar aquí el historial de los fondos recibidos.</p>
            </div>
          )}
        </section>
      </div>
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}


function RescuerSettings() {
  return <Navigate to="/rescuer/profile" replace />;
}


function LegalHub() {
  const navigate = useNavigate();
  return (
    <div className="plain-screen rescuer-theme">
      <TopBar title="Legal" back="/rescuer/profile" />
      <div className="content-pad list-stack">
        <button type="button" className="nav-row" onClick={() => navigate("/terms")}>
          <span className="nav-row-main">
            <Icon name="icon-doc.svg" size={20} />
            <strong>Términos y condiciones</strong>
          </span>
          <Chevron />
        </button>
        <button type="button" className="nav-row" onClick={() => navigate("/privacy")}>
          <span className="nav-row-main">
            <Icon name="icon-shield.svg" size={20} />
            <strong>Política de privacidad</strong>
          </span>
          <Chevron />
        </button>
      </div>
    </div>
  );
}

function HelpCenter() {
  const accountMode = usePrototypeStore((state) => state.accountMode);
  const faqs = accountMode === "rescuer" ? rescuerFaqs : donorFaqs;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="plain-screen">
      <TopBar title="Centro de ayuda" back={accountMode === "rescuer" ? "/rescuer/profile" : "/settings"} />
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
  const { savedRescuerIds, toggleSavedRescuer, emptyStates } = usePrototypeStore();
  const saved = emptyStates ? [] : rescuers.filter((item) => savedRescuerIds.includes(item.name));
  return (
    <div className="plain-screen">
      <TopBar title="Rescatistas guardados" back="/profile" icon="icon-bookmark.svg" />
      <div className="content-pad list-stack">
        {saved.length ? (
          saved.map((item) => (
            <article className="card-row" key={item.name}>
              <button className="card-row-main" onClick={() => navigate(`/rescuer-profile/${encodeURIComponent(item.name)}`)}>
                <span className="avatar">{rescuerDisplayName(item).charAt(0)}</span>
                <span className="nav-row-text">
                  <strong>
                    {rescuerDisplayName(item)}
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
            <button type="button" className="primary-button" onClick={() => navigate("/donate")}>
              Explorar casos
            </button>
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
  const { cases, savedRescuerIds, toggleSavedRescuer, savedPetIds, toggleSavedPet, rescuerProfile } = usePrototypeStore();
  const fromCase = cases.find((item) => item.id === caseId);
  const name = fromCase?.rescuer ?? decodeURIComponent(caseId);
  const catalog = rescuers.find((item) => item.name === name) ?? rescuers.find((item) => item.name === "María R.") ?? rescuers[0];
  const isLiveProfile =
    name === rescuerProfile.name ||
    catalog.name === rescuerProfile.name ||
    Boolean(rescuerProfile.orgName?.trim() && name === rescuerProfile.orgName.trim()) ||
    Boolean(catalog.orgName && catalog.orgName === rescuerProfile.orgName);
  const rescuer = isLiveProfile
    ? {
        name: rescuerProfile.name,
        city: rescuerProfile.address,
        bio: rescuerProfile.description,
        orgName: rescuerProfile.orgName,
        phone: rescuerProfile.phone,
        email: rescuerProfile.email,
        verified: true,
        publishedCases: catalog.publishedCases,
        social: {
          instagram: rescuerProfile.instagram || "",
          facebook: rescuerProfile.facebook || "",
        },
        avatar: rescuerProfile.avatar,
      }
    : { ...catalog, avatar: undefined as string | undefined };
  const [tab, setTab] = useState<"adoption" | "cases" | "activity">("cases");
  const [report, setReport] = useState(false);
  const [toast, setToast] = useState("");
  const saved = savedRescuerIds.includes(rescuer.name) || savedRescuerIds.includes(catalog.name);
  const ownCases = cases.filter((item) => item.rescuer === rescuer.name || item.rescuer === catalog.name);
  const adoptionList = [
    ...ownCases
      .filter((item) => item.adoption)
      .map((item) => ({
        id: item.id,
        name: item.name,
        attrs: [item.ageBand || item.age, item.size, item.energy].filter(Boolean).join(" · "),
        image: item.image,
        distance: item.distance,
        link: `/adoption/${item.id}`,
      })),
    ...adoptionPets
      .filter((item) => (item.rescuer === rescuer.name || item.rescuer === catalog.name) && !ownCases.some((entry) => entry.id === item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        attrs: [item.ageBand, item.size, item.energy].filter(Boolean).join(" · "),
        image: item.image,
        distance: item.distance,
        link: `/adoption/${item.id}`,
      })),
  ];
  const donationCases = ownCases.filter((item) => item.needs.length);
  const displayName = rescuerDisplayName(rescuer);
  const phone = rescuer.phone?.trim();
  const email = rescuer.email?.trim();
  const instagram = rescuer.social.instagram?.trim();
  const facebook = rescuer.social.facebook?.trim();
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
          <span className={`avatar xl ${rescuer.avatar ? "has-photo" : ""}`}>
            {rescuer.avatar ? <img src={rescuer.avatar} alt="" /> : displayName.charAt(0)}
          </span>
          <h1>
            {displayName}
            {rescuer.verified ? <AssetIcon name="icon-verified.svg" size={20} alt="Verificado" /> : null}
          </h1>
          {rescuer.bio ? <p className="public-bio">{rescuer.bio}</p> : null}
          {rescuer.city ? (
            <p className="public-city">
              <Icon name="location.svg" size={14} /> {rescuer.city}
            </p>
          ) : null}
          {phone ? (
            <p className="public-city">
              <Icon name="icon-phone.svg" size={14} /> {phone}
            </p>
          ) : null}
          {email ? (
            <p className="public-city">
              <Icon name="icon-mail.svg" size={14} /> {email}
            </p>
          ) : null}
          <strong className="public-count">{Math.max(rescuer.publishedCases, ownCases.length)} casos publicados</strong>
        </div>
        {instagram || facebook ? (
          <>
            <h2 className="settings-heading first">Redes sociales</h2>
            <div className="social-links">
              {instagram ? (
                <button type="button" onClick={() => setToast(`Instagram ${instagram} (simulado)`)}>
                  <Icon name="icon-instagram.svg" size={18} />
                  Instagram
                </button>
              ) : null}
              {facebook ? (
                <button type="button" onClick={() => setToast(`Facebook ${facebook} (simulado)`)}>
                  <Icon name="icon-facebook.svg" size={18} />
                  Facebook
                </button>
              ) : null}
            </div>
          </>
        ) : null}
        <div className="profile-tabs">
          <button className={tab === "adoption" ? "active" : ""} onClick={() => setTab("adoption")}>En adopción</button>
          <button className={tab === "cases" ? "active" : ""} onClick={() => setTab("cases")}>Casos</button>
          <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>Actividad</button>
          <button className="report-link" onClick={() => setReport(true)}>Reportar</button>
        </div>
        {tab === "adoption" ? (
          adoptionList.length ? (
            adoptionList.map((item) => {
              const isSaved = savedPetIds.includes(item.id);
              return (
                <article className="case-card" key={item.id}>
                  <div className="case-image">
                    <img src={item.image} alt={item.name} />
                    <div className="case-title"><strong>{item.name}, {item.attrs || item.distance}</strong><span>{item.distance}</span></div>
                  </div>
                  <div className="need-summary public-adoption-actions">
                    <button
                      type="button"
                      className={`round-save ${isSaved ? "selected" : ""}`}
                      onClick={() => toggleSavedPet(item.id)}
                      aria-label={isSaved ? "Quitar de guardados" : "Guardar"}
                    >
                      <Icon name="icon-bookmark.svg" size={20} />
                    </button>
                    <button type="button" className="primary-button" onClick={() => navigate(item.link)}>
                      Conoce la historia de {item.name}
                    </button>
                  </div>
                </article>
              );
            })
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
                  <div className="case-title"><strong>{item.name}, {item.attrs || item.distance}</strong><span>{item.distance}</span></div>
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
          (() => {
            const whenToDays = (when: string) => {
              const normalized = when.toLowerCase();
              if (normalized.includes("hoy")) return 0;
              const match = normalized.match(/hace\s+(\d+)\s+(día|dias|días|hora|horas|semana|semanas|mes|meses)/);
              if (!match) return 999;
              const n = Number(match[1]);
              const unit = match[2];
              if (unit.startsWith("hora")) return n / 24;
              if (unit.startsWith("día") || unit.startsWith("dia")) return n;
              if (unit.startsWith("semana")) return n * 7;
              if (unit.startsWith("mes")) return n * 30;
              return 999;
            };
            const stories = [
              ...ownCases.flatMap((item, index) => {
                const med = item.needs.find((need) => need.type === "Medicina");
                const food = item.needs.find((need) => need.type === "Comida");
                return [
                  {
                    id: `${item.id}-recovery`,
                    when: index === 0 ? "Hace 1 día" : "Hace 3 días",
                    tag: "Recuperación",
                    text: `${item.name} recibió apoyo con las donaciones. Ya muestra mejoría y sigue en seguimiento.`,
                    thanks: "Gracias a Ana P.",
                    image: item.id === "luna" ? "/assets/luna-detail.png" : item.image,
                    need: med ? `${med.title} · $${med.requested}` : food ? `${food.title} · $${food.requested}` : undefined,
                    needType: (med?.type ?? food?.type ?? "Medicina") as Need["type"],
                  },
                  {
                    id: `${item.id}-rescue`,
                    when: "Hace 1 semana",
                    tag: "Rescate",
                    text: `Publicamos evidencia del rescate de ${item.name} para que la comunidad vea el avance.`,
                    thanks: "Gracias a Lucía G.",
                    image: item.image,
                    need: undefined,
                    needType: "Otra" as Need["type"],
                  },
                ];
              }),
              ...adoptionPets
                .filter((item) => item.rescuer === rescuer.name || item.rescuer === catalog.name)
                .flatMap((pet) =>
                  pet.journey.map((entry) => ({
                    id: `${pet.id}-${entry.id}`,
                    when: entry.when,
                    tag: entry.tag,
                    text: entry.text,
                    thanks: entry.thanks,
                    image: pet.image,
                    need: entry.need,
                    needType: "Otra" as Need["type"],
                  })),
                ),
            ].sort((a, b) => whenToDays(a.when) - whenToDays(b.when));
            if (!stories.length) {
              return <p className="empty-inline">Aún no hay evidencias publicadas.</p>;
            }
            return (
              <section className="public-activity">
                <p className="section-lead">Evidencias de donaciones recibidas y avances del rescate.</p>
                <div className="story-stack donor-story-stack">
                  {stories.map((entry) => (
                    <article className="story-card" key={entry.id}>
                      <div className="story-media tall">
                        <img src={entry.image} alt="" />
                        <span className="story-when dark">
                          <Icon name="icon-clock.svg" size={12} />
                          {entry.when}
                        </span>
                      </div>
                      <div className="story-body">
                        <p>{entry.text}</p>
                        {entry.need ? (
                          <span className="story-need">
                            <span aria-hidden="true">{needEmoji(entry.needType)}</span>
                            {entry.need}
                          </span>
                        ) : null}
                        <small>
                          <Icon name="icon-star.svg" size={14} />
                          {entry.thanks}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })()
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
          <Route path="/forgot-password" element={<ForgotPasswordFlow />} />
          <Route path="/forgot-password/sent" element={<ForgotPasswordFlow />} />
          <Route path="/forgot-password/reset" element={<ForgotPasswordFlow />} />
          <Route path="/forgot-password/done" element={<ForgotPasswordFlow />} />
          <Route path="/terms" element={<LegalTermsPage />} />
          <Route path="/privacy" element={<LegalPrivacyPage />} />
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
          <Route path="/messages" element={<DonorMessages />} />
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
          <Route path="/rescuer/profile/edit" element={<RescuerEditProfile />} />
          <Route path="/rescuer/profile/payments" element={<RescuerPayments />} />
          <Route path="/rescuer/profile/legal" element={<LegalHub />} />
          <Route path="/rescuer/settings" element={<RescuerSettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <TestPanel />
    </div>
  );
}
