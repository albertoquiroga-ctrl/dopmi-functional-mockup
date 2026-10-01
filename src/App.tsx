import { type FormEvent, type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  adoptionPets,
  donationLog,
  helpTopics,
  paymentHistory,
  rescuers,
  savedCards,
  subscriptionPlans,
  type HelpTopic,
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

function useGoBack(fallback?: string | (() => void)) {
  const navigate = useNavigate();
  return () => {
    if (typeof fallback === "function") {
      fallback();
      return;
    }
    const historyIdx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof historyIdx === "number" && historyIdx > 0) {
      navigate(-1);
      return;
    }
    if (typeof fallback === "string" && fallback) {
      navigate(fallback);
      return;
    }
    navigate(-1);
  };
}

/** Header del flujo de acceso: ranuras laterales fijas de 40px con el logo centrado. */
function BrandHeader({ back, action }: { back?: string | (() => void); action?: ReactNode }) {
  const goBack = useGoBack(back);
  return (
    <header className="brand-header">
      {back ? (
        <button className="header-slot" onClick={goBack} aria-label="Atrás" type="button">
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
  subtitle,
  back,
  actions,
  icon,
}: {
  title?: string;
  subtitle?: string;
  back?: string | (() => void);
  actions?: ReactNode;
  icon?: string;
}) {
  const goBack = useGoBack(back);
  return (
    <header className={`topbar${subtitle ? " has-subtitle" : ""}`}>
      {back ? (
        <button className="icon-button" onClick={goBack} aria-label="Regresar" type="button">
          <AssetIcon name="back.svg" />
        </button>
      ) : (
        <span className="topbar-spacer" />
      )}
      <div className="topbar-title">
        <h1>
          {icon ? <Icon name={icon} size={20} className="title-icon" /> : null}
          {title}
        </h1>
        {subtitle ? <p className="topbar-subtitle">{subtitle}</p> : null}
      </div>
      <div className="topbar-actions">{actions}</div>
    </header>
  );
}

const donorTabs = [
  { path: "/adoption", label: "Adoptar", icon: "rtab-home.svg", size: 22 },
  { path: "/donate", label: "Apoyar", icon: "tab-donate.svg", size: 22 },
  { path: "/messages", label: "Favoritos", icon: "icon-heart.svg", size: 20 },
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
  const iconOnly = mode === "donor";
  return (
    <nav className={`bottom-nav${mode === "rescuer" ? " five" : " donor-pill"}`} aria-label="Navegación principal">
      {items.map((item) => {
        const active =
          item.path === "/rescuer"
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            type="button"
            className={active ? "active" : ""}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            <span className="nav-icon-wrap" aria-hidden="true">
              <Icon name={item.icon} size={item.size} />
            </span>
            {iconOnly ? null : <span>{item.label}</span>}
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

/** Logo + notificaciones: misma posición en Adoptar, Apoyar, Mis match, etc. */
function DonorChromeTop({
  leading,
  brand,
}: {
  leading?: ReactNode;
  brand?: ReactNode;
}) {
  const navigate = useNavigate();
  const { notifications } = usePrototypeStore();
  const unread = notifications.filter((item) => !item.read).length;
  return (
    <header className="discover-top">
      <div className="discover-brand">
        {brand ?? (
          <img className="discover-logo" src={`${A}logo-paw.svg`} alt="DopMi" width={40} height={40} />
        )}
        {leading}
      </div>
      <div className="discover-actions">
        <button
          type="button"
          className="discover-icon-btn"
          onClick={() => navigate("/notifications")}
          aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ""}`}
        >
          <Icon name="icon-bell.svg" size={20} />
          {unread > 0 ? <span className="notification-dot">{unread}</span> : null}
        </button>
      </div>
    </header>
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
    setPaymentOutcome,
    setVerification,
    setAccountMode,
    setEmptyStates,
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
          <label className="test-toggle-row">
            <span>Empty states</span>
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
    const timer = window.setTimeout(() => navigate("/choose-account"), 1200);
    return () => window.clearTimeout(timer);
  }, [navigate]);
  return (
    <button className="splash" onClick={() => navigate("/choose-account")} aria-label="Continuar a DopMi">
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

/** §3.1 / §3.2 / §3.5 — Tipo de cuenta + intención en una sola pantalla */
type AccountChoiceId = "adopt" | "rescue";

function AccountChoiceIcon({ id, size = 28 }: { id: AccountChoiceId; size?: number }) {
  if (id === "adopt") {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path
          d="M5 12.5 14 5l9 7.5V23a1 1 0 0 1-1 1h-5v-6h-6v6H6a1 1 0 0 1-1-1v-10.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M14 13.2c-.9-.9-2.35-.7-3.05.25a2.1 2.1 0 0 0 .15 2.75L14 19.2l2.9-3c.8-.85.8-2.1 0-2.95-.7-.9-2.15-1.1-2.9-.05Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <ellipse cx="9.2" cy="10" rx="2.4" ry="3.1" stroke="currentColor" strokeWidth="1.8" />
      <ellipse cx="18.8" cy="10" rx="2.4" ry="3.1" stroke="currentColor" strokeWidth="1.8" />
      <ellipse cx="6.8" cy="16.2" rx="2.2" ry="2.8" stroke="currentColor" strokeWidth="1.8" />
      <ellipse cx="21.2" cy="16.2" rx="2.2" ry="2.8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14 12.2c-3.4 0-5.8 2.4-5.8 5.6 0 2.6 2.1 4.6 5.8 4.6s5.8-2 5.8-4.6c0-3.2-2.4-5.6-5.8-5.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChooseAccount() {
  const navigate = useNavigate();
  const { setAccountMode, setDonorIntent } = usePrototypeStore();
  const [selected, setSelected] = useState<AccountChoiceId | null>(null);

  const options: {
    id: AccountChoiceId;
    label: string;
    title: string;
    copy: string;
  }[] = [
    {
      id: "adopt",
      label: "Adoptar",
      title: "Adoptar",
      copy: "Conoce mascotas rescatadas listas para un hogar y habla con su rescatista.",
    },
    {
      id: "rescue",
      label: "Dar en adopción",
      title: "Dar en adopción",
      copy: "Publica casos, pide apoyo para necesidades y comparte evidencia con tu comunidad.",
    },
  ];

  const active = options.find((option) => option.id === selected) ?? null;

  const continueFlow = () => {
    if (!selected) return;
    if (selected === "rescue") {
      setAccountMode("rescuer");
      navigate("/onboarding/rescuer");
      return;
    }
    setAccountMode("donor");
    setDonorIntent("adopt");
    navigate("/onboarding/donor");
  };

  return (
    <div className={`account-screen account-screen--choice${selected ? " has-selection" : " is-empty"}`}>
      <div className="account-body account-body--choice">
        <img className="account-logo" src={`${A}dopmi-wordmark.png`} alt="DopMi" width={120} height={40} />

        <header className="account-empty-header" aria-hidden={selected ? true : undefined}>
          <h1 className="account-empty-title">Bienvenido a DopMi</h1>
          <p className="account-mission">
            Ayuda a mascotas rescatadas de forma segura, simple y transparente.
          </p>
          <span className="account-paw" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <ellipse cx="9.2" cy="9.5" rx="2.2" ry="2.8" stroke="#f7cb2d" strokeWidth="1.6" />
              <ellipse cx="18.8" cy="9.5" rx="2.2" ry="2.8" stroke="#f7cb2d" strokeWidth="1.6" />
              <ellipse cx="7" cy="15.5" rx="2" ry="2.5" stroke="#f7cb2d" strokeWidth="1.6" />
              <ellipse cx="21" cy="15.5" rx="2" ry="2.5" stroke="#f7cb2d" strokeWidth="1.6" />
              <path
                d="M14 11.8c-3.1 0-5.3 2.1-5.3 5 0 2.3 1.9 4.1 5.3 4.1s5.3-1.8 5.3-4.1c0-2.9-2.2-5-5.3-5Z"
                stroke="#f7cb2d"
                strokeWidth="1.6"
              />
            </svg>
          </span>
        </header>

        <h2 className="account-prompt">
          {selected ? "¿Cómo quieres ayudar?" : "¿Cómo quieres ayudar hoy?"}
        </h2>

        <div className="account-tabs-wrap">
          <div className="account-tabs account-tabs--two" role="radiogroup" aria-label="Cómo quieres ayudar">
            {options.map((option) => {
              const isSelected = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`account-tab ${option.id}${isSelected ? " selected" : ""}`}
                  onClick={() => setSelected(option.id)}
                >
                  <span className="account-tab-orb">
                    <AccountChoiceIcon id={option.id} size={32} />
                  </span>
                  <span className="account-tab-label">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="account-summary" aria-live="polite" aria-hidden={!selected}>
          <h2>{active?.title ?? ""}</h2>
          <p>{active?.copy ?? ""}</p>
        </div>

        <div className="account-selected-footer" aria-hidden={!selected}>
          <button type="button" className="account-detail-cta" onClick={continueFlow} disabled={!selected}>
            Continuar
          </button>
          <p className="account-footnote account-footnote--center">
            Puedes cambiar tu selección en cualquier momento desde la configuración de tu perfil.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Redirige al flujo unificado de elección de cuenta. */
function ChooseDonorIntent() {
  return <Navigate to="/choose-account" replace />;
}

type OnboardingSlide = {
  id: string;
  art: ReactNode;
  title: string;
  body: string;
  cta: string;
  eyebrow?: string;
  accountLink?: boolean;
  footnote?: string;
};

const onboardingTracks: Record<"adopter" | "rescuer", OnboardingSlide[]> = {
  adopter: [
    {
      id: "desire",
      title: "Tu nuevo mejor amigo ya te espera.",
      body: "Descubre mascotas que buscan un hogar y conoce su historia.",
      art: (
        <div className="onb-adopt-stack" aria-hidden="true">
          <article className="onb-adopt-card onb-adopt-card--peek">
            <img src={`${A}nina-card.png`} alt="" />
            <p>Michi también busca hogar</p>
          </article>
          <article className="onb-adopt-card onb-adopt-card--main">
            <img src={`${A}luna-card.png`} alt="" />
            <div className="onb-adopt-card-shade" />
            <div className="onb-adopt-card-meta">
              <strong>Luna</strong>
              <span>Refugio Patitas</span>
            </div>
            <span className="onb-adopt-heart" aria-hidden="true">
              <AssetIcon name="icon-heart.svg" size={16} alt="" />
            </span>
          </article>
        </div>
      ),
      cta: "Continuar",
      accountLink: true,
    },
    {
      id: "trust",
      title: "Conoce a quien cuida cada historia.",
      body: "Revisa salud y convivencia, conoce al rescatista y escríbele directo.",
      art: (
        <div className="onb-adopt-detail" aria-hidden="true">
          <article className="onb-adopt-detail-card">
            <div className="onb-adopt-detail-top">
              <img src={`${A}luna-detail.png`} alt="" />
              <div>
                <strong>Luna</strong>
                <span>
                  Refugio Patitas
                  <span className="onb-case-verified">
                    <AssetIcon name="icon-verified.svg" size={12} alt="" />
                    Verificada
                  </span>
                </span>
              </div>
            </div>
            <div className="onb-adopt-attrs">
              <div className="onb-adopt-section">
                <small>Salud</small>
                <div className="onb-adopt-tags">
                  <span>Vacunada</span>
                  <span>Esterilizada</span>
                </div>
              </div>
              <div className="onb-adopt-section">
                <small>Convive con</small>
                <div className="onb-adopt-tags">
                  <span>Perros</span>
                  <span>Gatos</span>
                  <span>Niños</span>
                </div>
              </div>
            </div>
            <div className="onb-adopt-chat">
              <span>¡Hola! Me interesa Luna</span>
              <em>
                <AssetIcon name="send.svg" size={14} alt="" />
              </em>
            </div>
            <p className="onb-adopt-review">Cada publicación pasa por revisión de DopMi.</p>
          </article>
        </div>
      ),
      cta: "Quiero adoptar",
      accountLink: true,
      footnote: "Con tu cuenta guardas favoritos y escribes a rescatistas.",
    },
  ],
  rescuer: [
    {
      id: "problem",
      title: "Encontrarle hogar también es parte del rescate.",
      body: "Comparte la historia de una mascota y haz que llegue a las personas correctas.",
      art: (
        <div className="onb-publish-preview" aria-hidden="true">
          <p className="onb-publish-kicker">Tu próxima publicación</p>
          <article className="onb-publish-sheet">
            <div className="onb-publish-heroes">
              <span className="onb-publish-rescuer" aria-hidden="true">M</span>
              <img className="onb-publish-pet" src={`${A}nina-card.png`} alt="" />
            </div>
            <strong>Canela</strong>
            <span className="onb-publish-traits">Vacunada · Convive con niños</span>
            <span className="onb-publish-badge">En adopción</span>
          </article>
        </div>
      ),
      cta: "Continuar",
      accountLink: true,
    },
    {
      id: "value",
      title: "Tú lo cuidas. Te ayudamos a cubrir lo que necesita.",
      body: "Pide apoyo para comida, medicina o veterinario, y recibe donaciones de personas que quieren ayudar.",
      art: (
        <div className="onb-support-preview" aria-hidden="true">
          <div className="onb-evidence-toast">
            <AssetIcon name="icon-bell.svg" size={14} alt="" />
            <span>3 personas ya apoyaron a Canela</span>
          </div>
          <article className="onb-support-card">
            <div className="onb-support-heroes">
              <span className="onb-publish-rescuer" aria-hidden="true">M</span>
              <img src={`${A}nina-card.png`} alt="" />
            </div>
            <div className="onb-support-needs">
              <span>
                <AssetIcon name="tab-donate.svg" size={18} alt="" />
                Comida
              </span>
              <span>
                <AssetIcon name="onb-syringe.svg" size={18} alt="" />
                Medicina
              </span>
              <span>
                <AssetIcon name="icon-plus-circle.svg" size={18} alt="" />
                Veterinario
              </span>
            </div>
            <p className="onb-support-stat">12 personas ya donaron este mes</p>
            <p className="onb-support-trust">
              <AssetIcon name="icon-verified.svg" size={14} alt="" />
              Tu cuenta verificada es lo que hace que la gente confíe en ti.
            </p>
          </article>
        </div>
      ),
      cta: "Empezar",
      accountLink: true,
    },
  ],
};

function Onboarding({ mode }: { mode: AccountMode }) {
  const navigate = useNavigate();
  const track = mode === "rescuer" ? "rescuer" : "adopter";
  const slides = onboardingTracks[track];
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const goBack = () => (step === 0 ? navigate("/choose-account") : setStep(step - 1));
  const goNext = () => (step === slides.length - 1 ? navigate(`/welcome/${mode}`) : setStep(step + 1));
  return (
    <div className={`onb-gate ${track}`}>
      <div className="auth-gate-top onb-gate-top">
        <button type="button" className="auth-gate-back" onClick={goBack} aria-label="Atrás">
          <AssetIcon name="back.svg" size={24} />
        </button>
        <img className="auth-gate-logo" src={`${A}dopmi-wordmark.png`} alt="DopMi" width={108} height={36} />
        {slide.accountLink ? (
          <button type="button" className="onb-account-link" onClick={() => navigate(`/login/${mode}`)}>
            Ya tengo cuenta
          </button>
        ) : null}
      </div>

      <div className="onb-gate-body" key={slide.id}>
        {track === "adopter" ? (
          <>
            {slide.art}
            <div className="onb-gate-copy">
              {slide.eyebrow ? <p className="onb-gate-eyebrow">{slide.eyebrow}</p> : null}
              <h1>{slide.title}</h1>
              <p>{slide.body}</p>
              {slide.footnote ? <p className="onb-gate-footnote">{slide.footnote}</p> : null}
            </div>
            <div className="onb-gate-dots" aria-label={`Paso ${step + 1} de ${slides.length}`}>
              {slides.map((item, index) => (
                <span key={item.id} className={index === step ? "active" : ""} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="onb-gate-copy">
              {slide.eyebrow ? <p className="onb-gate-eyebrow">{slide.eyebrow}</p> : null}
              <h1>{slide.title}</h1>
              <p>{slide.body}</p>
            </div>
            {slide.art}
            <div className="onb-gate-dots" aria-label={`Paso ${step + 1} de ${slides.length}`}>
              {slides.map((item, index) => (
                <span key={item.id} className={index === step ? "active" : ""} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="onb-gate-footer">
        <button type="button" className="auth-gate-primary" onClick={goNext}>
          {slide.cta}
        </button>
        {track !== "adopter" && slide.footnote ? <p className="onb-gate-footnote">{slide.footnote}</p> : null}
      </div>
    </div>
  );
}

function SocialButtons({
  variant,
  onPick,
}: {
  variant: "solid" | "outline" | "auth" | "icons";
  onPick: () => void;
}) {
  if (variant === "icons") {
    return (
      <div className="social-stack social-stack--icons">
        <button type="button" className="social-button icons" onClick={onPick} aria-label="Continuar con Apple">
          <AssetIcon name="icon-apple.svg" size={22} />
        </button>
        <button type="button" className="social-button icons" onClick={onPick} aria-label="Continuar con Google">
          <AssetIcon name="icon-google.svg" size={22} />
        </button>
      </div>
    );
  }

  return (
    <div className={`social-stack${variant === "auth" ? " social-stack--auth" : ""}`}>
      <button type="button" className={`social-button ${variant}`} onClick={onPick}>
        <AssetIcon name="icon-google.svg" size={18} />
        Continuar con Google
      </button>
      <button type="button" className={`social-button ${variant}`} onClick={onPick}>
        <AssetIcon name="icon-apple.svg" size={18} />
        Continuar con Apple
      </button>
    </div>
  );
}

function Welcome({ mode }: { mode: AccountMode }) {
  const navigate = useNavigate();
  const enter = () => navigate(mode === "donor" ? "/adoption" : "/rescuer");
  const bgImage = mode === "rescuer" ? `${A}publish-sample-pet.jpg` : `${A}welcome-pets.png`;

  const context =
    mode === "rescuer"
      ? {
          title: "Crea tu espacio para publicar",
          body: "Verifica tu cuenta, publica casos y comparte evidencia con transparencia.",
        }
      : {
          title: "Casi listo para encontrar hogar",
          body: "Guarda favoritos, revisa historias y contacta al rescatista cuando quieras.",
        };

  return (
    <div className={`auth-gate auth-gate--welcome${mode === "rescuer" ? " is-rescuer" : ""}`}>
      <div className="auth-gate-media" aria-hidden="true">
        <img src={bgImage} alt="" />
        <div className="auth-gate-scrim" />
      </div>

      <div className="auth-gate-top">
        <button
          type="button"
          className="auth-gate-back"
          onClick={() => navigate(mode === "rescuer" ? "/onboarding/rescuer" : "/onboarding/donor")}
          aria-label="Atrás"
        >
          <Icon name="back.svg" size={24} />
        </button>
        <img className="auth-gate-logo" src={`${A}dopmi-wordmark.png`} alt="DopMi" width={108} height={36} />
      </div>

      <div className="auth-gate-hero">
        <h1>{context.title}</h1>
        <p className="auth-gate-body">{context.body}</p>
        <span className="auth-gate-paw" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <ellipse cx="9.2" cy="9.5" rx="2.2" ry="2.8" stroke="#f7cb2d" strokeWidth="1.6" />
            <ellipse cx="18.8" cy="9.5" rx="2.2" ry="2.8" stroke="#f7cb2d" strokeWidth="1.6" />
            <ellipse cx="7" cy="15.5" rx="2" ry="2.5" stroke="#f7cb2d" strokeWidth="1.6" />
            <ellipse cx="21" cy="15.5" rx="2" ry="2.5" stroke="#f7cb2d" strokeWidth="1.6" />
            <path
              d="M14 11.8c-3.1 0-5.3 2.1-5.3 5 0 2.3 1.9 4.1 5.3 4.1s5.3-1.8 5.3-4.1c0-2.9-2.2-5-5.3-5Z"
              stroke="#f7cb2d"
              strokeWidth="1.6"
            />
          </svg>
        </span>
      </div>

      <div className="auth-gate-actions">
        <button type="button" className="auth-gate-primary" onClick={() => navigate(`/signup/${mode}`)}>
          Crea una cuenta
        </button>
        <p className="auth-gate-switch">
          <button type="button" className="auth-text-link" onClick={() => navigate(`/login/${mode}`)}>
            Inicia sesión
          </button>
        </p>
        <div className="auth-gate-rule" aria-hidden="true" />
        <p className="auth-gate-social-label">Continuar con</p>
        <SocialButtons variant="icons" onPick={enter} />
      </div>
    </div>
  );
}

function Login({ mode, signup = false }: { mode: AccountMode; signup?: boolean }) {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const enter = () => navigate(mode === "donor" ? "/adoption" : "/rescuer");
  const bgImage = mode === "rescuer" ? `${A}publish-sample-pet.jpg` : `${A}welcome-pets.png`;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    enter();
  };
  return (
    <div
      className={`auth-gate auth-gate--form auth-gate--sheet${mode === "rescuer" ? " is-rescuer" : ""}`}
    >
      <div className="auth-gate-media" aria-hidden="true">
        <img src={bgImage} alt="" />
        <div className="auth-gate-scrim auth-gate-scrim--form" />
      </div>

      <div className="auth-gate-top">
        <button
          type="button"
          className="auth-gate-back"
          onClick={() => navigate(`/welcome/${mode}`)}
          aria-label="Atrás"
        >
          <Icon name="back.svg" size={24} />
        </button>
        <img className="auth-gate-logo" src={`${A}dopmi-wordmark.png`} alt="DopMi" width={108} height={36} />
      </div>

      <form className="auth-gate-form" onSubmit={submit}>
        <div className="auth-gate-form-head">
          <h1>{signup ? "Crea tu cuenta" : "Inicia sesión"}</h1>
          <p>
            {signup
              ? "Completa tus datos para guardar favoritos y contactar al rescatista."
              : "Entra para seguir tus favoritos y retomar donde lo dejaste."}
          </p>
        </div>

        {signup && (
          <label className="auth-field">
            Nombre completo
            <input required placeholder="Tu nombre" autoComplete="name" />
          </label>
        )}
        <label className="auth-field">
          Correo electrónico
          <input required type="email" placeholder="tu@email.com" autoComplete="email" />
        </label>
        {signup && (
          <label className="auth-field">
            Teléfono
            <input inputMode="tel" placeholder="+52 123 456 7890" autoComplete="tel" />
          </label>
        )}
        <label className="auth-field">
          Contraseña
          <input
            required
            type="password"
            placeholder={signup ? "Mínimo 6 caracteres" : "Tu contraseña"}
            autoComplete={signup ? "new-password" : "current-password"}
          />
        </label>
        {signup && (
          <label className="auth-field">
            Confirmar contraseña
            <input required type="password" placeholder="Confirma tu contraseña" autoComplete="new-password" />
          </label>
        )}

        {signup ? (
          <label className="auth-check">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>
              Acepto los{" "}
              <button
                type="button"
                className="auth-text-link"
                onClick={(event) => {
                  event.preventDefault();
                  navigate(`/terms/${mode}`);
                }}
              >
                Términos y Condiciones
              </button>{" "}
              y el{" "}
              <button
                type="button"
                className="auth-text-link"
                onClick={(event) => {
                  event.preventDefault();
                  navigate(`/privacy/${mode}`);
                }}
              >
                Aviso de Privacidad
              </button>
            </span>
          </label>
        ) : (
          <button type="button" className="auth-text-link auth-text-link--end" onClick={() => navigate("/forgot-password")}>
            Olvidé mi contraseña
          </button>
        )}

        <button className="auth-gate-primary" disabled={signup && !accepted}>
          {signup ? "Crea una cuenta" : "Inicia sesión"}
        </button>

        <div className="auth-gate-alt">
          <p className="auth-gate-social-label">Continuar con</p>
          <SocialButtons variant="icons" onPick={enter} />
        </div>

        <p className="auth-gate-switch">
          {signup ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
          <button
            type="button"
            className="auth-text-link"
            onClick={() => navigate(signup ? `/login/${mode}` : `/signup/${mode}`)}
          >
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

function LegalDoc({ kind }: { kind: "terms" | "privacy" }) {
  const navigate = useNavigate();
  const { mode } = useParams();
  const backMode: AccountMode = mode === "rescuer" ? "rescuer" : "donor";
  const back = `/signup/${backMode}`;

  const doc =
    kind === "privacy"
      ? {
          title: "Aviso de Privacidad",
          lead: "Lee cómo DopMi trata la información en este prototipo antes de crear tu cuenta.",
          sections: [
            {
              heading: "Qué cubre este aviso",
              body: "Contenido provisional para validar la apertura, lectura y retorno al registro. El texto legal final requiere aprobación del equipo.",
            },
            {
              heading: "Datos en el prototipo",
              body: "En este mockup no se almacenan ni procesan datos personales reales. La pantalla existe para probar el flujo de aceptación antes de crear una cuenta.",
            },
            {
              heading: "Tus derechos",
              body: "Cuando el producto esté en producción, este aviso explicará cómo ejercer acceso, rectificación, cancelación u oposición conforme a la normativa aplicable en México.",
            },
          ],
        }
      : {
          title: "Términos y Condiciones",
          lead: "Revisa las condiciones de uso de DopMi antes de crear tu cuenta.",
          sections: [
            {
              heading: "Términos de uso",
              body: "Contenido provisional para validar la apertura, lectura y retorno al registro. El texto legal final requiere aprobación del equipo.",
            },
            {
              heading: "Uso del prototipo",
              body: "No se procesan pagos, documentos ni verificaciones reales. Este flujo solo simula el recorrido de aceptación.",
            },
          ],
        };

  return (
    <div className="auth-gate auth-gate--form auth-gate--legal">
      <div className="auth-gate-top">
        <button type="button" className="auth-gate-back" onClick={() => navigate(back)} aria-label="Atrás">
          <AssetIcon name="back.svg" size={24} />
        </button>
        <img className="auth-gate-logo" src={`${A}dopmi-wordmark.png`} alt="DopMi" width={108} height={36} />
      </div>

      <div className="legal-doc">
        <header className="legal-doc-head">
          <h1>{doc.title}</h1>
          <p>{doc.lead}</p>
        </header>
        <div className="legal-doc-body">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>

      <div className="onb-gate-footer">
        <button type="button" className="auth-gate-primary" onClick={() => navigate(back)}>
          Entendido
        </button>
      </div>
    </div>
  );
}

const DISCOVER_DONATE_EVERY = 2;

type PetSize = "Chico" | "Mediano" | "Grande";
type PetPersonality =
  | "alegre"
  | "feliz"
  | "esperanzado"
  | "emocionado"
  | "triste"
  | "enojado"
  | "ansioso"
  | "tranquilo"
  | "contento"
  | "satisfecho"
  | "solo"
  | "nervioso";

const PERSONALITY_FILTERS: Array<{ id: PetPersonality; label: string; tone: string }> = [
  { id: "alegre", label: "Alegre", tone: "cheerful" },
  { id: "feliz", label: "Feliz", tone: "happy" },
  { id: "esperanzado", label: "Esperanzado", tone: "hopeful" },
  { id: "emocionado", label: "Emocionado", tone: "excited" },
  { id: "triste", label: "Triste", tone: "sad" },
  { id: "enojado", label: "Enojado", tone: "angry" },
  { id: "ansioso", label: "Ansioso", tone: "anxious" },
  { id: "tranquilo", label: "Tranquilo", tone: "calm" },
  { id: "contento", label: "Contento", tone: "pleased" },
  { id: "satisfecho", label: "Satisfecho", tone: "satisfied" },
  { id: "solo", label: "Solo", tone: "lonely" },
  { id: "nervioso", label: "Nervioso", tone: "nervous" },
];

function SizeDogIcon({ size, active }: { size: PetSize; active: boolean }) {
  const dims = size === "Chico" ? 30 : size === "Mediano" ? 40 : 52;
  const stroke = active ? 0 : 1.8;
  const fill = active ? "currentColor" : "none";
  return (
    <svg width={dims} height={dims * 0.78} viewBox="0 0 72 56" fill="none" aria-hidden="true">
      {/* cola */}
      <path
        d="M10 28c-6-2-9 2-9 7 0 2 2 3.5 4 2.5l7-3.5"
        fill={fill}
        stroke="currentColor"
        strokeWidth={stroke || 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* cuerpo */}
      <ellipse
        cx="30"
        cy="32"
        rx="18"
        ry="12"
        fill={fill}
        stroke="currentColor"
        strokeWidth={stroke || 1.8}
      />
      {/* cabeza */}
      <circle
        cx="50"
        cy="22"
        r="11"
        fill={fill}
        stroke="currentColor"
        strokeWidth={stroke || 1.8}
      />
      {/* oreja */}
      <path
        d="M46 12c2-8 12-10 16-4 1.2 1.8 0 4-2.2 4.2L50 13"
        fill={fill}
        stroke="currentColor"
        strokeWidth={stroke || 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* hocico */}
      <ellipse
        cx="60"
        cy="26"
        rx="6"
        ry="4.5"
        fill={fill}
        stroke="currentColor"
        strokeWidth={stroke || 1.8}
      />
      {/* ojo */}
      <circle cx="52" cy="20" r="1.8" fill={active ? "#fff" : "currentColor"} />
      {/* patas traseras */}
      <path
        d="M18 42v8M26 43v7"
        stroke="currentColor"
        strokeWidth={active ? 3.2 : 2.2}
        strokeLinecap="round"
      />
      {/* patas delanteras */}
      <path
        d="M38 42v8M46 41v9"
        stroke="currentColor"
        strokeWidth={active ? 3.2 : 2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

type DiscoverPet = (typeof adoptionPets)[number];
type DiscoverDonateCard = {
  kind: "donate";
  id: string;
  petCase: { id: string; name: string; species: "Perro" | "Gato"; image: string; story: string; location: string; rescuer: string };
  need: { id: string; title: string; requested: number; funded: number };
};
type DiscoverPetCard = { kind: "pet"; id: string; pet: DiscoverPet };
type DiscoverCard = DiscoverPetCard | DiscoverDonateCard;

function AdoptionHome() {
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet, emptyStates, cases, donorProfile } = usePrototypeStore();
  const donorCity = donorProfile.city.trim() || "Monterrey, NL";
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftSex, setDraftSex] = useState<"Macho" | "Hembra" | null>(null);
  const [sexFilter, setSexFilter] = useState<"Macho" | "Hembra" | null>(null);
  const [draftSize, setDraftSize] = useState<PetSize | null>(null);
  const [sizeFilter, setSizeFilter] = useState<PetSize | null>(null);
  const [draftPersonality, setDraftPersonality] = useState<PetPersonality[]>([]);
  const [personalityFilter, setPersonalityFilter] = useState<PetPersonality[]>([]);
  const [chatConfirmId, setChatConfirmId] = useState<string | null>(null);
  const [species, setSpecies] = useState<"Perro" | "Gato">("Perro");
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);
  const dragXRef = useRef(0);
  const filtersActive = !!sexFilter || !!sizeFilter || personalityFilter.length > 0;

  const pets = emptyStates
    ? []
    : adoptionPets.filter((pet) => {
        if (pet.listed === false) return false;
        if (pet.type !== species) return false;
        if (sexFilter && pet.sex !== sexFilter) return false;
        if (sizeFilter && pet.size !== sizeFilter) return false;
        if (
          personalityFilter.length &&
          !personalityFilter.some((trait) => (pet.personality as readonly string[]).includes(trait))
        ) {
          return false;
        }
        return true;
      });

  const deck = useMemo(() => {
    const donatePool = emptyStates
      ? []
      : cases
          .filter(
            (item) =>
              item.caseStatus === "active" &&
              item.species === species &&
              item.needs.some((need) => need.status === "active"),
          )
          .map((item) => {
            const need = item.needs.find((entry) => entry.status === "active")!;
            return {
              kind: "donate" as const,
              id: `donate-${item.id}-${need.id}`,
              petCase: {
                id: item.id,
                name: item.name,
                species: item.species,
                image: item.image,
                story: item.story,
                location: item.location,
                rescuer: item.rescuer,
              },
              need: {
                id: need.id,
                title: need.title,
                requested: need.requested,
                funded: need.funded,
              },
            };
          });

    const cards: DiscoverCard[] = [];
    let donateIndex = 0;
    pets.forEach((pet, petIndex) => {
      cards.push({ kind: "pet", id: pet.id, pet });
      if (donatePool.length && (petIndex + 1) % DISCOVER_DONATE_EVERY === 0) {
        cards.push(donatePool[donateIndex % donatePool.length]);
        donateIndex += 1;
      }
    });
    return cards;
  }, [cases, emptyStates, pets, species]);

  useEffect(() => {
    setIndex(0);
    setDragX(0);
    setExiting(null);
  }, [sexFilter, sizeFilter, personalityFilter, species, emptyStates]);

  const openFilters = () => {
    setDraftSex(sexFilter);
    setDraftSize(sizeFilter);
    setDraftPersonality(personalityFilter);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setSexFilter(draftSex);
    setSizeFilter(draftSize);
    setPersonalityFilter(draftPersonality);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftSex(null);
    setDraftSize(null);
    setDraftPersonality([]);
    setSexFilter(null);
    setSizeFilter(null);
    setPersonalityFilter([]);
    setFilterOpen(false);
  };

  const selectSpecies = (next: "Perro" | "Gato") => {
    if (next === species) return;
    setSpecies(next);
    setDragX(0);
    setExiting(null);
    setIndex(0);
  };

  const current = deck[index] ?? null;
  const nextCard = deck[index + 1] ?? null;
  const deckDone = deck.length > 0 && index >= deck.length;
  const currentPet = current?.kind === "pet" ? current.pet : null;
  const currentDonate = current?.kind === "donate" ? current : null;

  const advance = () => {
    setExiting(null);
    setDragX(0);
    dragXRef.current = 0;
    setIndex((value) => value + 1);
  };

  const fling = (dir: "left" | "right") => {
    if (!current || exiting) return;
    setExiting(dir);
    window.setTimeout(advance, 280);
  };

  const pass = () => fling("left");
  const like = () => {
    if (!current || exiting || current.kind !== "pet") return;
    if (!savedPetIds.includes(current.pet.id)) toggleSavedPet(current.pet.id);
    fling("right");
  };

  const openDonate = () => {
    if (!currentDonate || exiting) return;
    navigate(`/case/${currentDonate.petCase.id}`);
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!current || exiting) return;
    startX.current = event.clientX;
    dragXRef.current = 0;
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* pointer ya liberado o evento sintético sin captura activa */
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragging || exiting) return;
    const delta = event.clientX - startX.current;
    dragXRef.current = delta;
    setDragX(delta);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const delta = dragXRef.current;
    if (Math.abs(delta) < 8) {
      setDragX(0);
      dragXRef.current = 0;
      if (currentPet) navigate(`/adoption/${currentPet.id}`);
      if (currentDonate) openDonate();
      return;
    }
    if (delta > 110) {
      if (currentDonate) {
        fling("right");
      } else {
        like();
      }
      return;
    }
    if (delta < -110) {
      pass();
      return;
    }
    setDragX(0);
    dragXRef.current = 0;
  };

  const cardTransform = exiting
    ? `translateX(${exiting === "right" ? 420 : -420}px) rotate(${exiting === "right" ? 18 : -18}deg)`
    : `translateX(${dragX}px) rotate(${dragX / 28}deg)`;

  const mosaicPets = pets.length ? pets : adoptionPets;

  return (
    <ScreenShell
      className="adoption-shell"
      overlay={
        <>
        {filterOpen ? (
          <div className="modal-backdrop center" onClick={() => setFilterOpen(false)}>
            <div className="dialog-card adoption-filter-dialog" onClick={(event) => event.stopPropagation()}>
              <button className="dialog-close" onClick={() => setFilterOpen(false)} aria-label="Cerrar">×</button>
              <header className="adoption-filter-header">
                <h2>Filtros</h2>
              </header>
              <div className="adoption-filter-grid adoption-filter-grid--stacked">
                <section>
                  <h3>Género</h3>
                  <div className="filter-gender" role="group" aria-label="Género">
                    <button
                      type="button"
                      className={`filter-gender-btn female${draftSex === "Hembra" ? " is-active" : ""}`}
                      onClick={() => setDraftSex(draftSex === "Hembra" ? null : "Hembra")}
                    >
                      Hembra
                    </button>
                    <button
                      type="button"
                      className={`filter-gender-btn male${draftSex === "Macho" ? " is-active" : ""}`}
                      onClick={() => setDraftSex(draftSex === "Macho" ? null : "Macho")}
                    >
                      Macho
                    </button>
                  </div>
                </section>

                <section>
                  <h3>Tamaño</h3>
                  <div className="filter-size" role="group" aria-label="Tamaño">
                    {(["Chico", "Mediano", "Grande"] as const).map((size) => {
                      const active = draftSize === size;
                      return (
                        <button
                          type="button"
                          key={size}
                          className={`filter-size-btn${active ? " is-active" : ""}`}
                          aria-pressed={active}
                          aria-label={size}
                          onClick={() => setDraftSize(active ? null : size)}
                        >
                          <SizeDogIcon size={size} active={active} />
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="adoption-filter-personality">
                  <h3>Personalidad</h3>
                  <div className="filter-personality" role="group" aria-label="Personalidad">
                    {PERSONALITY_FILTERS.map((trait) => {
                      const active = draftPersonality.includes(trait.id);
                      return (
                        <button
                          type="button"
                          key={trait.id}
                          className={`filter-personality-chip tone-${trait.tone}${active ? " is-active" : ""}`}
                          aria-pressed={active}
                          onClick={() =>
                            setDraftPersonality((current) =>
                              current.includes(trait.id)
                                ? current.filter((item) => item !== trait.id)
                                : [...current, trait.id],
                            )
                          }
                        >
                          {trait.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
              <div className="adoption-filter-actions">
                <button type="button" className="primary-button" onClick={applyFilters}>Aplicar filtros</button>
                <button type="button" className="secondary-button" onClick={clearFilters}>Limpiar filtros</button>
              </div>
            </div>
          </div>
        ) : null}
        {chatConfirmId ? (
          <AdoptStartDialog
            onClose={() => setChatConfirmId(null)}
            onConfirm={() => navigate(`/messages/${chatConfirmId}`)}
          />
        ) : null}
        </>
      }
    >
      <div className="discover donor-chrome">
        <DonorChromeTop
          leading={
            <p className="discover-place">
              <AssetIcon name="location.svg" size={14} alt="" />
              <span>{donorCity}</span>
            </p>
          }
        />

        <div className="discover-species-row">
          <div className="discover-species" role="tablist" aria-label="Tipo de mascota">
            <button
              type="button"
              role="tab"
              aria-selected={species === "Perro"}
              className={`discover-species-tab${species === "Perro" ? " is-active" : ""}`}
              onClick={() => selectSpecies("Perro")}
            >
              Perros
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={species === "Gato"}
              className={`discover-species-tab${species === "Gato" ? " is-active" : ""}`}
              onClick={() => selectSpecies("Gato")}
            >
              Gatos
            </button>
          </div>
          <button
            type="button"
            className={`discover-filter-inline${filtersActive ? " is-active" : ""}`}
            onClick={openFilters}
            aria-label="Filtros"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="16.5" cy="7" r="2.25" fill="currentColor" />
              <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="7.5" cy="17" r="2.25" fill="currentColor" />
            </svg>
          </button>
        </div>

        {deckDone ? (
          <section className="discover-end">
            <div className="discover-end-mosaic" aria-hidden="true">
              {Array.from({ length: 4 }, (_, mosaicIndex) => {
                const pet = mosaicPets[mosaicIndex % mosaicPets.length];
                return (
                  <div className="discover-end-polaroid" key={`${pet.id}-mosaic-${mosaicIndex}`}>
                    <img src={pet.image} alt="" />
                  </div>
                );
              })}
            </div>
            <article className="discover-end-card">
              <h2>Nuestra manada llegó hasta aquí por ahora</h2>
              <p className="discover-end-lead">¡No te desanimes! nuestro feed se actualiza constantemente.</p>
              <p className="discover-end-tip">Tip: Ajusta los filtros para descubrir más historias.</p>
              <button type="button" className="discover-end-primary" onClick={() => navigate("/messages")}>
                Ir a mis <strong>favoritos</strong>
              </button>
              <button type="button" className="discover-end-secondary" onClick={() => setIndex(0)}>
                Volver a <strong>descubrir</strong>
              </button>
            </article>
          </section>
        ) : !pets.length ? (
          <section className="discover-empty">
            <article className="empty-card donor-empty-card">
              <div className="donor-empty-copy">
                <h2>No hay mascotas disponibles</h2>
                <p>
                  {filtersActive && !emptyStates
                    ? "Prueba otros filtros o limpia la selección para ver más opciones."
                    : !emptyStates
                      ? `Por ahora no hay ${species === "Perro" ? "perros" : "gatos"} en adopción. Prueba la otra categoría o vuelve pronto.`
                      : "Por ahora no hay mascotas en adopción. Vuelve pronto o apoya a quienes ya buscan ayuda."}
                </p>
              </div>
              {filtersActive && !emptyStates ? (
                <button type="button" className="secondary-button" onClick={clearFilters}>Limpiar filtros</button>
              ) : !emptyStates ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => selectSpecies(species === "Perro" ? "Gato" : "Perro")}
                >
                  Ver {species === "Perro" ? "gatos" : "perros"}
                </button>
              ) : (
                <button type="button" className="primary-button" onClick={() => navigate("/donate")}>
                  Ir a Apoyar
                </button>
              )}
            </article>
          </section>
        ) : (
          <>
            <div className="discover-deck" aria-live="polite">
              <div className="discover-deck-stage">
              <div className="discover-stack-layer discover-stack-layer--far" aria-hidden="true" />
              <div className="discover-stack-layer discover-stack-layer--mid" aria-hidden="true" />
              {nextCard ? (
                <article className="discover-card discover-card--next" aria-hidden="true">
                  <div className="discover-card-media">
                    <img
                      src={nextCard.kind === "pet" ? nextCard.pet.image : nextCard.petCase.image}
                      alt=""
                    />
                  </div>
                  <div className="discover-card-footer" />
                </article>
              ) : null}
              {currentPet ? (
                <article
                  className={`discover-card discover-card--active${dragging ? " is-dragging" : ""}${exiting ? " is-exiting" : ""}`}
                  style={{ transform: cardTransform }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <div className="discover-card-media">
                    <img src={currentPet.image} alt={currentPet.name} draggable={false} />
                    <div className="discover-card-shade" />
                    <div className="discover-card-info">
                      <div className="discover-card-copy">
                        <h2>{currentPet.name}</h2>
                        <p className="discover-card-place">
                          <AssetIcon name="location.svg" size={12} alt="" />
                          {currentPet.location}
                        </p>
                        <p className="discover-card-story">{currentPet.story}</p>
                        <div className="discover-card-tags">
                          <span>{currentPet.sex}</span>
                          <span>{currentPet.size}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="discover-card-footer">
                    <button
                      type="button"
                      className={`discover-control pass${dragX < -12 || exiting === "left" ? " is-hot" : ""}`}
                      onClick={pass}
                      onPointerDown={(event) => event.stopPropagation()}
                      aria-label="Pasar"
                      disabled={!!exiting}
                    >
                      <Icon name="icon-x-muted.svg" size={26} />
                    </button>
                    <button
                      type="button"
                      className="discover-control message"
                      onClick={() => setChatConfirmId(currentPet.id)}
                      onPointerDown={(event) => event.stopPropagation()}
                      aria-label="Enviar mensaje de adopción"
                      disabled={!!exiting}
                    >
                      <svg className="discover-message-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M7.9 20c1.91.98 4.1 1.24 6.19.75 2.09-.5 3.93-1.72 5.19-3.45 1.26-1.73 1.86-3.86 1.7-6-.17-2.14-1.09-4.15-2.61-5.66C16.85 4.11 14.84 3.19 12.7 3.02c-2.14-.17-4.27.44-6 1.7C5 6 3.75 7.82 3.25 9.91c-.5 2.09-.23 4.28.75 6.19L2 22l5.9-2z"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M8.5 11h7M8.5 14h4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`discover-control like${dragX > 12 || exiting === "right" ? " is-hot" : ""}`}
                      onClick={like}
                      onPointerDown={(event) => event.stopPropagation()}
                      aria-label="Me gusta"
                      disabled={!!exiting}
                    >
                      <Icon name="icon-heart.svg" size={24} />
                    </button>
                  </div>
                </article>
              ) : null}
              {currentDonate ? (
                <article
                  className={`discover-card discover-card--active discover-card--donate${dragging ? " is-dragging" : ""}${exiting ? " is-exiting" : ""}`}
                  style={{ transform: cardTransform }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <div className="discover-card-media">
                    <img src={currentDonate.petCase.image} alt={currentDonate.petCase.name} draggable={false} />
                    <div className="discover-card-shade" />
                    <div className="discover-card-info">
                      <div className="discover-card-copy">
                        <h2>{currentDonate.petCase.name}</h2>
                        <p className="discover-card-story">{currentDonate.need.title}</p>
                        <div className="discover-donate-progress" aria-hidden="true">
                          <i
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((currentDonate.need.funded / currentDonate.need.requested) * 100),
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="discover-donate-meta">
                          ${currentDonate.need.funded} de ${currentDonate.need.requested}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="discover-card-footer discover-card-footer--donate">
                    <button
                      type="button"
                      className="discover-donate-cta"
                      onClick={openDonate}
                      onPointerDown={(event) => event.stopPropagation()}
                      disabled={!!exiting}
                    >
                      <span className="discover-donate-cta-label">Apoya con sus necesidades</span>
                      <span className="discover-control donate" aria-hidden="true">
                        <Icon name="tab-donate.svg" size={26} />
                      </span>
                    </button>
                  </div>
                </article>
              ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </ScreenShell>
  );
}

function AdoptionDetail() {
  const { petId = "toby" } = useParams();
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet } = usePrototypeStore();
  const pet = adoptionPets.find((item) => item.id === petId) ?? adoptionPets[0];
  const isSaved = savedPetIds.includes(pet.id);
  const [report, setReport] = useState(false);
  const [adoptConfirm, setAdoptConfirm] = useState(false);
  const [toast, setToast] = useState("");
  const stats = [
    { value: pet.sex, label: "Sexo" },
    { value: pet.size, label: "Tamaño" },
    { value: pet.distance, label: "Distancia" },
  ];

  return (
    <ScreenShell
      className="adoption-detail-shell"
      overlay={
        <>
          {report ? (
            <ReportDialog
              title="Reportar publicación"
              onClose={(sent) => {
                setReport(false);
                if (sent) setToast("Reporte enviado, lo revisaremos pronto");
              }}
            />
          ) : null}
          {adoptConfirm ? (
            <AdoptStartDialog
              onClose={() => setAdoptConfirm(false)}
              onConfirm={() => navigate(`/messages/${pet.id}`)}
            />
          ) : null}
          {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
        </>
      }
    >
      <div className="pet-detail">
        <div className="pet-detail-scroll">
          <div className="pet-detail-hero">
            <img src={pet.image} alt={pet.name} />
            <button type="button" className="pet-detail-back" onClick={() => navigate("/adoption")} aria-label="Volver">
              <Icon name="back.svg" size={20} />
            </button>
            <button
              type="button"
              className="pet-detail-rescuer"
              onClick={() => navigate(`/rescuer-profile/${encodeURIComponent(pet.rescuer)}`)}
            >
              <span>{pet.rescuer}</span>
              <span className="pet-detail-rescuer-avatar" aria-hidden="true">
                {pet.rescuer.charAt(0)}
              </span>
            </button>
            <div className="pet-detail-dots" aria-hidden="true">
              <i className="is-active" />
              <i />
              <i />
            </div>
          </div>

          <div className="pet-detail-sheet">
            <div className="pet-detail-heading">
              <div className="pet-detail-heading-copy">
                <h1>{pet.name}</h1>
                <p className="pet-detail-location">
                  <Icon name="location.svg" size={14} />
                  {pet.location}
                </p>
                {pet.verified ? (
                  <p className="pet-detail-verified">
                    <AssetIcon name="icon-verified.svg" size={16} alt="" />
                    Rescatista verificado
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="pet-detail-share"
                onClick={() => setToast("Enlace copiado")}
                aria-label="Compartir"
              >
                <Icon name="icon-share.svg" size={18} />
              </button>
            </div>

            <div className="pet-detail-stats">
              {stats.map((stat) => (
                <article className="pet-detail-stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>

            <section className="pet-detail-story">
              <h2>Su historia</h2>
              <p>{pet.story}</p>
            </section>

            <button type="button" className="pet-detail-report" onClick={() => setReport(true)}>
              <Icon name="icon-alert-circle.svg" size={16} />
              Reportar publicación
            </button>
          </div>
        </div>

        <div className="pet-detail-bar">
          <button
            type="button"
            className={`pet-detail-save${isSaved ? " is-on" : ""}`}
            onClick={() => toggleSavedPet(pet.id)}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Quitar de Mis match" : "Guardar en Mis match"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566Z"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="pet-detail-cta"
            onClick={() => setAdoptConfirm(true)}
          >
            Quiero adoptar
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}

function DonateCaseRing({
  image,
  name,
  funded,
  requested,
  pct,
  onClick,
}: {
  image: string;
  name: string;
  funded: number;
  requested: number;
  pct: number;
  onClick: () => void;
}) {
  const size = 72;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;

  return (
    <button type="button" className="donate-case-ring" onClick={onClick}>
      <span className="donate-case-ring-visual" aria-hidden="true">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e7e2da"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--yellow)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <img src={image} alt="" />
      </span>
      <strong>{name}</strong>
      <span>
        <b>${funded}</b> / ${requested}
      </span>
    </button>
  );
}

function DonationHome() {
  const navigate = useNavigate();
  const { cases, emptyStates } = usePrototypeStore();

  const openCases = emptyStates
    ? []
    : cases.filter((item) => item.caseStatus === "active" && item.needs.some((need) => need.status === "active"));

  const caseItems = openCases.map((item) => {
    const need =
      item.needs.find((entry) => entry.status === "active" && entry.urgent) ??
      item.needs.find((entry) => entry.status === "active")!;
    const pct = need.requested ? Math.min(100, Math.round((need.funded / need.requested) * 100)) : 0;
    return { item, need, pct };
  });

  return (
    <ScreenShell
      className="donate-shell"
      overlay={
        <button
          type="button"
          className="donate-guardian-foot donate-guardian-foot--dock"
          onClick={() => navigate("/impact/support")}
        >
          <small>Desde $50 / mes</small>
          <span className="donate-guardian-cta">Suscríbete ahora</span>
        </button>
      }
    >
      <div className="donate-home donor-chrome">
        <DonorChromeTop />

        <section className="donate-discover">
          <div className="donate-discover-head">
            <h1>Descubre casos</h1>
          </div>

          {!caseItems.length ? null : (
            <div className="donate-cases-rail" role="list">
              {caseItems.map(({ item, need, pct }) => (
                <DonateCaseRing
                  key={`${item.id}-${need.id}`}
                  image={item.image}
                  name={item.name}
                  funded={need.funded}
                  requested={need.requested}
                  pct={pct}
                  onClick={() => navigate(`/case/${item.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="donate-guardian">
          <h2>Sé un Guardián</h2>
          <p>Con cada aporte mensual ayudarás a cubrir necesidades reales de mascotas que buscan un hogar.</p>
          <button
            type="button"
            className="donate-guardian-card"
            onClick={() => navigate("/impact/support")}
          >
            <div className="donate-guardian-media" aria-hidden="true">
              <img src={`${A}guardian-urgent.jpg`} alt="" />
              <div className="donate-guardian-shade" />
            </div>
            <div className="donate-guardian-body">
              <div className="donate-guardian-copy">
                <strong>Apoya a casos urgentes</strong>
                <ul>
                  <li>
                    <Icon name="icon-shield.svg" size={14} />
                    Rescatistas y casos verificados
                  </li>
                  <li>
                    <Icon name="tab-impact.svg" size={14} />
                    Sigue tu huella
                  </li>
                  <li>
                    <Icon name="check-circle.svg" size={14} />
                    Cancela cuando quieras
                  </li>
                </ul>
              </div>
              <div className="donate-guardian-grow" aria-hidden="true" />
              <div className="donate-guardian-foot-slot" aria-hidden="true" />
              <div className="donate-guardian-trail" aria-hidden="true" />
            </div>
          </button>
        </section>
      </div>
    </ScreenShell>
  );
}

function needTypeTone(type: Need["type"]) {
  if (type === "Comida") return "food";
  if (type === "Medicina") return "meds";
  if (type === "Veterinario") return "vet";
  return "other";
}

function needTypeLabel(type: Need["type"]) {
  if (type === "Comida") return "Alimento";
  if (type === "Medicina") return "Medicinas";
  if (type === "Veterinario") return "Veterinario";
  return "Otro";
}

function NeedCard({
  need,
  defaultOpen = false,
  onDonate,
}: {
  need: Need;
  caseId?: string;
  defaultOpen?: boolean;
  onDonate: (needId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const remaining = Math.max(0, need.requested - need.funded);
  const fullyFunded = remaining === 0 || need.status === "funded" || need.status === "completed" || need.status === "evidence";
  const pct = need.requested ? Math.min(100, Math.round((need.funded / need.requested) * 100)) : 0;
  const tone = needTypeTone(need.type);

  return (
    <article className={`donate-need ${open ? "is-open" : ""} tone-${tone}`}>
      <div className="donate-need-main">
        <button
          type="button"
          className="donate-need-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={`donate-need-icon tone-${tone}`} aria-hidden="true">
            {needEmoji(need.type)}
          </span>
          <span className="donate-need-copy">
            <span className="donate-need-title">
              <strong>{need.title}</strong>
              {need.urgent ? (
                <span className="donate-need-urgent" aria-label="Urgente">
                  <Icon name="icon-alert-circle.svg" size={14} />
                </span>
              ) : null}
            </span>
            <span className="donate-need-progress" aria-hidden="true">
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className="donate-need-amounts">
              <b>${need.funded.toLocaleString("es-MX")} donados</b>
              <span>${remaining.toLocaleString("es-MX")} faltantes</span>
            </span>
          </span>
          <span className="donate-need-chevron" aria-hidden="true">
            <Chevron />
          </span>
        </button>
        <button
          type="button"
          className="donate-need-action"
          disabled={fullyFunded}
          onClick={() => onDonate(need.id)}
          aria-label={fullyFunded ? "Necesidad completada" : `Donar a ${need.title}`}
        >
          <Icon name="tab-donate.svg" size={18} />
        </button>
      </div>
      {open ? (
        <div className="donate-need-details">
          <p className="donate-need-evidence-label">Evidencias cargadas por rescatista:</p>
          <div className="donate-need-evidence">
            <img src="/assets/guardian-reports.jpg" alt={`Evidencia de ${need.title}`} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function CaseDetail() {
  const { caseId = "luna" } = useParams();
  const navigate = useNavigate();
  const { cases } = usePrototypeStore();
  const item = cases.find((entry) => entry.id === caseId) ?? cases[0];
  const total = item.needs.reduce((sum, need) => sum + need.requested, 0);
  const funded = item.needs.reduce((sum, need) => sum + need.funded, 0);
  const missionPct = Math.round((funded / Math.max(total, 1)) * 100);
  const [report, setReport] = useState(false);
  const [toast, setToast] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [donateNeedId, setDonateNeedId] = useState<string | null>(null);
  const photos =
    item.id === "luna"
      ? ["/assets/luna-detail.png", item.image, "/assets/guardian-luna.jpg"]
      : item.id === "milo"
        ? [item.image, "/assets/guardian-milo.jpg", item.image]
        : item.id === "rocky"
          ? [item.image, "/assets/guardian-milo.jpg", "/assets/guardian-urgent.jpg"]
          : [item.image, item.image, item.image];
  const gallery = [...photos, item.image, photos[1] ?? item.image, photos[2] ?? item.image].slice(0, 6);
  const tags = Array.from(new Set(item.needs.map((need) => need.type))).map(needTypeLabel);
  const firstActive = item.needs.find((need) => need.status === "active" && need.funded < need.requested)?.id;
  const primaryNeed =
    item.needs.find((entry) => entry.status === "active" && entry.funded < entry.requested) ?? item.needs[0];
  const donateNeed =
    (donateNeedId ? item.needs.find((need) => need.id === donateNeedId) : null) ?? primaryNeed;
  const openDonate = (needId?: string) => {
    const target =
      (needId ? item.needs.find((need) => need.id === needId) : null) ??
      primaryNeed;
    if (target) setDonateNeedId(target.id);
  };

  return (
    <ScreenShell
      className="adoption-detail-shell donate-case-shell"
      overlay={
        <>
          {donateNeed && donateNeedId ? (
            <DonateAmountDialog
              remaining={Math.max(0, donateNeed.requested - donateNeed.funded)}
              onClose={() => setDonateNeedId(null)}
              onConfirm={(amount) => {
                setDonateNeedId(null);
                navigate(`/donate/${item.id}/${donateNeed.id}`, { state: { amount } });
              }}
            />
          ) : null}
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
        </>
      }
    >
      <div className="pet-detail donate-case-detail">
        <div className="pet-detail-scroll">
          <div className="pet-detail-hero">
            <img src={photos[photoIndex]} alt={item.name} />
            <button type="button" className="pet-detail-back" onClick={() => navigate("/donate")} aria-label="Volver">
              <Icon name="back.svg" size={20} />
            </button>
            <button
              type="button"
              className="pet-detail-rescuer"
              onClick={() => navigate(`/rescuer-profile/${encodeURIComponent(item.rescuer)}`)}
            >
              <span>{item.rescuer}</span>
              <span className="pet-detail-rescuer-avatar" aria-hidden="true">
                {item.rescuer.charAt(0)}
              </span>
            </button>
            <div className="pet-detail-dots" role="tablist" aria-label="Fotos">
              {photos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === photoIndex ? "is-active" : ""}
                  aria-label={`Foto ${index + 1}`}
                  onClick={() => setPhotoIndex(index)}
                />
              ))}
            </div>
          </div>

          <div className="pet-detail-sheet">
            <div className="pet-detail-heading">
              <div className="pet-detail-heading-copy">
                <h1>{item.name}</h1>
                <p className="pet-detail-location">
                  <Icon name="location.svg" size={14} />
                  {item.location}
                </p>
                <p className="pet-detail-verified">
                  <AssetIcon name="icon-verified.svg" size={16} alt="" />
                  Rescatista verificado
                </p>
              </div>
              <button
                type="button"
                className="pet-detail-share"
                onClick={() => setToast("Enlace copiado")}
                aria-label="Compartir"
              >
                <Icon name="icon-share.svg" size={18} />
              </button>
            </div>

            <section className="donate-case-funding" aria-label="Progreso de donación">
              <div className="donate-case-funding-stats">
                <div className="donate-case-funding-stat">
                  <span className="donate-case-funding-icon received" aria-hidden="true">
                    <Icon name="tab-impact.svg" size={16} />
                  </span>
                  <div>
                    <strong>${funded.toLocaleString("es-MX")}</strong>
                    <span>Recibido</span>
                  </div>
                </div>
                <div className="donate-case-funding-stat">
                  <span className="donate-case-funding-icon goal" aria-hidden="true">
                    <Icon name="icon-star.svg" size={16} />
                  </span>
                  <div>
                    <strong>${total.toLocaleString("es-MX")}</strong>
                    <span>Objetivo</span>
                  </div>
                </div>
              </div>
              <div className="donate-case-funding-bar" aria-hidden="true">
                <i style={{ width: `${missionPct}%` }} />
              </div>
            </section>

            {tags.length ? (
              <div className="donate-case-tags" aria-label="Categorías">
                {tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}

            <section className="pet-detail-story">
              <h2>Mi historia</h2>
              <p>{item.story}</p>
            </section>

            <section className="donate-case-needs">
              <h2>Ayúdame a recuperar:</h2>
              <div className="donate-needs-stack">
                {item.needs.map((need) => (
                  <NeedCard
                    key={need.id}
                    need={need}
                    caseId={item.id}
                    defaultOpen={need.id === firstActive}
                    onDonate={openDonate}
                  />
                ))}
              </div>
            </section>

            <section className="donate-case-gallery" aria-label="Galería">
              <div className="donate-case-gallery-grid">
                {gallery.map((src, index) => (
                  <button
                    type="button"
                    key={`${src}-${index}`}
                    className="donate-case-gallery-item"
                    onClick={() => setPhotoIndex(Math.min(index, photos.length - 1))}
                    aria-label={`Ver foto ${index + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            </section>

            <button type="button" className="pet-detail-report" onClick={() => setReport(true)}>
              <Icon name="icon-alert-circle.svg" size={16} />
              Reportar
            </button>
          </div>
        </div>

        <div className="pet-detail-bar donate-case-bar">
          <button
            type="button"
            className="pet-detail-cta"
            disabled={!primaryNeed}
            onClick={() => openDonate()}
          >
            Donar
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}

function DonationFlow() {
  const { caseId = "luna", needId = "luna-food" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { cases, paymentOutcome, donate } = usePrototypeStore();
  const item = cases.find((entry) => entry.id === caseId) ?? cases[0];
  const need = item.needs.find((entry) => entry.id === needId) ?? item.needs[0];
  const seedAmount = typeof location.state === "object" && location.state && "amount" in location.state
    ? Number((location.state as { amount?: number }).amount)
    : NaN;
  const [step, setStep] = useState<"amount" | "review">(Number.isFinite(seedAmount) && seedAmount > 0 ? "review" : "amount");
  const [amount, setAmount] = useState(Number.isFinite(seedAmount) && seedAmount > 0 ? seedAmount : 150);
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
              {[...new Set([50, 150, 300, remaining])].map((value) => (
                <button key={value} className={amount === value ? "selected" : ""} onClick={() => setAmount(value)}>
                  ${value}
                </button>
              ))}
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
            <>
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
            </>
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
      <TopBar back="/donate" />
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
        <button className="primary-button" onClick={() => navigate("/donate")}>Volver a Apoyar</button>
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
      <TopBar title="Pago no completado" back="/donate" />
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
        <button className="text-action" onClick={() => navigate("/donate")}>Volver a Apoyar</button>
      </div>
    </div>
  );
}

function Messages() {
  const navigate = useNavigate();
  const { threadId = "luna" } = useParams();
  const { messages, sendMessage, startAdoptionChat, accountMode } = usePrototypeStore();
  const [text, setText] = useState("");
  const pet = adoptionPets.find((item) => item.id === threadId);
  const chatTitle = pet?.name ?? (threadId === "luna" ? "Luna" : "Chat");
  const threadMessages = messages.filter((message) => (message.threadId ?? "luna") === threadId);

  useEffect(() => {
    if (accountMode !== "donor" || !pet) return;
    startAdoptionChat({ id: pet.id, name: pet.name, image: pet.image });
  }, [accountMode, pet?.id, pet?.name, pet?.image, startAdoptionChat]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    sendMessage(accountMode, text.trim(), threadId);
    setText("");
  };
  return (
    <div className={`plain-screen chat-screen ${accountMode === "donor" ? "adopter-chat" : "rescuer-chat"}`}>
      <TopBar
        title={chatTitle}
        subtitle={accountMode === "donor" ? pet?.rescuer : undefined}
        back={accountMode === "donor" ? "/messages" : "/rescuer/messages"}
        actions={
          pet && accountMode === "donor" ? (
            <button
              type="button"
              className="online-label chat-detail-link"
              onClick={() => navigate(`/adoption/${pet.id}`)}
            >
              Ver detalle
            </button>
          ) : null
        }
      />
      <div className="chat-messages">
        {threadMessages.map((message) => (
          <div key={message.id} className={`bubble ${message.author === accountMode ? "mine" : ""}${message.image ? " has-media" : ""}`}>
            {message.image ? (
              <img className="bubble-photo" src={message.image} alt={pet?.name ?? "Mascota"} />
            ) : null}
            <p>{message.text}</p>
            <span>{message.time}</span>
          </div>
        ))}
      </div>
      <form className="chat-compose" onSubmit={submit}>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Escribe un mensaje..." />
        <button disabled={!text.trim()} aria-label="Enviar"><AssetIcon name="send.svg" /></button>
      </form>
    </div>
  );
}

function DonorMessages() {
  const navigate = useNavigate();
  const { messages, emptyStates, savedPetIds } = usePrototypeStore();
  const [view, setView] = useState<"home" | "favorites">("home");
  const [favSort, setFavSort] = useState<"newest" | "oldest">("newest");
  const [chatConfirmId, setChatConfirmId] = useState<string | null>(null);
  const last = messages[messages.length - 1];

  const favorites = useMemo(() => {
    if (emptyStates) return [];
    const pets = adoptionPets.filter((pet) => pet.listed !== false && savedPetIds.includes(pet.id));
    const rank = (id: string) => {
      const index = savedPetIds.indexOf(id);
      return index === -1 ? -1 : index;
    };
    return [...pets].sort((a, b) => {
      const diff = rank(a.id) - rank(b.id);
      return favSort === "newest" ? -diff : diff;
    });
  }, [emptyStates, savedPetIds, favSort]);

  const hasFavorites = favorites.length > 0;

  const threads = emptyStates
    ? []
    : (
        [
          {
            petId: "rocky",
            preview: last?.text ?? "Perfecto. ¿Cuándo podrías visitarlo?",
            time: last?.time ?? "10:36",
            unread: last?.author === "rescuer" ? 1 : 0,
          },
          {
            petId: "toby",
            preview: "Gracias por tu interés en adoptar. ¿Quieres conocerlo?",
            time: "Ayer",
            unread: 0,
          },
          {
            petId: "misha",
            preview: "¡Hola! Misha está lista para visitas este fin de semana.",
            time: "2d",
            unread: 0,
          },
        ] as const
      )
        .map((thread) => {
          const pet = adoptionPets.find((item) => item.id === thread.petId && item.listed !== false);
          if (!pet) return null;
          return { ...thread, pet };
        })
        .filter((thread): thread is NonNullable<typeof thread> => thread !== null);

  const hasChats = threads.length > 0;

  const renderFavCard = (item: (typeof favorites)[number]) => (
    <article className="match-fav-card" key={item.id}>
      <button
        type="button"
        className="match-fav-photo"
        onClick={() => navigate(`/adoption/${item.id}`)}
        aria-label={`Ver a ${item.name}`}
      >
        <img src={item.image} alt="" />
        <span className="match-fav-name">{item.name}</span>
      </button>
      <button
        type="button"
        className="match-fav-chat"
        onClick={() => setChatConfirmId(item.id)}
        aria-label={`Escribir sobre ${item.name}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7.9 20c1.91.98 4.1 1.24 6.19.75 2.09-.5 3.93-1.72 5.19-3.45 1.26-1.73 1.86-3.86 1.7-6-.17-2.14-1.09-4.15-2.61-5.66C16.85 4.11 14.84 3.19 12.7 3.02c-2.14-.17-4.27.44-6 1.7C5 6 3.75 7.82 3.25 9.91c-.5 2.09-.23 4.28.75 6.19L2 22l5.9-2z"
            stroke="#15110d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </article>
  );

  return (
    <ScreenShell
      className="match-shell"
      overlay={
        chatConfirmId ? (
          <AdoptStartDialog
            onClose={() => setChatConfirmId(null)}
            onConfirm={() => navigate(`/messages/${chatConfirmId}`)}
          />
        ) : null
      }
    >
      <div className="match-page donor-chrome">
        <DonorChromeTop />

        {view === "favorites" ? (
          <>
            <button
              type="button"
              className="match-back"
              onClick={() => setView("home")}
              aria-label="Volver"
            >
              <Icon name="back.svg" size={22} />
            </button>
            <button
              type="button"
              className="match-sort-btn"
              onClick={() => setFavSort((value) => (value === "newest" ? "oldest" : "newest"))}
              aria-label={
                favSort === "newest"
                  ? "Ordenar del más antiguo al más reciente"
                  : "Ordenar del más reciente al más antiguo"
              }
            >
              Ordenar
              <small>{favSort === "newest" ? "Más recientes" : "Más antiguos"}</small>
            </button>
            {hasFavorites ? (
              <div className="match-fav-grid match-fav-grid--all">{favorites.map(renderFavCard)}</div>
            ) : (
              <div className="match-favorites-empty">
                <div className="match-favorites-art" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="match-favorites-empty-title">Es tiempo de compartir una nueva aventura</p>
                <button type="button" className="match-explore-btn" onClick={() => navigate("/adoption")}>
                  Explorar
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <header className="match-top">
              <h1>Mis match</h1>
            </header>

            <section className="match-favorites">
              <div className="match-favorites-head">
                <h2>Mis favoritos</h2>
                {hasFavorites ? (
                  <button type="button" className="match-see-more" onClick={() => setView("favorites")}>
                    Ver más
                  </button>
                ) : null}
              </div>

              {hasFavorites ? (
                <div className="match-fav-rail">{favorites.map(renderFavCard)}</div>
              ) : (
                <div className="match-favorites-empty">
                  <div className="match-favorites-art" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="match-favorites-empty-title">Es tiempo de compartir una nueva aventura</p>
                  <button type="button" className="match-explore-btn" onClick={() => navigate("/adoption")}>
                    Explorar
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
            </section>

            <section className="match-chats">
              <h2>Chats</h2>
              {!hasChats ? (
                <p className="match-chats-empty">
                  Aún no tienes chats. Ponte en contacto con el rescatista de tu compañero favorito.
                </p>
              ) : (
                <div className="thread-list donor-thread-list match-thread-list">
                  {threads.map((thread) => (
                    <button
                      className="thread-row chats-thread-row"
                      key={thread.petId}
                      onClick={() => navigate(`/messages/${thread.petId}`)}
                    >
                      <span className="thread-avatar chats-thread-avatar">
                        <img src={thread.pet.image} alt="" />
                      </span>
                      <span className="thread-main">
                        <span className="thread-head">
                          <strong>
                            {thread.pet.name}
                            <span className="chats-rescuer-name"> · {thread.pet.rescuer}</span>
                          </strong>
                          <time>{thread.time}</time>
                        </span>
                        <p>{thread.preview}</p>
                      </span>
                      {thread.unread > 0 ? <span className="thread-badge">{thread.unread}</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
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
  const navigate = useNavigate();
  const { emptyStates } = usePrototypeStore();
  const paymentStatusLabel = {
    pagado: "Pagado",
    cancelado: "Cancelado",
    enproceso: "En proceso",
    fallado: "Fallado",
  } as const;
  const donationRows = useDonationLogRows().filter(
    (row) => !/apadrinamiento/i.test(row.concept),
  );
  const subscriptionRows = emptyStates
    ? []
    : paymentHistory.map((row) => ({
        id: row.id,
        date: row.date,
        kind: "suscripcion" as const,
        title: "Suscripción",
        method: row.method,
        amount: row.amount,
        status: row.status,
        caseId: null as string | null,
      }));
  const caseRows = emptyStates
    ? []
    : donationRows.map((row) => ({
        id: row.id,
        date: row.date,
        kind: "donacion" as const,
        title: row.caseName,
        concept: row.concept,
        method: row.method,
        amount: row.amount,
        status: row.status,
        caseId: row.caseId as string | null,
      }));
  const rows = [...subscriptionRows, ...caseRows];

  return (
    <div className="plain-screen">
      <TopBar title="Mi historial" back="/profile" />
      <div className="content-pad log-section">
        <p>Consulta todo tu historial de pagos.</p>
        {rows.length ? (
          <ul className="profile-activity-list">
            {rows.map((row) => {
              const statusLabel = paymentStatusLabel[row.status];
              const body = (
                <>
                  <span className="profile-activity-date">{row.date}</span>
                  <span className="profile-activity-body">
                    {row.kind === "donacion" ? (
                      <span className="profile-activity-title">
                        <strong>{row.title}</strong> - {row.concept}
                      </span>
                    ) : (
                      <strong>{row.title}</strong>
                    )}
                    <small>{row.method}</small>
                  </span>
                  <span className="profile-activity-amount">
                    <b>{row.amount}</b>
                    <i className={`log-pill ${row.status}`}>{statusLabel}</i>
                  </span>
                </>
              );
              return (
                <li key={`${row.kind}-${row.id}`}>
                  {row.caseId ? (
                    <button
                      type="button"
                      className="profile-activity-row"
                      onClick={() => navigate(`/case/${row.caseId}`)}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="profile-activity-row">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="profile-activity-empty">
            <p>Aún no hay movimientos en tu historial.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function donationConceptLabel(type?: Need["type"]) {
  if (type === "Comida") return "Alimento";
  if (type === "Medicina") return "Medicina";
  if (type === "Veterinario") return "Veterinario";
  return "Aportación";
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
      concept: donationConceptLabel(need?.type),
      method: "Visa *4242",
      amount: `$${donation.amount}`,
      status: "pagado" as const,
    };
  });
  const rows = [...live, ...donationLog];
  return limit ? rows.slice(0, limit) : rows;
}

function DonorProfile() {
  const navigate = useNavigate();
  const {
    setAccountMode,
    guardianActive,
    donorProfile,
  } = usePrototypeStore();
  const [rescuerModeOpen, setRescuerModeOpen] = useState(false);
  const switchToRescuer = () => {
    setAccountMode("rescuer");
    navigate("/rescuer");
  };
  const fullName = `${donorProfile.firstName} ${donorProfile.lastName}`.trim() || "Alberto Quiroga";
  const city = donorProfile.city.trim() || "Monterrey, NL";
  const initial = (donorProfile.firstName.trim().charAt(0) || "A").toUpperCase();

  return (
    <ScreenShell
      overlay={
        rescuerModeOpen ? (
          <RescuerModeDialog onClose={() => setRescuerModeOpen(false)} onConfirm={switchToRescuer} />
        ) : null
      }
    >
      <div className="profile-page profile-page--soft donor-chrome">
        <DonorChromeTop />
        <header className="match-top">
          <h1>Mi perfil</h1>
        </header>

        <section className="profile-intro">
          <div className="profile-intro-row">
            <span className="profile-intro-avatar" aria-hidden="true">
              {donorProfile.avatar ? <img src={donorProfile.avatar} alt="" /> : initial}
            </span>
            <div className="profile-intro-copy">
              <strong>{fullName}</strong>
              <small>{city}</small>
            </div>
          </div>
        </section>

        {guardianActive ? (
          <button
            type="button"
            className="profile-feature is-active"
            onClick={() => navigate("/settings/billing")}
          >
            <span className="profile-feature-copy">
              <strong>¡Ya eres Guardián!</strong>
              <small>Consulta mi impacto a la manada</small>
            </span>
            <span className="profile-feature-cta" aria-hidden="true">
              <Icon name="icon-shield.svg" size={22} />
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="profile-feature"
            onClick={() => navigate("/impact/support")}
          >
            <span className="profile-feature-copy">
              <strong>Sé un Guardián</strong>
              <small>Apoyo mensual con reportes de impacto</small>
            </span>
            <span className="profile-feature-cta" aria-hidden="true">
              <Icon name="icon-star.svg" size={22} />
            </span>
          </button>
        )}

        <section className="profile-access" aria-label="Preferencias">
          <h2>Preferencias</h2>
          <div className="profile-access-grid profile-access-grid--two">
            <button
              type="button"
              className="profile-access-item"
              onClick={() => navigate("/settings/basic-info")}
            >
              <span className="profile-access-icon" aria-hidden="true">
                <Icon name="icon-user.svg" size={22} />
              </span>
              <span>Mi cuenta</span>
            </button>
            <button
              type="button"
              className="profile-access-item"
              onClick={() => navigate("/messages")}
            >
              <span className="profile-access-icon" aria-hidden="true">
                <Icon name="icon-heart.svg" size={22} />
              </span>
              <span>Mis mascotas</span>
            </button>
          </div>
        </section>

        <section className="profile-access" aria-label="Pagos y suscripciones">
          <h2>Pagos y suscripciones</h2>
          <div className="profile-access-grid">
            <button
              type="button"
              className="profile-access-item"
              onClick={() => navigate("/settings/payment-methods")}
            >
              <span className="profile-access-icon" aria-hidden="true">
                <Icon name="icon-card.svg" size={22} />
              </span>
              <span>Métodos de pago</span>
            </button>
            <button
              type="button"
              className="profile-access-item"
              onClick={() => navigate("/settings/billing")}
            >
              <span className="profile-access-icon" aria-hidden="true">
                <Icon name="icon-billing.svg" size={22} />
              </span>
              <span>Suscripción y pagos</span>
            </button>
            <button
              type="button"
              className="profile-access-item"
              onClick={() => navigate("/history")}
            >
              <span className="profile-access-icon" aria-hidden="true">
                <Icon name="icon-clock.svg" size={22} />
              </span>
              <span>Mi historial</span>
            </button>
          </div>
        </section>

        <button
          type="button"
          className="profile-feature profile-feature--mode"
          onClick={() => setRescuerModeOpen(true)}
        >
          <span className="profile-feature-copy">
            <strong>Publica un caso de adopción</strong>
            <small>Cambia tu perfil a modo Rescatista. Siempre podrás regresar a la navegación como Adoptante.</small>
          </span>
          <span className="profile-feature-cta" aria-hidden="true">
            <Icon name="rtab-publish.svg" size={22} />
          </span>
        </button>

        <section className="profile-support">
          <button
            type="button"
            className="profile-support-row"
            onClick={() => navigate("/about")}
          >
            <span className="profile-support-icon" aria-hidden="true">
              <Icon name="icon-doc.svg" size={20} />
            </span>
            <strong>Sobre Nosotros</strong>
            <Chevron />
          </button>
          <button
            type="button"
            className="profile-support-row"
            onClick={() => navigate("/help")}
          >
            <span className="profile-support-icon" aria-hidden="true">
              <Icon name="icon-help.svg" size={20} />
            </span>
            <strong>Centro de ayuda</strong>
            <Chevron />
          </button>
        </section>

        <button
          type="button"
          className="nav-row danger-row profile-logout"
          onClick={() => navigate("/")}
        >
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

function SavedPets() {
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet, emptyStates } = usePrototypeStore();
  const items = emptyStates
    ? []
    : adoptionPets.filter((item) => item.listed !== false && savedPetIds.includes(item.id));
  return (
    <div className="plain-screen">
      <TopBar title="Mis mascotas" back="/profile" />
      <div className="content-pad">
        <p className="profile-saved-lead">
          Solo aparecen los compañeritos que marcaste con like o guardaste para adoptar.
        </p>
        {!items.length ? (
          <div className="empty-state">
            <h2>Aún no tienes mascotas guardadas</h2>
            <p>Cuando des like o guardes un perfil en Adoptar, lo verás aquí.</p>
            <button type="button" className="primary-button" onClick={() => navigate("/adoption")}>
              Ir a Adoptar
            </button>
          </div>
        ) : (
          items.map((item) => (
            <article className="saved-row" key={item.id}>
              <img src={item.image} alt="" />
              <button type="button" onClick={() => navigate(`/adoption/${item.id}`)}>
                <strong>{item.name}</strong>
                <span>
                  {item.sex} · {item.age}
                </span>
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={() => toggleSavedPet(item.id)}
                aria-label={`Quitar a ${item.name} de mis mascotas`}
              >
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
      </div>
      <BottomNav mode={accountMode} />
    </div>
  );
}

function BasicInfo() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { donorProfile, updateDonorProfile } = usePrototypeStore();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: donorProfile.firstName,
    lastName: donorProfile.lastName,
    email: donorProfile.email,
    phone: donorProfile.phone,
    city: donorProfile.city,
    avatar: donorProfile.avatar ?? "",
  });

  const pickPhoto = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setForm((current) => ({ ...current, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    const city = form.city.trim() || "Monterrey, NL";
    updateDonorProfile({
      firstName: form.firstName.trim() || "Alberto",
      lastName: form.lastName.trim() || "Quiroga",
      email: form.email.trim(),
      phone: form.phone.trim(),
      city,
      avatar: form.avatar || undefined,
    });
    setForm((current) => ({ ...current, city }));
    setSaved(true);
  };

  const initial = (form.firstName.trim().charAt(0) || "A").toUpperCase();

  return (
    <div className="plain-screen">
      <TopBar title="Información básica" back="/settings" />
      <div className="content-pad form-stack">
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            pickPhoto(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="photo-card">
          <span className={`avatar large ${form.avatar ? "has-photo" : ""}`}>
            {form.avatar ? <img src={form.avatar} alt="" /> : initial}
            <span className="avatar-camera">
              <AssetIcon name="onb-camera.svg" size={12} />
            </span>
          </span>
          <span className="nav-row-text">
            <strong>Foto de perfil</strong>
            <small>Cambia tu foto de perfil</small>
          </span>
          <button
            type="button"
            className="photo-card-edit"
            onClick={() => fileRef.current?.click()}
            aria-label="Editar foto de perfil"
          >
            <Icon name="icon-edit.svg" size={18} />
            Editar
          </button>
        </div>
        <label>
          Nombre
          <input
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
          />
        </label>
        <label>
          Apellido
          <input
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
          />
        </label>
        <label>
          Correo electrónico
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label>
          Teléfono
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        <label>
          Ciudad / estado
          <input
            value={form.city}
            onChange={(event) => {
              const city = event.target.value;
              setForm({ ...form, city });
              updateDonorProfile({ city: city.trim() || "Monterrey, NL" });
            }}
          />
        </label>
        <button type="button" className="primary-button" onClick={save}>
          Guardar cambios
        </button>
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
  const { guardianActive, guardianAmount, setGuardian, emptyStates } = usePrototypeStore();
  const [dialog, setDialog] = useState<"none" | "amount" | "cancel">("none");
  const [choice, setChoice] = useState(guardianAmount);
  const [toast, setToast] = useState("");
  const [justChanged, setJustChanged] = useState(false);
  const plan = subscriptionPlans.find((item) => item.amount === guardianAmount) ?? subscriptionPlans[1];
  const paymentRows = emptyStates ? [] : paymentHistory;
  const paymentStatusLabel = {
    pagado: "Pagado",
    cancelado: "Cancelado",
    enproceso: "En proceso",
    fallado: "Fallado",
  } as const;
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
              <strong>Visa *4242</strong>
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
        {paymentRows.length ? (
          <ul className="profile-activity-list">
            {paymentRows.map((row) => (
              <li key={row.id}>
                <div className="profile-activity-row">
                  <span className="profile-activity-date">{row.date}</span>
                  <span className="profile-activity-body">
                    <strong>Suscripción</strong>
                    <small>{row.method}</small>
                  </span>
                  <span className="profile-activity-amount">
                    <b>{row.amount}</b>
                    <i className={`log-pill ${row.status}`}>{paymentStatusLabel[row.status]}</i>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="profile-activity-empty">
            <p>Aún no hay pagos registrados.</p>
          </div>
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
  const { verification, setVerification, emptyStates } = usePrototypeStore();
  const verified = verification === "verified";
  const showEmptyPending = emptyStates;
  const pendingActions = showEmptyPending
    ? []
    : verified
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
            <p>Disponible para tus mascotas</p>
            <div className="dopmi-wallet-bar">
              <i style={{ width: showEmptyPending ? "0%" : "40%" }} />
            </div>
            <div className="dopmi-wallet-stats">
              <div>
                <span>Total de donaciones</span>
                <b>{showEmptyPending ? "$0" : "$172"}</b>
              </div>
              <div>
                <span>Usado</span>
                <b>{showEmptyPending ? "$0" : "$69"}</b>
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
                  : "Verifica tu cuenta para recibir donaciones"}
              </strong>
            </div>
            <p>
              {verification === "rejected"
                ? "El comprobante no es legible y falta vincular una red social."
                : "Completa el proceso de verificación para desbloquear todas las funciones y comenzar a recibir donaciones."}
            </p>
            <button type="button" className="purple-button" onClick={() => navigate("/rescuer/verification")}>
              {verification === "rejected" ? "Corregir información" : "Verificarme"}
            </button>
          </article>
        ) : !verified ? (
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
                Cuando publiques casos, recibas mensajes o tengas evidencias por subir, tus acciones pendientes aparecerán aquí.
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

function RescuerNeedCard({ need, caseId }: { need: Need; caseId: string }) {
  const navigate = useNavigate();
  const remaining = Math.max(0, need.requested - need.funded);
  const funded = remaining === 0 || need.status === "funded" || need.status === "evidence" || need.status === "completed";
  const progress = need.requested ? need.funded / need.requested : 0;
  const canUnlock = funded || progress >= 0.65;
  const inReview = need.status === "evidence";
  const completed = need.status === "completed";
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
      {completed ? (
        <button className="purple-button soft" disabled>Completada</button>
      ) : inReview ? (
        <button className="purple-button soft" disabled>Evidencia en revisión</button>
      ) : canUnlock ? (
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
  urgent?: boolean;
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
  const navigate = useNavigate();
  const { verification, draft, updateDraft, publishDraft } = usePrototypeStore();
  const location = useLocation();
  const correcting = location.search.includes("correct");
  const continuing = location.search.includes("draft");
  const needsVerification = verification !== "verified";
  const [step, setStep] = useState(correcting || continuing ? 1 : 0);
  const [mode, setMode] = useState<"adoption" | "donation">((draft.publishMode as "adoption" | "donation") || "adoption");
  const photos = Array.isArray(draft.photos) ? (draft.photos as string[]) : [];
  const [needItems, setNeedItems] = useState<DraftNeedItem[]>(() => {
    try {
      return JSON.parse(String(draft.needItemsJson || "[]")) as DraftNeedItem[];
    } catch {
      return [];
    }
  });
  const [sheet, setSheet] = useState<"food" | "medicine" | "vet" | null>(null);
  const [foodQuery, setFoodQuery] = useState("");
  const [medForm, setMedForm] = useState({ name: "", amount: "", treatment: "", urgent: false });
  const emptyVetForm = {
    reason: "",
    amount: "",
    urgent: false,
  };
  const [vetForm, setVetForm] = useState(emptyVetForm);
  const [urgentVideo, setUrgentVideo] = useState(Boolean(draft.urgentVideo));

  const totalSteps = mode === "donation" ? 4 : 3;
  const reviewStep = totalSteps;
  const needsStep = mode === "donation" ? 3 : -1;
  const hasUrgentNeed = needItems.some((item) => item.urgent);

  const pickType = (nextMode: "adoption" | "donation") => {
    if (nextMode === "donation" && needsVerification) {
      navigate("/rescuer/verification");
      return;
    }
    setMode(nextMode);
    updateDraft({ publishMode: nextMode });
    setStep(1);
  };

  const persistNeeds = (items: DraftNeedItem[]) => {
    setNeedItems(items);
    updateDraft({ needItemsJson: JSON.stringify(items) });
  };

  const saveDraft = () => {
    updateDraft({ publishMode: mode, needItemsJson: JSON.stringify(needItems) });
    navigate("/rescuer/cases");
  };

  const addPhoto = () => {
    if (photos.includes(`${A}publish-sample-pet.jpg`)) return;
    updateDraft({ photos: [...photos, `${A}publish-sample-pet.jpg`] });
  };

  const removePhoto = (src: string) => {
    updateDraft({ photos: photos.filter((item) => item !== src) });
  };

  const canContinuePhotos = photos.length > 0;
  const canContinueInfo = Boolean(draft.sex) && Boolean(draft.species);

  const goNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }
    updateDraft({ publishMode: mode, needItemsJson: JSON.stringify(needItems) });
    publishDraft("review");
    navigate("/rescuer/cases");
  };

  const addFood = (item: (typeof FOOD_CATALOG)[number]) => {
    persistNeeds([
      ...needItems,
      {
        id: `need-${Date.now()}`,
        type: "Comida",
        title: item.title,
        amount: item.amount,
        detail: "Cada mes",
        badge: "Patrocinio habilitado",
      },
    ]);
    setSheet(null);
    setFoodQuery("");
  };

  const saveMedicine = () => {
    const amount = Number(medForm.amount || 0);
    if (!medForm.name.trim() || !amount) return;
    persistNeeds([
      ...needItems,
      {
        id: `need-${Date.now()}`,
        type: "Medicina",
        title: medForm.name.trim(),
        amount,
        detail: medForm.treatment.trim() || undefined,
        urgent: medForm.urgent,
      },
    ]);
    setMedForm({ name: "", amount: "", treatment: "", urgent: false });
    setSheet(null);
  };

  const saveVet = () => {
    const amount = Number(vetForm.amount || 0);
    if (!vetForm.reason.trim() || !amount) return;
    persistNeeds([
      ...needItems,
      {
        id: `need-${Date.now()}`,
        type: "Veterinario",
        title: vetForm.reason.trim(),
        amount,
        urgent: vetForm.urgent,
      },
    ]);
    setVetForm(emptyVetForm);
    setSheet(null);
  };

  const addUrgentVideo = () => {
    setUrgentVideo(true);
    updateDraft({ urgentVideo: true });
  };

  const clearUrgentVideo = () => {
    setUrgentVideo(false);
    updateDraft({ urgentVideo: false });
  };

  const removeNeed = (id: string) => {
    const next = needItems.filter((item) => item.id !== id);
    persistNeeds(next);
    if (!next.some((item) => item.urgent)) clearUrgentVideo();
  };

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

  const continueDisabled =
    step === 1
      ? !canContinuePhotos
      : step === 2
        ? !canContinueInfo
        : step === needsStep
          ? hasUrgentNeed && !urgentVideo
          : false;
  const continueLabel =
    step === reviewStep ? "Publicar caso" : step === needsStep ? "Continuar a revisión" : "Continuar";
  const headerTitle = step === reviewStep ? "Revisa tu caso" : "Publicar caso";
  const goPrevStep = () => setStep(step <= 1 ? 0 : step - 1);
  const filteredFood = FOOD_CATALOG.filter((item) => {
    const q = foodQuery.trim().toLowerCase();
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q);
  });

  return (
    <ScreenShell
      mode="rescuer"
      className="publish-case-shell"
      overlay={
        sheet ? (
          <div className="modal-backdrop center" onClick={() => setSheet(null)}>
            {sheet === "food" ? (
              <div className="dialog-card publish-food-sheet" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dialog-close" onClick={() => setSheet(null)} aria-label="Cerrar">×</button>
                <h2>Catálogo de comida</h2>
                <label className="publish-food-search">
                  <span className="visually-hidden">Buscar</span>
                  <input
                    placeholder="Buscar por nombre o marca..."
                    value={foodQuery}
                    onChange={(e) => setFoodQuery(e.target.value)}
                  />
                </label>
                <div className="publish-food-note">
                  Selecciona la comida que necesitas. Cuando recibas suficientes donaciones, podrás comprarla, subir evidencia y solicitar el reembolso con las donaciones recibidas.
                </div>
                <div className="publish-food-list">
                  {filteredFood.map((item) => (
                    <button type="button" className="publish-food-item" key={item.id} onClick={() => addFood(item)}>
                      <span className="publish-food-thumb" aria-hidden>🥣</span>
                      <span className="publish-food-meta">
                        <strong>{item.title}</strong>
                        <small>{item.brand}</small>
                      </span>
                      <span className="publish-food-price">
                        <strong>${item.amount}</strong>
                        <small>MXN</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : sheet === "medicine" ? (
              <div className="dialog-card publish-med-dialog" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dialog-close" onClick={() => setSheet(null)} aria-label="Cerrar">×</button>
                <header className="publish-med-head">
                  <h2>Agregar medicina</h2>
                  <p>Agrega los detalles de la medicina que necesita la mascota.</p>
                </header>
                <label className="publish-field">
                  <span>Nombre de la medicina</span>
                  <input
                    placeholder="ej. Amoxicilina"
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  />
                </label>
                <label className="publish-field">
                  <span>Costo a cubrir</span>
                  <span className="publish-amount-wrap">
                    <em>$</em>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={medForm.amount}
                      onChange={(e) => setMedForm({ ...medForm, amount: e.target.value })}
                    />
                  </span>
                  <small>Monto en MXN</small>
                </label>
                <label className="publish-field">
                  <span>¿Para qué tratamiento es?</span>
                  <textarea
                    rows={2}
                    placeholder="ej. Infección respiratoria"
                    value={medForm.treatment}
                    onChange={(e) => setMedForm({ ...medForm, treatment: e.target.value })}
                  />
                </label>
                <label className="publish-check publish-urgent">
                  <input
                    type="checkbox"
                    checked={medForm.urgent}
                    onChange={(e) => setMedForm({ ...medForm, urgent: e.target.checked })}
                  />
                  <span>
                    Marcar como urgente
                    <small>Se requiere evidencia de urgencia.</small>
                  </span>
                </label>
                <button
                  type="button"
                  className="purple-button"
                  disabled={!medForm.name.trim() || !Number(medForm.amount)}
                  onClick={saveMedicine}
                >
                  Guardar medicina
                </button>
                <button type="button" className="secondary-button" onClick={() => setSheet(null)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="dialog-card publish-med-dialog publish-vet-dialog" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dialog-close" onClick={() => setSheet(null)} aria-label="Cerrar">×</button>
                <header className="publish-med-head">
                  <h2>Agregar servicio veterinario</h2>
                  <p>Agrega los detalles del servicio veterinario que necesita la mascota.</p>
                </header>
                <label className="publish-field">
                  <span>Motivo de consulta <em>*</em></span>
                  <input
                    placeholder="ej. Vacunación, revisión general"
                    value={vetForm.reason}
                    onChange={(e) => setVetForm({ ...vetForm, reason: e.target.value })}
                  />
                </label>
                <label className="publish-field">
                  <span>Monto de la consulta <em>*</em></span>
                  <span className="publish-amount-wrap">
                    <em>$</em>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={vetForm.amount}
                      onChange={(e) => setVetForm({ ...vetForm, amount: e.target.value })}
                    />
                  </span>
                  <small>Monto en MXN</small>
                </label>
                <label className="publish-check publish-urgent">
                  <input
                    type="checkbox"
                    checked={vetForm.urgent}
                    onChange={(e) => setVetForm({ ...vetForm, urgent: e.target.checked })}
                  />
                  <span>
                    Marcar como urgente
                    <small>Se requiere evidencia de urgencia.</small>
                  </span>
                </label>
                <button
                  type="button"
                  className="purple-button"
                  disabled={!vetForm.reason.trim() || !Number(vetForm.amount)}
                  onClick={saveVet}
                >
                  Guardar consulta
                </button>
                <button type="button" className="secondary-button" onClick={() => setSheet(null)}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ) : null
      }
    >
      <header className="publish-case-header">
        <button
          type="button"
          className="publish-header-back"
          onClick={goPrevStep}
          aria-label="Volver"
        >
          <AssetIcon name="back.svg" size={24} />
          <h1>{headerTitle}</h1>
        </button>
        <PublishStepper step={step} total={totalSteps} />
      </header>

      <div className="publish-case-body">
        {correcting && (
          <div className="error-callout">
            <strong>Corrige antes de reenviar</strong>
            <span>La historia necesita más detalle y la evidencia de urgencia no permite identificar a la mascota.</span>
          </div>
        )}

        {step === 1 && (
          <section className="publish-section">
            <h2>Sube fotos de la mascota</h2>
            <div className="publish-photo-drop">
              <AssetIcon name="publish-cam-lg.svg" size={48} />
              <div>
                <p className="publish-drop-title">Añade fotos de la mascota</p>
                <p className="publish-drop-copy">Puedes subir una o varias fotos.</p>
              </div>
              <div className="publish-photo-actions">
                <button type="button" className="publish-outline-btn" onClick={addPhoto}>
                  <AssetIcon name="publish-cam-sm.svg" size={16} />
                  Tomar foto
                </button>
                <button type="button" className="publish-outline-btn" onClick={addPhoto}>
                  <AssetIcon name="publish-upload.svg" size={16} />
                  Subir desde galería
                </button>
              </div>
            </div>
            {photos.length === 0 ? (
              <p className="publish-hint">Sube al menos una foto para continuar.</p>
            ) : (
              <>
                <h3>Fotos agregadas</h3>
                <div className="publish-photo-grid">
                  {photos.map((src, index) => (
                    <article className="publish-photo-thumb" key={src}>
                      <img src={src} alt={`Foto ${index + 1}`} />
                      {index === 0 && <span className="publish-photo-badge">Principal</span>}
                      <button type="button" className="publish-photo-remove" aria-label="Quitar foto" onClick={() => removePhoto(src)}>×</button>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="publish-section">
            <h2>Información básica</h2>

            <label className="publish-field">
              <span>Nombre de la mascota</span>
              <input
                placeholder="Opcional"
                maxLength={25}
                value={String(draft.petName || "")}
                onChange={(e) => updateDraft({ petName: e.target.value })}
              />
              <small>Si aún no tiene nombre, puedes dejarlo vacío.</small>
            </label>

            <div className="publish-field">
              <span>Sexo <em>*</em></span>
              <div className="publish-choice-row">
                {(["Macho", "Hembra"] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`publish-choice ${draft.sex === value ? "selected" : ""}`}
                    onClick={() => updateDraft({ sex: value })}
                  >
                    <span aria-hidden>{value === "Macho" ? "♂" : "♀"}</span>
                    {value}
                  </button>
                ))}
              </div>
              {!draft.sex && <small>Selecciona una opción para continuar.</small>}
            </div>

            <div className="publish-field">
              <span>Especie <em>*</em></span>
              <div className="publish-choice-row">
                {(["Perro", "Gato"] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`publish-choice ${draft.species === value ? "selected" : ""}`}
                    onClick={() => updateDraft({ species: value })}
                  >
                    <span aria-hidden>{value === "Perro" ? "🐶" : "🐱"}</span>
                    {value}
                  </button>
                ))}
              </div>
              {!draft.species && <small>Selecciona una opción para continuar.</small>}
            </div>

            <label className="publish-field">
              <span>Edad</span>
              <input
                placeholder="ej. 3 meses"
                value={String(draft.age || "")}
                onChange={(e) => updateDraft({ age: e.target.value })}
              />
              <small>Puede ser aproximada.</small>
            </label>

            <label className="publish-field">
              <span>Historia de rescate</span>
              <textarea
                placeholder="Cuenta cómo la encontraste."
                rows={3}
                value={String(draft.story || "")}
                onChange={(e) => updateDraft({ story: e.target.value })}
              />
            </label>

            {mode === "adoption" && (
              <>
                <article className="publish-trait-card">
                  <h3>Salud</h3>
                  <label className="publish-check">
                    <input type="checkbox" checked={Boolean(draft.vaccinated)} onChange={(e) => updateDraft({ vaccinated: e.target.checked })} />
                    <span>Vacunado</span>
                  </label>
                  <label className="publish-check">
                    <input type="checkbox" checked={Boolean(draft.sterilized)} onChange={(e) => updateDraft({ sterilized: e.target.checked })} />
                    <span>Esterilizado</span>
                  </label>
                  <label className="publish-check">
                    <input type="checkbox" checked={Boolean(draft.specialCare)} onChange={(e) => updateDraft({ specialCare: e.target.checked })} />
                    <span>Requiere cuidados especiales</span>
                  </label>
                </article>

                <article className="publish-trait-card">
                  <h3>Social</h3>
                  <label className="publish-check">
                    <input type="checkbox" checked={Boolean(draft.socialDogs)} onChange={(e) => updateDraft({ socialDogs: e.target.checked })} />
                    <span>Social con perros</span>
                  </label>
                  <label className="publish-check">
                    <input type="checkbox" checked={Boolean(draft.socialCats)} onChange={(e) => updateDraft({ socialCats: e.target.checked })} />
                    <span>Social con gatos</span>
                  </label>
                  <label className="publish-check">
                    <input type="checkbox" checked={Boolean(draft.socialChildren)} onChange={(e) => updateDraft({ socialChildren: e.target.checked })} />
                    <span>Social con niños</span>
                  </label>
                </article>
              </>
            )}
          </section>
        )}

        {step === needsStep && (
          <section className="publish-section">
            <h2>¿Qué necesita la mascota?</h2>
            <div className="publish-needs-note">
              <strong>Nota:</strong> Las necesidades son opcionales. Puedes publicar el caso aunque aún no agregues apoyo económico.
            </div>
            <button type="button" className="publish-need-card" onClick={() => setSheet("food")}>
              <span aria-hidden>🥣</span>
              <span>
                <strong>Comida</strong>
                <p>Selecciona croquetas del catálogo y define cada cuánto las necesita.</p>
              </span>
            </button>
            <button
              type="button"
              className="publish-need-card"
              onClick={() => {
                setMedForm({ name: "", amount: "", treatment: "", urgent: false });
                setSheet("medicine");
              }}
            >
              <span aria-hidden>💊</span>
              <span>
                <strong>Medicina</strong>
                <p>Agrega una medicina, costo y tratamiento relacionado.</p>
              </span>
            </button>
            <button
              type="button"
              className="publish-need-card"
              onClick={() => {
                setVetForm(emptyVetForm);
                setSheet("vet");
              }}
            >
              <span aria-hidden>🩺</span>
              <span>
                <strong>Veterinario</strong>
                <p>Agrega consulta o tratamiento veterinario.</p>
              </span>
            </button>

            {needItems.length > 0 && (
              <div className="publish-needs-list">
                <h3>Necesidades agregadas</h3>
                {needItems.map((item) => (
                  <article className="publish-need-row" key={item.id}>
                    <span className="publish-need-emoji" aria-hidden>{NEED_EMOJI[item.type]}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>
                        ${item.amount}
                        {item.detail ? ` • ${item.detail}` : ""}
                      </p>
                      {item.badge ? <span className="publish-need-badge">{item.badge}</span> : null}
                      {item.urgent ? <span className="publish-need-badge urgent">Urgente</span> : null}
                    </div>
                    <button type="button" className="publish-need-remove" onClick={() => removeNeed(item.id)}>
                      Eliminar
                    </button>
                  </article>
                ))}
              </div>
            )}

            {hasUrgentNeed && (
              <section className="publish-urgent-video">
                <h3>Video de evidencia de urgencia</h3>
                <p>
                  Agrega un video explicando la situación. Debes aparecer tú y también la mascota que necesita apoyo. El equipo DopMi revisará el caso y, si se aprueba, podremos apoyarte o priorizar tu caso para que reciba donaciones.
                </p>
                {urgentVideo ? (
                  <article className="publish-urgent-video-done">
                    <div>
                      <strong>Video de urgencia agregado</strong>
                      <small>Listo para revisión del equipo DopMi</small>
                    </div>
                    <button type="button" className="publish-need-remove" onClick={clearUrgentVideo}>
                      Quitar
                    </button>
                  </article>
                ) : (
                  <div className="publish-photo-drop publish-urgent-drop">
                    <AssetIcon name="publish-cam-lg.svg" size={40} />
                    <div>
                      <p className="publish-drop-title">Grabar o subir video</p>
                      <p className="publish-drop-copy">Requerido para aprobar urgencia médica</p>
                    </div>
                    <button type="button" className="publish-outline-btn" onClick={addUrgentVideo}>
                      <AssetIcon name="publish-upload.svg" size={16} />
                      Subir video
                    </button>
                  </div>
                )}
              </section>
            )}
          </section>
        )}

        {step === reviewStep && (
          <section className="publish-section publish-review">
            <div className="publish-review-block">
              <div className="publish-review-head">
                <h3>Fotos</h3>
                <button type="button" className="publish-edit-link" onClick={() => setStep(1)}>Editar</button>
              </div>
              <div className="publish-photo-grid compact">
                {photos.map((src) => (
                  <article className="publish-photo-thumb" key={src}>
                    <img src={src} alt="" />
                  </article>
                ))}
              </div>
            </div>

            <div className="publish-review-block">
              <div className="publish-review-head">
                <h3>Información básica</h3>
                <button type="button" className="publish-edit-link" onClick={() => setStep(2)}>Editar</button>
              </div>
              <article className="publish-review-card">
                <div><span>Nombre</span><strong>{String(draft.petName || "Sin nombre")}</strong></div>
                <div><span>Edad</span><strong>{String(draft.age || "—")}</strong></div>
                <div><span>Historia</span><strong>{String(draft.story || "—")}</strong></div>
                <div><span>Lista para adopción</span><strong>{mode === "adoption" ? "Sí" : "No"}</strong></div>
              </article>
            </div>

            {mode === "adoption" ? (
              <>
                <article className="publish-trait-card">
                  <h3>Salud</h3>
                  <label className="publish-check"><input type="checkbox" checked={Boolean(draft.vaccinated)} readOnly /><span>Vacunado</span></label>
                  <label className="publish-check"><input type="checkbox" checked={Boolean(draft.sterilized)} readOnly /><span>Esterilizado</span></label>
                  <label className="publish-check"><input type="checkbox" checked={Boolean(draft.specialCare)} readOnly /><span>Requiere cuidados especiales</span></label>
                </article>
                <article className="publish-trait-card">
                  <h3>Social</h3>
                  <label className="publish-check"><input type="checkbox" checked={Boolean(draft.socialDogs)} readOnly /><span>Social con perros</span></label>
                  <label className="publish-check"><input type="checkbox" checked={Boolean(draft.socialCats)} readOnly /><span>Social con gatos</span></label>
                  <label className="publish-check"><input type="checkbox" checked={Boolean(draft.socialChildren)} readOnly /><span>Social con niños</span></label>
                </article>
              </>
            ) : (
              <div className="publish-review-block">
                <div className="publish-review-head">
                  <h3>Necesidades</h3>
                  <button type="button" className="publish-edit-link" onClick={() => setStep(3)}>Editar</button>
                </div>
                {needItems.length ? (
                  <div className="publish-needs-list compact">
                    {needItems.map((item) => (
                      <article className="publish-need-row" key={item.id}>
                        <span className="publish-need-emoji" aria-hidden>{NEED_EMOJI[item.type]}</span>
                        <div>
                          <strong>{item.title}</strong>
                          <p>
                            ${item.amount}
                            {item.detail ? ` • ${item.detail}` : ""}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="publish-hint">Sin necesidades agregadas.</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="publish-case-footer">
        <button
          type="button"
          className="purple-button publish-continue"
          disabled={continueDisabled}
          onClick={goNext}
        >
          {continueLabel}
        </button>
        <button type="button" className="publish-draft-link" onClick={saveDraft}>
          Guardar borrador
        </button>
      </footer>
    </ScreenShell>
  );
}

function EvidenceFlow() {
  const navigate = useNavigate();
  const { caseId = "luna", needId = "luna-food" } = useParams();
  const { cases, submitNeedEvidence } = usePrototypeStore();
  const item = cases.find((entry) => entry.id === caseId) ?? cases[0];
  const need = item.needs.find((entry) => entry.id === needId) ?? item.needs[0];
  const available = need?.funded ?? 0;
  const backTo = `/rescuer/cases/${item.id}`;
  const isFood = need?.type === "Comida";
  const isVet = need?.type === "Veterinario";
  const unlockSteps = isFood
    ? (["receipt", "purchaseId", "petEvidence", "description"] as const)
    : isVet
      ? (["receipt", "vetDetails", "petEvidence", "description"] as const)
      : (["receipt", "petEvidence", "description"] as const);
  const totalSteps = unlockSteps.length;

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState("");
  const [vetDetails, setVetDetails] = useState({
    hospital: "",
    hospitalPhone: "",
    caseNumber: "",
    vetName: "",
    vetPhone: "",
  });
  const [petEvidence, setPetEvidence] = useState<string | null>(null);
  const [petEvidenceLabel, setPetEvidenceLabel] = useState("");
  const [description, setDescription] = useState("");
  const receiptRef = useRef<HTMLInputElement>(null);
  const petRef = useRef<HTMLInputElement>(null);

  const currentKey = unlockSteps[step - 1];
  const close = () => navigate(backTo);
  const saveProgress = () => {
    setToast("Progreso guardado");
    window.setTimeout(() => navigate(backTo), 700);
  };

  const readImage = (file: File | undefined, setter: (src: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const readPetEvidence = (file: File | undefined) => {
    if (!file) return;
    setPetEvidenceLabel(file.name);
    if (file.type.startsWith("image/")) {
      readImage(file, setPetEvidence);
      return;
    }
    setPetEvidence("video");
  };

  const vetDetailsComplete =
    vetDetails.hospital.trim() &&
    vetDetails.hospitalPhone.trim() &&
    vetDetails.caseNumber.trim() &&
    vetDetails.vetName.trim() &&
    vetDetails.vetPhone.trim();

  const canNext =
    currentKey === "receipt" ? Boolean(receipt) :
    currentKey === "purchaseId" ? true :
    currentKey === "vetDetails" ? Boolean(vetDetailsComplete) :
    currentKey === "petEvidence" ? Boolean(petEvidence) :
    description.trim().length > 0;

  const goNext = () => {
    if (!canNext) return;
    if (step < totalSteps) setStep((current) => current + 1);
    else {
      if (need) submitNeedEvidence(item.id, need.id);
      setDone(true);
    }
  };

  const descriptionPlaceholder = isVet
    ? `Ej.: ${item.name} recibió su consulta veterinaria gracias a quienes la apoyaron.`
    : isFood
      ? `Ej.: ${item.name} recibió su comida del mes gracias a quienes la apoyaron.`
      : `Ej.: ${item.name} recibió el apoyo gracias a quienes la ayudaron.`;

  if (!need) {
    return (
      <div className="plain-screen rescuer-theme">
        <div className="modal-backdrop center" onClick={close}>
          <div className="unlock-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="unlock-close" onClick={close} aria-label="Cerrar">
              <Icon name="icon-x-muted.svg" size={16} />
            </button>
            <h2>No encontramos esta necesidad</h2>
            <p>Vuelve al caso e inténtalo de nuevo.</p>
            <button type="button" className="purple-button" onClick={close}>Volver al caso</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="plain-screen rescuer-theme unlock-screen">
      <div className="modal-backdrop center" onClick={close}>
        {done ? (
          <div className="unlock-dialog unlock-success" onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="unlock-success-title">
            <button type="button" className="unlock-close" onClick={close} aria-label="Cerrar">
              <Icon name="icon-x-muted.svg" size={16} />
            </button>
            <span className="unlock-success-icon" aria-hidden="true">✓</span>
            <h2 id="unlock-success-title">Has subido tu evidencia para revisión.</h2>
            <p>Gracias por tu esfuerzo, nuestro equipo revisará tu solicitud y regresará contigo.</p>
            <button type="button" className="purple-button" onClick={close}>Entendido</button>
          </div>
        ) : (
          <div className="unlock-dialog" onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="unlock-title">
            <button
              type="button"
              className="unlock-back"
              onClick={() => (step > 1 ? setStep((current) => current - 1) : close())}
              aria-label={step > 1 ? "Paso anterior" : "Cerrar"}
            >
              <AssetIcon name="back.svg" size={20} />
            </button>
            <button type="button" className="unlock-close" onClick={close} aria-label="Cerrar">
              <Icon name="icon-x-muted.svg" size={16} />
            </button>

            <header className="unlock-head">
              <h2 id="unlock-title"><span aria-hidden="true">{needEmoji(need.type)}</span> Desbloquea las donaciones</h2>
              <p className="unlock-step">Paso {step} de {totalSteps}</p>
              <p className="unlock-lead">
                Por favor compártenos evidencia – recibos, facturas, vouchers – de la necesidad cubierta para que el equipo de DopMi pueda revisarlo. Al ser aprobada recibirás el dinero que utilizaste para cubrir esta necesidad.
              </p>
            </header>

            <article className="unlock-need">
              <strong>{need.title}</strong>
              <small>Disponible: ${available}</small>
            </article>

            {currentKey === "receipt" && (
              <section className="unlock-section">
                <h3>Foto del recibo</h3>
                <p>Sube una foto clara del ticket o comprobante.</p>
                <input
                  ref={receiptRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(event) => readImage(event.target.files?.[0], setReceipt)}
                />
                {receipt ? (
                  <div className="unlock-preview">
                    <img src={receipt} alt="Recibo subido" />
                    <button type="button" className="secondary-button compact" onClick={() => receiptRef.current?.click()}>
                      Cambiar foto
                    </button>
                  </div>
                ) : (
                  <button type="button" className="unlock-drop" onClick={() => receiptRef.current?.click()}>
                    <AssetIcon name="publish-upload.svg" size={28} />
                    <strong>Toca para subir foto</strong>
                    <small>JPEG o PNG, máximo 10 MB</small>
                  </button>
                )}
              </section>
            )}

            {currentKey === "purchaseId" && (
              <section className="unlock-section">
                <h3>ID de compra / transacción</h3>
                <p>Si compraste la comida usando el enlace de DopMi, agrega el ID de compra para validar cashback o DopMi Coins pendientes.</p>
                <input
                  className="unlock-input"
                  value={purchaseId}
                  onChange={(event) => setPurchaseId(event.target.value)}
                  placeholder="ej. AMZ-2025-12345"
                  autoComplete="off"
                />
                <div className="unlock-hint">
                  Usar el enlace de DopMi puede generar cashback o DopMi Coins pendientes al confirmar la compra.
                </div>
              </section>
            )}

            {currentKey === "vetDetails" && (
              <section className="unlock-section unlock-vet-fields">
                <label className="unlock-field">
                  <span>Nombre del hospital veterinario <em>*</em></span>
                  <input
                    className="unlock-input"
                    value={vetDetails.hospital}
                    onChange={(event) => setVetDetails({ ...vetDetails, hospital: event.target.value })}
                    placeholder="Nombre del hospital"
                    autoComplete="organization"
                  />
                </label>
                <label className="unlock-field">
                  <span>Teléfono del hospital veterinario <em>*</em></span>
                  <input
                    className="unlock-input"
                    type="tel"
                    value={vetDetails.hospitalPhone}
                    onChange={(event) => setVetDetails({ ...vetDetails, hospitalPhone: event.target.value })}
                    placeholder="+52 55 1234 5678"
                    autoComplete="tel"
                  />
                </label>
                <label className="unlock-field">
                  <span>Número del caso de atención veterinaria <em>*</em></span>
                  <input
                    className="unlock-input"
                    value={vetDetails.caseNumber}
                    onChange={(event) => setVetDetails({ ...vetDetails, caseNumber: event.target.value })}
                    placeholder="Número de caso o expediente"
                    autoComplete="off"
                  />
                </label>
                <label className="unlock-field">
                  <span>Veterinario que atendió <em>*</em></span>
                  <input
                    className="unlock-input"
                    value={vetDetails.vetName}
                    onChange={(event) => setVetDetails({ ...vetDetails, vetName: event.target.value })}
                    placeholder="Nombre completo del veterinario"
                    autoComplete="name"
                  />
                </label>
                <label className="unlock-field">
                  <span>Teléfono del veterinario <em>*</em></span>
                  <input
                    className="unlock-input"
                    type="tel"
                    value={vetDetails.vetPhone}
                    onChange={(event) => setVetDetails({ ...vetDetails, vetPhone: event.target.value })}
                    placeholder="+52 55 1234 5678"
                    autoComplete="tel"
                  />
                </label>
              </section>
            )}

            {currentKey === "petEvidence" && (
              <section className="unlock-section">
                <h3>Foto o video de evidencia</h3>
                <p>Esta evidencia se mostrará a los donantes como prueba visual del impacto.</p>
                <input
                  ref={petRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(event) => readPetEvidence(event.target.files?.[0])}
                />
                {petEvidence ? (
                  <div className="unlock-preview">
                    {petEvidence === "video" ? (
                      <div className="unlock-file-chip">
                        <AssetIcon name="onb-camera.svg" size={20} />
                        <strong>{petEvidenceLabel || "Video subido"}</strong>
                      </div>
                    ) : (
                      <img src={petEvidence} alt="Evidencia con la mascota" />
                    )}
                    <button type="button" className="secondary-button compact" onClick={() => petRef.current?.click()}>
                      Cambiar archivo
                    </button>
                  </div>
                ) : (
                  <button type="button" className="unlock-drop" onClick={() => petRef.current?.click()}>
                    <AssetIcon name="publish-upload.svg" size={28} />
                    <strong>Toca para subir foto o video</strong>
                    <small>Muestra a la mascota con el producto o recibiendo cuidado</small>
                  </button>
                )}
              </section>
            )}

            {currentKey === "description" && (
              <section className="unlock-section">
                <h3>Describe la evidencia</h3>
                <p>Esta información será pública para donantes y para la comunidad.</p>
                <textarea
                  className="unlock-textarea"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={descriptionPlaceholder}
                  rows={4}
                />
                <p className="unlock-note">Ninguna donación se liberará sin evidencia revisada y aprobada previamente por DopMi.</p>
              </section>
            )}

            <div className="unlock-actions">
              <button type="button" className="secondary-button" onClick={saveProgress}>Guardar progreso</button>
              <button type="button" className="purple-button" disabled={!canNext} onClick={goNext}>
                {step === totalSteps ? "Enviar a revisión" : "Siguiente"}
              </button>
            </div>
          </div>
        )}
      </div>
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
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
  const {
    verification,
    rescuerProfile: profile,
    cases,
    emptyStates,
    setAccountMode,
  } = usePrototypeStore();
  const verified = verification === "verified";
  const activeCases = emptyStates ? 0 : cases.filter((item) => item.caseStatus === "active").length;
  const openCases = emptyStates ? 0 : cases.filter((item) => item.caseStatus !== "closed").length;
  const receivedTotal = emptyStates
    ? 0
    : rescuerActivity.reduce((sum, item) => {
        const n = Number(String(item.amount).replace(/[^0-9.]/g, ""));
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0);
  const recent = emptyStates || !verified ? [] : rescuerActivity.slice(0, 3);
  const statusLabel = {
    unverified: "Sin verificar",
    review: "En revisión",
    rejected: "Requiere correcciones",
    verified: "Verificado",
  }[verification];
  const cityHint = profile.address.includes(",")
    ? profile.address.split(",").slice(-2).join(",").trim()
    : profile.address;
  const switchToDonor = () => {
    setAccountMode("donor");
    navigate("/adoption");
  };

  return (
    <ScreenShell mode="rescuer">
      <div className="content-pad profile-page rescuer-profile-page">
        <header className="page-head">
          <h1>Mi perfil</h1>
        </header>

        <article className={`profile-hero rescuer${verified ? " verified" : ""}`}>
          <div className="profile-hero-main">
            <span className={`profile-hero-avatar${profile.avatar ? " has-photo" : ""}`} aria-hidden="true">
              {profile.avatar ? <img src={profile.avatar} alt="" /> : profile.name.charAt(0)}
            </span>
            <div className="profile-hero-copy">
              <strong>{profile.name}</strong>
              <span className={`profile-hero-badge${verified ? " ok" : ""}`}>
                <Icon name="icon-shield.svg" size={14} />
                {statusLabel}
              </span>
              <small>{cityHint}</small>
            </div>
          </div>
          {verified ? (
            <button
              type="button"
              className="profile-hero-edit"
              onClick={() => navigate("/rescuer/profile/edit")}
            >
              <Icon name="icon-edit.svg" size={16} />
              Editar
            </button>
          ) : null}
        </article>

        <section className="profile-metrics" aria-label="Tu refugio">
          <button type="button" className="profile-metric" onClick={() => navigate("/rescuer/cases")}>
            <strong>{openCases}</strong>
            <span>Casos</span>
          </button>
          <button type="button" className="profile-metric" onClick={() => navigate("/rescuer/cases")}>
            <strong>{activeCases}</strong>
            <span>Activos</span>
          </button>
          <button type="button" className="profile-metric" onClick={() => navigate("/rescuer")}>
            <strong>${receivedTotal}</strong>
            <span>Recibido</span>
          </button>
        </section>

        {verified ? (
          <button
            type="button"
            className="profile-guardian-card is-active rescuer"
            onClick={() => navigate("/rescuer/settings")}
          >
            <span className="profile-guardian-icon" aria-hidden="true">
              <Icon name="icon-verified.svg" size={20} />
            </span>
            <span className="profile-guardian-copy">
              <strong>Cuenta verificada</strong>
              <small>Puedes recibir donaciones y publicar casos</small>
            </span>
            <Chevron />
          </button>
        ) : (
          <button
            type="button"
            className="profile-guardian-card rescuer"
            onClick={() => navigate("/rescuer/verification")}
          >
            <span className="profile-guardian-icon" aria-hidden="true">
              <Icon name="icon-shield.svg" size={20} />
            </span>
            <span className="profile-guardian-copy">
              <strong>
                {verification === "rejected"
                  ? "Corrige tu verificación"
                  : verification === "review"
                    ? "Verificación en proceso"
                    : "Verifícate para recibir donaciones"}
              </strong>
              <small>
                {verification === "rejected"
                  ? "Hay datos que debes corregir para continuar"
                  : verification === "review"
                    ? "Te avisaremos cuando termine la revisión"
                    : "Desbloquea donaciones y reembolsos"}
              </small>
            </span>
            <Chevron />
          </button>
        )}

        {verified && profile.description ? (
          <section className="rescuer-profile-about">
            <h2>Sobre ti</h2>
            <p>{profile.description}</p>
            <div className="rescuer-profile-contacts">
              <span>
                <Icon name="icon-phone.svg" size={14} />
                {profile.phone}
              </span>
              <span>
                <Icon name="icon-mail.svg" size={14} />
                {profile.email}
              </span>
            </div>
          </section>
        ) : null}

        <section className="profile-activity">
          <div className="profile-section-head">
            <h2>Actividad reciente</h2>
            {recent.length ? (
              <button type="button" className="text-link rescuer" onClick={() => navigate("/rescuer")}>
                Ver inicio
              </button>
            ) : null}
          </div>
          {recent.length ? (
            <ul className="profile-activity-list">
              {recent.map((item) => (
                <li key={`${item.amount}-${item.meta}`}>
                  <button
                    type="button"
                    className="profile-activity-row rescuer-activity-row"
                    onClick={() => navigate("/rescuer/cases")}
                  >
                    <span className="profile-activity-icon" aria-hidden="true">
                      <AssetIcon name="icon-donation-in.svg" size={18} />
                    </span>
                    <span className="profile-activity-body">
                      <strong>
                        {item.amount} · {item.title}
                      </strong>
                      <small>{item.meta}</small>
                    </span>
                    <Chevron />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="profile-activity-empty">
              <p>
                {verified
                  ? "Aún no hay movimiento. Publica un caso para empezar a recibir apoyo."
                  : "Verifica tu cuenta para publicar casos y ver donaciones aquí."}
              </p>
              <button
                type="button"
                className="purple-button"
                onClick={() => navigate(verified ? "/rescuer/publish" : "/rescuer/verification")}
              >
                {verified ? "Publicar caso" : "Ir a verificación"}
              </button>
            </div>
          )}
        </section>

        <section className="profile-links" aria-label="Accesos">
          <h2 className="profile-links-title">Accesos</h2>
          <div className="list-stack">
            <SettingsRow
              icon="icon-settings.svg"
              title="Configuración"
              subtitle="Verificación, redes y datos bancarios"
              onClick={() => navigate("/rescuer/settings")}
            />
            <SettingsRow
              icon="rtab-cases.svg"
              title="Mis casos"
              subtitle="Gestiona adopción y donación"
              onClick={() => navigate("/rescuer/cases")}
            />
            <SettingsRow
              icon="icon-messages.svg"
              title="Mensajes"
              subtitle="Habla con adoptantes"
              onClick={() => navigate("/rescuer/messages")}
            />
            <SettingsRow
              icon="icon-help.svg"
              title="Centro de ayuda"
              onClick={() => navigate("/help")}
            />
          </div>
        </section>

        <article className="switch-card profile-switch">
          <div>
            <strong>Modo donante</strong>
            <small>Adopta, apoya y sigue impacto</small>
          </div>
          <button
            className="switch"
            role="switch"
            aria-checked="false"
            aria-label="Cambiar a modo donante"
            onClick={switchToDonor}
          >
            <i />
          </button>
        </article>
      </div>
    </ScreenShell>
  );
}

function RescuerEditPublicProfile() {
  const navigate = useNavigate();
  const { rescuerProfile, updateRescuerProfile } = usePrototypeStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: rescuerProfile.name,
    address: rescuerProfile.address,
    phone: rescuerProfile.phone,
    email: rescuerProfile.email,
    description: rescuerProfile.description,
    avatar: rescuerProfile.avatar ?? "",
  });
  const [toast, setToast] = useState("");
  const canSave =
    form.name.trim() &&
    form.address.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.description.trim();

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
    updateRescuerProfile({
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      description: form.description.trim(),
      avatar: form.avatar || undefined,
    });
    setToast("Perfil actualizado");
    window.setTimeout(() => navigate("/rescuer/profile"), 500);
  };

  return (
    <div className="plain-screen rescuer-theme">
      <TopBar title="Editar perfil público" back="/rescuer/profile" />
      <div className="content-pad form-stack edit-public-profile">
        <p className="section-lead">Estos datos se muestran en tu perfil público para adoptantes y donantes.</p>
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
            <small>Cambia tu foto de perfil</small>
          </span>
        </button>
        <label className="publish-field">
          <span>Nombre</span>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Tu nombre o el de tu refugio"
            autoComplete="name"
          />
        </label>
        <label className="publish-field">
          <span>Dirección</span>
          <input
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
            placeholder="Calle, colonia, ciudad"
            autoComplete="street-address"
          />
        </label>
        <label className="publish-field">
          <span>Teléfono</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            placeholder="+52 55 1234 5678"
            autoComplete="tel"
          />
        </label>
        <label className="publish-field">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="correo@ejemplo.com"
            autoComplete="email"
          />
        </label>
        <label className="publish-field">
          <span>Descripción</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Cuenta quién eres y cómo ayudas a las mascotas"
            rows={5}
          />
        </label>
        <button type="button" className="purple-button" disabled={!canSave} onClick={save}>
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

function RescuerSettings() {
  const navigate = useNavigate();
  const { verification, setAccountMode, rescuerProfile, updateRescuerProfile } = usePrototypeStore();
  const verified = verification === "verified";
  const [editField, setEditField] = useState<"instagram" | "facebook" | "clabe" | null>(null);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState("");
  const statusCard = {
    unverified: { title: "No verificada", copy: "Completa tu verificación para desbloquear donaciones y reembolsos.", cta: "Iniciar verificación" },
    review: { title: "Verificación en proceso", copy: "Estamos revisando tu información. Te avisaremos en cuanto termine.", cta: "Ver estado" },
    rejected: { title: "Verificación con errores", copy: "Hay información que debes corregir para continuar.", cta: "Corregir información" },
    verified: { title: "Cuenta verificada", copy: "Tu cuenta está activa y puede recibir donaciones.", cta: "" },
  }[verification];

  const openEdit = (field: "instagram" | "facebook" | "clabe") => {
    setEditField(field);
    setDraft(rescuerProfile[field]);
  };

  const saveEdit = () => {
    if (!editField) return;
    const value = draft.trim();
    if (!value) return;
    if (editField === "clabe" && !/^\d{18}$/.test(value)) return;
    updateRescuerProfile({ [editField]: value });
    setEditField(null);
    setToast(
      editField === "instagram"
        ? "Instagram actualizado"
        : editField === "facebook"
          ? "Facebook actualizado"
          : "CLABE actualizada",
    );
  };

  const editMeta = editField
    ? {
        instagram: {
          title: "Editar Instagram",
          label: "Usuario de Instagram",
          placeholder: "@tuusuario",
          hint: "Usa el @ de tu cuenta pública.",
          inputMode: "text" as const,
          maxLength: 40,
          canSave: Boolean(draft.trim()),
        },
        facebook: {
          title: "Editar Facebook",
          label: "Perfil de Facebook",
          placeholder: "Nombre del perfil",
          hint: "El nombre como aparece en tu página o perfil.",
          inputMode: "text" as const,
          maxLength: 60,
          canSave: Boolean(draft.trim()),
        },
        clabe: {
          title: "Editar CLABE",
          label: "CLABE interbancaria",
          placeholder: "18 dígitos",
          hint: "Debe tener exactamente 18 números.",
          inputMode: "numeric" as const,
          maxLength: 18,
          canSave: /^\d{18}$/.test(draft.trim()),
        },
      }[editField]
    : null;

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
            <h2 className="settings-heading">Redes sociales</h2>
            <article className="card-row">
              <span className="row-tile gray"><Icon name="icon-instagram.svg" size={18} /></span>
              <span className="nav-row-text"><small>Instagram</small><strong>{rescuerProfile.instagram}</strong></span>
              <button className="icon-button" onClick={() => openEdit("instagram")} aria-label="Editar Instagram">
                <Icon name="icon-edit.svg" size={16} />
              </button>
            </article>
            <article className="card-row">
              <span className="row-tile gray"><Icon name="icon-facebook.svg" size={18} /></span>
              <span className="nav-row-text"><small>Facebook</small><strong>{rescuerProfile.facebook}</strong></span>
              <button className="icon-button" onClick={() => openEdit("facebook")} aria-label="Editar Facebook">
                <Icon name="icon-edit.svg" size={16} />
              </button>
            </article>
            <p className="field-hint">Vincula tus cuentas para comprobar que eres el dueño. Es ideal agregar ambas.</p>
            <h2 className="settings-heading">Datos bancarios</h2>
            <article className="card-row">
              <span className="nav-row-text"><small>CLABE</small><strong>{rescuerProfile.clabe}</strong></span>
              <button className="icon-button" onClick={() => openEdit("clabe")} aria-label="Editar CLABE">
                <Icon name="icon-edit.svg" size={16} />
              </button>
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
      {editField && editMeta ? (
        <div className="modal-backdrop center" onClick={() => setEditField(null)}>
          <div className="dialog-card settings-edit-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="dialog-close" onClick={() => setEditField(null)} aria-label="Cerrar">×</button>
            <h2>{editMeta.title}</h2>
            <label className="dialog-field">
              <span>{editMeta.label}</span>
              <input
                autoFocus
                value={draft}
                onChange={(event) => {
                  const next = editField === "clabe" ? event.target.value.replace(/\D/g, "").slice(0, 18) : event.target.value;
                  setDraft(next);
                }}
                placeholder={editMeta.placeholder}
                inputMode={editMeta.inputMode}
                maxLength={editMeta.maxLength}
                autoComplete="off"
              />
            </label>
            <p className="field-hint">{editMeta.hint}</p>
            <button type="button" className="purple-button" disabled={!editMeta.canSave} onClick={saveEdit}>
              Guardar
            </button>
            <button type="button" className="secondary-button" onClick={() => setEditField(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </ScreenShell>
  );
}

function HelpCenter() {
  const navigate = useNavigate();
  const { accountMode, guardianActive, setGuardian, cases, emptyStates } = usePrototypeStore();
  const [topicId, setTopicId] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelGuardian, setCancelGuardian] = useState(true);
  const [confirmPendings, setConfirmPendings] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportTopic, setSupportTopic] = useState(helpTopics[0]?.id ?? "apoyos");
  const [supportCase, setSupportCase] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportImage, setSupportImage] = useState("");
  const supportFileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState("");

  const { primaryTopics, secondaryTopics } = useMemo(() => {
    const primary: HelpTopic[] = [];
    const secondary: HelpTopic[] = [];
    helpTopics.forEach((topic) => {
      const isPrimary =
        topic.audience === "both" ||
        (accountMode === "rescuer" ? topic.audience === "rescuer" : topic.audience === "donor");
      (isPrimary ? primary : secondary).push(topic);
    });
    return { primaryTopics: primary, secondaryTopics: secondary };
  }, [accountMode]);

  const activeTopic = helpTopics.find((topic) => topic.id === topicId) ?? null;

  useEffect(() => {
    setOpenFaq(null);
  }, [topicId]);

  const rescuerPendings = useMemo(() => {
    if (emptyStates) return [] as { id: string; caseName: string; kind: string; detail: string }[];
    const items: { id: string; caseName: string; kind: string; detail: string }[] = [];
    cases.forEach((item) => {
      if (item.caseStatus === "closed") return;
      if (item.caseStatus === "active") {
        items.push({
          id: `${item.id}-active`,
          caseName: item.name,
          kind: "Caso activo",
          detail: "Sigue publicado y recibiendo apoyo o adopción.",
        });
      }
      item.needs.forEach((need) => {
        if (need.funded > 0 && need.funded < need.requested && need.status === "active") {
          items.push({
            id: `${item.id}-${need.id}-funds`,
            caseName: item.name,
            kind: "Fondos pendientes",
            detail: `${need.title}: $${need.funded} de $${need.requested} recaudados.`,
          });
        }
        if (need.status === "funded" || need.status === "evidence") {
          items.push({
            id: `${item.id}-${need.id}-evidence`,
            caseName: item.name,
            kind: "Evidencia por subir",
            detail: `${need.title}: falta comprobar el uso del apoyo.`,
          });
        }
      });
    });
    return items;
  }, [cases, emptyStates]);

  const hasPendings = rescuerPendings.length > 0;
  const canDelete = (!guardianActive || cancelGuardian) && (!hasPendings || confirmPendings);

  const closeDelete = () => {
    setDeleteOpen(false);
    setCancelGuardian(true);
    setConfirmPendings(false);
  };

  const confirmDelete = () => {
    if (!canDelete) return;
    if (guardianActive && cancelGuardian) setGuardian(false);
    closeDelete();
    setToast("Cuenta eliminada (ambos perfiles)");
    window.setTimeout(() => navigate("/"), 800);
  };

  const openSupport = () => {
    setSupportTopic(topicId ?? primaryTopics[0]?.id ?? helpTopics[0].id);
    setSupportCase("");
    setSupportMessage("");
    setSupportImage("");
    setSupportSent(false);
    setSupportOpen(true);
  };

  const submitSupport = (event: FormEvent) => {
    event.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSent(true);
  };

  const renderTopicChip = (topic: HelpTopic) => (
    <button
      key={topic.id}
      type="button"
      className={`help-topic-chip${topicId === topic.id ? " is-active" : ""}`}
      onClick={() => setTopicId((current) => (current === topic.id ? null : topic.id))}
    >
      {topic.label}
    </button>
  );

  return (
    <div className="plain-screen">
      <TopBar title="Centro de ayuda" back={accountMode === "rescuer" ? "/rescuer/settings" : "/profile"} />
      <div className="content-pad help-center">
        <header className="help-hero">
          <h1>¿En qué te ayudamos?</h1>
          <p>Encuentra respuestas rápidas o escríbenos.</p>
        </header>

        <section className="help-topics" aria-label="Temas de ayuda">
          <div className="help-topic-group">
            <p className="help-topic-label">
              {accountMode === "rescuer" ? "Para rescatistas" : "Para adoptantes"}
            </p>
            <div className="help-topic-chips">{primaryTopics.map(renderTopicChip)}</div>
          </div>
          {secondaryTopics.length ? (
            <div className="help-topic-group">
              <p className="help-topic-label">
                {accountMode === "rescuer" ? "También para adoptantes" : "También para rescatistas"}
              </p>
              <div className="help-topic-chips">{secondaryTopics.map(renderTopicChip)}</div>
            </div>
          ) : null}
        </section>

        {activeTopic ? (
          <section className="help-topic-content" aria-live="polite">
            <h2>{activeTopic.label}</h2>
            <div className="help-blocks">
              {activeTopic.blocks.map((block, index) => {
                if (block.type === "heading") {
                  return (
                    <h3 key={`${activeTopic.id}-h-${index}`} className="help-block-heading">
                      {block.text}
                    </h3>
                  );
                }
                if (block.type === "paragraph") {
                  return (
                    <p key={`${activeTopic.id}-p-${index}`} className="help-block-copy">
                      {block.text}
                    </p>
                  );
                }
                if (block.type === "bullets") {
                  return (
                    <ul key={`${activeTopic.id}-b-${index}`} className="help-block-list">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === "action") {
                  return (
                    <button
                      key={`${activeTopic.id}-a-${index}`}
                      type="button"
                      className="danger-button help-delete-account"
                      onClick={() => setDeleteOpen(true)}
                    >
                      {block.label}
                    </button>
                  );
                }
                const faqKey = `${activeTopic.id}-${block.q}`;
                const isOpen = openFaq === faqKey;
                return (
                  <article className={`faq-row ${isOpen ? "open" : ""}`} key={faqKey}>
                    <button type="button" onClick={() => setOpenFaq(isOpen ? null : faqKey)}>
                      <strong>{block.q}</strong>
                      <Chevron />
                    </button>
                    {isOpen ? <p>{block.a}</p> : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <p className="help-pick-hint">Elige un tema para ver las respuestas.</p>
        )}

        <section className="help-support-card">
          <h2>¿No encontraste lo que buscabas?</h2>
          <p>Escríbenos y te respondemos lo antes posible.</p>
          <button type="button" className="primary-button" onClick={openSupport}>
            Contactar a soporte
          </button>
        </section>

        <footer className="help-footer">
          <button type="button" onClick={() => navigate("/about")}>
            Sobre nosotros
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => navigate("/terms/donor")}>
            Términos y Condiciones
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => navigate("/privacy/donor")}>
            Aviso de privacidad
          </button>
        </footer>
      </div>

      {supportOpen ? (
        <div className="modal-backdrop center" onClick={() => setSupportOpen(false)}>
          <div
            className="dialog-card help-support-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-support-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="dialog-close" onClick={() => setSupportOpen(false)} aria-label="Cerrar">
              ×
            </button>
            {supportSent ? (
              <>
                <h2 id="help-support-title">Recibimos tu mensaje.</h2>
                <p>
                  Te respondemos lo antes posible, normalmente el mismo día, al correo de tu cuenta.
                </p>
                <button type="button" className="primary-button" onClick={() => setSupportOpen(false)}>
                  Entendido
                </button>
              </>
            ) : (
              <form className="help-support-form" onSubmit={submitSupport}>
                <h2 id="help-support-title">Contactar a soporte</h2>
                <label>
                  Tema
                  <select value={supportTopic} onChange={(event) => setSupportTopic(event.target.value)}>
                    {helpTopics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Caso relacionado <span className="help-optional">(opcional)</span>
                  <input
                    value={supportCase}
                    onChange={(event) => setSupportCase(event.target.value)}
                    placeholder="Ej. Rocky, Luna…"
                  />
                </label>
                <label>
                  Mensaje
                  <textarea
                    rows={4}
                    value={supportMessage}
                    onChange={(event) => setSupportMessage(event.target.value)}
                    placeholder="Cuéntanos qué necesitas"
                    required
                  />
                </label>
                <input
                  ref={supportFileRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file || !file.type.startsWith("image/")) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") setSupportImage(reader.result);
                    };
                    reader.readAsDataURL(file);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => supportFileRef.current?.click()}
                >
                  {supportImage ? "Cambiar imagen" : "Adjuntar imagen (opcional)"}
                </button>
                {supportImage ? (
                  <img className="help-support-preview" src={supportImage} alt="Adjunto seleccionado" />
                ) : null}
                <button type="submit" className="primary-button" disabled={!supportMessage.trim()}>
                  Enviar mensaje
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="modal-backdrop center" onClick={closeDelete}>
          <div
            className="dialog-card delete-account-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="dialog-close" onClick={closeDelete} aria-label="Cerrar">
              ×
            </button>
            <h2 id="delete-account-title">¿Eliminar tu cuenta?</h2>
            <p>
              Se eliminarán ambos perfiles vinculados: <strong>Adoptante</strong> y{" "}
              <strong>Rescatista</strong>. No podrás recuperar el acceso después.
            </p>

            <aside className="delete-account-note">
              <strong>Historial de apoyos</strong>
              <p>
                Tu historial de aportaciones se conserva en el panel de administración y la base de datos por
                motivos fiscales y de trazabilidad, aunque la cuenta se elimine.
              </p>
            </aside>

            {guardianActive ? (
              <label className="delete-account-check">
                <input
                  type="checkbox"
                  checked={cancelGuardian}
                  onChange={(event) => setCancelGuardian(event.target.checked)}
                />
                <span>
                  Tienes <strong>Guardián</strong> activo. Al continuar, cancelamos la suscripción como parte
                  del proceso.
                </span>
              </label>
            ) : null}

            {hasPendings ? (
              <div className="delete-account-blockers">
                <strong>Pendientes como rescatista</strong>
                <p>No puedes eliminar la cuenta hasta confirmar que cerrarás estos pendientes:</p>
                <ul>
                  {rescuerPendings.map((item) => (
                    <li key={item.id}>
                      <strong>
                        {item.caseName} · {item.kind}
                      </strong>
                      <small>{item.detail}</small>
                    </li>
                  ))}
                </ul>
                <label className="delete-account-check">
                  <input
                    type="checkbox"
                    checked={confirmPendings}
                    onChange={(event) => setConfirmPendings(event.target.checked)}
                  />
                  <span>
                    Confirmo que quiero eliminar mi cuenta y con ello todos los casos activos mismos que se
                    cerrarán y ya no recibiré el apoyo de servicio o económico brindado por el uso de la app
                    DopMi.
                  </span>
                </label>
              </div>
            ) : null}

            <button
              type="button"
              className="destructive-button"
              disabled={!canDelete}
              onClick={confirmDelete}
            >
              Sí, eliminar mi cuenta
            </button>
            <button type="button" className="secondary-button" onClick={closeDelete}>
              Conservar mi cuenta
            </button>
          </div>
        </div>
      ) : null}
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}

function AboutUs() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  const whatWeDo = [
    {
      title: "Adoptar",
      detail: "Mascotas reales, publicadas por rescatistas reales. Hablas directo con quien la cuida.",
      icon: "tab-adoption.svg",
    },
    {
      title: "Apoyar",
      detail: "Ayudas con una necesidad concreta, como comida, medicina o una consulta, y ves qué pasó después.",
      icon: "tab-donate.svg",
    },
    {
      title: "Rescatar",
      detail: "Las rescatistas publican sus casos en minutos y DopMi les ayuda a encontrar quién apoye.",
      icon: "intent-rescuer.svg",
    },
  ] as const;

  const trustItems = [
    {
      title: "Personas verificadas",
      detail: "Detrás de cada caso que pide apoyo hay una rescatista verificada, no un perfil anónimo.",
    },
    {
      title: "Mascotas reales",
      detail: "Revisamos cada publicación antes de mostrarla, y también cada cambio.",
    },
    {
      title: "Seguimiento con evidencia",
      detail: "Te mostramos en qué se usó cada apoyo, con nombre, foto y desenlace.",
    },
  ] as const;

  return (
    <div className="plain-screen">
      <TopBar title="Sobre Nosotros" back="/profile" />
      <div className="content-pad about-section">
        <section className="about-block">
          <h2>Ayudar se siente bien.</h2>
          <p>DopMi nació entre rescatistas, para rescatistas y para todas las personas que quieren sumar.</p>
        </section>

        <section className="about-block">
          <h2>Nuestra historia</h2>
          <p>
            En México, rescatar a un perro o un gato se hace a pura fuerza de voluntad: publicaciones que se
            pierden en redes, grupos de WhatsApp y la suerte de que alguien vea el post a tiempo.
          </p>
          <p>
            Quienes rescatan no necesitan más ruido. Necesitan que su trabajo llegue a las personas correctas.
            Por eso hicimos DopMi: un solo lugar para adoptar, apoyar y darle seguimiento a cada rescate.
          </p>
        </section>

        <section className="about-block">
          <h2>Lo que hacemos</h2>
          <div className="about-cards">
            {whatWeDo.map((item) => (
              <article className="about-card" key={item.title}>
                <span className="about-card-icon" aria-hidden="true">
                  <Icon name={item.icon} size={20} />
                </span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-block">
          <h2>Por qué puedes confiar</h2>
          <p>No te pedimos que confíes. Te mostramos por qué puedes hacerlo.</p>
          <ul className="about-trust-list">
            {trustItems.map((item) => (
              <li key={item.title}>
                <strong>{item.title}.</strong> {item.detail}
              </li>
            ))}
          </ul>
        </section>

        <section className="about-block">
          <h2>Guardianes</h2>
          <p>
            Algunas personas eligen estar siempre. Con Guardián, tu aportación mensual ayuda directamente a los
            casos de apoyo activos para responder principalmente a las urgencias de rescate. Cada mes te
            contamos qué casos se atendieron.
          </p>
        </section>

        <section className="about-block about-closing">
          <h2>No estás ayudando solo.</h2>
          <p>Cada pequeña ayuda suma, y aquí celebramos todas.</p>
        </section>

        <div className="about-actions">
          <button type="button" className="secondary-button" onClick={() => navigate("/transparency")}>
            Transparencia
          </button>
        </div>

        <footer className="about-footer">
          <button type="button" onClick={() => navigate("/help")}>
            Centro de ayuda
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => navigate("/terms/donor")}>
            Términos y Condiciones
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => navigate("/privacy/donor")}>
            Aviso de privacidad
          </button>
          <span aria-hidden="true">·</span>
          <a href="mailto:hola@dopmi.mx">Contacto</a>
          <span aria-hidden="true">·</span>
          <span className="about-footer-social">
            Síguenos en{" "}
            <button type="button" onClick={() => setToast("Instagram de DopMi (simulado)")}>
              Instagram
            </button>
            {" / "}
            <button type="button" onClick={() => setToast("Facebook de DopMi (simulado)")}>
              Facebook
            </button>
          </span>
        </footer>
      </div>
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}

function Transparency() {
  const [showCriteria, setShowCriteria] = useState(false);

  return (
    <div className="plain-screen">
      <TopBar title="Transparencia" back="/about" />
      <div className="content-pad about-section transparency-section">
        <section className="about-block">
          <h2>Cuando apoyas un caso</h2>
          <p>
            Tu apoyo va a la necesidad que elegiste de esa mascota: comida, medicina o consulta veterinaria.
          </p>
        </section>

        <section className="about-block">
          <h2>¿A dónde va cada peso?</h2>
          <p>De cada $100 que aportas:</p>
          <ul className="transparency-breakdown">
            <li>
              <strong>$93</strong> llegan a la rescatista para esa necesidad.
            </li>
            <li>
              <strong>$5</strong> cubren la comisión del procesador de pago. No es de DopMi.
            </li>
            <li>
              <strong>$2</strong> mantienen funcionando DopMi.
            </li>
          </ul>
          <p>
            Antes de pagar, ves el desglose exacto de tu apoyo. Tu apoyo no es deducible de impuestos.
          </p>
        </section>

        <section className="about-block">
          <h2>Cómo se usa el dinero</h2>
          <p>
            La rescatista recibe los fondos cuando comprueba el gasto con un ticket o una factura, y DopMi lo
            revisa. Esa evidencia queda visible en el caso.
          </p>
        </section>

        <section className="about-block">
          <h2>¿Y si…?</h2>
          <ul className="transparency-list">
            <li>
              …el caso junta más de lo necesario? El excedente se reasigna a otra necesidad activa de la misma
              mascota o, si ya no hay, a urgencias del fondo Guardián.
            </li>
            <li>
              …la mascota es adoptada o fallece antes? Se cierra el caso, se detienen nuevos apoyos y los fondos
              pendientes se destinan solo a gastos comprobados de esa mascota o se reasignan según la política
              de cierre.
            </li>
            <li>
              …la rescatista no comprueba el gasto? Los fondos no se liberan y el caso queda en revisión hasta
              que suba evidencia válida o DopMi resuelva el pendiente.
            </li>
          </ul>
        </section>

        <section className="about-block">
          <h2>Cuando eres Guardián</h2>
          <p>
            Tu suscripción mensual es un pago a DopMi por mantener un fondo de respuesta listo para urgencias
            de rescate, con reportes de lo que logra. DopMi decide cómo se usa el fondo con reglas públicas. Tu
            cuota no se destina a una mascota en particular.
          </p>
          <ul className="about-trust-list">
            <li>
              <strong>Urgencias primero.</strong> El fondo atiende primero operaciones, hospitalizaciones y
              traslados.
            </li>
            <li>
              <strong>Reglas públicas.</strong> Cuando hay excedente, completa casos que llevan tiempo
              esperando.{" "}
              <button
                type="button"
                className="transparency-inline-link"
                onClick={() => setShowCriteria((value) => !value)}
              >
                {showCriteria ? "Ocultar criterios" : "Ver criterios"}
              </button>
              {showCriteria ? (
                <span className="transparency-criteria">
                  Priorizamos urgencia médica, tiempo en espera y avance de meta. No se asigna a dedo ni por
                  popularidad del caso.
                </span>
              ) : null}
            </li>
            <li>
              <strong>Te contamos qué logró.</strong> Cada mes recibes un reporte con los casos que atendió el
              fondo: foto, necesidad cubierta y cómo les fue.
            </li>
            <li>
              <strong>Cambia tu monto o cancela cuando quieras.</strong>
            </li>
          </ul>
        </section>

        <p className="transparency-meta">
          Última actualización: 30 sep 2026 · ¿Dudas?{" "}
          <a href="mailto:hola@dopmi.mx">hola@dopmi.mx</a>
        </p>
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

function DonateAmountDialog({
  remaining,
  onClose,
  onConfirm,
}: {
  remaining: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const presets = [50, 100] as const;
  const remainingAmount = Math.max(0, Math.round(remaining));
  const [mode, setMode] = useState<"preset" | "remaining" | "custom">("preset");
  const [preset, setPreset] = useState<number>(100);
  const [custom, setCustom] = useState("");
  const [coverFees, setCoverFees] = useState(true);
  const parsedCustom = Number(custom);
  const amount =
    mode === "custom"
      ? parsedCustom
      : mode === "remaining"
        ? remainingAmount
        : preset;
  const valid = Number.isFinite(amount) && amount >= 50;
  const feeLabel = coverFees ? "$0.00" : "$0.00";

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div
        className="dialog-card donate-amount-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donate-amount-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="donate-amount-top">
          <button type="button" className="donate-amount-icon-btn" onClick={onClose} aria-label="Regresar">
            <Icon name="back.svg" size={20} />
          </button>
          <button type="button" className="donate-amount-icon-btn" onClick={onClose} aria-label="Cerrar">
            <Icon name="icon-x-muted.svg" size={18} />
          </button>
        </div>

        <h2 id="donate-amount-title">Elige un monto a donar:</h2>

        <div className="donate-amount-presets" role="group" aria-label="Montos sugeridos">
          {presets.map((value) => (
            <button
              key={value}
              type="button"
              className={mode === "preset" && preset === value ? "is-selected" : ""}
              onClick={() => {
                setMode("preset");
                setPreset(value);
                setCustom("");
              }}
            >
              ${value}
            </button>
          ))}
          <button
            type="button"
            className={`donate-amount-remaining${mode === "remaining" ? " is-selected" : ""}`}
            onClick={() => {
              setMode("remaining");
              setCustom("");
            }}
          >
            <strong>${remainingAmount.toLocaleString("es-MX")}</strong>
            <small>Total faltante</small>
          </button>
        </div>

        <label className="donate-amount-custom">
          <span>Otra cantidad:</span>
          <span className={`donate-amount-input${mode === "custom" ? " is-active" : ""}`}>
            <em aria-hidden="true">$</em>
            <input
              type="number"
              min={50}
              inputMode="numeric"
              placeholder=""
              value={custom}
              onChange={(event) => {
                setCustom(event.target.value);
                setMode("custom");
              }}
              onFocus={() => setMode("custom")}
            />
          </span>
          <small>No podrá ser menor a $50</small>
        </label>

        <label className="donate-amount-fee">
          <input
            type="checkbox"
            checked={coverFees}
            onChange={(event) => setCoverFees(event.target.checked)}
          />
          <span>Suma {feeLabel} para apoyar al rescatista a cubrir los costos de transacción.</span>
        </label>

        <button
          type="button"
          className="donate-amount-cta"
          disabled={!valid}
          onClick={() => onConfirm(amount)}
        >
          Dona ahora
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 17 17 7M9 7h8v8"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="donate-amount-note">Serás redirigido para completar la transacción</p>
      </div>
    </div>
  );
}

function AdoptStartDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div
        className="dialog-card adopt-start-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adopt-start-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 id="adopt-start-title">¿Iniciamos el proceso?</h2>
        <p>Contactaremos al rescatista para que pueda resolver tus dudas y explicarte los siguientes pasos</p>
        <div className="adopt-start-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Todavía no
          </button>
          <button type="button" className="primary-button" onClick={onConfirm}>
            Sí, contactar rescatista
          </button>
        </div>
      </div>
    </div>
  );
}

function RescuerModeDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const steps = [
    {
      title: "Cambias de navegación",
      detail: "Ves Inicio, Casos y Publicar pensados para quien rescata.",
      icon: "rtab-home.svg",
    },
    {
      title: "Armas el perfil del compañerito",
      detail: "Nombre, fotos e historia para que alguien se enamore de verdad.",
      icon: "onb-camera.svg",
    },
    {
      title: "Publicas cuando estés listo",
      detail: "Te guiamos paso a paso y puedes pausar cuando quieras.",
      icon: "rtab-publish.svg",
    },
    {
      title: "Vuelves a Adoptante en un toque",
      detail: "Tu perfil de Adoptante no se borra: regresas cuando lo necesites.",
      icon: "onb-adopt-heart.svg",
    },
  ] as const;

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div
        className="dialog-card rescuer-mode-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rescuer-mode-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="rescuer-mode-intro">
          <h2 id="rescuer-mode-title">¿Activamos tu modo Rescatista?</h2>
          <p>Publica casos de mascotas con necesidad de un hogar.</p>
          <span className="rescuer-mode-badge">Tu perfil de Adoptante se queda intacto.</span>
        </div>
        <ul className="rescuer-mode-steps">
          {steps.map((step) => (
            <li key={step.title}>
              <span className="rescuer-mode-step-icon" aria-hidden="true">
                <Icon name={step.icon} size={18} />
              </span>
              <span>
                <strong>{step.title}</strong>
                <small>{step.detail}</small>
              </span>
            </li>
          ))}
        </ul>
        <div className="rescuer-mode-actions">
          <button type="button" className="primary-button" onClick={onConfirm}>
            Sí, cambiar a Rescatista
          </button>
          <button type="button" className="text-link-button" onClick={onClose}>
            Ahora no
          </button>
        </div>
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
  const { cases, savedPetIds, toggleSavedPet } = usePrototypeStore();
  const fromCase = cases.find((item) => item.id === caseId);
  const name = fromCase?.rescuer ?? decodeURIComponent(caseId);
  const rescuer = rescuers.find((item) => item.name === name) ?? rescuers[0];
  const [tab, setTab] = useState<"adoption" | "cases" | "activity">("activity");
  const [report, setReport] = useState(false);
  const [toast, setToast] = useState("");
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
          <button className="icon-button" onClick={() => setToast("Enlace del perfil copiado")} aria-label="Compartir">
            <Icon name="send.svg" size={20} />
          </button>
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
          <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>Actividad</button>
          <button className={tab === "adoption" ? "active" : ""} onClick={() => setTab("adoption")}>En adopción</button>
          <button className={tab === "cases" ? "active" : ""} onClick={() => setTab("cases")}>Casos</button>
          <button className="report-link" onClick={() => setReport(true)}>Reportar</button>
        </div>
        {tab === "activity" ? (
          (() => {
            const adoptionActive = adoptionList.filter((item) => {
              const pet = adoptionPets.find((entry) => entry.id === item.id);
              if (pet) return pet.listed !== false;
              const petCase = ownCases.find((entry) => entry.id === item.id);
              return petCase?.caseStatus === "active";
            }).length;
            const donationActive = ownCases.filter(
              (item) =>
                item.caseStatus === "active" &&
                item.needs.some((need) => need.status === "active" && need.funded < need.requested),
            ).length;
            const donationPublished = ownCases.filter((item) => item.needs.length > 0).length;
            const adoptionPublished = adoptionList.length;
            const raised = ownCases.reduce(
              (sum, item) => sum + item.needs.reduce((inner, need) => inner + need.funded, 0),
              0,
            );
            const needsCompleted = ownCases.reduce(
              (sum, item) =>
                sum +
                item.needs.filter(
                  (need) =>
                    need.status === "funded" ||
                    need.status === "completed" ||
                    need.status === "evidence" ||
                    need.funded >= need.requested,
                ).length,
              0,
            );
            const petsHelped = new Set([
              ...ownCases.map((item) => item.id),
              ...adoptionPets.filter((item) => item.rescuer === rescuer.name).map((item) => item.id),
            ]).size;
            const closedCases = ownCases.filter((item) => item.caseStatus === "closed").length;
            const highlight = [
              {
                value: donationActive,
                label: "Donaciones activas",
                hint: "Con meta abierta ahora",
                tone: "yellow",
                icon: "tab-donate.svg",
              },
              {
                value: adoptionActive,
                label: "Adopciones activas",
                hint: "Buscando hogar",
                tone: "ink",
                icon: "tab-adoption.svg",
              },
            ] as const;
            const stats = [
              {
                value: donationPublished || rescuer.publishedCases,
                label: "Casos de donación",
                sub: "Historial publicado",
                icon: "notif-case.svg",
              },
              {
                value: adoptionPublished,
                label: "Publicaciones de adopción",
                sub: "En todo el historial",
                icon: "notif-pet.svg",
              },
              {
                value: `$${raised.toLocaleString("es-MX")}`,
                label: "Recaudado",
                sub: "Aportes recibidos",
                icon: "icon-donation-in.svg",
              },
              {
                value: needsCompleted,
                label: "Necesidades cubiertas",
                sub: "Metas completadas",
                icon: "check-circle.svg",
              },
              {
                value: petsHelped,
                label: "Mascotas ayudadas",
                sub: "Adopción y donación",
                icon: "empty-impact-paw.svg",
              },
              {
                value: closedCases,
                label: "Casos cerrados",
                sub: "Historial concluido",
                icon: "icon-verified.svg",
              },
            ];

            return (
              <section className="rescuer-dash" aria-label="Resumen de actividad">
                <p className="rescuer-dash-lead">
                  Numeralia de lo que {rescuer.name.split(" ")[0]} ha impulsado en DopMi.
                </p>
                <div className="rescuer-dash-hero">
                  {highlight.map((item) => (
                    <article key={item.label} className={`rescuer-dash-hero-card tone-${item.tone}`}>
                      <span className="rescuer-dash-hero-icon" aria-hidden="true">
                        <Icon name={item.icon} size={18} />
                      </span>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                      <small>{item.hint}</small>
                    </article>
                  ))}
                </div>
                <div className="rescuer-dash-grid">
                  {stats.map((stat) => (
                    <article key={stat.label} className="rescuer-dash-stat">
                      <span className="rescuer-dash-stat-icon" aria-hidden="true">
                        <Icon name={stat.icon} size={16} />
                      </span>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                      <small>{stat.sub}</small>
                    </article>
                  ))}
                </div>
              </section>
            );
          })()
        ) : null}
        {tab === "adoption" ? (
          adoptionList.length ? (
            adoptionList.map((item) => {
              const isSaved = savedPetIds.includes(item.id);
              return (
                <article className="case-card" key={item.id}>
                  <div className="case-image">
                    <img src={item.image} alt={item.name} />
                    <div className="case-title"><strong>{item.name}, {item.age}</strong><span>{item.distance}</span></div>
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
                  <div className="case-title"><strong>{item.name}, {item.age}</strong><span>{item.distance}</span></div>
                </div>
                {item.needs.slice(0, 1).map((need) => (
                  <div className="need-summary" key={need.id}>
                    <div><strong>{need.title}</strong><b>${need.funded} / ${need.requested}</b></div>
                    <div className="progress"><i style={{ width: `${(need.funded / need.requested) * 100}%` }} /></div>
                    <div className="card-actions">
                      <button className="primary-button" onClick={() => navigate(`/case/${item.id}`)}>Ver caso</button>
                      <button className="secondary-button" onClick={() => navigate(`/donate/${item.id}/${need.id}`)}>Donar</button>
                    </div>
                  </div>
                ))}
              </article>
            ))
          ) : (
            <p className="empty-inline">Sin casos de donación activos.</p>
          )
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
          <Route path="/choose-account" element={<ChooseAccount />} />
          <Route path="/choose-intent" element={<ChooseDonorIntent />} />
          <Route path="/intro" element={<Navigate to="/choose-account" replace />} />
          <Route path="/onboarding/donor" element={<Onboarding mode="donor" />} />
          <Route path="/onboarding/rescuer" element={<Onboarding mode="rescuer" />} />
          <Route path="/welcome/donor" element={<Welcome mode="donor" />} />
          <Route path="/welcome/rescuer" element={<Welcome mode="rescuer" />} />
          <Route path="/login/donor" element={<Login mode="donor" />} />
          <Route path="/login/rescuer" element={<Login mode="rescuer" />} />
          <Route path="/signup/donor" element={<Login mode="donor" signup />} />
          <Route path="/signup/rescuer" element={<Login mode="rescuer" signup />} />
          <Route path="/forgot-password" element={<StaticSimulated title="Recuperar contraseña" back="/login/donor"><div className="form-stack"><h1>Recupera el acceso</h1><p>Te enviaremos un enlace simulado a tu correo.</p><label>Correo<input type="email" placeholder="nombre@correo.com" /></label><button className="primary-button">Enviar enlace</button></div></StaticSimulated>} />
          <Route path="/terms/:mode" element={<LegalDoc kind="terms" />} />
          <Route path="/privacy/:mode" element={<LegalDoc kind="privacy" />} />
          <Route path="/terms" element={<Navigate to="/terms/donor" replace />} />
          <Route path="/privacy" element={<Navigate to="/privacy/donor" replace />} />
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
          <Route path="/about" element={<AboutUs />} />
          <Route path="/transparency" element={<Transparency />} />
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
          <Route path="/rescuer/profile/edit" element={<RescuerEditPublicProfile />} />
          <Route path="/rescuer/settings" element={<RescuerSettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <TestPanel />
    </div>
  );
}
