import {
  type Dispatch,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  adoptionPets,
  donationLog,
  helpTopics,
  guardianPaymentHistory,
  rescuerReceivedPaymentHistory,
  rescuers,
  savedCards,
  subscriptionPlans,
  type HelpTopic,
  type Need,
  type NotificationKind,
  type NotificationTone,
  type PetCase,
  defaultRescuerVerificationRejection,
  type RescuerVerificationFixField,
} from "./data";
import {
  adoptionChatIntroText,
  usePrototypeStore,
  type AccountMode,
  type RescuerProfile,
  type RescuerSupportPaymentEvent,
  type Verification,
} from "./store";

const A = "/assets/";
function guardianSubscriptionHeadline(petName: string) {
  return `Suscripción - ${petName}`;
}

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
  { path: "/messages", label: "Mis match", icon: "icon-heart.svg", size: 20 },
  { path: "/donate", label: "Apoyar", icon: "tab-donate.svg", size: 22 },
  { path: "/apoya-causa", label: "Tienda", icon: "icon-shop.svg", size: 20 },
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

  const isNavActive = (path: string) =>
    path === "/rescuer" ? location.pathname === path : location.pathname.startsWith(path);

  if (mode === "donor") {
    return (
      <nav className="bottom-nav donor-pill" aria-label="Navegación principal">
        {items.map((item) => {
          const active = isNavActive(item.path);
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
            </button>
          );
        })}
      </nav>
    );
  }

  const publishIndex = 2;

  return (
    <nav className="bottom-nav rescuer-fab-nav" aria-label="Navegación principal">
      {items.map((item, index) => {
        const active = isNavActive(item.path);
        if (index === publishIndex) {
          return (
            <div key={item.path} className="rescuer-nav-fab-slot">
              <button
                type="button"
                className="rescuer-nav-fab"
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon-wrap" aria-hidden="true">
                  <Icon name={item.icon} size={26} />
                </span>
              </button>
            </div>
          );
        }
        return (
          <button
            key={item.path}
            type="button"
            className={`rescuer-nav-item${active ? " active" : ""}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            <span className="nav-icon-wrap" aria-hidden="true">
              <Icon name={item.icon} size={item.size} />
            </span>
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

/** Logo + notificaciones: misma posición en Adoptar, Apoyar, Mis match, etc. */
function DonorChromeTop({
  leading,
  brand,
  actions,
}: {
  leading?: ReactNode;
  brand?: ReactNode;
  actions?: ReactNode;
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
        {actions ?? (
          <button
            type="button"
            className="discover-icon-btn"
            onClick={() => navigate("/notifications")}
            aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ""}`}
          >
            <Icon name="icon-bell.svg" size={20} />
            {unread > 0 ? <span className="notification-dot">{unread}</span> : null}
          </button>
        )}
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

const ADOPTION_SIZES = ["Chico", "Mediano", "Grande"] as const;
const ADOPTION_AGE_BANDS = ["Cachorro", "Adulto", "Senior"] as const;
const ADOPTION_PET_PLACEHOLDER_ICON = "notif-pet.svg";
const ADOPTION_SIZE_ICON_PX: Record<(typeof ADOPTION_SIZES)[number], number> = {
  Chico: 14,
  Mediano: 22,
  Grande: 30,
};
const ADOPTION_PERSONALITY = [
  "Alegre",
  "Juguetón",
  "Tranquilo",
  "Nervioso",
  "Dormilón",
  "Protector",
  "Obediente",
  "Cariñoso",
  "Tímido",
] as const;

const ADOPTION_PERSONALITY_TONE: Record<(typeof ADOPTION_PERSONALITY)[number], string> = {
  Alegre: "alegre",
  Juguetón: "jugueton",
  Tranquilo: "tranquilo",
  Nervioso: "nervioso",
  Dormilón: "dormilon",
  Protector: "protector",
  Obediente: "obediente",
  Cariñoso: "cariñoso",
  Tímido: "timido",
};

type PetSize = (typeof ADOPTION_SIZES)[number];
type PetAgeBand = (typeof ADOPTION_AGE_BANDS)[number];
type PetPersonality = (typeof ADOPTION_PERSONALITY_TONE)[(typeof ADOPTION_PERSONALITY)[number]];

function adoptionPublishedAgeLabel(value: string) {
  const trimmed = value.trim();
  return ADOPTION_AGE_BANDS.includes(trimmed as PetAgeBand) ? trimmed : "";
}

const PERSONALITY_FILTERS = ADOPTION_PERSONALITY.map((label) => ({
  id: ADOPTION_PERSONALITY_TONE[label],
  label,
  tone: ADOPTION_PERSONALITY_TONE[label],
}));

const PERSONALITY_LABEL_BY_SLUG = Object.fromEntries(
  PERSONALITY_FILTERS.map((trait) => [trait.id, trait.label]),
) as Record<string, string>;

function resolvePersonalityChip(trait: string) {
  const fromLabel = ADOPTION_PERSONALITY_TONE[trait as keyof typeof ADOPTION_PERSONALITY_TONE];
  if (fromLabel) return { label: trait, tone: fromLabel };
  const label = PERSONALITY_LABEL_BY_SLUG[trait] ?? trait;
  return { label, tone: trait };
}

function PetDetailPersonalityBlock({ personality }: { personality: readonly string[] }) {
  if (!personality.length) return null;

  return (
    <div className="pet-detail-traits-block pet-detail-personality-block">
      <ul className="pet-detail-traits-list pet-detail-traits-list--wrap">
        {personality.map((trait) => {
          const chip = resolvePersonalityChip(trait);
          return (
            <li key={`${chip.tone}-${chip.label}`}>
              <span
                className={`publish-chip publish-chip--personality tone-${chip.tone} pet-detail-traits-personality`}
              >
                {chip.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PetDetailCharacteristics({
  health,
  convivencia,
}: {
  health: { vaccinated: boolean; sterilized: boolean; specialCare: boolean };
  convivencia: readonly string[];
}) {
  const healthTags = [
    health.vaccinated && "Vacunado",
    health.sterilized && "Esterilizado",
    health.specialCare && "Requiere cuidados especiales",
  ].filter((tag): tag is string => Boolean(tag));

  if (!convivencia.length && !healthTags.length) return null;

  return (
    <section className="pet-detail-traits" aria-label="Características de la mascota">
      {convivencia.length ? (
        <div className="pet-detail-traits-block">
          <h3>Convivencia y hogar</h3>
          <ul className="pet-detail-traits-checklist">
            {convivencia.map((tag) => (
              <li key={tag}>
                <Icon name="check.svg" size={16} aria-hidden="true" />
                <span>{tag}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {healthTags.length ? (
        <div className="pet-detail-traits-block">
          <h3>Salud</h3>
          <ul className="pet-detail-traits-list pet-detail-traits-list--wrap">
            {healthTags.map((tag) => (
              <li key={tag} className="pet-detail-traits-pill pet-detail-traits-pill--convivencia">{tag}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

type SupportCauseKibble = {
  id: string;
  species: "Perro" | "Gato";
  brand: string;
  kilos: string;
  age: PetAgeBand;
  size: PetSize;
  marcaKey: PetPersonality;
};

const SUPPORT_CAUSE_KIBBLE: SupportCauseKibble[] = [
  { id: "k1", species: "Perro", brand: "PawNutri", kilos: "3 kg", age: "Adulto", size: "Mediano", marcaKey: "obediente" },
  { id: "k2", species: "Perro", brand: "Royal Bark", kilos: "15 kg", age: "Adulto", size: "Grande", marcaKey: "protector" },
  { id: "k3", species: "Perro", brand: "LittlePaws", kilos: "1.5 kg", age: "Cachorro", size: "Chico", marcaKey: "jugueton" },
  { id: "k4", species: "Perro", brand: "NutriCan", kilos: "8 kg", age: "Senior", size: "Mediano", marcaKey: "tranquilo" },
  { id: "k5", species: "Perro", brand: "HappyTail", kilos: "2 kg", age: "Cachorro", size: "Chico", marcaKey: "alegre" },
  { id: "k6", species: "Gato", brand: "MeowChef", kilos: "1 kg", age: "Adulto", size: "Chico", marcaKey: "cariñoso" },
  { id: "k7", species: "Gato", brand: "WhiskerPro", kilos: "3 kg", age: "Cachorro", size: "Chico", marcaKey: "timido" },
  { id: "k8", species: "Gato", brand: "FelineGold", kilos: "5 kg", age: "Senior", size: "Mediano", marcaKey: "dormilon" },
  { id: "k9", species: "Gato", brand: "MiauPlus", kilos: "2.5 kg", age: "Adulto", size: "Mediano", marcaKey: "nervioso" },
  { id: "k10", species: "Perro", brand: "CampoVital", kilos: "20 kg", age: "Adulto", size: "Grande", marcaKey: "obediente" },
];

function supportCauseKilosValue(kilos: string) {
  const n = parseFloat(kilos.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
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
type DiscoverSpeciesChoice = "Perro" | "Gato";

function DiscoverFilterButton({ active, onClick }: { active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`discover-filter-inline${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-label="Filtros"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16.5" cy="7" r="2.25" fill="currentColor" />
        <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="7.5" cy="17" r="2.25" fill="currentColor" />
      </svg>
    </button>
  );
}

function RescuerPublicFilterButton({ active, onClick }: { active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`rescuer-public-filter-btn${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-label="Filtrar"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16.5" cy="7" r="2.25" fill="currentColor" />
        <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="7.5" cy="17" r="2.25" fill="currentColor" />
      </svg>
      <span>Filtrar</span>
    </button>
  );
}

function DiscoverSpeciesFilterBar({
  species,
  onSpeciesChange,
  filtersActive,
  onOpenFilters,
}: {
  species: DiscoverSpeciesChoice;
  onSpeciesChange: (next: DiscoverSpeciesChoice) => void;
  filtersActive: boolean;
  onOpenFilters: () => void;
}) {
  return (
    <div className="discover-species-row">
      <div className="discover-species" role="tablist" aria-label="Tipo de mascota">
        <button
          type="button"
          role="tab"
          aria-selected={species === "Perro"}
          className={`discover-species-tab${species === "Perro" ? " is-active" : ""}`}
          onClick={() => onSpeciesChange("Perro")}
        >
          Perros
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={species === "Gato"}
          className={`discover-species-tab${species === "Gato" ? " is-active" : ""}`}
          onClick={() => onSpeciesChange("Gato")}
        >
          Gatos
        </button>
      </div>
      <DiscoverFilterButton active={filtersActive} onClick={onOpenFilters} />
    </div>
  );
}

type AdoptionFilterModalProps = {
  open: boolean;
  onClose: () => void;
  variant?: "adoption" | "supportCause";
  showSpecies?: boolean;
  draftSpecies?: DiscoverSpeciesChoice | null;
  setDraftSpecies?: (value: DiscoverSpeciesChoice | null) => void;
  draftSex: "Macho" | "Hembra" | null;
  setDraftSex: (value: "Macho" | "Hembra" | null) => void;
  draftAge?: PetAgeBand | null;
  setDraftAge?: (value: PetAgeBand | null) => void;
  draftSize: PetSize | null;
  setDraftSize: (value: PetSize | null) => void;
  draftPersonality: PetPersonality[];
  setDraftPersonality: Dispatch<SetStateAction<PetPersonality[]>>;
  onApply: () => void;
  onClear: () => void;
};

function AdoptionFilterModal({
  open,
  onClose,
  variant = "adoption",
  showSpecies = false,
  draftSpecies = null,
  setDraftSpecies,
  draftSex,
  setDraftSex,
  draftAge = null,
  setDraftAge,
  draftSize,
  setDraftSize,
  draftPersonality,
  setDraftPersonality,
  onApply,
  onClear,
}: AdoptionFilterModalProps) {
  const isSupportCause = variant === "supportCause";
  if (!open) return null;
  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div className="dialog-card adoption-filter-dialog" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">×</button>
        <header className="adoption-filter-header">
          <h2>Filtros</h2>
        </header>
        <div className="adoption-filter-grid adoption-filter-grid--stacked">
          {showSpecies && setDraftSpecies ? (
            <section>
              <h3>Especie</h3>
              <div className="rescuer-public-filter-species" role="group" aria-label="Especie">
                <button
                  type="button"
                  className={draftSpecies === null ? "is-active" : ""}
                  onClick={() => setDraftSpecies(null)}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className={draftSpecies === "Perro" ? "is-active" : ""}
                  onClick={() => setDraftSpecies("Perro")}
                >
                  Perros
                </button>
                <button
                  type="button"
                  className={draftSpecies === "Gato" ? "is-active" : ""}
                  onClick={() => setDraftSpecies("Gato")}
                >
                  Gatos
                </button>
              </div>
            </section>
          ) : null}
          {!isSupportCause ? (
            <section>
              <h3>Sexo</h3>
              <div className="filter-gender" role="group" aria-label="Sexo">
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
          ) : (
            <section>
              <h3>Edad</h3>
              <div
                className="publish-choice-row publish-choice-row--three adoption-filter-age-row"
                role="group"
                aria-label="Edad"
              >
                {ADOPTION_AGE_BANDS.map((ageBand) => {
                  const active = draftAge === ageBand;
                  return (
                    <button
                      type="button"
                      key={ageBand}
                      className={`publish-choice${active ? " selected" : ""}`}
                      aria-pressed={active}
                      onClick={() => setDraftAge?.(active ? null : ageBand)}
                    >
                      {ageBand}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h3>{isSupportCause ? "Tamaño de Raza" : "Tamaño"}</h3>
            <div
              className="publish-choice-row publish-choice-row--three adoption-filter-size-row"
              role="group"
              aria-label={isSupportCause ? "Tamaño de Raza" : "Tamaño"}
            >
              {ADOPTION_SIZES.map((size) => {
                const active = draftSize === size;
                return (
                  <button
                    type="button"
                    key={size}
                    className={`publish-choice publish-choice--pet-size${active ? " selected" : ""}`}
                    aria-pressed={active}
                    onClick={() => setDraftSize(active ? null : size)}
                  >
                    <span className="publish-choice-icon" aria-hidden="true">
                      <Icon name={ADOPTION_PET_PLACEHOLDER_ICON} size={ADOPTION_SIZE_ICON_PX[size]} />
                    </span>
                    {size}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="adoption-filter-personality">
            <h3>{isSupportCause ? "Marca" : "Personalidad"}</h3>
            <div
              className="publish-chip-grid adoption-filter-personality-grid"
              role="group"
              aria-label={isSupportCause ? "Marca" : "Personalidad"}
            >
              {PERSONALITY_FILTERS.map((trait) => {
                const active = draftPersonality.includes(trait.id);
                return (
                  <button
                    type="button"
                    key={trait.id}
                    className={`publish-chip publish-chip--personality tone-${trait.tone}${active ? " selected" : ""}`}
                    aria-pressed={active}
                    onClick={() =>
                      setDraftPersonality((current) => (current.includes(trait.id) ? [] : [trait.id]))
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
          <button type="button" className="primary-button" onClick={onApply}>Aplicar filtros</button>
          <button type="button" className="secondary-button" onClick={onClear}>Limpiar filtros</button>
        </div>
      </div>
    </div>
  );
}

function AdoptionHome() {
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet, emptyStates, cases } = usePrototypeStore();
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftSex, setDraftSex] = useState<"Macho" | "Hembra" | null>(null);
  const [sexFilter, setSexFilter] = useState<"Macho" | "Hembra" | null>(null);
  const [draftSize, setDraftSize] = useState<PetSize | null>(null);
  const [sizeFilter, setSizeFilter] = useState<PetSize | null>(null);
  const [draftPersonality, setDraftPersonality] = useState<PetPersonality[]>([]);
  const [personalityFilter, setPersonalityFilter] = useState<PetPersonality[]>([]);
  const [chatConfirmId, setChatConfirmId] = useState<string | null>(null);
  const [species, setSpecies] = useState<DiscoverSpeciesChoice>("Perro");
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

  const selectSpecies = (next: DiscoverSpeciesChoice) => {
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
  const mosaicEndPets: DiscoverPet[] = [];
  const mosaicSeen = new Set<string>();
  for (const pet of mosaicPets) {
    if (mosaicSeen.has(pet.id)) continue;
    mosaicSeen.add(pet.id);
    mosaicEndPets.push(pet);
    if (mosaicEndPets.length === 4) break;
  }

  const chatConfirmPet = chatConfirmId ? adoptionPets.find((item) => item.id === chatConfirmId) : undefined;

  return (
    <ScreenShell
      className="adoption-shell"
      overlay={
        <>
        <AdoptionFilterModal
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          draftSex={draftSex}
          setDraftSex={setDraftSex}
          draftSize={draftSize}
          setDraftSize={setDraftSize}
          draftPersonality={draftPersonality}
          setDraftPersonality={setDraftPersonality}
          onApply={applyFilters}
          onClear={clearFilters}
        />
        {chatConfirmPet ? (
          <AdoptStartDialog
            petName={chatConfirmPet.name}
            rescuer={chatConfirmPet.rescuer}
            onClose={() => setChatConfirmId(null)}
            onConfirm={() => navigate(`/messages/${chatConfirmPet.id}`)}
          />
        ) : null}
        </>
      }
    >
      <div className="discover donor-chrome">
        <DonorChromeTop
          brand={
            <img
              className="discover-wordmark"
              src={`${A}dopmi-wordmark.png`}
              alt="DopMi"
              width={108}
              height={36}
            />
          }
        />

        <DiscoverSpeciesFilterBar
          species={species}
          onSpeciesChange={selectSpecies}
          filtersActive={filtersActive}
          onOpenFilters={openFilters}
        />

        {deckDone ? (
          <section className="discover-end">
            <div className="discover-end-cluster">
              <div className="discover-end-mosaic" aria-hidden="true">
                {mosaicEndPets.map((pet) => (
                  <div className="discover-end-polaroid" key={`${pet.id}-mosaic`}>
                    <img src={pet.image} alt="" />
                  </div>
                ))}
              </div>
              <article className="discover-end-card">
                <h2>Nuestra manada llegó hasta aquí por ahora</h2>
                <p className="discover-end-lead">Todos los días hay historias nuevas esperando a alguien como tú.</p>
                <button type="button" className="discover-end-primary" onClick={() => navigate("/messages")}>
                  Ir a mis <strong>favoritos</strong>
                </button>
                <button type="button" className="discover-end-secondary" onClick={() => setIndex(0)}>
                  Volver a <strong>descubrir</strong>
                </button>
              </article>
            </div>
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
                        <div className="discover-card-tags">
                          <span>{currentPet.sex}</span>
                          <span>{currentPet.size}</span>
                          {currentPet.personality[0] ? (
                            <span>
                              {PERSONALITY_LABEL_BY_SLUG[currentPet.personality[0]] ?? currentPet.personality[0]}
                            </span>
                          ) : null}
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

function PetDetailPhotoHero({
  photos,
  alt,
  children,
}: {
  photos: readonly string[];
  alt: string;
  children?: ReactNode;
}) {
  const gallery = photos.filter((src) => Boolean(src?.trim()));
  const items = gallery.length ? gallery : [""];
  const [photoIndex, setPhotoIndex] = useState(0);
  const activeIndex = Math.min(photoIndex, items.length - 1);
  const showCarousel = items.length > 1;

  return (
    <div className="pet-detail-hero">
      <img src={items[activeIndex]} alt={alt} />
      {children}
      {showCarousel ? (
        <div className="pet-detail-dots" role="tablist" aria-label="Fotos">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              className={index === activeIndex ? "is-active" : ""}
              aria-label={`Foto ${index + 1}`}
              aria-selected={index === activeIndex}
              onClick={() => setPhotoIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function adoptionPetGalleryPhotos(pet: (typeof adoptionPets)[number]) {
  const published =
    "photos" in pet && Array.isArray(pet.photos) ? pet.photos.filter((src) => Boolean(src?.trim())) : [];
  if (published.length > 1) return published;
  return [pet.image];
}

function AdoptionDetail() {
  const { petId = "toby" } = useParams();
  const navigate = useNavigate();
  const { savedPetIds, toggleSavedPet } = usePrototypeStore();
  const pet = adoptionPets.find((item) => item.id === petId) ?? adoptionPets[0];
  const galleryPhotos = adoptionPetGalleryPhotos(pet);
  const isSaved = savedPetIds.includes(pet.id);
  const [report, setReport] = useState(false);
  const [adoptConfirm, setAdoptConfirm] = useState(false);
  const [toast, setToast] = useState("");
  const stats = [
    { value: pet.sex, label: "Sexo" },
    { value: pet.size, label: "Tamaño" },
    { value: adoptionPublishedAgeLabel(pet.age) || "—", label: "Edad" },
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
              petName={pet.name}
              rescuer={pet.rescuer}
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
          <PetDetailPhotoHero photos={galleryPhotos} alt={pet.name}>
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
          </PetDetailPhotoHero>

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
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>

            <section className="pet-detail-story">
              <h2>Su historia</h2>
              <p>{pet.story}</p>
            </section>

            <PetDetailPersonalityBlock personality={pet.personality} />
          </div>

          <PetDetailCharacteristics
            health={{
              vaccinated: pet.health.vaccinated,
              sterilized: pet.health.sterilized,
              specialCare: Boolean(pet.health.specialCare),
            }}
            convivencia={pet.convivencia}
          />

          <button type="button" className="pet-detail-report pet-detail-report--footer" onClick={() => setReport(true)}>
            <Icon name="icon-alert-circle.svg" size={16} />
            Reportar publicación
          </button>
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
            Quiero saber más
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}

const DONATE_STORY_IMAGE_MS = 5200;
const DONATE_STORY_VIDEO_MS = 9000;

type DonateStorySlideKind = "hero" | "urgent-video" | "thank-you-video" | "evidence";

type DonateStorySlide = {
  caseId: string;
  kind: DonateStorySlideKind;
  mediaType: "image" | "video";
  src: string;
  needType?: Need["type"];
  needId?: string;
};

function isDonateNeedCompleted(need: Need) {
  const remaining = Math.max(0, need.requested - need.funded);
  return (
    remaining === 0 ||
    need.status === "funded" ||
    need.status === "completed" ||
    need.status === "evidence"
  );
}

function donateCaseNeedTypesOrdered(item: PetCase, openOnly = false) {
  const order: Need["type"][] = ["Veterinario", "Medicina", "Comida", "Otra"];
  const pool = openOnly ? item.needs.filter((need) => !isDonateNeedCompleted(need)) : item.needs;
  const types = new Set(pool.map((need) => need.type));
  return order.filter((type) => types.has(type));
}

function donateStoryNeedForType(item: PetCase, type: Need["type"]) {
  return sortNeedsByType(item.needs.filter((need) => need.type === type && !isDonateNeedCompleted(need)))[0];
}

function resolveDonateCaseStoryMedia(item: PetCase) {
  return (
    item.donateStoryMedia ?? {
      urgentVideoPoster: "/assets/guardian-urgent.jpg",
      thankYouVideoPoster: "/assets/guardian-luna.jpg",
      evidenceByType: {
        Veterinario: "/assets/guardian-reports.jpg",
        Medicina: "/assets/guardian-reports.jpg",
        Comida: "/assets/publish-sample-pet.jpg",
      },
    }
  );
}

function buildDonateCaseStorySlides(item: PetCase): DonateStorySlide[] {
  const media = resolveDonateCaseStoryMedia(item);
  const slides: DonateStorySlide[] = [
    { caseId: item.id, kind: "hero", mediaType: "image", src: item.image },
  ];
  const hasUrgentNeed = item.needs.some((need) => need.urgent && !isDonateNeedCompleted(need));
  if (hasUrgentNeed && media.urgentVideoPoster) {
    slides.push({
      caseId: item.id,
      kind: "urgent-video",
      mediaType: "video",
      src: media.urgentVideoPoster,
    });
  }
  if (media.thankYouVideoPoster) {
    slides.push({
      caseId: item.id,
      kind: "thank-you-video",
      mediaType: "video",
      src: media.thankYouVideoPoster,
    });
  }
  donateCaseNeedTypesOrdered(item, true).forEach((type) => {
    const evidenceSrc = media.evidenceByType[type];
    if (!evidenceSrc) return;
    const needForType = donateStoryNeedForType(item, type);
    if (!needForType) return;
    slides.push({
      caseId: item.id,
      kind: "evidence",
      mediaType: "image",
      src: evidenceSrc,
      needType: type,
      needId: needForType.id,
    });
  });
  return slides;
}

function DonateCaseStoriesViewer({
  caseIds,
  initialCaseId,
  onClose,
  onOpenDetail,
}: {
  caseIds: string[];
  initialCaseId: string;
  onClose: () => void;
  onOpenDetail: (caseId: string) => void;
}) {
  const { cases } = usePrototypeStore();
  const queue = useMemo(() => {
    const start = Math.max(0, caseIds.indexOf(initialCaseId));
    const ordered = start >= 0 ? caseIds.slice(start) : caseIds;
    return ordered
      .map((id) => cases.find((entry) => entry.id === id))
      .filter((entry): entry is PetCase => Boolean(entry));
  }, [caseIds, cases, initialCaseId]);

  const slidesByCase = useMemo(
    () => new Map(queue.map((item) => [item.id, buildDonateCaseStorySlides(item)])),
    [queue],
  );

  const [petIndex, setPetIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const touchActive = useRef(false);
  const detailOpenedRef = useRef(false);

  const currentPet = queue[petIndex];
  const currentSlides = currentPet ? slidesByCase.get(currentPet.id) ?? [] : [];
  const currentSlide = currentSlides[slideIndex];
  const isLastSlide = slideIndex >= currentSlides.length - 1;
  const isLastPet = petIndex >= queue.length - 1;

  const goNext = useCallback(() => {
    if (!currentPet) return;
    if (!isLastSlide) {
      setSlideIndex((value) => value + 1);
      setSegmentProgress(0);
      return;
    }
    if (!isLastPet) {
      setPetIndex((value) => value + 1);
      setSlideIndex(0);
      setSegmentProgress(0);
      return;
    }
    onClose();
  }, [currentPet, isLastPet, isLastSlide, onClose]);

  const goPrev = useCallback(() => {
    if (slideIndex > 0) {
      setSlideIndex((value) => value - 1);
      setSegmentProgress(0);
      return;
    }
    if (petIndex > 0) {
      const prevPet = queue[petIndex - 1];
      const prevSlides = prevPet ? slidesByCase.get(prevPet.id) ?? [] : [];
      setPetIndex((value) => value - 1);
      setSlideIndex(Math.max(0, prevSlides.length - 1));
      setSegmentProgress(0);
    }
  }, [petIndex, queue, slideIndex, slidesByCase]);

  const openDetail = useCallback(() => {
    if (!currentPet || detailOpenedRef.current) return;
    detailOpenedRef.current = true;
    onOpenDetail(currentPet.id);
  }, [currentPet, onOpenDetail]);

  useEffect(() => {
    detailOpenedRef.current = false;
  }, [petIndex, slideIndex]);

  useEffect(() => {
    if (!currentSlide || paused) return;
    const duration = currentSlide.mediaType === "video" ? DONATE_STORY_VIDEO_MS : DONATE_STORY_IMAGE_MS;
    const started = performance.now();
    setSegmentProgress(0);
    let finished = false;
    const tick = window.setInterval(() => {
      if (finished) return;
      const elapsed = performance.now() - started;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setSegmentProgress(pct);
      if (pct >= 100) {
        finished = true;
        goNext();
      }
    }, 40);
    return () => window.clearInterval(tick);
  }, [currentSlide, goNext, paused, petIndex, slideIndex]);

  if (!currentPet || !currentSlide) return null;

  const total = currentPet.needs.reduce((sum, need) => sum + need.requested, 0);
  const funded = currentPet.needs.reduce((sum, need) => sum + need.funded, 0);
  const missionPct = Math.min(100, Math.round((funded / Math.max(total, 1)) * 100));
  const supportTypes = donateCaseNeedTypesOrdered(currentPet, true);
  const isHeroStorySlide = currentSlide.kind === "hero";
  const isUrgentStorySlide = currentSlide.kind === "urgent-video";
  const isThankYouStorySlide = currentSlide.kind === "thank-you-video";
  const isEvidenceStorySlide = currentSlide.kind === "evidence";
  const storyFrameClass = [
    "donate-story-frame",
    isHeroStorySlide ? "donate-story-frame--hero" : "",
    isUrgentStorySlide ? "donate-story-frame--urgent" : "",
    !isHeroStorySlide && !isUrgentStorySlide ? "donate-story-frame--plain" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const evidenceNeed =
    isEvidenceStorySlide && currentSlide.needId
      ? currentPet.needs.find((need) => need.id === currentSlide.needId)
      : undefined;
  const evidencePct = evidenceNeed?.requested
    ? Math.min(100, Math.round((evidenceNeed.funded / evidenceNeed.requested) * 100))
    : 0;

  const handleVerticalSwipe = (deltaY: number) => {
    if (deltaY > 72) openDetail();
    if (deltaY < -72) onClose();
  };

  return (
    <div
      className="donate-story-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Historias de ${currentPet.name}`}
    >
      <div
        className="donate-story-shell"
        onTouchStart={(event) => {
          touchActive.current = true;
          touchStartY.current = event.touches[0]?.clientY ?? 0;
          touchStartX.current = event.touches[0]?.clientX ?? 0;
          setPaused(true);
        }}
        onTouchEnd={(event) => {
          if (!touchActive.current) return;
          const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
          const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
          const deltaY = touchStartY.current - endY;
          const deltaX = endX - touchStartX.current;
          if (Math.abs(deltaY) > Math.abs(deltaX)) handleVerticalSwipe(deltaY);
          touchActive.current = false;
          setPaused(false);
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") {
            touchStartY.current = event.clientY;
            touchActive.current = true;
            setPaused(true);
          }
        }}
        onPointerUp={(event) => {
          if (!touchActive.current || event.pointerType !== "mouse") return;
          handleVerticalSwipe(touchStartY.current - event.clientY);
          touchActive.current = false;
          setPaused(false);
        }}
      >
        <div className={storyFrameClass}>
          <div className="donate-story-segments" aria-hidden="true">
            {currentSlides.map((slide, index) => (
              <span key={`${slide.kind}-${slide.needType ?? index}`} className="donate-story-segment">
                <i
                  style={{
                    width:
                      index < slideIndex ? "100%" : index === slideIndex ? `${segmentProgress}%` : "0%",
                  }}
                />
              </span>
            ))}
          </div>
          <button type="button" className="donate-story-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
          <div className="donate-story-tap-zones" aria-hidden="true">
            <button type="button" className="donate-story-tap-prev" onClick={goPrev} aria-label="Anterior" />
            <button type="button" className="donate-story-tap-next" onClick={goNext} aria-label="Siguiente" />
          </div>
          <div className="donate-story-media">
            {currentSlide.mediaType === "video" ? (
              <div className="donate-story-video">
                <img src={currentSlide.src} alt="" />
              </div>
            ) : (
              <img src={currentSlide.src} alt={currentPet.name} />
            )}
            <div className="donate-story-shade" aria-hidden="true" />
            <div
              className={`donate-story-meta${isUrgentStorySlide ? " donate-story-meta--urgent" : ""}${isThankYouStorySlide ? " donate-story-meta--thank-you" : ""}${isEvidenceStorySlide ? " donate-story-meta--evidence" : ""}`}
            >
              {isThankYouStorySlide ? (
                <div className="donate-story-thankyou-copy">
                  <p>Da un pequeño gesto,</p>
                  <p>
                    haz una <strong>GRAN</strong> diferencia.
                  </p>
                </div>
              ) : isEvidenceStorySlide && evidenceNeed ? (
                <>
                  <p className="donate-story-evidence-title">
                    {evidenceNeed.title} para {currentPet.name}
                  </p>
                  <div
                    className="donate-story-progress"
                    role="progressbar"
                    aria-valuenow={evidencePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Avance de ${evidenceNeed.title}`}
                  >
                    <i style={{ width: `${evidencePct}%` }} />
                  </div>
                  <p className="donate-story-amounts">
                    ${evidenceNeed.funded.toLocaleString("es-MX")} de $
                    {evidenceNeed.requested.toLocaleString("es-MX")}
                  </p>
                </>
              ) : (
                <>
                  <h2>{currentPet.name}</h2>
                  {isUrgentStorySlide ? (
                    <p className="donate-story-urgent-row">
                      <Icon name="icon-alert-circle.svg" size={20} />
                      <span>Apoyo urgente</span>
                    </p>
                  ) : null}
                  {currentSlide.kind === "hero" ? (
                    <>
                      <button type="button" className="donate-story-story-link" onClick={openDetail}>
                        <span className="donate-story-need-icons" aria-label="Tipos de apoyo">
                          {supportTypes.map((type) => (
                            <span
                              key={type}
                              className={`need-symbol small ${needTypeSymbolClass(type)}`}
                              title={needTypeLabel(type)}
                              aria-hidden="true"
                            >
                              {needEmoji(type)}
                            </span>
                          ))}
                        </span>
                        <span>Conoce su historia</span>
                      </button>
                      <div
                        className="donate-story-progress"
                        role="progressbar"
                        aria-valuenow={missionPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Avance del apoyo"
                      >
                        <i style={{ width: `${missionPct}%` }} />
                      </div>
                      <p className="donate-story-amounts">
                        ${funded.toLocaleString("es-MX")} de ${total.toLocaleString("es-MX")}
                      </p>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
        <button type="button" className="donate-story-swipe-hint" onClick={openDetail}>
          <Icon name="icon-chevron-right.svg" size={18} className="donate-story-swipe-icon" />
          Desliza hacia arriba
        </button>
      </div>
    </div>
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

const guardianHeroPerks = [
  { icon: "icon-shield.svg", label: "Rescatistas y casos verificados" },
  { icon: "tab-impact.svg", label: "Sigue tu huella" },
  { icon: "check-circle.svg", label: "Cancela cuando quieras" },
] as const;

const guardianPromoTitle = "Sé un Guardián";

const guardianPromoSlides = [
  { id: "guardian-hero", image: "guardian-carousel-hero.jpg" },
  { id: "guardian-impact", image: "guardian-luna.jpg" },
  { id: "guardian-community", image: "guardian-milo.jpg" },
] as const;

function DonationHome() {
  const navigate = useNavigate();
  const { cases, emptyStates } = usePrototypeStore();
  const [storyCaseId, setStoryCaseId] = useState<string | null>(null);
  const guardianCarouselRef = useRef<HTMLDivElement>(null);
  const guardianCarouselDrag = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    captured: false,
    slideEl: null as HTMLElement | null,
  });
  const [guardianCarouselDragging, setGuardianCarouselDragging] = useState(false);

  const snapGuardianCarousel = () => {
    const carousel = guardianCarouselRef.current;
    if (!carousel) return;
    const slides = carousel.querySelectorAll<HTMLElement>("[data-guardian-slide]");
    if (!slides.length) return;
    const left = carousel.scrollLeft;
    let closest = 0;
    let minDist = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const dist = Math.abs(slide.offsetLeft - left);
      if (dist < minDist) {
        minDist = dist;
        closest = index;
      }
    });
    slides[closest]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  const onGuardianCarouselPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const carousel = guardianCarouselRef.current;
    if (!carousel) return;
    guardianCarouselDrag.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: carousel.scrollLeft,
      moved: false,
      captured: false,
      slideEl: (event.target as HTMLElement).closest(".donate-guardian-slide"),
    };
    setGuardianCarouselDragging(true);
  };

  const onGuardianCarouselPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const carousel = guardianCarouselRef.current;
    if (!guardianCarouselDrag.current.active || !carousel) return;
    const delta = event.clientX - guardianCarouselDrag.current.startX;
    if (Math.abs(delta) > 6) {
      guardianCarouselDrag.current.moved = true;
      if (!guardianCarouselDrag.current.captured) {
        guardianCarouselDrag.current.captured = true;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* captura no disponible */
        }
      }
    }
    if (!guardianCarouselDrag.current.moved) return;
    carousel.scrollLeft = guardianCarouselDrag.current.startScrollLeft - delta;
  };

  const finishGuardianCarouselDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!guardianCarouselDrag.current.active) return;
    const { moved, slideEl, captured } = guardianCarouselDrag.current;
    guardianCarouselDrag.current.active = false;
    guardianCarouselDrag.current.slideEl = null;
    setGuardianCarouselDragging(false);
    if (captured) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ya liberado */
      }
    }
    if (moved) {
      guardianCarouselDrag.current.moved = false;
      guardianCarouselDrag.current.captured = false;
      snapGuardianCarousel();
      return;
    }
    guardianCarouselDrag.current.moved = false;
    guardianCarouselDrag.current.captured = false;
    const endSlide = (event.target as HTMLElement).closest(".donate-guardian-slide");
    if (slideEl && endSlide === slideEl) navigate("/impact/support");
  };

  const openGuardianSupportFromSlide = () => {
    navigate("/impact/support");
  };

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
        <>
          {storyCaseId ? (
            <DonateCaseStoriesViewer
              key={storyCaseId}
              caseIds={caseItems.map(({ item }) => item.id)}
              initialCaseId={storyCaseId}
              onClose={() => setStoryCaseId(null)}
              onOpenDetail={(caseId) => {
                setStoryCaseId(null);
                navigate(`/case/${caseId}`);
              }}
            />
          ) : null}
          {!storyCaseId ? (
            <button
              type="button"
              className="donate-guardian-foot donate-guardian-foot--dock"
              onClick={() => navigate("/impact/support")}
            >
              <small>Desde $20 / mes</small>
              <span className="donate-guardian-cta">Suscríbete ahora</span>
            </button>
          ) : null}
        </>
      }
    >
      <div className="donate-home donor-chrome">
        <DonorChromeTop />
        <header className="match-top">
          <h1>Ayudar se siente bien</h1>
        </header>

        <section className="donate-discover">
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
                  onClick={() => setStoryCaseId(item.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="donate-guardian">
          <div className="donate-guardian-carousel-wrap">
            <div
              ref={guardianCarouselRef}
              className={`donate-guardian-carousel${guardianCarouselDragging ? " is-dragging" : ""}`}
              aria-label="Conoce Guardián"
              onPointerDown={onGuardianCarouselPointerDown}
              onPointerMove={onGuardianCarouselPointerMove}
              onPointerUp={finishGuardianCarouselDrag}
              onPointerCancel={finishGuardianCarouselDrag}
            >
            <div className="donate-guardian-track">
              {guardianPromoSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className="donate-guardian-slide"
                  data-guardian-slide={index}
                  aria-label="Elegir tu apoyo como Guardián"
                  onClick={openGuardianSupportFromSlide}
                >
                  <img className="donate-guardian-slide-photo" src={`${A}${slide.image}`} alt="" draggable={false} />
                  {slide.id !== "guardian-hero" ? (
                    <>
                      <div className="donate-guardian-slide-shade" aria-hidden="true" />
                      <div className="donate-guardian-slide-copy">
                        <strong>{guardianPromoTitle}</strong>
                        <ul>
                          {guardianHeroPerks.map((perk) => (
                            <li key={perk.label}>
                              <Icon name={perk.icon} size={14} />
                              {perk.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : null}
                </button>
              ))}
            </div>
            </div>
          </div>
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

const NEED_TYPE_DISPLAY_ORDER: Need["type"][] = ["Veterinario", "Medicina", "Comida", "Otra"];

function sortNeedsByType(needs: Need[]) {
  const rank = (type: Need["type"]) => {
    const index = NEED_TYPE_DISPLAY_ORDER.indexOf(type);
    return index === -1 ? NEED_TYPE_DISPLAY_ORDER.length : index;
  };
  return [...needs].sort((a, b) => rank(a.type) - rank(b.type));
}

function NeedCard({
  need,
  defaultOpen = false,
  onDonate,
  showDonateAction = true,
}: {
  need: Need;
  caseId?: string;
  defaultOpen?: boolean;
  onDonate: (needId: string) => void;
  showDonateAction?: boolean;
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
              <b>${need.funded.toLocaleString("es-MX")} recibidos</b>
              <span>${remaining.toLocaleString("es-MX")} faltantes</span>
            </span>
          </span>
          <span className="donate-need-chevron" aria-hidden="true">
            <Chevron />
          </span>
        </button>
        {showDonateAction ? (
          <button
            type="button"
            className="donate-need-action"
            disabled={fullyFunded}
            onClick={() => onDonate(need.id)}
            aria-label={fullyFunded ? "Necesidad completada" : `Donar a ${need.title}`}
          >
            <Icon name="tab-donate.svg" size={18} />
          </button>
        ) : null}
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
                {sortNeedsByType(item.needs).map((need) => (
                  <NeedCard
                    key={need.id}
                    need={need}
                    caseId={item.id}
                    defaultOpen={false}
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
      {
        name: "Luna",
        image: "impact-luna.png",
        type: "Fondo Guardián",
        amount: 200,
        author: "Ana García",
        time: "Hace 2 días",
        copy: "Luna recibió alimento gracias al fondo Guardián. ¡Ya está mucho más fuerte!",
      },
      {
        name: "Milo",
        image: "impact-milo.png",
        type: "Donación directa",
        amount: 500,
        author: "Carlos Ruiz",
        time: "Hace 5 días",
        copy: "Milo completó su tratamiento de vacunas. Tu donación directa ayudó a proteger su salud.",
      },
      {
        name: "Max",
        image: "impact-max.png",
        type: "Fondo Guardián",
        amount: 150,
        author: "María López",
        time: "Hace 1 semana",
        copy: "Max recibió atención veterinaria de emergencia con apoyo del fondo Guardián.",
      },
      {
        name: "Bella",
        image: "impact-bella.png",
        type: "Fondo Guardián",
        amount: 100,
        author: "Ana García",
        time: "Hace 2 semanas",
        copy: "Bella avanzó hacia su adopción con apoyo asignado desde el fondo comunitario.",
      },
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

const guardianSupportBubbleLayout = [
  { src: "luna-card.png", top: "6%", left: "8%", size: 78, delay: 0 },
  { src: "rocky.png", top: "4%", left: "38%", size: 64, delay: 40 },
  { src: "milo-card.png", top: "12%", left: "62%", size: 86, delay: 80 },
  { src: "toby.png", top: "22%", left: "18%", size: 92, delay: 30 },
  { src: "guardian-urgent.jpg", top: "18%", left: "48%", size: 70, delay: 120 },
  { src: "publish-sample-pet.jpg", top: "28%", left: "72%", size: 58, delay: 160 },
  { src: "luna-detail.png", top: "34%", left: "4%", size: 68, delay: 90 },
  { src: "guardian-luna.jpg", top: "38%", left: "32%", size: 80, delay: 140 },
  { src: "guardian-milo.jpg", top: "42%", left: "56%", size: 74, delay: 200 },
  { src: "impact-luna.png", top: "48%", left: "78%", size: 62, delay: 60 },
  { src: "rocky.png", top: "52%", left: "14%", size: 56, delay: 180 },
  { src: "milo-card.png", top: "56%", left: "44%", size: 88, delay: 220 },
  { src: "luna-card.png", top: "58%", left: "68%", size: 52, delay: 100 },
  { src: "toby.png", top: "8%", left: "82%", size: 48, delay: 260 },
] as const;

const GUARDIAN_BUBBLE_ORIGIN = { x: 50, y: 94 };
const GUARDIAN_BUBBLE_STAGE = { width: 375, height: 320 };

/** Comisión estimada del procesador (prototipo): 3.6% + $3 MXN. */
function estimatePaymentProcessorFee(subtotal: number) {
  if (subtotal <= 0) return 0;
  return Math.round((subtotal * 0.036 + 3) * 100) / 100;
}

function formatGuardianMoney(value: number) {
  const cents = Math.round(value * 100) % 100;
  if (cents === 0) return `$${Math.round(value).toLocaleString("es-MX")}`;
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function guardianSupportBubbleEnter(left: string, top: string, size: number) {
  const leftN = Number.parseFloat(left);
  const topN = Number.parseFloat(top);
  const finalX = (leftN / 100) * GUARDIAN_BUBBLE_STAGE.width + size / 2;
  const finalY = (topN / 100) * GUARDIAN_BUBBLE_STAGE.height + size / 2;
  const startX = (GUARDIAN_BUBBLE_ORIGIN.x / 100) * GUARDIAN_BUBBLE_STAGE.width;
  const startY = (GUARDIAN_BUBBLE_ORIGIN.y / 100) * GUARDIAN_BUBBLE_STAGE.height;
  const enterX = startX - finalX;
  const enterY = startY - finalY;
  const dist = Math.hypot(enterX, enterY);
  return { enterX, enterY, dist };
}

function GuardianSupportBubbles({ burstKey }: { burstKey: number }) {
  return (
    <div className="guardian-support-bubbles" aria-hidden="true">
      {guardianSupportBubbleLayout.map((bubble, index) => {
        const motion = guardianSupportBubbleEnter(bubble.left, bubble.top, bubble.size);
        return (
        <span
          key={`${burstKey}-${index}`}
          className="guardian-support-bubble"
          style={{
            top: bubble.top,
            left: bubble.left,
            width: bubble.size,
            height: bubble.size,
            animationDelay: `${Math.round(motion.dist * 0.45 + index * 12)}ms`,
            ["--bubble-enter-x" as string]: `${motion.enterX}px`,
            ["--bubble-enter-y" as string]: `${motion.enterY}px`,
          }}
        >
          <img src={`${A}${bubble.src}`} alt="" />
        </span>
        );
      })}
    </div>
  );
}

const GUARDIAN_SUPPORT_MIN_MXN = 20;

function ImpactSupport() {
  const navigate = useNavigate();
  const { paymentOutcome, setGuardian } = usePrototypeStore();
  const presets = [100, 200, 350] as const;
  const [amount, setAmount] = useState(200);
  const [custom, setCustom] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState("");
  const [coverFees, setCoverFees] = useState(true);
  const [bubbleBurstKey, setBubbleBurstKey] = useState(1);

  const selectPreset = (value: number) => {
    setAmount(value);
    setCustom(false);
    setCustomAmountInput("");
    setBubbleBurstKey((key) => key + 1);
  };

  const openCustomAmount = () => {
    setCustomAmountInput(String(amount));
    setCustom(true);
  };

  const parsedSupport = custom ? Number.parseFloat(customAmountInput) : amount;
  const supportValid = Number.isFinite(parsedSupport) && parsedSupport >= GUARDIAN_SUPPORT_MIN_MXN;
  const monthlySupport = supportValid ? parsedSupport : amount;
  const feeBase = Number.isFinite(parsedSupport) && parsedSupport > 0 ? parsedSupport : monthlySupport;
  const transactionFee = estimatePaymentProcessorFee(feeBase);
  const displaySupport = custom && Number.isFinite(parsedSupport) ? parsedSupport : amount;
  const displayTotal =
    (Number.isFinite(displaySupport) ? displaySupport : 0) +
    (coverFees ? estimatePaymentProcessorFee(Number.isFinite(displaySupport) ? Math.max(0, displaySupport) : 0) : 0);
  const showCustomMinError =
    custom &&
    customAmountInput.trim() !== "" &&
    (!Number.isFinite(parsedSupport) || parsedSupport < GUARDIAN_SUPPORT_MIN_MXN);

  const confirm = () => {
    if (!supportValid) return;
    const safeAmount = parsedSupport;
    if (paymentOutcome === "error") {
      navigate(`/impact/error?amount=${safeAmount}`);
      return;
    }
    setGuardian(true, safeAmount);
    navigate(`/impact/success?amount=${safeAmount}&method=card`);
  };

  return (
    <div className="plain-screen guardian-support-screen">
      <TopBar back="/donate" />
      <GuardianSupportBubbles burstKey={bubbleBurstKey} />
      <div className="guardian-support-panel">
        <header className="guardian-support-head">
          <h1>Elige tu apoyo</h1>
          <p className="guardian-support-lead">Tu aporte mensual ayuda a casos publicados por rescatistas.</p>
        </header>

        <div className="guardian-support-stack">
          <div className="amount-grid guardian-support-amounts" role="group" aria-label="Monto mensual">
            {presets.map((value) => (
              <button
                key={value}
                type="button"
                className={!custom && amount === value ? "selected" : ""}
                aria-pressed={!custom && amount === value}
                onClick={() => selectPreset(value)}
              >
                <strong>${value}</strong>
                <small>MXN / mes</small>
              </button>
            ))}
          </div>

          {custom ? (
            <div className="guardian-support-custom">
              <label className={`amount-input guardian-support-custom-input${showCustomMinError ? " is-invalid" : ""}`}>
                <span>$</span>
                <input
                  type="number"
                  min={GUARDIAN_SUPPORT_MIN_MXN}
                  step={10}
                  inputMode="decimal"
                  autoFocus
                  value={customAmountInput}
                  onChange={(event) => setCustomAmountInput(event.target.value)}
                  aria-invalid={showCustomMinError}
                  aria-describedby={showCustomMinError ? "guardian-support-min-error" : undefined}
                />
                <span>MXN / mes</span>
              </label>
              {showCustomMinError ? (
                <p id="guardian-support-min-error" className="guardian-support-custom-error" role="alert">
                  No puede ser menor a ${GUARDIAN_SUPPORT_MIN_MXN}.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="guardian-support-alt">
              ¿Prefieres otro monto?{" "}
              <button type="button" className="inline-link guardian-support-inline" onClick={openCustomAmount}>
                Elige desde $20
              </button>
            </p>
          )}

          <div className="guardian-support-fee">
            <span id="guardian-support-fee-label" className="guardian-support-alt">
              Suma {formatGuardianMoney(transactionFee)} para apoyar al rescatista a cubrir los costos de transacción.
            </span>
            <button
              type="button"
              className={`switch ${coverFees ? "on" : ""}`}
              role="switch"
              aria-checked={coverFees}
              aria-labelledby="guardian-support-fee-label"
              onClick={() => setCoverFees((value) => !value)}
            >
              <i />
            </button>
          </div>
        </div>

        <div className="guardian-support-meta">
          <p className="guardian-support-billing">
            <Icon name="icon-clock.svg" size={14} />
            Cargo mensual recurrente. Puedes ajustar o cancelar tu apoyo en cualquier momento.
          </p>
          <button type="button" className="inline-link guardian-support-footlink" onClick={() => navigate("/transparency")}>
            ¿Cómo se reparte tu aporte?
          </button>
        </div>
      </div>

      <div className="guardian-support-dock">
        <button
          type="button"
          className="primary-button guardian-support-cta"
          onClick={confirm}
          disabled={!supportValid}
        >
          Ser Guardián por {formatGuardianMoney(displayTotal)} al mes
        </button>
        <p className="guardian-support-dock-note">Serás redirigido para completar la transacción.</p>
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

const RESCUER_CHAT_ADOPTERS: Record<string, string> = {
  luna: "Ana P.",
  rocky: "Carlos M.",
  milo: "Lucía G.",
};

type RescuerAdoptionChatThread = {
  petId: string;
  adopter: string;
  adopterInitial: string;
  preview: string;
  time: string;
  unread: number;
  archived?: boolean;
};

const RESCUER_ADOPTION_CHAT_THREADS: RescuerAdoptionChatThread[] = [
  {
    petId: "luna",
    adopter: "Ana P.",
    adopterInitial: "A",
    preview: adoptionChatIntroText({ name: "Luna", sex: "Hembra" }),
    time: "5m",
    unread: 1,
  },
  {
    petId: "luna",
    adopter: "Sofía L.",
    adopterInitial: "S",
    preview: "¿Sigue disponible para visitas?",
    time: "2d",
    unread: 0,
    archived: true,
  },
  {
    petId: "rocky",
    adopter: "Carlos M.",
    adopterInitial: "C",
    preview: "¿Puedo visitarlo este fin de semana?",
    time: "1h",
    unread: 0,
  },
];

function sortRescuerChatsByUnread<T extends { unread: number; adopter: string }>(chats: T[]) {
  return [...chats].sort((a, b) => {
    if (b.unread !== a.unread) return b.unread - a.unread;
    return a.adopter.localeCompare(b.adopter, "es");
  });
}

function rescuerAdopterName(threadId: string, adopterHint?: string) {
  if (adopterHint) {
    const exact = RESCUER_ADOPTION_CHAT_THREADS.find(
      (thread) => thread.petId === threadId && thread.adopter === adopterHint,
    );
    if (exact) return exact.adopter;
  }
  const first = RESCUER_ADOPTION_CHAT_THREADS.find((thread) => thread.petId === threadId);
  return first?.adopter ?? RESCUER_CHAT_ADOPTERS[threadId];
}

function resolveRescuerCaseId(threadId: string, petName: string | undefined, cases: PetCase[]) {
  const byId = cases.find((item) => item.id === threadId);
  if (byId) return byId.id;
  if (petName) {
    const byName = cases.find((item) => item.name === petName);
    if (byName) return byName.id;
  }
  return threadId;
}

function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { threadId = "luna" } = useParams();
  const { messages, sendMessage, startAdoptionChat, accountMode, setAccountMode, cases } = usePrototypeStore();
  const [text, setText] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const rescuerChatRoute = location.pathname.startsWith("/rescuer/messages/");
  const isRescuerView = rescuerChatRoute || accountMode === "rescuer";
  const adopterHint = (location.state as { adopter?: string } | null)?.adopter;
  const adoptionPet = adoptionPets.find((item) => item.id === threadId);
  const casePet = cases.find((item) => item.id === threadId);
  const pet = adoptionPet ?? (casePet ? { id: casePet.id, name: casePet.name, image: casePet.image, rescuer: casePet.rescuer } : undefined);
  const chatTitle = pet?.name ?? (threadId === "luna" ? "Luna" : "Chat");
  const chatSubtitle = isRescuerView
    ? rescuerAdopterName(threadId, adopterHint)
    : adoptionPet?.rescuer;
  const rescuerCaseId = resolveRescuerCaseId(threadId, pet?.name, cases);
  const threadMessages = messages.filter((message) => (message.threadId ?? "luna") === threadId);
  const chatMode: AccountMode = isRescuerView ? "rescuer" : "donor";

  useEffect(() => {
    if (rescuerChatRoute) setAccountMode("rescuer");
  }, [rescuerChatRoute, setAccountMode]);

  useEffect(() => {
    if (isRescuerView || !adoptionPet) return;
    startAdoptionChat({
      id: adoptionPet.id,
      name: adoptionPet.name,
      image: adoptionPet.image,
      sex: adoptionPet.sex,
    });
  }, [isRescuerView, adoptionPet?.id, adoptionPet?.name, adoptionPet?.image, adoptionPet?.sex, startAdoptionChat]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    sendMessage(chatMode, text.trim(), threadId);
    setText("");
  };

  const attachPhoto = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        sendMessage(chatMode, "", threadId, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`plain-screen chat-screen ${isRescuerView ? "rescuer-chat rescuer-theme" : "adopter-chat"}`}>
      <TopBar
        title={chatTitle}
        subtitle={chatSubtitle}
        back={isRescuerView ? "/rescuer/messages" : "/messages"}
        actions={
          pet && !isRescuerView ? (
            <button
              type="button"
              className="online-label chat-detail-link"
              onClick={() => navigate(`/adoption/${pet.id}`)}
            >
              Ver detalle
            </button>
          ) : pet || casePet ? (
            <button
              type="button"
              className="online-label chat-detail-link"
              onClick={() => navigate(`/rescuer/cases/${rescuerCaseId}`)}
            >
              Ver detalle
            </button>
          ) : null
        }
      />
      <div className="chat-messages">
        {threadMessages.map((message) => (
          <div key={message.id} className={`bubble ${message.author === chatMode ? "mine" : ""}${message.image ? " has-media" : ""}`}>
            {message.image ? (
              <img className="bubble-photo" src={message.image} alt={pet?.name ?? "Mascota"} />
            ) : null}
            {message.text ? <p>{message.text}</p> : null}
            <span>{message.time}</span>
          </div>
        ))}
      </div>
      <form className="chat-compose chat-compose--with-attach" onSubmit={submit}>
        <input
          ref={photoInputRef}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            attachPhoto(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Escribe un mensaje..." />
        <button
          type="button"
          className="chat-compose-attach"
          onClick={() => photoInputRef.current?.click()}
          aria-label="Adjuntar foto"
        >
          <Icon name="icon-paperclip.svg" size={22} />
        </button>
        <button type="submit" disabled={!text.trim()} aria-label="Enviar">
          <AssetIcon name="send.svg" />
        </button>
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

  const chatConfirmPet = chatConfirmId ? adoptionPets.find((item) => item.id === chatConfirmId) : undefined;

  return (
    <ScreenShell
      className="match-shell"
      overlay={
        chatConfirmPet ? (
          <AdoptStartDialog
            petName={chatConfirmPet.name}
            rescuer={chatConfirmPet.rescuer}
            onClose={() => setChatConfirmId(null)}
            onConfirm={() => navigate(`/messages/${chatConfirmPet.id}`)}
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

function notificationChipKind(item: { kind: NotificationKind; title: string; body: string }) {
  if (/guardián/i.test(`${item.title} ${item.body}`)) return "pet";
  return item.kind ?? "case";
}

function isGuardianNotification(item: { title: string; body: string }) {
  return /guardián/i.test(`${item.title} ${item.body}`);
}

function isPaymentNotification(item: { kind: NotificationKind; title: string; body: string }) {
  return item.kind === "donation" || isGuardianNotification(item);
}

function resolveNotificationTone(item: {
  kind: NotificationKind;
  title: string;
  body: string;
  tone?: NotificationTone;
}): NotificationTone | null {
  if (!isPaymentNotification(item)) return null;
  if (item.tone) return item.tone;
  const text = `${item.title} ${item.body}`.toLowerCase();
  if (/no pudimos|fall|cancelad|problema con/.test(text)) return "negative";
  if (/próximo|proceso|actualiz|reporte|en revisión/.test(text)) return "pending";
  if (/exitosamente|recibida|ya eres|gracias|cobramos|enviada/.test(text)) return "positive";
  return "pending";
}

function NotificationVisual({
  item,
  chipKind,
}: {
  item: {
    kind: NotificationKind;
    title: string;
    body: string;
    thumb?: string;
    thumbStyle?: "photo" | "brand";
    tone?: NotificationTone;
  };
  chipKind: NotificationKind;
}) {
  if (item.thumbStyle === "brand") {
    return (
      <span className="notif-thumb notif-thumb--brand" aria-hidden="true">
        <img className="discover-logo" src={`${A}logo-paw.svg`} alt="" width={40} height={40} />
      </span>
    );
  }
  if (item.thumb && item.thumbStyle === "photo") {
    return (
      <span className="notif-thumb notif-thumb--photo" aria-hidden="true">
        <img src={item.thumb} alt="" />
      </span>
    );
  }
  const tone = resolveNotificationTone(item);
  const toneClass = tone ? `tone-${tone}` : "";
  const guardian = isGuardianNotification(item);
  const chipIcon =
    chipKind === "donation" ? (
      <Icon name="tab-donate.svg" size={20} />
    ) : chipKind === "pet" && guardian ? (
      <Icon name="notif-pet.svg" size={20} />
    ) : (
      <AssetIcon name={notificationIcons[chipKind]} size={20} />
    );
  return <span className={`notif-chip ${chipKind} ${toneClass}`.trim()}>{chipIcon}</span>;
}

function NotificationList() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, accountMode } = usePrototypeStore();
  return (
    <div className={`plain-screen${accountMode === "rescuer" ? " rescuer-theme" : ""}`}>
      <TopBar title="Notificaciones" back={accountMode === "rescuer" ? "/rescuer/messages" : "/profile"} />
      <div className="content-pad notification-stack">
        {notifications.map((item) => {
          const chipKind = notificationChipKind(item);
          return (
          <button
            key={item.id}
            className={`notification-card ${item.read ? "" : "unread"}`}
            onClick={() => {
              markNotificationRead(item.id);
              navigate(item.target);
            }}
          >
            <NotificationVisual item={item} chipKind={chipKind} />
            <span className="notif-body">
              <span className="notif-head">
                <strong>{item.title}</strong>
                <time>{item.time}</time>
              </span>
              <p>{item.body}</p>
            </span>
          </button>
          );
        })}
      </div>
    </div>
  );
}

const stripePaymentStatusLabel = {
  pagado: "Pagado",
  cancelado: "Cancelado",
  enproceso: "En proceso",
  fallado: "Fallado",
} as const;

function resolvePaymentLogPetImage(petName: string, caseId: string | null, cases: PetCase[]) {
  if (caseId) {
    const match = cases.find((item) => item.id === caseId);
    if (match?.image) return match.image;
  }
  const byName = cases.find((item) => item.name === petName);
  if (byName?.image) return byName.image;
  const adoption = adoptionPets.find((pet) => pet.name === petName);
  if (adoption?.image) return adoption.image;
  return `${A}publish-sample-pet.jpg`;
}

function formatPaymentLogDate(date: string) {
  const trimmed = date.trim();
  if (/\b20\d{2}\b/.test(trimmed)) return trimmed;
  return `${trimmed} 2026`;
}

function parsePaymentLogAmount(raw: string | number) {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return { dollars: 0, cents: 0 };
    const totalCents = Math.round(raw * 100);
    return { dollars: Math.trunc(totalCents / 100), cents: Math.abs(totalCents % 100) };
  }
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed)) return { dollars: 0, cents: 0 };
  const totalCents = Math.round(parsed * 100);
  return { dollars: Math.trunc(totalCents / 100), cents: Math.abs(totalCents % 100) };
}

function formatPaymentLogAmountLabel(dollars: number, cents: number, showPlus = true) {
  const whole = dollars.toLocaleString("en-US");
  const prefix = showPlus ? "+" : "";
  return cents > 0 ? `${prefix}$${whole}.${String(cents).padStart(2, "0")}` : `${prefix}$${whole}`;
}

function PaymentLogAmount({
  value,
  tone,
  showPlus = true,
}: {
  value: string | number;
  tone: "is-positive" | "is-negative";
  showPlus?: boolean;
}) {
  const { dollars, cents } = parsePaymentLogAmount(value);
  const whole = dollars.toLocaleString("en-US");
  return (
    <span
      className={`payment-log-amount ${tone}`}
      aria-label={formatPaymentLogAmountLabel(dollars, cents, showPlus)}
    >
      {showPlus ? "+" : null}${whole}
      {cents > 0 ? (
        <span className="payment-log-amount-cents" aria-hidden="true">
          .{String(cents).padStart(2, "0")}
        </span>
      ) : null}
    </span>
  );
}

function PaymentLogCard({
  headline,
  date,
  method,
  status,
  amount,
  petImage,
}: {
  headline: string;
  date: string;
  method: string;
  status: keyof typeof stripePaymentStatusLabel;
  amount: string | number;
  petImage: string;
}) {
  const isNegativeStatus = status === "cancelado" || status === "fallado";
  const amountTone = isNegativeStatus ? "is-negative" : "is-positive";
  return (
    <li className="payment-log-card">
      <article className="payment-log-card-body profile-activity-row--static">
        <span className="payment-log-thumb" aria-hidden="true">
          <img src={petImage} alt="" />
        </span>
        <div className="payment-log-copy">
          <strong className="payment-log-title">{headline}</strong>
          <span className="payment-log-date">{formatPaymentLogDate(date)}</span>
          <span className="payment-log-method-row">
            <span className="payment-log-method">{method}</span>
            {isNegativeStatus ? (
              <span className={`log-pill payment-log-status-pill ${status}`}>
                {stripePaymentStatusLabel[status]}
              </span>
            ) : null}
          </span>
        </div>
        <PaymentLogAmount value={amount} tone={amountTone} showPlus={!isNegativeStatus} />
      </article>
    </li>
  );
}

function RescuerReceivedPaymentHistory() {
  const { emptyStates } = usePrototypeStore();
  const rows = emptyStates ? [] : rescuerReceivedPaymentHistory;

  return (
    <div className="plain-screen rescuer-theme">
      <TopBar title="Mi historial" back="/rescuer/profile" />
      <div className="content-pad log-section">
        <p className="log-section-intro">
          Consulta el historial de pagos que has recibido por tus casos de apoyo.
        </p>
        <p className="log-section-intro">Sigue así, personas como tú son especiales para la manada.</p>
        {rows.length ? (
          <ul className="profile-activity-list profile-activity-list--received-log" aria-label="Historial de pagos recibidos">
            {rows.map((row) => (
              <li key={row.id}>
                <div className="profile-activity-row profile-activity-row--received profile-activity-row--static">
                  <span className="profile-activity-date">{row.date}</span>
                  <span className="profile-activity-body">
                    <strong>{row.petName}</strong>
                    <span className="profile-activity-support-type">{row.supportType}</span>
                    <small>{row.donorLabel}</small>
                  </span>
                  <span className="profile-activity-amount">
                    <PaymentLogAmount
                      value={row.amount}
                      tone={
                        row.status === "cancelado" || row.status === "fallado"
                          ? "is-negative"
                          : "is-positive"
                      }
                    />
                    <i className={`log-pill ${row.status}`}>{stripePaymentStatusLabel[row.status]}</i>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="profile-activity-empty">
            <p>Aún no has recibido pagos por tus casos de apoyo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function History() {
  const { accountMode, emptyStates, cases } = usePrototypeStore();
  if (accountMode === "rescuer") {
    return <RescuerReceivedPaymentHistory />;
  }
  const donationRows = useDonationLogRows();
  const guardianRows = emptyStates
    ? []
    : guardianPaymentHistory.map((row) => ({
        id: row.id,
        date: row.date,
        kind: "guardian" as const,
        method: row.method,
        amount: row.amount,
        status: row.status,
        assignedPetName: row.assignedPetName,
        assignedCaseId: row.assignedCaseId,
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
  const rows = [...guardianRows, ...caseRows];

  return (
    <div className="plain-screen">
      <TopBar title="Mi historial" back="/profile" />
      <div className="content-pad log-section">
        <p className="log-section-intro">
          Consulta todos los <span className="log-section-intro-accent">+Apoyos</span> que recibió la manada{" "}
          <strong>gracias a ti.</strong>
        </p>
        {rows.length ? (
          <ul className="profile-activity-list profile-activity-list--payment-log" aria-label="Historial de pagos">
            {rows.map((row) => {
              const headline =
                row.kind === "donacion"
                  ? `${row.concept} - ${row.title}`
                  : guardianSubscriptionHeadline(row.assignedPetName);
              const petImage =
                row.kind === "donacion"
                  ? resolvePaymentLogPetImage(row.title, row.caseId, cases)
                  : resolvePaymentLogPetImage(row.assignedPetName, row.assignedCaseId, cases);
              return (
                <PaymentLogCard
                  key={`${row.kind}-${row.id}`}
                  headline={headline}
                  date={row.date}
                  method={row.method}
                  status={row.status}
                  amount={row.amount}
                  petImage={petImage}
                />
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

function SupportCause({ shellMode = "donor" }: { shellMode?: AccountMode }) {
  const [species, setSpecies] = useState<DiscoverSpeciesChoice>("Perro");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftAge, setDraftAge] = useState<PetAgeBand | null>(null);
  const [ageFilter, setAgeFilter] = useState<PetAgeBand | null>(null);
  const [draftSize, setDraftSize] = useState<PetSize | null>(null);
  const [sizeFilter, setSizeFilter] = useState<PetSize | null>(null);
  const [draftPersonality, setDraftPersonality] = useState<PetPersonality[]>([]);
  const [personalityFilter, setPersonalityFilter] = useState<PetPersonality[]>([]);
  const [kiloSort, setKiloSort] = useState<"asc" | "desc">("asc");
  const filtersActive = Boolean(ageFilter || sizeFilter || personalityFilter.length > 0);

  const openFilters = () => {
    setDraftAge(ageFilter);
    setDraftSize(sizeFilter);
    setDraftPersonality(personalityFilter);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setAgeFilter(draftAge);
    setSizeFilter(draftSize);
    setPersonalityFilter(draftPersonality);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftAge(null);
    setDraftSize(null);
    setDraftPersonality([]);
    setAgeFilter(null);
    setSizeFilter(null);
    setPersonalityFilter([]);
    setFilterOpen(false);
  };

  const visibleKibble = useMemo(() => {
    const filtered = SUPPORT_CAUSE_KIBBLE.filter((item) => {
      if (item.species !== species) return false;
      if (ageFilter && item.age !== ageFilter) return false;
      if (sizeFilter && item.size !== sizeFilter) return false;
      if (personalityFilter.length && !personalityFilter.includes(item.marcaKey)) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      const diff = supportCauseKilosValue(a.kilos) - supportCauseKilosValue(b.kilos);
      return kiloSort === "asc" ? diff : -diff;
    });
  }, [species, ageFilter, sizeFilter, personalityFilter, kiloSort]);

  return (
    <ScreenShell mode={shellMode}>
      <div className="donate-home donor-chrome support-cause-screen">
        <DonorChromeTop />
        <header className="match-top">
          <h1>Tienda Dopmi</h1>
        </header>
        <AdoptionFilterModal
          variant="supportCause"
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          draftSex={null}
          setDraftSex={() => {}}
          draftAge={draftAge}
          setDraftAge={setDraftAge}
          draftSize={draftSize}
          setDraftSize={setDraftSize}
          draftPersonality={draftPersonality}
          setDraftPersonality={setDraftPersonality}
          onApply={applyFilters}
          onClear={clearFilters}
        />
        <div className="support-cause-body">
        <div className="publish-needs-note support-cause-intro-note">
          Busca las croquetas de tu preferencia y compra con nuestro enlace de referidos que te dará un{" "}
          <strong>5% de descuento.</strong> Al seleccionar una, te llevará a la tienda correspondiente, donde podrás
          pagar. ¡Gracias por tu apoyo!
        </div>
        <DiscoverSpeciesFilterBar
          species={species}
          onSpeciesChange={setSpecies}
          filtersActive={filtersActive}
          onOpenFilters={openFilters}
        />
        <button
          type="button"
          className="match-sort-btn"
          onClick={() => setKiloSort((value) => (value === "asc" ? "desc" : "asc"))}
          aria-label={
            kiloSort === "asc" ? "Ordenar de mayor a menor kg" : "Ordenar de menor a mayor kg"
          }
        >
          Ordenar
          <small>{kiloSort === "asc" ? "Menor a mayor kg" : "Mayor a menor kg"}</small>
        </button>
        {visibleKibble.length ? (
          <div className="support-cause-grid">
            {visibleKibble.map((item) => (
              <article key={item.id} className="support-cause-card">
                <div className="support-cause-card-media" aria-hidden="true">
                  <span>🥣</span>
                </div>
                <div className="support-cause-card-body">
                  <strong className="support-cause-card-brand">{item.brand}</strong>
                  <div className="support-cause-card-meta">
                    <span className="support-cause-card-value">{item.kilos}</span>
                    <span
                      className={`support-cause-age-tag support-cause-age-tag--${item.age.toLowerCase()}`}
                    >
                      {item.age}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="support-cause-empty">
            No hay croquetas con estos filtros. Prueba otra combinación o limpia los filtros.
          </p>
        )}
        </div>
      </div>
    </ScreenShell>
  );
}

function CroquetasConCausaCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="profile-feature profile-feature--cause profile-feature--cause-banner" onClick={onClick}>
      <span className="profile-feature-banner-body">
        <span className="profile-feature-copy">
          <strong>Croquetas con causa</strong>
          <small>Compra en nuestra tienda y ayuda a la app para seguir apoyando a la manada.</small>
        </span>
        <span className="profile-feature-banner-cta">
          Ver más
          <Icon name="icon-chevron-right.svg" size={16} />
        </span>
      </span>
      <span className="profile-feature-banner-media" aria-hidden="true">
        <img src={`${A}croquetas-banner-pet.svg`} alt="" width={120} height={138} />
      </span>
    </button>
  );
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
            <span
              className={`profile-intro-avatar${donorProfile.avatar ? " has-photo" : ""}`}
              aria-hidden="true"
            >
              {donorProfile.avatar ? <img src={donorProfile.avatar} alt="" /> : initial}
            </span>
            <div className="profile-intro-copy">
              <strong>{fullName}</strong>
              <small>{city}</small>
            </div>
            <button
              type="button"
              className="profile-intro-edit"
              onClick={() => navigate("/settings/basic-info")}
              aria-label="Editar información básica"
            >
              <Icon name="icon-edit.svg" size={18} />
            </button>
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

        <CroquetasConCausaCard onClick={() => navigate("/apoya-causa")} />

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

  const requiredFilled =
    Boolean(form.firstName.trim()) && Boolean(form.lastName.trim()) && Boolean(form.email.trim());

  const save = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (!firstName || !lastName || !email) return;
    const city = form.city.trim() || "Monterrey, NL";
    updateDonorProfile({
      firstName,
      lastName,
      email,
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
          Nombre *
          <input
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
          />
        </label>
        <label>
          Apellido *
          <input
            required
            autoComplete="family-name"
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
          />
        </label>
        <label>
          Correo electrónico *
          <input
            type="email"
            required
            autoComplete="email"
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
        <button type="button" className="primary-button" disabled={!requiredFilled} onClick={save}>
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
  const navigate = useNavigate();
  const { guardianActive, guardianAmount, setGuardian, emptyStates, cases } = usePrototypeStore();
  const [dialog, setDialog] = useState<"none" | "amount" | "cancel">("none");
  const [choice, setChoice] = useState(guardianAmount);
  const [toast, setToast] = useState("");
  const [justChanged, setJustChanged] = useState(false);
  const paymentRows = emptyStates ? [] : guardianPaymentHistory;
  return (
    <div className="plain-screen">
      <TopBar title="Suscripción y pagos" back="/settings" />
      <div className="content-pad list-stack">
        <h2 className="settings-heading first">Suscripción Guardián</h2>
        {guardianActive ? (
          <article className="billing-card">
            <div className="billing-head">
              <span className="status-chip green">Suscripción activa</span>
              <span className="billing-star">
                <Icon name="icon-star.svg" size={18} />
              </span>
            </div>
            <strong className="billing-plan">
              Pequeño gesto, gran diferencia:
              <br />
              gracias por ser parte
            </strong>
            <p className="billing-amount">
              ${guardianAmount.toFixed(2)} <small>MXN / mes</small>
            </p>
            <div className="billing-meta">
              <span>Próximo cobro</span>
              <strong>3 julio 2026</strong>
            </div>
          </article>
        ) : (
          <article className="billing-card">
            <div className="billing-head">
              <strong>Desde $20 / mes</strong>
              <span className="status-chip">Sin Subscripción</span>
            </div>
            <button type="button" className="primary-button" onClick={() => navigate("/impact/support")}>
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
        {paymentRows.length ? (
          <ul className="profile-activity-list profile-activity-list--payment-log" aria-label="Historial de pagos">
            {paymentRows.map((row) => (
              <PaymentLogCard
                key={row.id}
                headline={guardianSubscriptionHeadline(row.assignedPetName)}
                date={row.date}
                method={row.method}
                status={row.status}
                amount={row.amount}
                petImage={resolvePaymentLogPetImage(row.assignedPetName, row.assignedCaseId, cases)}
              />
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

type RescuerHomeMessageActivityItem = {
  id: string;
  petId: string;
  adopter: string;
  petName: string;
  image?: string;
  preview: string;
  time: string;
  unread: number;
};

function buildRescuerHomeMessageActivity(
  cases: PetCase[],
  messages: { author?: string; text?: string; time?: string }[],
  emptyStates: boolean,
): RescuerHomeMessageActivityItem[] {
  if (emptyStates) return [];
  const last = messages[messages.length - 1];
  const petNameById = new Map(cases.map((item) => [item.id, item.name]));
  const petImageById = new Map(cases.map((item) => [item.id, item.image]));
  return sortRescuerChatsByUnread(
    RESCUER_ADOPTION_CHAT_THREADS.filter((thread) => !thread.archived).map((thread) => {
      const isLunaAna = thread.petId === "luna" && thread.adopter === "Ana P.";
      const unread = isLunaAna && last?.author === "donor" ? 1 : thread.unread;
      return {
        id: `${thread.petId}-${thread.adopter}`,
        petId: thread.petId,
        adopter: thread.adopter,
        petName: petNameById.get(thread.petId) ?? "Mascota",
        image: petImageById.get(thread.petId),
        preview: isLunaAna ? (last?.text ?? thread.preview) : thread.preview,
        time: isLunaAna ? (last?.time ?? thread.time) : thread.time,
        unread,
      };
    }),
  );
}

function buildSupportPaymentActivity(
  cases: PetCase[],
  events: RescuerSupportPaymentEvent[],
  emptyStates: boolean,
) {
  if (emptyStates) return [];
  const activeSupportIds = new Set(
    cases.filter((item) => !item.adoption && item.caseStatus === "active").map((item) => item.id),
  );
  return events
    .filter((event) => activeSupportIds.has(event.caseId))
    .sort((a, b) => b.receivedAt - a.receivedAt)
    .map((event) => {
      const caseItem = cases.find((item) => item.id === event.caseId);
      const petName = caseItem?.name ?? "Mascota";
      return {
        amount: event.amount,
        title: event.title,
        meta: `Para ${petName} · ${event.metaSuffix}`,
        image: caseItem?.image ?? "/assets/milo-card.png",
        petName,
      };
    });
}

function countUnseenRescuerHomePayments(
  cases: PetCase[],
  events: RescuerSupportPaymentEvent[],
  acknowledgedAt: number,
  emptyStates: boolean,
) {
  if (emptyStates) return 0;
  const activeSupportIds = new Set(
    cases.filter((item) => !item.adoption && item.caseStatus === "active").map((item) => item.id),
  );
  return events.filter(
    (event) => activeSupportIds.has(event.caseId) && event.receivedAt > acknowledgedAt,
  ).length;
}

const RESCUER_HOME_QUICK_ACTIONS: {
  id: string;
  label: string;
  icon: string;
  target: string;
  asset?: boolean;
}[] = [
  { id: "adoption", label: "Adopción", icon: "rtab-home.svg", target: "/rescuer/cases?program=adoption" },
  { id: "support", label: "Apoyo", icon: "tab-donate.svg", target: "/rescuer/cases?program=support" },
  { id: "messages", label: "Mensajes", icon: "icon-messages.svg", target: "/rescuer/messages" },
  { id: "payments", label: "Pagos", icon: "icon-billing.svg", target: "/settings/billing" },
];

type RescuerHomeActivityView = "none" | "payments" | "adoption" | "support" | "messages";

function buildRescuerHomeCaseSummary(cases: PetCase[], emptyStates: boolean, adoption: boolean) {
  const pool = emptyStates ? [] : cases.filter((item) => item.adoption === adoption);
  const countByStatus = (status: PetCase["caseStatus"]) =>
    pool.filter((item) => item.caseStatus === status).length;
  return [
    {
      id: "active",
      title: "Casos activos",
      meta: adoption ? "Buscando hogar" : "Recibiendo apoyo",
      count: countByStatus("active"),
    },
    {
      id: "review",
      title: "Casos en revisión",
      meta: "Pendiente de aprobación",
      count: countByStatus("review"),
    },
    {
      id: "draft",
      title: "Casos en borrador",
      meta: "Publicación incompleta",
      count: countByStatus("draft"),
    },
    {
      id: "rejected",
      title: "Casos rechazados",
      meta: "Requieren corrección",
      count: countByStatus("rejected"),
    },
  ];
}

const RESCUER_HOME_PENDING_STATUSES: PetCase["caseStatus"][] = ["draft", "review", "rejected"];

function rescuerCaseBelongsToProfile(caseRescuer: string, profileName: string) {
  const profileFirst = profileName.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const caseFirst = caseRescuer.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return profileFirst.length > 0 && caseFirst === profileFirst;
}

function rescuerHasSavedAccountData(
  verification: Verification,
  clabe: string,
  emptyStates: boolean,
) {
  if (emptyStates) return false;
  return verification === "verified" && /^\d{18}$/.test(clabe.trim());
}

const RESCUER_VERIFY_SOCIAL_GAP_LABEL = "Red social (Instagram o Facebook)";

const RESCUER_VERIFY_REQUIRED_FIELD_LABELS = [
  "Nombre",
  "Foto de perfil",
  "Correo electrónico",
  "Teléfono",
  RESCUER_VERIFY_SOCIAL_GAP_LABEL,
] as const;

function rescuerProfileVerificationGaps(profile: RescuerProfile, emptyStates: boolean) {
  if (emptyStates) {
    return [...RESCUER_VERIFY_REQUIRED_FIELD_LABELS];
  }
  const missing: string[] = [];
  if (!profile.name.trim()) missing.push("Nombre");
  if (!profile.avatar?.trim()) missing.push("Foto de perfil");
  if (!profile.email.trim()) missing.push("Correo electrónico");
  if (!profile.phone.trim() || !profile.phoneVerified) missing.push("Teléfono");
  const hasSocial = Boolean(profile.instagram.trim() || profile.facebook.trim());
  if (!hasSocial) missing.push(RESCUER_VERIFY_SOCIAL_GAP_LABEL);
  return missing;
}

function RescuerVerifyProfileDialog({
  mode,
  missingFields,
  onClose,
  onEditProfile,
  onSubmitRequest,
}: {
  mode: "ready" | "gaps";
  missingFields: string[];
  onClose: () => void;
  onEditProfile: () => void;
  onSubmitRequest: () => void;
}) {
  return (
    <div className="modal-backdrop center" onClick={onClose} role="presentation">
      <div
        className="dialog-card rescuer-verify-profile-dialog verify-intro"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rescuer-verify-profile-dialog-title"
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        {mode === "ready" ? (
          <>
            <span className="verify-chip large" aria-hidden="true">
              <Icon name="icon-shield.svg" size={28} />
            </span>
            <h2 id="rescuer-verify-profile-dialog-title">¿Enviar solicitud de verificación?</h2>
            <article className="intro-card">
              <Icon name="icon-shield.svg" size={18} />
              <div>
                <strong>Confirma tu identidad</strong>
                <p>
                  La verificación ayuda a DopMi a confirmar que eres quien dices ser, para que adoptantes y
                  donantes puedan confiar en tu perfil.
                </p>
              </div>
            </article>
            <h3>Refugios, fundaciones y centros</h3>
            <p className="dialog-copy">
              Si representas una fundación, refugio o centro de bienestar animal, la verificación es clave para
              mostrar que tu organización es real y responsable.
            </p>
            <button type="button" className="purple-button" onClick={onSubmitRequest}>
              Enviar solicitud
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Ahora no
            </button>
          </>
        ) : (
          <>
            <span className="verify-chip large" aria-hidden="true">
              <Icon name="icon-edit.svg" size={28} />
            </span>
            <h2 id="rescuer-verify-profile-dialog-title">Completa tu información</h2>
            <article className="intro-card">
              <Icon name="icon-user.svg" size={18} />
              <div>
                <strong>Revisa Información básica</strong>
                <p>
                  Necesitas nombre, foto, correo, teléfono y al menos una red social en Información básica. Sobre ti y
                  página web son opcionales.
                </p>
              </div>
            </article>
            <h3>Campos pendientes</h3>
            <ul className="check-list rescuer-verify-profile-gap-list">
              {missingFields.map((field) => (
                <li key={field}>
                  <Icon name="check-circle.svg" size={16} />
                  <div>
                    <strong>{field}</strong>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="purple-button" onClick={onEditProfile}>
              Ir a Información básica
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type RescuerAdoptionFunnelMetrics = {
  views: number;
  matches: number;
  messages: number;
  adoptions: number;
};

function rescuerActiveAdoptionCases(cases: PetCase[], rescuerProfileName: string) {
  return cases.filter(
    (item) =>
      item.adoption &&
      item.caseStatus === "active" &&
      rescuerCaseBelongsToProfile(item.rescuer, rescuerProfileName),
  );
}

function computeRescuerAdoptionFunnelMetrics(
  cases: PetCase[],
  rescuerProfileName: string,
  emptyStates: boolean,
): RescuerAdoptionFunnelMetrics {
  if (emptyStates) {
    return { views: 0, matches: 0, messages: 0, adoptions: 0 };
  }
  const active = rescuerActiveAdoptionCases(cases, rescuerProfileName);
  const activeIds = new Set(active.map((item) => item.id));
  const views = active.reduce((sum, item) => sum + (item.profileViews ?? 0), 0);
  const matches = active.reduce((sum, item) => sum + (item.matchSaves ?? 0), 0);
  const messagesFromCases = active.reduce((sum, item) => sum + (item.adoptionInquiries ?? 0), 0);
  const messagesFromThreads = new Set(
    RESCUER_ADOPTION_CHAT_THREADS.filter((thread) => activeIds.has(thread.petId)).map(
      (thread) => `${thread.petId}:${thread.adopter}`,
    ),
  ).size;
  const messages = messagesFromCases > 0 ? messagesFromCases : messagesFromThreads;
  const adoptions = cases.filter(
    (item) =>
      item.adoption &&
      item.caseStatus === "closed" &&
      rescuerCaseBelongsToProfile(item.rescuer, rescuerProfileName),
  ).length;
  return { views, matches, messages, adoptions };
}

const RESCUER_PUBLIC_OVERVIEW_ICONS: Record<
  "views" | "matches" | "messages" | "adoptions",
  string
> = {
  views: "rtab-home.svg",
  matches: "check-circle.svg",
  messages: "tab-donate.svg",
  adoptions: "icon-heart.svg",
};

const ADOPTION_FUNNEL_CARD_SPARK: Record<
  "views" | "matches" | "messages" | "adoptions",
  { area: string; line: string; fill: string; stroke: string }
> = {
  views: {
    area: "M0 26 L0 16 Q9 8 18 14 T36 10 L36 26 Z",
    line: "M0 18 Q9 10 18 14 T36 10",
    fill: "#c4b5fd",
    stroke: "#6d28d9",
  },
  matches: {
    area: "M0 26 L0 20 Q8 10 16 16 T32 12 L32 26 Z",
    line: "M0 20 Q8 12 16 16 T32 12",
    fill: "#fdba74",
    stroke: "#ea580c",
  },
  messages: {
    area: "M0 26 L0 14 Q10 6 20 12 T40 8 L40 26 Z",
    line: "M0 14 Q10 6 20 12 T40 8",
    fill: "#93c5fd",
    stroke: "#2563eb",
  },
  adoptions: {
    area: "M0 26 L0 18 Q7 10 14 14 T28 11 L28 26 Z",
    line: "M0 18 Q7 10 14 14 T28 11",
    fill: "#86efac",
    stroke: "#16a34a",
  },
};

type RescuerSupportFunnelMetrics = {
  donors: number;
  activeCases: number;
  completedCases: number;
  totalRaised: number;
};

function countSupportDonorsForCases(
  supportCaseIds: Set<string>,
  events: RescuerSupportPaymentEvent[],
): number {
  let total = 0;
  events.forEach((event) => {
    if (!supportCaseIds.has(event.caseId)) return;
    const batch = event.title.match(/Donaciones de (\d+) personas/);
    if (batch) {
      total += Number(batch[1]) || 0;
      return;
    }
    if (event.title.includes(" — ")) total += 1;
  });
  return total;
}

function computeRescuerSupportFunnelMetrics(
  cases: PetCase[],
  rescuerProfileName: string,
  emptyStates: boolean,
  paymentEvents: RescuerSupportPaymentEvent[],
): RescuerSupportFunnelMetrics {
  if (emptyStates) {
    return { donors: 0, activeCases: 0, completedCases: 0, totalRaised: 0 };
  }
  const supportCases = cases.filter(
    (item) =>
      !item.adoption &&
      item.caseStatus !== "draft" &&
      rescuerCaseBelongsToProfile(item.rescuer, rescuerProfileName),
  );
  const supportCaseIds = new Set(supportCases.map((item) => item.id));
  const activeCases = supportCases.filter((item) => item.caseStatus === "active").length;
  const completedCases = supportCases.filter((item) => {
    const goal = item.needs.reduce((sum, need) => sum + need.requested, 0);
    const received = item.needs.reduce((sum, need) => sum + need.funded, 0);
    return goal > 0 && received >= goal;
  }).length;
  const totalRaised = supportCases.reduce(
    (sum, item) => sum + item.needs.reduce((inner, need) => inner + need.funded, 0),
    0,
  );
  const donors = countSupportDonorsForCases(supportCaseIds, paymentEvents);
  return { donors, activeCases, completedCases, totalRaised };
}

const SUPPORT_FUNNEL_CARD_SPARK: Record<
  "donors" | "active" | "completed" | "raised",
  { area: string; line: string; fill: string; stroke: string }
> = {
  donors: {
    area: "M0 26 L0 16 Q9 8 18 14 T36 10 L36 26 Z",
    line: "M0 18 Q9 10 18 14 T36 10",
    fill: "#c4b5fd",
    stroke: "#6d28d9",
  },
  active: {
    area: "M0 26 L0 20 Q8 10 16 16 T32 12 L32 26 Z",
    line: "M0 20 Q8 12 16 16 T32 12",
    fill: "#fdba74",
    stroke: "#ea580c",
  },
  completed: {
    area: "M0 26 L0 14 Q10 6 20 12 T40 8 L40 26 Z",
    line: "M0 14 Q10 6 20 12 T40 8",
    fill: "#93c5fd",
    stroke: "#2563eb",
  },
  raised: {
    area: "M0 26 L0 18 Q7 10 14 14 T28 11 L28 26 Z",
    line: "M0 18 Q7 10 14 14 T28 11",
    fill: "#86efac",
    stroke: "#16a34a",
  },
};

function RescuerSupportFunnel({ metrics }: { metrics: RescuerSupportFunnelMetrics }) {
  const steps = [
    {
      id: "donors" as const,
      value: metrics.donors,
      label: "Donantes",
      hint: "Personas donaron a tus mascotas",
      format: "number" as const,
    },
    {
      id: "active" as const,
      value: metrics.activeCases,
      label: "Activos",
      hint: "Casos recibiendo apoyo",
      format: "number" as const,
    },
    {
      id: "completed" as const,
      value: metrics.completedCases,
      label: "Completados",
      hint: "Casos que lograron la meta",
      format: "number" as const,
    },
    {
      id: "raised" as const,
      value: metrics.totalRaised,
      label: "Recaudado",
      hint: "Total en tus casos de apoyo",
      format: "currency" as const,
    },
  ];

  return (
    <div className="rh-adoption-funnel rh-support-funnel" aria-label="Resumen de apoyo">
      {steps.map((step) => {
        const spark = SUPPORT_FUNNEL_CARD_SPARK[step.id];
        const displayValue =
          step.format === "currency"
            ? `$${step.value.toLocaleString("es-MX")}`
            : step.value.toLocaleString("es-MX");
        return (
          <article
            key={step.id}
            className={`rh-adoption-funnel-card rh-adoption-funnel-card--${step.id}`}
            aria-label={`${step.label}: ${displayValue}. ${step.hint}`}
          >
            <p className="rh-adoption-funnel-value">{displayValue}</p>
            <svg className="rh-adoption-funnel-card-spark" viewBox="0 0 40 28" aria-hidden="true">
              <path d={spark.area} fill={spark.fill} opacity={0.55} />
              <path
                d={spark.line}
                fill="none"
                stroke={spark.stroke}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
            <div className="rh-adoption-funnel-card-copy">
              <p className="rh-adoption-funnel-label">{step.label}</p>
              <p className="rh-adoption-funnel-hint">{step.hint}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function RescuerAdoptionFunnel({ metrics }: { metrics: RescuerAdoptionFunnelMetrics }) {
  const steps = [
    {
      id: "views" as const,
      value: metrics.views,
      label: "Vistas",
      hint: "Personas vieron tus mascotas",
    },
    {
      id: "matches" as const,
      value: metrics.matches,
      label: "Favoritos",
      hint: "Guardaron tus mascotas",
    },
    {
      id: "messages" as const,
      value: metrics.messages,
      label: "Mensajes",
      hint: "Escribieron por adopción",
    },
    {
      id: "adoptions" as const,
      value: metrics.adoptions,
      label: "Adopciones",
      hint: "Mascotas adoptadas",
    },
  ];

  return (
    <div className="rh-adoption-funnel" aria-label="Embudo de adopción">
      {steps.map((step) => {
        const spark = ADOPTION_FUNNEL_CARD_SPARK[step.id];
        return (
          <article
            key={step.id}
            className={`rh-adoption-funnel-card rh-adoption-funnel-card--${step.id}`}
            aria-label={`${step.label}: ${step.value.toLocaleString("es-MX")}. ${step.hint}`}
          >
            <p className="rh-adoption-funnel-value">{step.value.toLocaleString("es-MX")}</p>
            <svg className="rh-adoption-funnel-card-spark" viewBox="0 0 40 28" aria-hidden="true">
              <path d={spark.area} fill={spark.fill} opacity={0.55} />
              <path
                d={spark.line}
                fill="none"
                stroke={spark.stroke}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
            <div className="rh-adoption-funnel-card-copy">
              <p className="rh-adoption-funnel-label">{step.label}</p>
              <p className="rh-adoption-funnel-hint">{step.hint}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function rescuerAdoptionUnreadMessages(messages: { author?: string }[], emptyStates: boolean) {
  if (emptyStates) return 0;
  const last = messages[messages.length - 1];
  return RESCUER_ADOPTION_CHAT_THREADS.filter((thread) => !thread.archived).reduce((sum, thread) => {
    const isLunaAna = thread.petId === "luna" && thread.adopter === "Ana P.";
    const unread = isLunaAna && last?.author === "donor" ? 1 : thread.unread;
    return sum + unread;
  }, 0);
}

function rescuerHomeQuickActionCounts(
  cases: PetCase[],
  emptyStates: boolean,
  messages: { author?: string }[],
  paymentEvents: RescuerSupportPaymentEvent[],
  paymentsAcknowledgedAt: number,
) {
  if (emptyStates) {
    return { adoption: 0, support: 0, messages: 0, payments: 0 };
  }
  const adoption = cases.filter(
    (item) => item.adoption && RESCUER_HOME_PENDING_STATUSES.includes(item.caseStatus),
  ).length;
  const support = cases.filter(
    (item) => !item.adoption && RESCUER_HOME_PENDING_STATUSES.includes(item.caseStatus),
  ).length;
  const messagesCount = rescuerAdoptionUnreadMessages(messages, emptyStates);
  const payments = countUnseenRescuerHomePayments(
    cases,
    paymentEvents,
    paymentsAcknowledgedAt,
    emptyStates,
  );
  return { adoption, support, messages: messagesCount, payments };
}

function rescuerVerificationStatusMeta(verification: Verification) {
  if (verification === "verified") {
    return { icon: "icon-verified-purple.svg", label: "Rescatista verificado" };
  }
  return { icon: "verify-shield-purple.svg", label: "Completar mi perfil" };
}

const RESCUER_PHOTO_TIPS = [
  {
    title: "Luz natural",
    body: "Fotografía cerca de una ventana o al aire libre. Evita contraluz y flash directo que tapen los ojos.",
  },
  {
    title: "Rostro y cuerpo visibles",
    body: "Incluye al menos una foto donde se vea bien la cara y otra con el cuerpo completo.",
  },
  {
    title: "Fondo simple",
    body: "Busca un lugar ordenado. Un fondo limpio ayuda a que la mascota sea el foco.",
  },
  {
    title: "Varios ángulos",
    body: "Sube 2 o 3 fotos distintas: de frente, de perfil y una mostrando su personalidad.",
  },
  {
    title: "Sin filtros fuertes",
    body: "Usa colores reales y buena nitidez. Así los adoptantes saben qué esperar al conocerla.",
  },
] as const;

type PendingPeriodFilter = "yesterday" | "week" | "month";

const PENDING_PERIOD_SCALE: Record<PendingPeriodFilter, number> = {
  yesterday: 0.14,
  week: 0.62,
  month: 1,
};

function scalePendingMetricValue(value: number, period: PendingPeriodFilter) {
  const scale = PENDING_PERIOD_SCALE[period];
  if (value <= 0) return 0;
  return Math.max(1, Math.round(value * scale));
}

function scaleAdoptionFunnelByPeriod(
  metrics: RescuerAdoptionFunnelMetrics,
  period: PendingPeriodFilter,
): RescuerAdoptionFunnelMetrics {
  return {
    views: scalePendingMetricValue(metrics.views, period),
    matches: scalePendingMetricValue(metrics.matches, period),
    messages: scalePendingMetricValue(metrics.messages, period),
    adoptions: scalePendingMetricValue(metrics.adoptions, period),
  };
}

function scaleSupportFunnelByPeriod(
  metrics: RescuerSupportFunnelMetrics,
  period: PendingPeriodFilter,
): RescuerSupportFunnelMetrics {
  return {
    donors: scalePendingMetricValue(metrics.donors, period),
    activeCases: metrics.activeCases,
    completedCases: metrics.completedCases,
    totalRaised: scalePendingMetricValue(metrics.totalRaised, period),
  };
}

function RescuerPendingFilterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16.5" cy="7" r="2.25" fill="currentColor" />
      <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7.5" cy="17" r="2.25" fill="currentColor" />
    </svg>
  );
}

function RhPendingFilterDialog({
  open,
  period,
  onPeriodChange,
  onClose,
}: {
  open: boolean;
  period: PendingPeriodFilter;
  onPeriodChange: (value: PendingPeriodFilter) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const periodOptions: { id: PendingPeriodFilter; label: string }[] = [
    { id: "yesterday", label: "Ayer" },
    { id: "week", label: "Esta semana" },
    { id: "month", label: "Este mes" },
  ];

  return (
    <div className="modal-backdrop center" onClick={onClose} role="presentation">
      <div
        className="dialog-card rescuer-cases-filter-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rh-pending-filter-title"
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <header className="adoption-filter-header">
          <h2 id="rh-pending-filter-title">Filtrar</h2>
        </header>
        <section className="rescuer-cases-filter-dialog-section">
          <h3>Período</h3>
          <div
            className="filter-options rescuer-cases-filter-options"
            role="radiogroup"
            aria-label="Período de pendientes"
          >
            {periodOptions.map((option) => (
              <label key={option.id} className="filter-check">
                <input
                  type="radio"
                  name="pending-period-filter"
                  checked={period === option.id}
                  onChange={() => onPeriodChange(option.id)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>
        <button type="button" className="purple-button" onClick={onClose}>
          Listo
        </button>
      </div>
    </div>
  );
}

function RescuerPhotoTipsDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop center" onClick={onClose} role="presentation">
      <div
        className="dialog-card rescuer-photo-tips-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rescuer-photo-tips-title"
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 id="rescuer-photo-tips-title">Tips para mejores fotos</h2>
        <p className="rescuer-photo-tips-intro">
          Sigue estas recomendaciones para que tus casos destaquen en Adoptar y reciban más vistas.
        </p>
        <ul className="rescuer-photo-tips-list">
          {RESCUER_PHOTO_TIPS.map((tip) => (
            <li key={tip.title}>
              <strong>{tip.title}</strong>
              <p>{tip.body}</p>
            </li>
          ))}
        </ul>
        <button type="button" className="primary-button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}

function RescuerHome() {
  const navigate = useNavigate();
  const {
    verification,
    emptyStates,
    rescuerProfile,
    cases,
    messages,
    rescuerSupportPaymentEvents,
    rescuerHomePaymentsAcknowledgedAt,
    acknowledgeRescuerHomePayments,
  } = usePrototypeStore();
  const verified = verification === "verified";
  const verificationStatus = rescuerVerificationStatusMeta(verification);
  const showEmptyPending = useMemo(() => {
    const pool = emptyStates ? [] : cases;
    const published = pool.filter(
      (item) =>
        rescuerCaseBelongsToProfile(item.rescuer, rescuerProfile.name) &&
        item.caseStatus !== "draft",
    );
    const hasAdoptionPublished = published.some((item) => item.adoption);
    const hasSupportPublished = published.some((item) => !item.adoption);
    return !hasAdoptionPublished && !hasSupportPublished;
  }, [cases, emptyStates, rescuerProfile.name]);
  const hasActiveSupportCases = useMemo(() => {
    const pool = emptyStates ? [] : cases;
    return pool.some(
      (item) =>
        !item.adoption &&
        item.caseStatus === "active" &&
        rescuerCaseBelongsToProfile(item.rescuer, rescuerProfile.name),
    );
  }, [cases, emptyStates, rescuerProfile.name]);
  const hasActiveAdoptionCases = useMemo(() => {
    const pool = emptyStates ? [] : cases;
    return pool.some(
      (item) =>
        item.adoption &&
        item.caseStatus === "active" &&
        rescuerCaseBelongsToProfile(item.rescuer, rescuerProfile.name),
    );
  }, [cases, emptyStates, rescuerProfile.name]);
  const rescuerFirstName = rescuerProfile.name.trim().split(/\s+/)[0] || "María";
  const [pendingTab, setPendingTab] = useState<"adoption" | "support">("adoption");
  const [homeActivityView, setHomeActivityView] = useState<RescuerHomeActivityView>("none");
  const [photoTipsOpen, setPhotoTipsOpen] = useState(false);
  const [pendingFilterOpen, setPendingFilterOpen] = useState(false);
  const [pendingPeriodFilter, setPendingPeriodFilter] = useState<PendingPeriodFilter>("month");
  const homeCaseSummary = useMemo(
    () => ({
      adoption: buildRescuerHomeCaseSummary(cases, emptyStates, true),
      support: buildRescuerHomeCaseSummary(cases, emptyStates, false),
    }),
    [cases, emptyStates],
  );
  const homeSupportPaymentActivity = useMemo(
    () => buildSupportPaymentActivity(cases, rescuerSupportPaymentEvents, emptyStates),
    [cases, rescuerSupportPaymentEvents, emptyStates],
  );
  const homeMessageActivity = useMemo(
    () => buildRescuerHomeMessageActivity(cases, messages, emptyStates),
    [cases, messages, emptyStates],
  );
  const homeCaseSummaryActive = homeActivityView === "support" || homeActivityView === "adoption";
  const homeQuickActionCounts = useMemo(
    () =>
      rescuerHomeQuickActionCounts(
        cases,
        emptyStates,
        messages,
        rescuerSupportPaymentEvents,
        rescuerHomePaymentsAcknowledgedAt,
      ),
    [cases, emptyStates, messages, rescuerSupportPaymentEvents, rescuerHomePaymentsAcknowledgedAt],
  );

  const handleHomeQuickAction = (actionId: string, target: string) => {
    if (actionId === "adoption") {
      setHomeActivityView("adoption");
      return;
    }
    if (actionId === "support") {
      setHomeActivityView("support");
      return;
    }
    if (actionId === "payments") {
      setHomeActivityView("payments");
      acknowledgeRescuerHomePayments();
      return;
    }
    if (actionId === "messages") {
      setHomeActivityView("messages");
      return;
    }
    navigate(target);
  };
  const adoptionFunnelMetricsBase = useMemo(
    () => computeRescuerAdoptionFunnelMetrics(cases, rescuerProfile.name, emptyStates),
    [cases, emptyStates, rescuerProfile.name],
  );
  const adoptionFunnelMetrics = useMemo(
    () => scaleAdoptionFunnelByPeriod(adoptionFunnelMetricsBase, pendingPeriodFilter),
    [adoptionFunnelMetricsBase, pendingPeriodFilter],
  );
  const supportFunnelMetricsBase = useMemo(
    () =>
      computeRescuerSupportFunnelMetrics(
        cases,
        rescuerProfile.name,
        emptyStates,
        rescuerSupportPaymentEvents,
      ),
    [cases, emptyStates, rescuerProfile.name, rescuerSupportPaymentEvents],
  );
  const supportFunnelMetrics = useMemo(
    () => scaleSupportFunnelByPeriod(supportFunnelMetricsBase, pendingPeriodFilter),
    [supportFunnelMetricsBase, pendingPeriodFilter],
  );
  const pendingFiltersActive = pendingPeriodFilter !== "month";

  return (
    <ScreenShell mode="rescuer">
      <div className="rescuer-home-network donor-chrome">
        <DonorChromeTop
          brand={
            <img
              className="discover-wordmark"
              src={`${A}dopmi-wordmark.png`}
              alt="DopMi"
              width={108}
              height={36}
            />
          }
        />
        <div className="rh-home-greeting">
          <header className="match-top">
            <h1>Hola, {rescuerFirstName}</h1>
          </header>
          {verification === "verified" ? (
            <p className="pet-detail-verified rh-home-verification-status is-verified" role="status">
              <AssetIcon name={verificationStatus.icon} size={16} alt="" />
              {verificationStatus.label}
            </p>
          ) : (
            <button
              type="button"
              className="pet-detail-verified rh-home-verification-status rh-home-verification-status--action"
              onClick={() => navigate("/rescuer/profile/edit")}
            >
              <AssetIcon name={verificationStatus.icon} size={16} alt="" />
              {verificationStatus.label}
            </button>
          )}
        </div>

        <div className="rescuer-home">

        <section className="rh-section rh-section-pending">
          {!showEmptyPending ? (
            <div className="rh-pending-tabs-row">
              <div className="rh-pending-tabs" role="tablist" aria-label="Filtrar pendientes por programa">
                {(
                  [
                    { id: "adoption" as const, label: "En adopción" },
                    { id: "support" as const, label: "Recibiendo apoyo" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={pendingTab === tab.id}
                    className={`rh-pending-tab${pendingTab === tab.id ? " is-active" : ""}`}
                    onClick={() => setPendingTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`rescuer-cases-filter-btn rescuer-cases-filter-btn--icon-only${pendingFiltersActive ? " is-active" : ""}`}
                onClick={() => setPendingFilterOpen(true)}
                aria-label="Filtrar pendientes"
              >
                <RescuerPendingFilterIcon />
              </button>
            </div>
          ) : null}
          {showEmptyPending ? (
            <article className="rh-empty-card">
              <span className="rh-empty-icon">
                <AssetIcon name="empty-pending-heart.svg" size={32} />
              </span>
              <h3>¿Empezamos?</h3>
              <p>Aún no tienes casos de adopción o de apoyo publicados.</p>
              <button type="button" className="purple-button" onClick={() => navigate("/rescuer/publish")}>
                <AssetIcon name="empty-publish-plus.svg" size={16} />
                Publicar caso
              </button>
            </article>
          ) : pendingTab === "adoption" ? (
            !hasActiveAdoptionCases ? (
              <article className="rh-empty-card">
                <span className="rh-empty-icon">
                  <AssetIcon name="empty-pending-heart.svg" size={32} />
                </span>
                <h3>¿Empezamos?</h3>
                <p>Aún no tienes casos publicados.</p>
                <button type="button" className="purple-button" onClick={() => navigate("/rescuer/publish")}>
                  <AssetIcon name="empty-publish-plus.svg" size={16} />
                  Publicar caso
                </button>
              </article>
            ) : (
              <RescuerAdoptionFunnel metrics={adoptionFunnelMetrics} />
            )
          ) : !hasActiveSupportCases ? (
            <article className="rh-empty-card">
              <span className="rh-empty-icon">
                <AssetIcon name="empty-pending-heart.svg" size={32} />
              </span>
              <h3>¿Empezamos?</h3>
              <p>Aún no tienes casos publicados.</p>
              <button type="button" className="purple-button" onClick={() => navigate("/rescuer/publish")}>
                <AssetIcon name="empty-publish-plus.svg" size={16} />
                Publicar caso
              </button>
            </article>
          ) : (
            <RescuerSupportFunnel metrics={supportFunnelMetrics} />
          )}
        </section>

        <section className="profile-access rh-home-quick-access" aria-label="Mis pendientes">
          <h2>Mis pendientes</h2>
          <div className="profile-access-grid profile-access-grid--four">
            {RESCUER_HOME_QUICK_ACTIONS.map((action) => {
              const pendingCount = homeQuickActionCounts[action.id as keyof typeof homeQuickActionCounts] ?? 0;
              const pendingLabel =
                pendingCount > 9 ? "9+" : pendingCount > 0 ? String(pendingCount) : null;
              return (
                <button
                  type="button"
                  key={action.id}
                  className={`profile-access-item${action.id === "adoption" && homeActivityView === "adoption" ? " is-selected" : ""}${action.id === "support" && homeActivityView === "support" ? " is-selected" : ""}${action.id === "messages" && homeActivityView === "messages" ? " is-selected" : ""}${action.id === "payments" && homeActivityView === "payments" ? " is-selected" : ""}`}
                  onClick={() => handleHomeQuickAction(action.id, action.target)}
                  aria-label={`${action.label}${pendingCount > 0 ? `, ${pendingCount} pendientes` : ""}`}
                >
                  <span className="profile-access-icon" aria-hidden="true">
                    {action.asset ? <AssetIcon name={action.icon} size={22} /> : <Icon name={action.icon} size={22} />}
                    {pendingLabel ? <span className="notification-dot">{pendingLabel}</span> : null}
                  </span>
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {homeActivityView !== "none" ? (
          <section className="rh-section rh-section-activity">
            <div className="rh-section-head">
              <h2>
                {homeActivityView === "adoption"
                  ? "Resumen de adopción"
                  : homeActivityView === "support"
                    ? "Resumen de apoyo"
                    : homeActivityView === "messages"
                      ? "Mensajes recientes"
                      : "Actividad reciente"}
              </h2>
              <button type="button" className="rh-section-see-all" onClick={() => navigate("/rescuer/profile")}>
                Ver todo
              </button>
            </div>
            <div className="rh-activity-sheet">
              <div className="rh-activity-list">
                {homeActivityView === "messages"
                  ? homeMessageActivity.map((item) => (
                      <button
                        type="button"
                        className="rh-activity rh-activity-row-btn"
                        key={item.id}
                        onClick={() =>
                          navigate(`/rescuer/messages/${item.petId}`, { state: { adopter: item.adopter } })
                        }
                      >
                        <span className="rh-activity-icon rh-activity-icon-photo">
                          {item.image ? (
                            <img src={item.image} alt="" />
                          ) : (
                            <Icon name="icon-messages.svg" size={20} />
                          )}
                        </span>
                        <div className="rh-activity-copy">
                          <strong>{item.petName} · {item.adopter}</strong>
                          <small>{item.preview}</small>
                        </div>
                        {item.unread > 0 ? (
                          <span className="rh-activity-amount rh-activity-count">{item.unread}</span>
                        ) : (
                          <span className="rh-activity-meta-time">{item.time}</span>
                        )}
                      </button>
                    ))
                  : homeCaseSummaryActive
                  ? (homeActivityView === "support"
                      ? homeCaseSummary.support
                      : homeCaseSummary.adoption
                    ).map((item) => (
                      <button
                        type="button"
                        className="rh-activity rh-activity-row-btn"
                        key={item.id}
                        onClick={() =>
                          navigate(
                            homeActivityView === "support"
                              ? "/rescuer/cases?program=support"
                              : "/rescuer/cases?program=adoption",
                          )
                        }
                      >
                        <span className={`rh-activity-icon is-status-${item.id}`}>
                          <Icon name="rtab-cases.svg" size={20} />
                        </span>
                        <div className="rh-activity-copy">
                          <strong>{item.title}</strong>
                          <small>{item.meta}</small>
                        </div>
                        <span className="rh-activity-amount rh-activity-count">{item.count}</span>
                      </button>
                    ))
                  : homeSupportPaymentActivity.map((item) => (
                      <article className="rh-activity" key={`${item.amount}-${item.meta}`}>
                        <span className="rh-activity-icon rh-activity-icon-photo">
                          <img src={item.image} alt={item.petName} />
                        </span>
                        <div className="rh-activity-copy">
                          <strong>{item.title}</strong>
                          <small>{item.meta}</small>
                        </div>
                        <span className="rh-activity-amount">{item.amount}</span>
                      </article>
                    ))}
              </div>
            </div>
          </section>
        ) : null}

        <button type="button" className="profile-feature" onClick={() => setPhotoTipsOpen(true)}>
          <span className="profile-feature-copy">
            <strong>Tips para mejores fotos</strong>
            <small>Te damos recomendaciones para que tus casos tengan más visualizaciones</small>
          </span>
          <span className="profile-feature-cta" aria-hidden="true">
            <Icon name="icon-star.svg" size={22} />
          </span>
        </button>

        <CroquetasConCausaCard onClick={() => navigate("/rescuer/apoya-causa")} />
        </div>
      </div>
      {photoTipsOpen ? <RescuerPhotoTipsDialog onClose={() => setPhotoTipsOpen(false)} /> : null}
      {pendingFilterOpen ? (
        <RhPendingFilterDialog
          open={pendingFilterOpen}
          period={pendingPeriodFilter}
          onPeriodChange={setPendingPeriodFilter}
          onClose={() => setPendingFilterOpen(false)}
        />
      ) : null}
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

function FinishSupportCaseArchiveDialog({ item, onClose }: { item: PetCase; onClose: () => void }) {
  const { updateCaseStatus } = usePrototypeStore();
  const dismissedRef = useRef(false);

  const dismissAndArchive = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    updateCaseStatus(item.id, "closed");
    onClose();
  };

  useEffect(() => {
    const timer = window.setTimeout(dismissAndArchive, 2800);
    return () => window.clearTimeout(timer);
  }, [item.id, onClose, updateCaseStatus]);

  return (
    <div className="modal-backdrop center" onClick={dismissAndArchive}>
      <div
        className="dialog-card rescuer-case-finish-archive-pop"
        onClick={(event) => event.stopPropagation()}
        role="status"
        aria-live="polite"
      >
        <div className="rescuer-case-finish-archive-pop-icon" aria-hidden="true">
          <Icon name="icon-inbox-archive.svg" size={44} />
        </div>
        <h2>Caso finalizado</h2>
        <p>Este caso se enviará al archivo</p>
      </div>
    </div>
  );
}

function CloseSupportCaseDialog({
  item,
  onClose,
  onArchived,
}: {
  item: PetCase;
  onClose: () => void;
  onArchived?: () => void;
}) {
  const { updateCaseStatus } = usePrototypeStore();
  const [confirmed, setConfirmed] = useState(false);
  const { goal, received } = rescuerCaseFundingTotals(item);
  const remaining = Math.max(0, goal - received);

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div className="dialog-card rescuer-cases-filter-dialog" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2>¿Deseas cerrar el caso?</h2>
        <label className="check-row rescuer-close-support-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>
            Confirmo que quiero cerrar el caso y acepto que ya no recibiré ni reclamaré el apoyo faltante de $
            {remaining.toLocaleString("es-MX")}.
          </span>
        </label>
        <button
          type="button"
          className="danger-button"
          disabled={!confirmed}
          onClick={() => {
            updateCaseStatus(item.id, "closed");
            onArchived?.();
            onClose();
          }}
        >
          Confirmar cierre
        </button>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function CloseCaseDialog({
  item,
  onClose,
  onArchived,
}: {
  item: PetCase;
  onClose: () => void;
  onArchived?: () => void;
}) {
  const navigate = useNavigate();
  const { updateCaseStatus } = usePrototypeStore();
  const [closeReason, setCloseReason] = useState<"adoptada" | "otro">("adoptada");
  const [dopmiSupport, setDopmiSupport] = useState<"si" | "no">("si");
  const [otherReasonDescription, setOtherReasonDescription] = useState("");

  const confirmClose = () => {
    updateCaseStatus(item.id, "closed", {
      closeReason,
      adoptedWithDopmiSupport: closeReason === "adoptada" ? dopmiSupport === "si" : undefined,
      closeReasonDescription:
        closeReason === "otro" ? otherReasonDescription.trim() || undefined : undefined,
    });
    onArchived?.();
    onClose();
    navigate("/rescuer/cases");
  };

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div className="dialog-card close-case-dialog" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2>Cerrar caso</h2>
        <p>Esta acción archiva el caso.</p>
        <label className="dialog-field">
          Motivo
          <select
            value={closeReason}
            onChange={(event) => {
              const next = event.target.value as "adoptada" | "otro";
              setCloseReason(next);
              if (next === "adoptada") {
                setOtherReasonDescription("");
                setDopmiSupport("si");
              }
            }}
          >
            <option value="adoptada">Ya fue adoptad@</option>
            <option value="otro">Otro motivo</option>
          </select>
        </label>
        {closeReason === "adoptada" ? (
          <div className="dialog-field">
            ¿Se adoptó con apoyo de DopMi?
            <div
              className="filter-gender close-case-dopmi-filter"
              role="group"
              aria-label="¿Se adoptó con apoyo de DopMi?"
            >
              <button
                type="button"
                className={`filter-gender-btn${dopmiSupport === "si" ? " is-active" : ""}`}
                aria-pressed={dopmiSupport === "si"}
                onClick={() => setDopmiSupport("si")}
              >
                Sí
              </button>
              <button
                type="button"
                className={`filter-gender-btn${dopmiSupport === "no" ? " is-active" : ""}`}
                aria-pressed={dopmiSupport === "no"}
                onClick={() => setDopmiSupport("no")}
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <label className="dialog-field">
            Describe el motivo
            <textarea
              rows={3}
              value={otherReasonDescription}
              onChange={(event) => setOtherReasonDescription(event.target.value)}
              placeholder="Opcional"
            />
          </label>
        )}
        <button type="button" className="danger-button" onClick={confirmClose}>
          Confirmar cierre
        </button>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
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
    if (item.caseStatus === "active") updateCaseStatus(item.id, "review");
    onClose();
  };

  if (closing) {
    return <CloseCaseDialog item={item} onClose={() => setClosing(false)} />;
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

type RescuerCaseFilter = "adoption" | "support";

const RESCUER_CASE_FILTERS: { id: RescuerCaseFilter; label: string }[] = [
  { id: "adoption", label: "Adopción" },
  { id: "support", label: "Apoyo" },
];

type RescuerCaseStatusTagTone =
  | "active"
  | "adopted"
  | "finished"
  | "review"
  | "draft"
  | "rejected"
  | "closed";

function rescuerCaseStatusTag(item: PetCase): { label: string; tone: RescuerCaseStatusTagTone } {
  if (item.caseStatus === "closed" && item.adoption && item.closeReason === "adoptada") {
    return { label: "Adoptado", tone: "adopted" };
  }
  if (item.caseStatus === "closed") return { label: "Cerrado", tone: "closed" };
  return { label: caseStatusLabel[item.caseStatus], tone: item.caseStatus };
}

function rescuerCaseChatCount(caseId: string) {
  return RESCUER_ADOPTION_CHAT_THREADS.filter((thread) => thread.petId === caseId).length;
}

function rescuerCaseFundingTotals(item: PetCase) {
  const goal = item.needs.reduce((sum, need) => sum + need.requested, 0);
  const received = item.needs.reduce((sum, need) => sum + need.funded, 0);
  const pct = goal ? Math.min(100, Math.round((received / goal) * 100)) : 0;
  return { goal, received, pct };
}

function rescuerCaseSupportGoalReached(item: PetCase) {
  const { goal, received } = rescuerCaseFundingTotals(item);
  return goal > 0 && received >= goal;
}

/** Tarjeta de apoyo con barra, emojis y subtítulo de recaudación (activo o archivado). */
function rescuerCaseSupportRichCardUi(item: PetCase, programFilter: RescuerCaseFilter) {
  if (programFilter !== "support" || item.adoption) return false;
  return item.caseStatus === "active" || item.caseStatus === "closed";
}

function rescuerCaseNeedTypes(item: PetCase) {
  const order: Need["type"][] = ["Veterinario", "Medicina", "Comida", "Otra"];
  const types = new Set(item.needs.map((need) => need.type));
  return order.filter((type) => types.has(type));
}

function needTypeSymbolClass(type: Need["type"]) {
  if (type === "Comida") return "comida";
  if (type === "Medicina") return "medicina";
  if (type === "Veterinario") return "veterinario";
  return "otra";
}

function rescuerCaseSubtitle(item: PetCase, programFilter: RescuerCaseFilter) {
  if (rescuerCaseSupportRichCardUi(item, programFilter)) {
    const { received, goal } = rescuerCaseFundingTotals(item);
    return `Recolectado: $${received.toLocaleString("es-MX")} de $${goal.toLocaleString("es-MX")}`;
  }
  if (item.caseStatus === "active" || item.caseStatus === "closed") {
    const days = item.daysSinceApproval ?? 0;
    if (days === 1) return "1 día en DopMi";
    if (days > 0) return `${days} días en DopMi`;
    return "Recién publicado en DopMi";
  }
  if (item.caseStatus === "review") return "Pendiente de aprobación";
  if (item.caseStatus === "draft") return "Continúa tu publicación";
  if (item.caseStatus === "rejected") return "Requiere corrección";
  return caseStatusLabel[item.caseStatus];
}

function rescuerCaseProfileViews(item: PetCase) {
  return item.profileViews ?? 0;
}

function rescuerCaseShowSubtitle(item: PetCase) {
  return item.caseStatus !== "draft";
}

function rescuerCaseShowStats(item: PetCase, programFilter: RescuerCaseFilter) {
  if (rescuerCaseSupportRichCardUi(item, programFilter)) return false;
  return item.caseStatus === "active" || item.caseStatus === "closed";
}

function rescuerCaseShowSupportNeedTypes(item: PetCase, programFilter: RescuerCaseFilter) {
  return rescuerCaseSupportRichCardUi(item, programFilter) && rescuerCaseNeedTypes(item).length > 0;
}

function rescuerCaseShowSupportFundingBar(item: PetCase, programFilter: RescuerCaseFilter) {
  return rescuerCaseSupportRichCardUi(item, programFilter);
}

const RESCUER_CASE_STATUS_SORT_ORDER: Record<PetCase["caseStatus"], number> = {
  rejected: 0,
  draft: 1,
  review: 2,
  active: 3,
  closed: 4,
};

const RESCUER_CASE_LIST_STATUS_FILTERS: { id: PetCase["caseStatus"]; label: string }[] = [
  { id: "rejected", label: "Rechazado" },
  { id: "draft", label: "Borrador" },
  { id: "review", label: "En revisión" },
  { id: "active", label: "Activo" },
];

const RESCUER_CASE_LIST_STATUS_DEFAULT = RESCUER_CASE_LIST_STATUS_FILTERS.map((item) => item.id);

const RESCUER_ADOPTION_IN_PROGRESS_STATUSES: PetCase["caseStatus"][] = ["rejected", "draft", "review"];

function RescuerCaseCardItem({
  item,
  programFilter,
  onCloseCase,
  onDelete,
  onEdit,
  onArchiveCompleted,
}: {
  item: PetCase;
  programFilter: RescuerCaseFilter;
  onCloseCase: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: PetCase) => void;
  onArchiveCompleted: (id: string) => void;
}) {
  const openChats = rescuerCaseChatCount(item.id);
  const views = rescuerCaseProfileViews(item);
  const funding = rescuerCaseFundingTotals(item);
  const supportRichCard = rescuerCaseSupportRichCardUi(item, programFilter);
  const supportGoalReachedLook = supportRichCard && rescuerCaseSupportGoalReached(item);
  const supportClosedArchived =
    supportRichCard && item.caseStatus === "closed" && !rescuerCaseSupportGoalReached(item);
  const statusTag = supportGoalReachedLook
    ? { label: "Finalizado", tone: "finished" as const }
    : rescuerCaseStatusTag(item);
  const [needsBreakdownOpen, setNeedsBreakdownOpen] = useState(false);

  return (
    <article
      className={`rescuer-case-card${item.caseStatus === "active" ? " is-case-active" : ""}${supportRichCard ? " is-support-active" : ""}${supportGoalReachedLook ? " is-support-goal-reached" : ""}${supportClosedArchived ? " is-support-closed" : ""}`}
    >
      <div className="rescuer-case-card-layout">
        <div className="rescuer-case-card-content">
          <img className="rescuer-case-card-photo" src={item.image} alt="" />
          <span className="rescuer-case-card-body">
            <span className="rescuer-case-card-title-row">
              <strong>{item.name}</strong>
              <span className={`rescuer-case-status-tag is-${statusTag.tone}`}>{statusTag.label}</span>
            </span>
            {rescuerCaseShowSubtitle(item) ? (
              <span className="rescuer-case-card-subtitle">
                {supportRichCard ? (
                  <>
                    Recolectado: <strong>${funding.received.toLocaleString("es-MX")}</strong> de $
                    {funding.goal.toLocaleString("es-MX")}
                  </>
                ) : (
                  rescuerCaseSubtitle(item, programFilter)
                )}
              </span>
            ) : null}
            {rescuerCaseShowSupportNeedTypes(item, programFilter) ? (
              <span className="rescuer-case-card-need-types" aria-label="Tipos de apoyo solicitados">
                {rescuerCaseNeedTypes(item).map((type) => (
                  <span
                    key={type}
                    className={`need-symbol small ${needTypeSymbolClass(type)}`}
                    title={needTypeLabel(type)}
                    aria-hidden="true"
                  >
                    {needEmoji(type)}
                  </span>
                ))}
              </span>
            ) : null}
            {rescuerCaseShowStats(item, programFilter) ? (
              <span className="rescuer-case-card-stats" aria-label="Actividad del caso">
                <span className="rescuer-case-card-stat">
                  <Icon name="icon-messages.svg" size={18} />
                  {openChats}
                </span>
                <span className="rescuer-case-card-stat">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  {views}
                </span>
              </span>
            ) : null}
          </span>
        </div>
        <div className="rescuer-case-card-actions">
          {item.caseStatus === "active" && supportGoalReachedLook ? (
            <button
              type="button"
              className="rescuer-case-card-archive-finish"
              aria-label={`Archivar caso completado de ${item.name}`}
              onClick={() => onArchiveCompleted(item.id)}
            >
              <Icon name="check.svg" size={22} aria-hidden="true" />
            </button>
          ) : item.caseStatus === "active" ? (
            <button
              type="button"
              className="rescuer-case-card-close"
              aria-label={`Cerrar caso de ${item.name}`}
              onClick={() => onCloseCase(item.id)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          ) : item.caseStatus === "draft" || item.caseStatus === "rejected" ? (
            <button
              type="button"
              className="rescuer-case-card-close"
              aria-label={`Eliminar caso de ${item.name}`}
              onClick={() => onDelete(item.id)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <span className="rescuer-case-card-actions-spacer" aria-hidden="true" />
          )}
          {supportRichCard ? (
            <button
              type="button"
              className={`rescuer-case-card-expand${needsBreakdownOpen ? " is-expanded" : ""}`}
              aria-expanded={needsBreakdownOpen}
              aria-label={
                needsBreakdownOpen
                  ? `Ocultar desglose de apoyos de ${item.name}`
                  : `Ver desglose de apoyos de ${item.name}`
              }
              onClick={() => setNeedsBreakdownOpen((open) => !open)}
            >
              <svg
                className="rescuer-case-card-chevron"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="rescuer-case-card-edit"
              disabled={item.caseStatus === "review"}
              aria-label={
                item.caseStatus === "review"
                  ? `Editar no disponible: ${item.name} está en revisión`
                  : item.caseStatus === "closed"
                    ? `Reactivar caso de ${item.name}`
                    : `Editar caso de ${item.name}`
              }
              onClick={() => onEdit(item)}
            >
              <Icon name="icon-edit.svg" size={20} />
            </button>
          )}
        </div>
      </div>
      {rescuerCaseShowSupportFundingBar(item, programFilter) ? (
        <div
          className="donate-case-funding-bar rescuer-case-card-funding-bar"
          aria-hidden="true"
          role="presentation"
        >
          <i style={{ width: `${funding.pct}%` }} />
        </div>
      ) : null}
      {supportRichCard && needsBreakdownOpen && item.needs.length > 0 ? (
        <section className="rescuer-case-card-needs-breakdown" aria-label="Desglose de apoyos solicitados">
          <div className="donate-needs-stack">
            {sortNeedsByType(item.needs).map((need) => (
              <NeedCard
                key={need.id}
                need={need}
                caseId={item.id}
                defaultOpen={false}
                showDonateAction={false}
                onDonate={() => undefined}
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function RescuerCasesFilterDialog({
  open,
  selected,
  onChange,
  onClose,
}: {
  open: boolean;
  selected: PetCase["caseStatus"][];
  onChange: (next: PetCase["caseStatus"][]) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const toggle = (status: PetCase["caseStatus"]) => {
    if (selected.includes(status)) {
      const next = selected.filter((item) => item !== status);
      onChange(next.length ? next : [...RESCUER_CASE_LIST_STATUS_DEFAULT]);
      return;
    }
    onChange([...selected, status]);
  };

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div className="dialog-card rescuer-cases-filter-dialog" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <header className="adoption-filter-header">
          <h2>Filtrar</h2>
        </header>
        <section className="rescuer-cases-filter-dialog-section">
          <h3>Estatus</h3>
          <div className="filter-options rescuer-cases-filter-options" role="group" aria-label="Estatus del caso">
            {RESCUER_CASE_LIST_STATUS_FILTERS.map((option) => {
              const on = selected.includes(option.id);
              return (
                <label key={option.id} className="filter-check">
                  <input type="checkbox" checked={on} onChange={() => toggle(option.id)} />
                  {option.label}
                </label>
              );
            })}
          </div>
        </section>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onChange([...RESCUER_CASE_LIST_STATUS_DEFAULT])}
        >
          Mostrar todos
        </button>
        <button type="button" className="purple-button" onClick={onClose}>
          Listo
        </button>
      </div>
    </div>
  );
}

function RescuerCases() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cases, updateCaseStatus, emptyStates } = usePrototypeStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reactivateCaseId, setReactivateCaseId] = useState<string | null>(null);
  const [closeCaseId, setCloseCaseId] = useState<string | null>(null);
  const [finishArchiveCaseId, setFinishArchiveCaseId] = useState<string | null>(null);
  const [caseFilter, setCaseFilter] = useState<RescuerCaseFilter>(() => {
    const program = new URLSearchParams(location.search).get("program");
    return program === "support" ? "support" : "adoption";
  });
  const [showArchived, setShowArchived] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<PetCase["caseStatus"][]>([...RESCUER_CASE_LIST_STATUS_DEFAULT]);

  useEffect(() => {
    const program = new URLSearchParams(location.search).get("program");
    if (program === "support" || program === "adoption") {
      setCaseFilter(program);
    }
  }, [location.search]);

  const closingCase = closeCaseId ? cases.find((item) => item.id === closeCaseId) : null;
  const finishingArchiveCase = finishArchiveCaseId
    ? cases.find((item) => item.id === finishArchiveCaseId)
    : null;
  const showCasesEmpty = emptyStates || cases.length === 0;
  const statusFiltersActive =
    statusFilters.length !== RESCUER_CASE_LIST_STATUS_DEFAULT.length ||
    !RESCUER_CASE_LIST_STATUS_DEFAULT.every((status) => statusFilters.includes(status));
  const archiveFilteredCases = useMemo(() => {
    if (emptyStates) return [];
    return cases.filter((item) => (showArchived ? item.caseStatus === "closed" : item.caseStatus !== "closed"));
  }, [cases, emptyStates, showArchived]);
  const filteredCases = useMemo(() => {
    return archiveFilteredCases
      .filter((item) => (showArchived ? true : statusFilters.includes(item.caseStatus)))
      .filter((item) => (caseFilter === "adoption" ? item.adoption : !item.adoption))
      .sort(
        (a, b) =>
          RESCUER_CASE_STATUS_SORT_ORDER[a.caseStatus] - RESCUER_CASE_STATUS_SORT_ORDER[b.caseStatus] ||
          a.name.localeCompare(b.name, "es"),
      );
  }, [caseFilter, archiveFilteredCases, showArchived, statusFilters]);
  const adoptionInProgressCases = useMemo(
    () => filteredCases.filter((item) => RESCUER_ADOPTION_IN_PROGRESS_STATUSES.includes(item.caseStatus)),
    [filteredCases],
  );
  const adoptionSeekingHomeCases = useMemo(() => {
    const active = filteredCases.filter((item) => item.caseStatus === "active");
    if (caseFilter !== "support") return active;
    return [...active].sort((a, b) => {
      const aReached = rescuerCaseSupportGoalReached(a);
      const bReached = rescuerCaseSupportGoalReached(b);
      if (aReached !== bReached) return aReached ? -1 : 1;
      return a.name.localeCompare(b.name, "es");
    });
  }, [filteredCases, caseFilter]);
  const showProgramCaseSections = !showArchived;
  const openCaseEdit = (item: PetCase) => {
    if (item.caseStatus === "review") return;
    if (item.caseStatus === "closed") {
      setReactivateCaseId(item.id);
      return;
    }
    if (item.caseStatus === "draft") navigate(`/rescuer/publish?draft=${item.id}`);
    else if (item.caseStatus === "rejected") navigate(`/rescuer/publish?correct=${item.id}`);
    else navigate(`/rescuer/publish?edit=${item.id}`);
  };

  return (
    <ScreenShell
      mode="rescuer"
      className="match-shell"
      overlay={
        <>
          {deleteId ? (
            <div className="modal-backdrop center" onClick={() => setDeleteId(null)}>
              <div className="dialog-card rescuer-cases-filter-dialog" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="dialog-close" onClick={() => setDeleteId(null)} aria-label="Cerrar">
                  ×
                </button>
                <h2>¿Eliminar este caso?</h2>
                <p>
                  Esta acción borrará la información previamente capturada de esta mascota y eliminará el seguimiento en
                  Mis Casos.
                </p>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    updateCaseStatus(deleteId, "closed");
                    setDeleteId(null);
                  }}
                >
                  Sí, eliminar
                </button>
                <button type="button" className="secondary-button" onClick={() => setDeleteId(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
          {reactivateCaseId ? (
            <div className="modal-backdrop center" onClick={() => setReactivateCaseId(null)}>
              <div className="dialog-card rescuer-cases-filter-dialog" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="dialog-close"
                  onClick={() => setReactivateCaseId(null)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <h2>¿Reactivar este caso?</h2>
                <p>
                  Esta acción regresará el caso con un estatus Borrador al seguimiento de Mis Casos.
                </p>
                <button
                  type="button"
                  className="purple-button"
                  onClick={() => {
                    updateCaseStatus(reactivateCaseId, "draft");
                    setReactivateCaseId(null);
                    setShowArchived(false);
                  }}
                >
                  Sí, reactivar
                </button>
                <button type="button" className="secondary-button" onClick={() => setReactivateCaseId(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
          {finishingArchiveCase ? (
            <FinishSupportCaseArchiveDialog
              item={finishingArchiveCase}
              onClose={() => setFinishArchiveCaseId(null)}
            />
          ) : null}
          {closingCase ? (
            caseFilter === "support" && closingCase.caseStatus === "active" ? (
              <CloseSupportCaseDialog
                item={closingCase}
                onClose={() => setCloseCaseId(null)}
                onArchived={() => setShowArchived(true)}
              />
            ) : (
              <CloseCaseDialog
                item={closingCase}
                onClose={() => setCloseCaseId(null)}
                onArchived={() => setShowArchived(true)}
              />
            )
          ) : null}
          <RescuerCasesFilterDialog
            open={filterOpen}
            selected={statusFilters}
            onChange={setStatusFilters}
            onClose={() => setFilterOpen(false)}
          />
        </>
      }
    >
      <div className="rescuer-cases-network donor-chrome">
        <DonorChromeTop />
        <header className="match-top">
          <h1>Mis Casos</h1>
        </header>

        <div className="rescuer-cases-program-row">
          <div
            className="filter-gender rescuer-cases-program-filter"
            role="tablist"
            aria-label="Filtrar casos por programa"
          >
            {RESCUER_CASE_FILTERS.map((filter) => {
              const selected = caseFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`filter-gender-btn${selected ? " is-active" : ""}`}
                  onClick={() => setCaseFilter(filter.id)}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rescuer-cases-status-filters">
            <button
              type="button"
              className={`rescuer-cases-filter-btn${statusFiltersActive ? " is-active" : ""}`}
              onClick={() => setFilterOpen(true)}
              aria-label="Filtrar casos"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="16.5" cy="7" r="2.25" fill="currentColor" />
                <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="7.5" cy="17" r="2.25" fill="currentColor" />
              </svg>
              <span>Filtrar</span>
            </button>
            <button
              type="button"
              aria-pressed={showArchived}
              aria-label={showArchived ? "Ver casos activos" : "Ver archivados"}
              className={`rescuer-cases-status-archive${showArchived ? " is-selected" : ""}`}
              onClick={() => setShowArchived((value) => !value)}
            >
              <Icon name="icon-inbox-archive.svg" size={22} />
            </button>
        </div>

        {showCasesEmpty ? (
          <article className="rh-empty-card cases-empty-card">
            <span className="rh-empty-icon">
              <Icon name="rtab-cases.svg" size={32} />
            </span>
            <h3>No tienes casos todavía</h3>
            <p>
              Cuando publiques una mascota para adopción o apoyo, tus casos aparecerán aquí para que puedas darles
              seguimiento.
            </p>
            <button type="button" className="purple-button" onClick={() => navigate("/rescuer/publish")}>
              <AssetIcon name="empty-publish-plus.svg" size={16} />
              Publicar caso
            </button>
          </article>
        ) : filteredCases.length === 0 ? (
          <p className="rescuer-cases-filter-empty">
            {showArchived
              ? "No tienes casos archivados."
              : caseFilter === "adoption"
                ? "No tienes casos en adopción en este momento."
                : "No tienes casos recibiendo apoyo en este momento."}
          </p>
        ) : showProgramCaseSections ? (
          <div className="rescuer-cases-sections">
            {adoptionInProgressCases.length > 0 ? (
              <section className="rescuer-cases-section" aria-labelledby="rescuer-cases-section-in-progress">
                <h2 id="rescuer-cases-section-in-progress" className="rescuer-cases-section-title">En proceso</h2>
                <div className="rescuer-cases-grid">
                  {adoptionInProgressCases.map((item) => (
                    <RescuerCaseCardItem
                      key={item.id}
                      item={item}
                      programFilter={caseFilter}
                      onCloseCase={setCloseCaseId}
                      onDelete={setDeleteId}
                      onEdit={openCaseEdit}
                      onArchiveCompleted={setFinishArchiveCaseId}
                    />
                  ))}
                </div>
              </section>
            ) : null}
            {adoptionSeekingHomeCases.length > 0 ? (
              <section className="rescuer-cases-section" aria-labelledby="rescuer-cases-section-seeking-home">
                <h2 id="rescuer-cases-section-seeking-home" className="rescuer-cases-section-title">
                  {caseFilter === "support" ? "Recibiendo apoyo" : "Buscando hogar"}
                </h2>
                <div className="rescuer-cases-grid">
                  {adoptionSeekingHomeCases.map((item) => (
                    <RescuerCaseCardItem
                      key={item.id}
                      item={item}
                      programFilter={caseFilter}
                      onCloseCase={setCloseCaseId}
                      onDelete={setDeleteId}
                      onEdit={openCaseEdit}
                      onArchiveCompleted={setFinishArchiveCaseId}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="rescuer-cases-grid">
            {filteredCases.map((item) => (
              <RescuerCaseCardItem
                key={item.id}
                item={item}
                programFilter={caseFilter}
                onCloseCase={setCloseCaseId}
                onDelete={setDeleteId}
                onEdit={openCaseEdit}
                onArchiveCompleted={setFinishArchiveCaseId}
              />
            ))}
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
          {closeOpen ? <CloseCaseDialog item={item} onClose={() => setCloseOpen(false)} /> : null}
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
  const segments = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div
      className="publish-stepper publish-stepper--segments"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Paso ${step} de ${total}`}
    >
      {segments.map((n) => (
        <span key={n} className={`publish-step-segment${n <= step ? " is-filled" : ""}`} />
      ))}
    </div>
  );
}

type DraftNeedItem = {
  id: string;
  type: "Comida" | "Medicina" | "Veterinario";
  title: string;
  amount: number;
  detail?: string;
  notes?: string;
  receiptPhoto?: string;
  contextEvidencePhoto?: string;
  urgent?: boolean;
  badge?: string;
};

function needsToDraftItems(needs: Need[]): DraftNeedItem[] {
  return needs.map((need) => ({
    id: need.id,
    type: need.type === "Otra" ? "Veterinario" : need.type,
    title: need.title,
    amount: need.requested,
    urgent: need.urgent,
  }));
}

function draftFromPetCase(item: PetCase) {
  return {
    petName: item.name,
    species: item.species,
    sex: item.sex,
    petSize: "Mediano",
    age: item.age,
    story: item.story,
    publishMode: item.adoption ? "adoption" : "donation",
    mainPetPhoto: item.image,
    photos: [] as string[],
    location: item.location,
    vaccinated: item.health.vaccinated,
    sterilized: item.health.sterilized,
    specialCare: item.health.specialCare !== "Ninguno" && Boolean(item.health.specialCare),
    socialDogs: item.social.dogs,
    socialCats: item.social.cats,
    socialChildren: item.social.children,
    needItemsJson: JSON.stringify(needsToDraftItems(item.needs)),
  };
}

const NEED_EMOJI: Record<DraftNeedItem["type"], string> = {
  Comida: "🥣",
  Medicina: "💊",
  Veterinario: "🩺",
};

const VET_SERVICE_AMOUNT_MIN = 150;
const MOCK_THANK_YOU_VIDEO_MARKER = "mock:thank-you-video";

const VET_SERVICE_DESCRIPTIONS = [
  "Consulta y diagnóstico",
  "Cirugía",
  "Estudios",
  "Vacunas y desparasitación",
  "Otro",
] as const;

function sanitizePublishAmountInput(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const [whole, ...rest] = cleaned.split(".");
  if (!rest.length) return whole;
  return `${whole}.${rest.join("").slice(0, 2)}`;
}

const ADOPTION_SPECIES_ICON: Record<"Perro" | "Gato", string> = {
  Perro: ADOPTION_PET_PLACEHOLDER_ICON,
  Gato: "publish-species-cat.svg",
};
const ADOPTION_SUPPLEMENTARY_PHOTO_MAX = 5;
const ADOPTION_CONVIVENCIA = [
  "Social con niños",
  "Social con otras mascotas",
  "Ideal para departamento",
  "Necesita patio",
  "Ideal para primerizos",
  "Mejor para alguien con experiencia",
] as const;
function parseDraftStringArray(value: unknown) {
  if (typeof value !== "string" || !value) return [] as string[];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [] as string[];
  }
}

function formatDraftAge(years: string, months: string) {
  const y = years.trim();
  const m = months.trim();
  if (y && m) return `${y} años, ${m} meses`;
  if (y) return `${y} años`;
  if (m) return `${m} meses`;
  return "";
}

function formatAdoptionPreviewLocation(location: string) {
  const trimmed = location.trim();
  if (!trimmed) return "Monterrey, MX";
  if (/,\s*MX$/i.test(trimmed)) return trimmed;
  return trimmed.replace(/,\s*Nuevo León$/i, ", MX").replace(/,\s*NL$/i, ", MX");
}

function PetDetailReportPreviewStatic() {
  return (
    <p className="pet-detail-report pet-detail-report--footer publish-preview-static" aria-hidden="true">
      <Icon name="icon-alert-circle.svg" size={16} />
      Reportar publicación
    </p>
  );
}

function formatRescuerPreviewName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "María R.";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

function draftNeedItemsToPreviewNeeds(items: DraftNeedItem[]): Need[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    requested: Number(item.amount) || 0,
    funded: 0,
    urgent: item.urgent,
    recurring: item.type === "Comida",
    status: "active",
  }));
}

function PublishDonationDetailPreview({
  name,
  location,
  story,
  photos,
  rescuerName,
  needs,
}: {
  name: string;
  location: string;
  story: string;
  photos: string[];
  rescuerName: string;
  needs: Need[];
}) {
  const hero = photos[0] || `${A}luna-card.png`;
  const gallerySource = photos.length ? photos : [hero];
  const gallery = [...gallerySource, ...gallerySource, ...gallerySource].slice(0, 6);
  const heroDots = photos.length > 1 ? photos : [hero];
  const total = needs.reduce((sum, need) => sum + need.requested, 0);
  const funded = 0;
  const missionPct = total ? Math.round((funded / total) * 100) : 0;
  const tags = Array.from(new Set(needs.map((need) => need.type))).map(needTypeLabel);
  const rescuerDisplay = formatRescuerPreviewName(rescuerName);
  const rescuerInitial = (rescuerDisplay.charAt(0) || "R").toUpperCase();
  return (
    <div className="publish-donation-detail-preview pet-detail donate-case-detail" aria-label="Vista previa para quienes apoyan">
      <div className="pet-detail-scroll publish-preview-static">
        <div className="pet-detail-hero">
          <img src={hero} alt={name} />
          <div className="pet-detail-rescuer publish-preview-rescuer-static">
            <span>{rescuerDisplay}</span>
            <span className="pet-detail-rescuer-avatar" aria-hidden="true">{rescuerInitial}</span>
          </div>
          <div className="pet-detail-dots" aria-hidden="true">
            {heroDots.map((_, index) => (
              <button key={index} type="button" className={index === 0 ? "is-active" : ""} tabIndex={-1} />
            ))}
          </div>
        </div>

        <div className="pet-detail-sheet">
          <div className="pet-detail-heading">
            <div className="pet-detail-heading-copy">
              <h1>{name}</h1>
              <p className="pet-detail-location">
                <Icon name="location.svg" size={14} />
                {formatAdoptionPreviewLocation(location)}
              </p>
              <p className="pet-detail-verified">
                <AssetIcon name="icon-verified.svg" size={16} alt="" />
                Rescatista verificado
              </p>
            </div>
            <span className="pet-detail-share publish-preview-share-static" aria-hidden="true">
              <Icon name="icon-share.svg" size={18} />
            </span>
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
            <p>{story || "—"}</p>
          </section>

          {needs.length ? (
            <section className="donate-case-needs">
              <h2>Ayúdame a recuperar:</h2>
              <div className="donate-needs-stack">
                {sortNeedsByType(needs).map((need) => (
                  <NeedCard
                    key={need.id}
                    need={need}
                    defaultOpen={false}
                    showDonateAction={false}
                    onDonate={() => undefined}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="donate-case-gallery" aria-label="Galería">
            <div className="donate-case-gallery-grid">
              {gallery.map((src, index) => (
                <div className="donate-case-gallery-item" key={`${src}-${index}`}>
                  <img src={src} alt="" />
                </div>
              ))}
            </div>
          </section>

          <p className="pet-detail-report publish-preview-static" aria-hidden="true">
            <Icon name="icon-alert-circle.svg" size={16} />
            Reportar
          </p>
        </div>
      </div>
    </div>
  );
}

function PublishAdoptionDetailPreview({
  name,
  location,
  story,
  sex,
  size,
  age,
  photos,
  rescuerName,
  health,
  convivencia,
  personality,
}: {
  name: string;
  location: string;
  story: string;
  sex: string;
  size: string;
  age: string;
  photos: string[];
  rescuerName: string;
  health: { vaccinated: boolean; sterilized: boolean; specialCare: boolean };
  convivencia: readonly string[];
  personality: readonly string[];
}) {
  const hero = photos[0] || `${A}publish-sample-pet.jpg`;
  const galleryPhotos = photos.length ? photos : [hero];
  const stats = [
    { value: sex || "—", label: "Sexo" },
    { value: size || "—", label: "Tamaño" },
    { value: age || "—", label: "Edad" },
  ];
  const rescuerInitial = (rescuerName.trim().charAt(0) || "R").toUpperCase();

  return (
    <div className="publish-adoption-detail-preview" aria-label="Vista previa para adoptantes">
      <div className="pet-detail">
        <div className="pet-detail-scroll">
          <PetDetailPhotoHero photos={galleryPhotos} alt={name}>
            <div className="pet-detail-rescuer publish-preview-rescuer-static">
              <span>{rescuerName}</span>
              <span className="pet-detail-rescuer-avatar" aria-hidden="true">{rescuerInitial}</span>
            </div>
          </PetDetailPhotoHero>

          <div className="pet-detail-sheet">
            <div className="pet-detail-heading">
              <div className="pet-detail-heading-copy">
                <h1>{name}</h1>
                <p className="pet-detail-location">
                  <Icon name="location.svg" size={14} />
                  {formatAdoptionPreviewLocation(location)}
                </p>
                <p className="pet-detail-verified">
                  <AssetIcon name="icon-verified.svg" size={16} alt="" />
                  Rescatista verificado
                </p>
              </div>
              <span className="pet-detail-share publish-preview-share-static" aria-hidden="true">
                <Icon name="icon-share.svg" size={18} />
              </span>
            </div>

            <div className="pet-detail-stats">
              {stats.map((stat) => (
                <article className="pet-detail-stat" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>

            <section className="pet-detail-story">
              <h2>Su historia</h2>
              <p>{story || "—"}</p>
            </section>

            <PetDetailPersonalityBlock personality={personality} />
          </div>

          <PetDetailCharacteristics health={health} convivencia={convivencia} />

          <PetDetailReportPreviewStatic />
        </div>
      </div>
    </div>
  );
}

function PublishFlow() {
  const navigate = useNavigate();
  const { draft, updateDraft, publishDraft, updateCase, updateCaseStatus, cases, donorProfile, rescuerProfile } =
    usePrototypeStore();
  const location = useLocation();
  const publishSearch = new URLSearchParams(location.search);
  const editingCaseId = publishSearch.get("edit");
  const resumeCaseId = editingCaseId || publishSearch.get("correct") || publishSearch.get("draft");
  const correcting = location.search.includes("correct");
  const continuing =
    location.search.includes("draft") || location.search.includes("edit") || location.search.includes("correct");
  const [step, setStep] = useState(continuing ? 1 : 0);
  const [mode, setMode] = useState<"adoption" | "donation">((draft.publishMode as "adoption" | "donation") || "adoption");
  const photos = Array.isArray(draft.photos) ? (draft.photos as string[]) : [];
  const mainPetPhotoStored = String(draft.mainPetPhoto || "");
  const [needItems, setNeedItems] = useState<DraftNeedItem[]>(() => {
    try {
      return JSON.parse(String(draft.needItemsJson || "[]")) as DraftNeedItem[];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (!resumeCaseId) return;
    const item = cases.find((entry) => entry.id === resumeCaseId);
    if (!item) return;
    updateDraft(draftFromPetCase(item));
    setMode(item.adoption ? "adoption" : "donation");
    setNeedItems(needsToDraftItems(item.needs));
    setStep(1);
  }, [resumeCaseId, cases, updateDraft]);
  const [sheet, setSheet] = useState<"food" | "medicine" | "vet" | null>(null);
  const emptyFoodForm = {
    name: "",
    amount: "",
    receiptPhoto: "",
    contextEvidencePhoto: "",
  };
  const [foodForm, setFoodForm] = useState(emptyFoodForm);
  const emptyMedForm = {
    name: "",
    amount: "",
    treatment: "",
    receiptPhoto: "",
    contextEvidencePhoto: "",
    urgent: false,
    urgentReason: "",
  };
  const [medForm, setMedForm] = useState(emptyMedForm);
  const emptyVetForm = {
    amount: "",
    serviceDescription: "",
    serviceDescriptionOther: "",
    receiptPhoto: "",
    contextEvidencePhoto: "",
    urgent: false,
    urgentReason: "",
  };
  const [vetForm, setVetForm] = useState(emptyVetForm);
  const [editingNeedId, setEditingNeedId] = useState<string | null>(null);
  const [publishTypeChoice, setPublishTypeChoice] = useState<"adoption" | "donation" | null>(null);
  const [verifyInfoOpen, setVerifyInfoOpen] = useState(false);
  const [thankYouVideoInfoOpen, setThankYouVideoInfoOpen] = useState(false);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const adoptionPetPhotoRef = useRef<HTMLInputElement>(null);
  const thankYouVideoRef = useRef<HTMLInputElement>(null);
  const urgentComplementMediaRef = useRef<HTMLInputElement>(null);
  const foodReceiptPhotoRef = useRef<HTMLInputElement>(null);
  const foodContextEvidencePhotoRef = useRef<HTMLInputElement>(null);
  const medReceiptPhotoRef = useRef<HTMLInputElement>(null);
  const medContextEvidencePhotoRef = useRef<HTMLInputElement>(null);
  const vetReceiptPhotoRef = useRef<HTMLInputElement>(null);
  const vetContextEvidencePhotoRef = useRef<HTMLInputElement>(null);
  const thankYouVideo = String(draft.thankYouVideo || "");
  const hasThankYouVideo = Boolean(thankYouVideo);
  const detectedLocation = donorProfile.city.trim() || "Monterrey, Nuevo León";
  const adoptionPetPhoto =
    mainPetPhotoStored || (mode === "adoption" ? photos[0] ?? "" : "");
  const supplementaryPhotos = mainPetPhotoStored
    ? photos
    : mode === "adoption"
      ? photos.slice(1)
      : [];
  const urgentComplementMedia = String(draft.urgentComplementMedia || "");
  const urgentComplementMediaType =
    draft.urgentComplementMediaType === "video"
      ? "video"
      : draft.urgentComplementMediaType === "image"
        ? "image"
        : urgentComplementMedia.startsWith("data:video/")
          ? "video"
          : urgentComplementMedia
            ? "image"
            : "";
  const hasUrgentComplementMedia = Boolean(urgentComplementMedia);
  const convivenciaSelected = parseDraftStringArray(draft.convivenciaJson);
  const personalitySelected = parseDraftStringArray(draft.personalityJson);
  const adoptionAgeBand = String(draft.age || "");
  const hasAdoptionAge = ADOPTION_AGE_BANDS.includes(adoptionAgeBand as PetAgeBand);

  useEffect(() => {
    if (step !== 1) return;
    if (mode !== "adoption" && mode !== "donation") return;
    if (!draft.location) updateDraft({ location: detectedLocation });
  }, [mode, step, draft.location, detectedLocation, updateDraft]);

  const publishTypeOptions = [
    {
      id: "adoption" as const,
      label: "Dar en adopción",
      title: "Dar en adopción",
      copy: "Publica una mascota que esté lista para encontrar un hogar",
      icon: "intent-adopter.svg",
      verifyHint: true,
    },
    {
      id: "donation" as const,
      label: "Recibir Apoyo",
      title: "Recibir Apoyo",
      copy: "Crea un caso para apoyarte a solventar los gastos que ya hayas cubierto recientemente de una mascota.",
      icon: "tab-donate.svg",
      verifyHint: true,
    },
  ];
  const activePublishType = publishTypeOptions.find((option) => option.id === publishTypeChoice) ?? null;

  const totalSteps = mode === "donation" ? 4 : 3;
  const reviewStep = totalSteps;
  const needsStep = mode === "donation" ? 2 : -1;
  const donationPhotosStep = mode === "donation" ? 3 : -1;
  const showUrgentComplementEvidence = needItems.some(
    (item) =>
      (item.type === "Veterinario" || item.type === "Medicina") && Boolean(item.urgent),
  );

  useEffect(() => {
    if (mode !== "donation") return;
    if (mainPetPhotoStored || photos.length === 0) return;
    updateDraft({ mainPetPhoto: photos[0], photos: photos.slice(1) });
  }, [mode, mainPetPhotoStored, photos, updateDraft]);

  const pickType = (nextMode: "adoption" | "donation") => {
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

  const petPhotoSamples = [`${A}publish-sample-pet.jpg`, `${A}luna-card.png`, `${A}rocky.png`, `${A}nina-card.png`];

  const addPhoto = () => {
    if (photos.length >= 6) return;
    const nextSrc = petPhotoSamples[photos.length % petPhotoSamples.length];
    updateDraft({ photos: [...photos, nextSrc] });
  };

  const addSupplementaryPhoto = () => {
    if (!adoptionPetPhoto) return;
    if (supplementaryPhotos.length >= ADOPTION_SUPPLEMENTARY_PHOTO_MAX) return;
    const nextSrc = petPhotoSamples[supplementaryPhotos.length % petPhotoSamples.length];
    updateDraft({
      mainPetPhoto: adoptionPetPhoto,
      photos: [...supplementaryPhotos, nextSrc],
    });
  };

  const removeSupplementaryPhoto = (src: string) => {
    if (!adoptionPetPhoto) return;
    updateDraft({
      mainPetPhoto: adoptionPetPhoto,
      photos: supplementaryPhotos.filter((item) => item !== src),
    });
  };

  const pickThankYouVideo = (file: File | undefined) => {
    if (hasThankYouVideo || !file || !file.type.startsWith("video/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateDraft({ thankYouVideo: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const openThankYouVideoPicker = () => {
    if (hasThankYouVideo) return;
    updateDraft({ thankYouVideo: MOCK_THANK_YOU_VIDEO_MARKER });
  };

  const removeThankYouVideo = () => {
    updateDraft({ thankYouVideo: "" });
  };

  const pickUrgentComplementMedia = (file: File | undefined) => {
    if (hasUrgentComplementMedia || !file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updateDraft({
        urgentComplementMedia: reader.result,
        urgentComplementMediaType: isVideo ? "video" : "image",
      });
    };
    reader.readAsDataURL(file);
  };

  const openUrgentComplementMediaPicker = () => {
    if (hasUrgentComplementMedia) return;
    urgentComplementMediaRef.current?.click();
  };

  const removeUrgentComplementMedia = () => {
    updateDraft({ urgentComplementMedia: "", urgentComplementMediaType: "" });
  };

  const pickAdoptionPetPhoto = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      if (mode === "donation") {
        const complementOnly = mainPetPhotoStored
          ? photos.filter((p) => p !== reader.result)
          : photos.slice(1).filter((p) => p !== reader.result);
        updateDraft({ mainPetPhoto: reader.result, photos: complementOnly });
        return;
      }
      updateDraft({
        mainPetPhoto: reader.result,
        photos: mainPetPhotoStored ? photos : photos.slice(1),
      });
    };
    reader.readAsDataURL(file);
  };

  const openAdoptionPetPhotoPicker = () => {
    adoptionPetPhotoRef.current?.click();
  };

  const pickVetPhoto = (field: "receiptPhoto" | "contextEvidencePhoto", file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setVetForm((prev) => ({ ...prev, [field]: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const pickMedPhoto = (field: "receiptPhoto" | "contextEvidencePhoto", file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMedForm((prev) => ({ ...prev, [field]: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const pickFoodPhoto = (field: "receiptPhoto" | "contextEvidencePhoto", file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFoodForm((prev) => ({ ...prev, [field]: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleConvivencia = (label: string) => {
    const next = convivenciaSelected.includes(label)
      ? convivenciaSelected.filter((item) => item !== label)
      : [...convivenciaSelected, label];
    updateDraft({ convivenciaJson: JSON.stringify(next) });
  };

  const togglePersonality = (trait: string) => {
    if (personalitySelected.includes(trait)) {
      updateDraft({
        personalityJson: JSON.stringify(personalitySelected.filter((item) => item !== trait)),
      });
      return;
    }
    if (personalitySelected.length >= 3) return;
    updateDraft({ personalityJson: JSON.stringify([...personalitySelected, trait]) });
  };

  const removePhoto = (src: string) => {
    updateDraft({ photos: photos.filter((item) => item !== src) });
  };

  const canContinuePhotos = hasThankYouVideo;
  const canContinueAdoptionStep1 =
    Boolean(String(draft.petName || "").trim()) &&
    Boolean(draft.species) &&
    Boolean(draft.sex) &&
    Boolean(draft.petSize) &&
    hasAdoptionAge &&
    Boolean(adoptionPetPhoto) &&
    Boolean(String(draft.story || "").trim());
  const canContinueAdoptionStep2 = true;

  const finalizePublish = () => {
    const composedAge = adoptionPublishedAgeLabel(String(draft.age || ""));
    const nextImage = String(mainPetPhotoStored || photos[0] || "");
    if (mode === "adoption") {
      const conv = convivenciaSelected;
      updateDraft({
        publishMode: mode,
        age: composedAge,
        socialChildren: conv.includes("Social con niños"),
        socialDogs: conv.includes("Social con otras mascotas"),
        socialCats: conv.includes("Social con otras mascotas"),
      });
    } else {
      updateDraft({ publishMode: mode, needItemsJson: JSON.stringify(needItems) });
    }
    if (editingCaseId) {
      const existing = cases.find((entry) => entry.id === editingCaseId);
      if (existing) {
        const donationNeeds =
          mode === "donation"
            ? needItems.map((need) => ({
                id: need.id,
                title: need.title,
                type: need.type,
                requested: need.amount,
                funded: existing.needs.find((entry) => entry.id === need.id)?.funded ?? 0,
                urgent: need.urgent,
                recurring: need.type === "Comida",
                status: existing.needs.find((entry) => entry.id === need.id)?.status ?? "active",
              }))
            : existing.needs;
        updateCase(editingCaseId, {
          name: String(draft.petName || existing.name),
          age: composedAge || String(draft.age || existing.age),
          story: String(draft.story || existing.story),
          adoption: mode === "adoption",
          needs: donationNeeds,
          ...(nextImage ? { image: nextImage } : {}),
        });
        updateCaseStatus(editingCaseId, "review");
      }
    } else {
      publishDraft("review");
    }
    setPublishSuccessOpen(false);
    navigate("/rescuer/cases");
  };

  const goNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }
    if (step === reviewStep) {
      setPublishSuccessOpen(true);
    }
  };

  const closeNeedSheet = () => {
    setSheet(null);
    setEditingNeedId(null);
    setVetForm(emptyVetForm);
    setMedForm(emptyMedForm);
    setFoodForm(emptyFoodForm);
  };

  const openNeedItem = (item: DraftNeedItem) => {
    setEditingNeedId(item.id);
    if (item.type === "Veterinario") {
      setVetForm({
        amount: String(item.amount),
        serviceDescription: item.title,
        serviceDescriptionOther: item.notes || "",
        receiptPhoto: item.receiptPhoto || "",
        contextEvidencePhoto: item.contextEvidencePhoto || "",
        urgent: Boolean(item.urgent),
        urgentReason: item.detail || "",
      });
      setSheet("vet");
      return;
    }
    if (item.type === "Medicina") {
      setMedForm({
        name: item.title,
        amount: String(item.amount),
        treatment: item.notes || (item.urgent ? "" : item.detail || ""),
        receiptPhoto: item.receiptPhoto || "",
        contextEvidencePhoto: item.contextEvidencePhoto || "",
        urgent: Boolean(item.urgent),
        urgentReason: item.urgent ? item.detail || "" : "",
      });
      setSheet("medicine");
      return;
    }
    setFoodForm({
      name: item.title,
      amount: String(item.amount),
      receiptPhoto: item.receiptPhoto || "",
      contextEvidencePhoto: item.contextEvidencePhoto || "",
    });
    setSheet("food");
  };

  const saveFood = () => {
    const amount = Number(foodForm.amount || 0);
    if (
      !foodForm.name.trim() ||
      !amount ||
      !foodForm.receiptPhoto ||
      !foodForm.contextEvidencePhoto
    ) {
      return;
    }
    const entry: DraftNeedItem = {
      id: editingNeedId || `need-${Date.now()}`,
      type: "Comida",
      title: foodForm.name.trim(),
      amount,
      receiptPhoto: foodForm.receiptPhoto,
      contextEvidencePhoto: foodForm.contextEvidencePhoto,
    };
    const next = editingNeedId
      ? needItems.map((need) => (need.id === editingNeedId ? entry : need))
      : [...needItems, entry];
    persistNeeds(next);
    closeNeedSheet();
  };

  const saveMedicine = () => {
    const amount = Number(medForm.amount || 0);
    const urgentReason = medForm.urgentReason.trim();
    const treatment = medForm.treatment.trim();
    if (
      !medForm.name.trim() ||
      !treatment ||
      !amount ||
      !medForm.receiptPhoto ||
      !medForm.contextEvidencePhoto ||
      (medForm.urgent && !urgentReason)
    ) {
      return;
    }
    const entry: DraftNeedItem = {
      id: editingNeedId || `need-${Date.now()}`,
      type: "Medicina",
      title: medForm.name.trim(),
      amount,
      notes: treatment,
      detail: medForm.urgent ? urgentReason : treatment,
      receiptPhoto: medForm.receiptPhoto,
      contextEvidencePhoto: medForm.contextEvidencePhoto,
      urgent: medForm.urgent,
    };
    const next = editingNeedId
      ? needItems.map((need) => (need.id === editingNeedId ? entry : need))
      : [...needItems, entry];
    persistNeeds(next);
    closeNeedSheet();
  };

  const saveVet = () => {
    const amount = Number(vetForm.amount || 0);
    const selectedService = vetForm.serviceDescription.trim();
    const serviceDetail = vetForm.serviceDescriptionOther.trim();
    const urgentReason = vetForm.urgentReason.trim();
    if (
      !selectedService ||
      !serviceDetail ||
      amount < VET_SERVICE_AMOUNT_MIN ||
      !vetForm.receiptPhoto ||
      !vetForm.contextEvidencePhoto ||
      (vetForm.urgent && !urgentReason)
    ) {
      return;
    }
    const entry: DraftNeedItem = {
      id: editingNeedId || `need-${Date.now()}`,
      type: "Veterinario",
      title: selectedService,
      amount,
      notes: serviceDetail,
      detail: vetForm.urgent ? urgentReason : undefined,
      receiptPhoto: vetForm.receiptPhoto,
      contextEvidencePhoto: vetForm.contextEvidencePhoto,
      urgent: vetForm.urgent,
    };
    const next = editingNeedId
      ? needItems.map((need) => (need.id === editingNeedId ? entry : need))
      : [...needItems, entry];
    persistNeeds(next);
    closeNeedSheet();
  };

  const removeNeed = (id: string) => {
    const next = needItems.filter((item) => item.id !== id);
    persistNeeds(next);
    if (editingNeedId === id) {
      setEditingNeedId(null);
    }
  };

  if (step === 0 && !correcting && !continuing) {
    const continuePublishType = () => {
      if (!publishTypeChoice) return;
      pickType(publishTypeChoice);
    };

    return (
      <ScreenShell
        mode="rescuer"
        className="publish-type-shell"
        overlay={
          verifyInfoOpen ? (
            <div className="modal-backdrop center" onClick={() => setVerifyInfoOpen(false)}>
              <div
                className="dialog-card publish-verify-dialog"
                role="dialog"
                aria-labelledby="publish-verify-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="dialog-close"
                  onClick={() => setVerifyInfoOpen(false)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <h2 id="publish-verify-title">
                  {publishTypeChoice === "adoption"
                    ? "Revisión del caso de adopción"
                    : "Verificación de Rescatista y Caso de apoyo"}
                </h2>
                <ul className="publish-verify-dialog-list">
                  {publishTypeChoice === "adoption" ? (
                    <>
                      <li>
                        <strong>Qué es:</strong> revisamos la información y las fotos de tu publicación antes de
                        mostrarla a los adoptantes.
                      </li>
                      <li>
                        <strong>Por qué:</strong> cuidamos a quienes buscan adoptar y a las mascotas frente a casos
                        incompletos o engañosos.
                      </li>
                      <li>
                        <strong>Cómo funciona:</strong> DopMi revisa tu caso en 1–2 días hábiles y te avisa cuando
                        esté activo en Adoptar.
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <strong>Qué es:</strong> validamos que eres quien publica y que el apoyo se usa para la
                        mascota.
                      </li>
                      <li>
                        <strong>Por qué:</strong> cuidamos a donantes y a la comunidad frente a publicaciones falsas.
                      </li>
                      <li>
                        <strong>Cómo funciona:</strong> subes INE, una selfie y datos básicos; DopMi revisa en 1–2 días
                        hábiles.
                      </li>
                    </>
                  )}
                </ul>
                <button type="button" className="purple-button" onClick={() => setVerifyInfoOpen(false)}>
                  Entendido
                </button>
              </div>
            </div>
          ) : null
        }
      >
        <div className={`publish-type-screen account-screen--choice${publishTypeChoice ? " has-selection" : ""}`}>
          <DonorChromeTop />
          {publishTypeChoice ? (
            <header className="match-top publish-type-match-top">
              <h2>¿Qué quieres publicar?</h2>
            </header>
          ) : null}
          <div className="publish-type-body">
            {!publishTypeChoice ? (
              <div className="intent-copy publish-type-copy">
                <h1>¿Qué quieres publicar?</h1>
                <p>Selecciona el tipo de publicación que deseas crear</p>
              </div>
            ) : null}

            <div className="account-tabs-wrap">
              <div className="account-tabs account-tabs--two" role="radiogroup" aria-label="Tipo de publicación">
                {publishTypeOptions.map((option) => {
                  const isSelected = publishTypeChoice === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`account-tab ${option.id === "donation" ? "donate" : "adopt"}${isSelected ? " selected" : ""}`}
                      onClick={() => setPublishTypeChoice(option.id)}
                    >
                      <span className="account-tab-orb">
                        <AssetIcon name={option.icon} size={32} />
                      </span>
                      <span className="account-tab-label">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="account-summary publish-type-summary" aria-live="polite" aria-hidden={!publishTypeChoice}>
              <h2>{activePublishType?.title ?? ""}</h2>
              <p>{activePublishType?.copy ?? ""}</p>
            </div>

            <div className="account-selected-footer publish-type-footer" aria-hidden={!publishTypeChoice}>
              {activePublishType?.verifyHint ? (
                <button type="button" className="publish-verify-hint" onClick={() => setVerifyInfoOpen(true)}>
                  DopMi revisará el caso antes de publicar
                  <Icon name="icon-alert-circle.svg" size={14} className="publish-verify-hint-icon" />
                </button>
              ) : null}
              <button
                type="button"
                className="account-detail-cta"
                onClick={continuePublishType}
                disabled={!publishTypeChoice}
              >
                Continuar
              </button>
            </div>

            {publishTypeChoice ? (
              <button type="button" className="publish-cancel publish-type-cancel" onClick={() => navigate("/rescuer")}>
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      </ScreenShell>
    );
  }

  const continueDisabled =
    mode === "adoption"
      ? step === 1
        ? !canContinueAdoptionStep1
        : step === 2
          ? !canContinueAdoptionStep2
          : false
      : step === 1
        ? !canContinueAdoptionStep1
        : step === needsStep
          ? false
          : step === donationPhotosStep
            ? !canContinuePhotos
            : false;
  const continueLabel = step === reviewStep ? "Enviar a revisión" : "Continuar";
  const vetAmountNumber = Number(vetForm.amount);
  const vetAmountValid = Number.isFinite(vetAmountNumber) && vetAmountNumber >= VET_SERVICE_AMOUNT_MIN;
  const vetAmountTooLow =
    Boolean(vetForm.amount.trim()) &&
    (!Number.isFinite(vetAmountNumber) || vetAmountNumber < VET_SERVICE_AMOUNT_MIN);
  const vetServiceDescriptionValid =
    Boolean(vetForm.serviceDescription.trim()) && Boolean(vetForm.serviceDescriptionOther.trim());
  const vetUrgentReasonValid = !vetForm.urgent || Boolean(vetForm.urgentReason.trim());
  const medAmountNumber = Number(medForm.amount);
  const medAmountValid = Number.isFinite(medAmountNumber) && medAmountNumber > 0;
  const medUrgentReasonValid = !medForm.urgent || Boolean(medForm.urgentReason.trim());
  const medTreatmentValid = Boolean(medForm.treatment.trim());
  const foodAmountNumber = Number(foodForm.amount);
  const foodAmountValid = Number.isFinite(foodAmountNumber) && foodAmountNumber > 0;

  const headerTitle =
    step === reviewStep
      ? "Valida tu caso"
      : mode === "donation"
        ? step === 1
          ? "¿A quién estás apoyando?"
          : step === needsStep
            ? "Cuéntanos"
            : step === donationPhotosStep
              ? "Un poco más..."
              : "Publicar caso"
        : step === 1
          ? "Empecemos..."
          : step === 2
            ? "Un poco más..."
            : "Publicar caso";
  const adoptionAgeLabel = adoptionPublishedAgeLabel(String(draft.age || "")) || "—";
  const goPrevStep = () => {
    if (continuing && step <= 1) {
      navigate("/rescuer/cases");
      return;
    }
    setStep(step <= 1 ? 0 : step - 1);
  };

  return (
    <ScreenShell
      mode="rescuer"
      className="publish-case-shell"
      overlay={
        <>
        {sheet ? (
          <div className="modal-backdrop center" onClick={closeNeedSheet}>
            {sheet === "food" ? (
              <div className="dialog-card publish-med-dialog publish-vet-dialog" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dialog-close" onClick={closeNeedSheet} aria-label="Cerrar">×</button>
                <header className="publish-med-head publish-vet-dialog-head">
                  <div className="publish-vet-dialog-title-row">
                    <span className="donate-need-icon tone-food" aria-hidden="true">🥣</span>
                    <h2 className="publish-vet-dialog-title">Alimento</h2>
                  </div>
                  <p>Agrega los detalles del alimento o croquetas que necesitó la mascota.</p>
                </header>
                <label className="publish-field">
                  <span>Nombre del alimento <em>*</em></span>
                  <input
                    required
                    placeholder="Ej. Croquetas premium adulto 3 kg, alimento para cachorro, etc."
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  />
                </label>
                <label className="publish-field publish-vet-amount-field">
                  <span>Monto a cubrir <em>*</em></span>
                  <span
                    className={`publish-vet-amount-input${
                      foodForm.amount.trim() ? " is-active" : ""
                    }`}
                  >
                    <em aria-hidden="true">$</em>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="150"
                      value={foodForm.amount}
                      onChange={(e) =>
                        setFoodForm({ ...foodForm, amount: sanitizePublishAmountInput(e.target.value) })
                      }
                    />
                  </span>
                  <small>Monto en MXN</small>
                </label>
                <div className="publish-field">
                  <span>Foto de Recibo <em>*</em></span>
                  <small className="publish-field-hint">
                    Puede ser un ticket, recibo o factura de la compra del alimento. El total deberá ser igual al monto
                    capturado.
                  </small>
                  <input
                    ref={foodReceiptPhotoRef}
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      pickFoodPhoto("receiptPhoto", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {foodForm.receiptPhoto ? (
                    <div className="publish-evidence-preview">
                      <img src={foodForm.receiptPhoto} alt="Recibo del alimento" />
                      <button
                        type="button"
                        className="publish-outline-btn publish-evidence-change-btn"
                        onClick={() => foodReceiptPhotoRef.current?.click()}
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="publish-evidence-drop"
                      onClick={() => foodReceiptPhotoRef.current?.click()}
                    >
                      <AssetIcon name="publish-upload.svg" size={28} />
                      <strong>Subir recibo</strong>
                      <small>JPEG o PNG</small>
                    </button>
                  )}
                </div>
                <div className="publish-field">
                  <span>Foto de Evidencia <em>*</em></span>
                  <small className="publish-field-hint">
                    Agrega una fotografía que muestre el alimento otorgado.
                  </small>
                  <input
                    ref={foodContextEvidencePhotoRef}
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      pickFoodPhoto("contextEvidencePhoto", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {foodForm.contextEvidencePhoto ? (
                    <div className="publish-evidence-preview">
                      <img src={foodForm.contextEvidencePhoto} alt="Alimento otorgado" />
                      <button
                        type="button"
                        className="publish-outline-btn publish-evidence-change-btn"
                        onClick={() => foodContextEvidencePhotoRef.current?.click()}
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="publish-evidence-drop"
                      onClick={() => foodContextEvidencePhotoRef.current?.click()}
                    >
                      <AssetIcon name="publish-upload.svg" size={28} />
                      <strong>Subir evidencia</strong>
                      <small>JPEG o PNG</small>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="purple-button"
                  disabled={
                    !foodForm.name.trim() ||
                    !foodAmountValid ||
                    !foodForm.receiptPhoto ||
                    !foodForm.contextEvidencePhoto
                  }
                  onClick={saveFood}
                >
                  Guardar alimento
                </button>
                <button type="button" className="secondary-button" onClick={closeNeedSheet}>
                  Cancelar
                </button>
              </div>
            ) : sheet === "medicine" ? (
              <div className="dialog-card publish-med-dialog publish-vet-dialog" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dialog-close" onClick={closeNeedSheet} aria-label="Cerrar">×</button>
                <header className="publish-med-head publish-vet-dialog-head">
                  <div className="publish-vet-dialog-title-row">
                    <span className="donate-need-icon tone-meds" aria-hidden="true">💊</span>
                    <h2 className="publish-vet-dialog-title">Medicina</h2>
                  </div>
                  <p>Agrega los detalles de la medicina que necesitó la mascota.</p>
                </header>
                <label className="publish-field">
                  <span>Nombre de la medicina <em>*</em></span>
                  <input
                    required
                    placeholder="Ej. Amoxicilina, Metronidazol, etc."
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  />
                </label>
                <label className="publish-field publish-vet-amount-field">
                  <span>Monto a cubrir <em>*</em></span>
                  <span
                    className={`publish-vet-amount-input${
                      medForm.amount.trim() ? " is-active" : ""
                    }`}
                  >
                    <em aria-hidden="true">$</em>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="150"
                      value={medForm.amount}
                      onChange={(e) =>
                        setMedForm({ ...medForm, amount: sanitizePublishAmountInput(e.target.value) })
                      }
                    />
                  </span>
                  <small>Monto en MXN</small>
                </label>
                <label className="publish-field">
                  <span>¿Para qué tratamiento es? <em>*</em></span>
                  <input
                    required
                    placeholder="Ej. Infección respiratoria, desparasitación, etc."
                    value={medForm.treatment}
                    onChange={(e) => setMedForm({ ...medForm, treatment: e.target.value })}
                  />
                </label>
                <div className="publish-field">
                  <span>Foto de Recibo <em>*</em></span>
                  <small className="publish-field-hint">
                    Puede ser un ticket, recibo, factura o similar otorgado por el veterinario. El total deberá ser igual al
                    monto capturado.
                  </small>
                  <input
                    ref={medReceiptPhotoRef}
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      pickMedPhoto("receiptPhoto", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {medForm.receiptPhoto ? (
                    <div className="publish-evidence-preview">
                      <img src={medForm.receiptPhoto} alt="Recibo de la medicina" />
                      <button
                        type="button"
                        className="publish-outline-btn publish-evidence-change-btn"
                        onClick={() => medReceiptPhotoRef.current?.click()}
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="publish-evidence-drop"
                      onClick={() => medReceiptPhotoRef.current?.click()}
                    >
                      <AssetIcon name="publish-upload.svg" size={28} />
                      <strong>Subir recibo</strong>
                      <small>JPEG o PNG</small>
                    </button>
                  )}
                </div>
                <div className="publish-field">
                  <span>Foto de Evidencia <em>*</em></span>
                  <small className="publish-field-hint">
                    Agrega una fotografía que muestre la medicina otorgada.
                  </small>
                  <input
                    ref={medContextEvidencePhotoRef}
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      pickMedPhoto("contextEvidencePhoto", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {medForm.contextEvidencePhoto ? (
                    <div className="publish-evidence-preview">
                      <img src={medForm.contextEvidencePhoto} alt="Mascota y contexto del tratamiento" />
                      <button
                        type="button"
                        className="publish-outline-btn publish-evidence-change-btn"
                        onClick={() => medContextEvidencePhotoRef.current?.click()}
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="publish-evidence-drop"
                      onClick={() => medContextEvidencePhotoRef.current?.click()}
                    >
                      <AssetIcon name="publish-upload.svg" size={28} />
                      <strong>Subir evidencia</strong>
                      <small>JPEG o PNG</small>
                    </button>
                  )}
                </div>
                <label className={`publish-urgent-row${medForm.urgent ? " is-selected" : ""}`}>
                  <span className="publish-urgent-row-icon" aria-hidden="true">
                    <Icon name="icon-alert-circle.svg" size={20} />
                  </span>
                  <span className="publish-urgent-row-copy">
                    <strong>Marcar como urgente</strong>
                    <small>Pasará por revisión de DopMi</small>
                  </span>
                  <input
                    type="checkbox"
                    className="publish-urgent-row-check"
                    checked={medForm.urgent}
                    onChange={(e) =>
                      setMedForm({
                        ...medForm,
                        urgent: e.target.checked,
                        urgentReason: e.target.checked ? medForm.urgentReason : "",
                      })
                    }
                  />
                </label>
                {medForm.urgent ? (
                  <label className="publish-field">
                    <span>Motivo de urgencia <em>*</em></span>
                    <input
                      placeholder="Explica por qué es urgente"
                      value={medForm.urgentReason}
                      onChange={(e) => setMedForm({ ...medForm, urgentReason: e.target.value })}
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  className="purple-button"
                  disabled={
                    !medForm.name.trim() ||
                    !medTreatmentValid ||
                    !medAmountValid ||
                    !medForm.receiptPhoto ||
                    !medForm.contextEvidencePhoto ||
                    !medUrgentReasonValid
                  }
                  onClick={saveMedicine}
                >
                  Guardar medicina
                </button>
                <button type="button" className="secondary-button" onClick={closeNeedSheet}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="dialog-card publish-med-dialog publish-vet-dialog" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dialog-close" onClick={closeNeedSheet} aria-label="Cerrar">×</button>
                <header className="publish-med-head publish-vet-dialog-head">
                  <div className="publish-vet-dialog-title-row">
                    <span className="donate-need-icon tone-vet" aria-hidden="true">🩺</span>
                    <h2 className="publish-vet-dialog-title">Servicio Veterinario</h2>
                  </div>
                  <p>Agrega los detalles del servicio veterinario que necesitó la mascota.</p>
                </header>
                <label className="publish-field">
                  <span>Servicio <em>*</em></span>
                  <select
                    required
                    value={vetForm.serviceDescription}
                    onChange={(e) => setVetForm({ ...vetForm, serviceDescription: e.target.value })}
                  >
                    <option value="">Selecciona una opción</option>
                    {VET_SERVICE_DESCRIPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="publish-field">
                  <span>Describe el servicio <em>*</em></span>
                  <input
                    required
                    placeholder="Ej. Cirugía de mandíbula, Vacuna antirrabica, etc."
                    value={vetForm.serviceDescriptionOther}
                    onChange={(e) => setVetForm({ ...vetForm, serviceDescriptionOther: e.target.value })}
                  />
                </label>
                <label className="publish-field publish-vet-amount-field">
                  <span>Monto de la consulta <em>*</em></span>
                  <span
                    className={`publish-vet-amount-input${
                      vetAmountTooLow ? " is-invalid" : vetForm.amount.trim() ? " is-active" : ""
                    }`}
                  >
                    <em aria-hidden="true">$</em>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="150"
                      value={vetForm.amount}
                      aria-invalid={vetAmountTooLow}
                      aria-describedby={vetAmountTooLow ? "vet-amount-error" : undefined}
                      onChange={(e) =>
                        setVetForm({ ...vetForm, amount: sanitizePublishAmountInput(e.target.value) })
                      }
                    />
                  </span>
                  {vetAmountTooLow ? (
                    <small id="vet-amount-error" className="publish-field-error" role="alert">
                      El monto mínimo de solicitud de apoyo es ${VET_SERVICE_AMOUNT_MIN}
                    </small>
                  ) : (
                    <small>Monto en MXN (mínimo ${VET_SERVICE_AMOUNT_MIN})</small>
                  )}
                </label>
                <div className="publish-field">
                  <span>Foto de Recibo <em>*</em></span>
                  <small className="publish-field-hint">
                    Puede ser un ticket, recibo, factura o similar otorgado por el veterinario. El total deberá ser igual al
                    monto capturado.
                  </small>
                  <input
                    ref={vetReceiptPhotoRef}
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      pickVetPhoto("receiptPhoto", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {vetForm.receiptPhoto ? (
                    <div className="publish-evidence-preview">
                      <img src={vetForm.receiptPhoto} alt="Recibo del servicio veterinario" />
                      <button
                        type="button"
                        className="publish-outline-btn publish-evidence-change-btn"
                        onClick={() => vetReceiptPhotoRef.current?.click()}
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="publish-evidence-drop"
                      onClick={() => vetReceiptPhotoRef.current?.click()}
                    >
                      <AssetIcon name="publish-upload.svg" size={28} />
                      <strong>Subir recibo</strong>
                      <small>JPEG o PNG</small>
                    </button>
                  )}
                </div>
                <div className="publish-field">
                  <span>Foto de Evidencia <em>*</em></span>
                  <small className="publish-field-hint">
                    Agrega una fotografía que muestre a la mascota y de contexto de porqué necesitó el servicio.
                  </small>
                  <input
                    ref={vetContextEvidencePhotoRef}
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      pickVetPhoto("contextEvidencePhoto", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {vetForm.contextEvidencePhoto ? (
                    <div className="publish-evidence-preview">
                      <img src={vetForm.contextEvidencePhoto} alt="Mascota y contexto del servicio veterinario" />
                      <button
                        type="button"
                        className="publish-outline-btn publish-evidence-change-btn"
                        onClick={() => vetContextEvidencePhotoRef.current?.click()}
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="publish-evidence-drop"
                      onClick={() => vetContextEvidencePhotoRef.current?.click()}
                    >
                      <AssetIcon name="publish-upload.svg" size={28} />
                      <strong>Subir evidencia</strong>
                      <small>JPEG o PNG</small>
                    </button>
                  )}
                </div>
                <label className={`publish-urgent-row${vetForm.urgent ? " is-selected" : ""}`}>
                  <span className="publish-urgent-row-icon" aria-hidden="true">
                    <Icon name="icon-alert-circle.svg" size={20} />
                  </span>
                  <span className="publish-urgent-row-copy">
                    <strong>Marcar como urgente</strong>
                    <small>Pasará por revisión de DopMi</small>
                  </span>
                  <input
                    type="checkbox"
                    className="publish-urgent-row-check"
                    checked={vetForm.urgent}
                    onChange={(e) =>
                      setVetForm({
                        ...vetForm,
                        urgent: e.target.checked,
                        urgentReason: e.target.checked ? vetForm.urgentReason : "",
                      })
                    }
                  />
                </label>
                {vetForm.urgent ? (
                  <label className="publish-field">
                    <span>Motivo de urgencia <em>*</em></span>
                    <input
                      placeholder="Explica por qué es urgente"
                      value={vetForm.urgentReason}
                      onChange={(e) => setVetForm({ ...vetForm, urgentReason: e.target.value })}
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  className="purple-button"
                  disabled={
                    !vetServiceDescriptionValid ||
                    !vetAmountValid ||
                    !vetForm.receiptPhoto ||
                    !vetForm.contextEvidencePhoto ||
                    !vetUrgentReasonValid
                  }
                  onClick={saveVet}
                >
                  Guardar consulta
                </button>
                <button type="button" className="secondary-button" onClick={closeNeedSheet}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ) : null}
        {thankYouVideoInfoOpen ? (
          <div className="modal-backdrop center" onClick={() => setThankYouVideoInfoOpen(false)}>
            <div
              className="dialog-card publish-verify-dialog"
              role="dialog"
              aria-labelledby="publish-thank-you-video-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="dialog-close"
                onClick={() => setThankYouVideoInfoOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
              <h2 id="publish-thank-you-video-title">¿Por qué subir este video?</h2>
              <ul className="publish-verify-dialog-list">
                <li>
                  <strong>Confianza:</strong> quienes apoyan quieren ver que su ayuda llega a la mascota.
                </li>
                <li>
                  <strong>Gratitud:</strong> un mensaje breve refuerza la comunidad y motiva a seguir donando.
                </li>
                <li>
                  <strong>Qué mostrar:</strong> debe salir la mascota; es opcional que aparezcas tú en el video.
                </li>
              </ul>
              <button type="button" className="purple-button" onClick={() => setThankYouVideoInfoOpen(false)}>
                Entendido
              </button>
            </div>
          </div>
        ) : null}
        {publishSuccessOpen ? (
          <div className="modal-backdrop center" onClick={finalizePublish}>
            <div
              className="dialog-card publish-verify-dialog"
              role="dialog"
              aria-labelledby="publish-success-title"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="publish-success-title">Tu caso se envió con éxito.</h2>
              <p className="publish-hint publish-success-dialog-copy">
                El equipo DopMi revisará tu publicación lo antes posible. Si todo va bien, se publicará automáticamente
                y empezarás a recibir tu apoyo.
              </p>
              <button type="button" className="purple-button" onClick={finalizePublish}>
                Entendido
              </button>
            </div>
          </div>
        ) : null}
        </>
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
        </button>
        <PublishStepper step={step} total={totalSteps} />
        <div className="match-top publish-case-title">
          <h1>{headerTitle}</h1>
        </div>
      </header>

      <div
        className="publish-case-body"
      >
        {correcting && (
          <div className="error-callout">
            <strong>Corrige antes de reenviar</strong>
            <span>La historia necesita más detalle y la evidencia de urgencia no permite identificar a la mascota.</span>
          </div>
        )}

        {step === 1 && (mode === "adoption" || mode === "donation") && (
          <section className="publish-section">
            <input
              ref={adoptionPetPhotoRef}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                pickAdoptionPetPhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <h2>Perfil</h2>

            <div className="publish-pet-photo-field">
              <span className="publish-pet-photo-label">
                Foto de la mascota <em aria-hidden="true">*</em>
              </span>
              <small className="publish-pet-photo-hint">Será la foto principal que lo representará.</small>
              <div className="publish-pet-photo-wrap">
                <button
                  type="button"
                  className={`publish-pet-photo${adoptionPetPhoto ? " has-photo" : ""}${!adoptionPetPhoto ? " is-required-empty" : ""}`}
                  onClick={openAdoptionPetPhotoPicker}
                  aria-required="true"
                  aria-invalid={!adoptionPetPhoto}
                  aria-label={
                    adoptionPetPhoto
                      ? "Cambiar foto de la mascota"
                      : "Subir foto de la mascota, obligatoria"
                  }
                >
                  {adoptionPetPhoto ? (
                    <img className="publish-pet-photo-image" src={adoptionPetPhoto} alt="" />
                  ) : (
                    <span className="publish-pet-photo-placeholder" aria-hidden="true">
                      <Icon name={ADOPTION_PET_PLACEHOLDER_ICON} size={36} />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="publish-pet-photo-edit"
                  onClick={openAdoptionPetPhotoPicker}
                  aria-label="Editar foto de la mascota"
                >
                  <Icon name="icon-edit.svg" size={16} />
                </button>
              </div>
            </div>

            <label className="publish-field">
              <span>Nombre de la mascota <em>*</em></span>
              <input
                placeholder="Ej. Luna"
                maxLength={25}
                value={String(draft.petName || "")}
                onChange={(e) => updateDraft({ petName: e.target.value })}
              />
            </label>

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
                    <span className="publish-choice-icon" aria-hidden="true">
                      <Icon name={ADOPTION_SPECIES_ICON[value]} size={20} />
                    </span>
                    {value}
                  </button>
                ))}
              </div>
            </div>

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
            </div>

            <div className="publish-field">
              <span>Tamaño <em>*</em></span>
              <div className="publish-choice-row publish-choice-row--three">
                {ADOPTION_SIZES.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`publish-choice publish-choice--pet-size ${draft.petSize === value ? "selected" : ""}`}
                    onClick={() => updateDraft({ petSize: value })}
                  >
                    <span className="publish-choice-icon" aria-hidden="true">
                      <Icon name={ADOPTION_PET_PLACEHOLDER_ICON} size={ADOPTION_SIZE_ICON_PX[value]} />
                    </span>
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="publish-field">
              <span>Edad <em>*</em></span>
              <div className="publish-choice-row publish-choice-row--three">
                {ADOPTION_AGE_BANDS.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`publish-choice ${adoptionAgeBand === value ? "selected" : ""}`}
                    onClick={() => updateDraft({ age: value, ageYears: "", ageMonths: "" })}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <h2>Su historia</h2>

            <label className="publish-field">
              <span>Historia de rescate <em>*</em></span>
              <textarea
                placeholder="Cuéntanos cómo llegó a ti. Danos una descripción de él/ella."
                rows={4}
                value={String(draft.story || "")}
                onChange={(e) => updateDraft({ story: e.target.value })}
                required
              />
            </label>

            <label className="publish-field">
              <span>Ubicación</span>
              <input readOnly value={String(draft.location || detectedLocation)} />
              <small>Usamos la misma que tu perfil.</small>
            </label>
          </section>
        )}

        {step === donationPhotosStep && (
          <section className="publish-section">
            <input
              ref={thankYouVideoRef}
              className="visually-hidden"
              type="file"
              accept="video/*"
              onChange={(event) => {
                pickThankYouVideo(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <h2>Video de agradecimiento <em>*</em></h2>
            <p className="publish-hint">
              <strong>Dile gracias a las personas que apoyan a la causa.</strong> En el video deberá salir la
              mascota. Es opcional que aparezca el/la rescatista.
            </p>
            {hasThankYouVideo ? (
              <article className="publish-urgent-video-done publish-thank-you-video-done">
                <div>
                  <strong>Video agregado</strong>
                  <small>Solo puedes subir un video de agradecimiento</small>
                </div>
                <button type="button" className="publish-need-remove" onClick={removeThankYouVideo}>
                  Quitar
                </button>
              </article>
            ) : (
              <div className="publish-photo-drop publish-thank-you-video-drop">
                <AssetIcon name="publish-cam-lg.svg" size={48} />
                <div className="publish-photo-actions publish-photo-actions--stacked">
                  <button type="button" className="publish-outline-btn" onClick={openThankYouVideoPicker}>
                    <AssetIcon name="publish-upload.svg" size={16} />
                    Subir video
                  </button>
                  <button type="button" className="publish-outline-btn" onClick={openThankYouVideoPicker}>
                    <AssetIcon name="publish-cam-sm.svg" size={16} />
                    Grabar video
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className="publish-verify-hint publish-thank-you-video-hint"
              onClick={() => setThankYouVideoInfoOpen(true)}
            >
              ¿Por qué debo subir este video?
              <Icon name="icon-alert-circle.svg" size={14} className="publish-verify-hint-icon" />
            </button>

            {showUrgentComplementEvidence ? (
              <>
                <input
                  ref={urgentComplementMediaRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/*"
                  onChange={(event) => {
                    pickUrgentComplementMedia(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <h2>Complementa tu evidencia de urgencia</h2>
                <p className="publish-hint">
                  (Opcional) Comparte más contexto de la urgencia en la publicación que verán las personas que
                  apoyarán. <strong>Las urgencias son más rápidas en fondearse.</strong>
                </p>
                {hasUrgentComplementMedia ? (
                  <article className="publish-urgent-video-done publish-thank-you-video-done">
                    <div className="publish-urgent-complement-preview">
                      {urgentComplementMediaType === "video" ? (
                        <video src={urgentComplementMedia} controls playsInline className="publish-urgent-complement-media" />
                      ) : (
                        <img
                          src={urgentComplementMedia}
                          alt="Evidencia de urgencia"
                          className="publish-urgent-complement-media"
                        />
                      )}
                      <strong>{urgentComplementMediaType === "video" ? "Video agregado" : "Imagen agregada"}</strong>
                      <small>Solo puedes subir un archivo (foto o video)</small>
                    </div>
                    <button type="button" className="publish-need-remove" onClick={removeUrgentComplementMedia}>
                      Quitar
                    </button>
                  </article>
                ) : (
                  <div className="publish-photo-drop">
                    <AssetIcon name="publish-cam-lg.svg" size={48} />
                    <div className="publish-photo-actions publish-photo-actions--stacked">
                      <button type="button" className="publish-outline-btn" onClick={openUrgentComplementMediaPicker}>
                        <AssetIcon name="publish-upload.svg" size={16} />
                        Subir desde galería
                      </button>
                      <button type="button" className="publish-outline-btn" onClick={openUrgentComplementMediaPicker}>
                        <AssetIcon name="publish-cam-sm.svg" size={16} />
                        Subir video o foto
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </section>
        )}

        {step === 2 && mode === "adoption" && (
          <section className="publish-section">
            <h2>Complementa sus fotos</h2>
            <p className="publish-hint">Puedes agregar hasta 5 fotos más.</p>
            {supplementaryPhotos.length < ADOPTION_SUPPLEMENTARY_PHOTO_MAX ? (
              <div className="publish-photo-drop">
                <AssetIcon name="publish-cam-lg.svg" size={48} />
                <div className="publish-photo-actions publish-photo-actions--stacked">
                  <button type="button" className="publish-outline-btn" onClick={addSupplementaryPhoto}>
                    <AssetIcon name="publish-upload.svg" size={16} />
                    Subir desde galería
                  </button>
                  <button type="button" className="publish-outline-btn" onClick={addSupplementaryPhoto}>
                    <AssetIcon name="publish-cam-sm.svg" size={16} />
                    Tomar foto
                  </button>
                </div>
              </div>
            ) : null}
            {supplementaryPhotos.length > 0 ? (
              <>
                <h3>Fotos agregadas</h3>
                <div className="publish-photo-grid compact">
                  {supplementaryPhotos.map((src, index) => (
                    <article className="publish-photo-thumb" key={`${src}-${index}`}>
                      <img src={src} alt={`Foto adicional ${index + 1}`} />
                      <button
                        type="button"
                        className="publish-photo-remove"
                        aria-label="Quitar foto"
                        onClick={() => removeSupplementaryPhoto(src)}
                      >
                        ×
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            <h2>Características de la mascota</h2>
            <p className="publish-trait-hint">
              Selecciona las que apliquen. Ninguna es obligatoria pero ayudará al adoptante a motivarse más rápido.
            </p>

            <div className="publish-field">
                <h4 className="publish-family-subtitle">Salud</h4>
                <div className="publish-field-box publish-field-box--checks">
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
                </div>
              </div>

              <div className="publish-family-traits">
                <h4 className="publish-family-subtitle">Convivencia y hogar</h4>
                <div className="publish-chip-grid publish-chip-grid--cards">
                  {ADOPTION_CONVIVENCIA.map((label) => (
                    <button
                      type="button"
                      key={label}
                      className={`publish-chip publish-chip--card ${convivenciaSelected.includes(label) ? "selected" : ""}`}
                      onClick={() => toggleConvivencia(label)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="publish-subhead-row">
                  <h4>Personalidad</h4>
                  <span className="publish-trait-note">Máximo 3</span>
                </div>
                <div className="publish-chip-grid">
                  {ADOPTION_PERSONALITY.map((trait) => (
                    <button
                      type="button"
                      key={trait}
                      className={`publish-chip publish-chip--personality tone-${ADOPTION_PERSONALITY_TONE[trait]} ${personalitySelected.includes(trait) ? "selected" : ""}`}
                      onClick={() => togglePersonality(trait)}
                      disabled={!personalitySelected.includes(trait) && personalitySelected.length >= 3}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>
          </section>
        )}

        {step === needsStep && (
          <section className="publish-section">
            <h2>¿En qué necesitaron apoyo?</h2>
            <div className="publish-needs-note">
              Puedes seleccionar uno o más tipos de apoyo. Por seguridad, te solicitaremos evidencia de cada tipo que agregues.
            </div>
            <button
              type="button"
              className="publish-need-card"
              onClick={() => {
                setEditingNeedId(null);
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
            <button
              type="button"
              className="publish-need-card"
              onClick={() => {
                setEditingNeedId(null);
                setMedForm(emptyMedForm);
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
                setEditingNeedId(null);
                setFoodForm(emptyFoodForm);
                setSheet("food");
              }}
            >
              <span aria-hidden>🥣</span>
              <span>
                <strong>Alimento</strong>
                <p>Agrega croquetas y el costo a cubrir.</p>
              </span>
            </button>

            {needItems.length > 0 && (
              <div className="publish-needs-list">
                <h3>Necesidades agregadas ({needItems.length})</h3>
                {needItems.map((item) => (
                  <article className="publish-need-row" key={item.id}>
                    <button
                      type="button"
                      className="publish-need-row-main"
                      onClick={() => openNeedItem(item)}
                      aria-label={`Ver detalle de ${item.title}`}
                    >
                      <span className="publish-need-emoji" aria-hidden>{NEED_EMOJI[item.type]}</span>
                      <div className="publish-need-row-text">
                        <strong>{item.title}</strong>
                        <p>${item.amount}</p>
                        {item.urgent ? <span className="publish-need-badge urgent">Urgente</span> : null}
                      </div>
                      <Icon name="icon-edit.svg" size={18} className="publish-need-row-edit" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="publish-need-remove"
                      onClick={() => removeNeed(item.id)}
                      aria-label={`Eliminar ${item.title}`}
                    >
                      Eliminar
                    </button>
                  </article>
                ))}
              </div>
            )}

          </section>
        )}

        {step === reviewStep && mode === "adoption" && (
          <section className="publish-section publish-review">
            <div className="publish-review-block">
              <div className="publish-review-head">
                <h3>Vista previa de la publicación</h3>
              </div>
              <p className="publish-adoption-preview-copy">
                Esta es una previsualización de la publicación que verán los adoptantes.
              </p>
              <section className="publish-adoption-preview-frame" aria-label="Vista previa de la publicación">
                <PublishAdoptionDetailPreview
                  name={String(draft.petName || "Mascota")}
                  location={String(draft.location || detectedLocation)}
                  story={String(draft.story || "")}
                  sex={String(draft.sex || "")}
                  size={String(draft.petSize || "")}
                  age={adoptionAgeLabel}
                  photos={
                    adoptionPetPhoto ? [adoptionPetPhoto, ...supplementaryPhotos] : [...supplementaryPhotos]
                  }
                  rescuerName={rescuerProfile.name.trim() || "María Rescatista"}
                  health={{
                    vaccinated: Boolean(draft.vaccinated),
                    sterilized: Boolean(draft.sterilized),
                    specialCare: Boolean(draft.specialCare),
                  }}
                  convivencia={convivenciaSelected}
                  personality={personalitySelected}
                />
              </section>
            </div>
          </section>
        )}

        {step === reviewStep && mode === "donation" && (
          <section className="publish-section publish-review">
            <div className="publish-review-block">
              <div className="publish-review-head">
                <h3>Vista previa de la publicación</h3>
              </div>
              <p className="publish-adoption-preview-copy">
                Esta es una previsualización de la publicación que verán quienes apoyen la causa.
              </p>
              <section className="publish-adoption-preview-frame" aria-label="Vista previa de la publicación">
                <PublishDonationDetailPreview
                  name={String(draft.petName || "Mascota")}
                  location={String(draft.location || detectedLocation)}
                  story={String(draft.story || "")}
                  photos={
                    adoptionPetPhoto
                      ? [
                          adoptionPetPhoto,
                          ...(showUrgentComplementEvidence &&
                          hasUrgentComplementMedia &&
                          urgentComplementMediaType === "image"
                            ? [urgentComplementMedia]
                            : []),
                        ]
                      : showUrgentComplementEvidence &&
                          hasUrgentComplementMedia &&
                          urgentComplementMediaType === "image"
                        ? [urgentComplementMedia]
                        : []
                  }
                  rescuerName={rescuerProfile.name.trim() || "María Rescatista"}
                  needs={draftNeedItemsToPreviewNeeds(needItems)}
                />
              </section>
            </div>
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
  const { messages, emptyStates, cases } = usePrototypeStore();
  const last = messages[messages.length - 1];
  const [petFilter, setPetFilter] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const chatThreads = useMemo(() => {
    if (emptyStates) return [];
    return RESCUER_ADOPTION_CHAT_THREADS.map((thread) => {
      const isLunaAna = thread.petId === "luna" && thread.adopter === "Ana P.";
      return {
        ...thread,
        preview: isLunaAna ? (last?.text ?? thread.preview) : thread.preview,
        time: isLunaAna ? (last?.time ?? thread.time) : thread.time,
        unread: isLunaAna && last?.author === "donor" ? 1 : thread.unread,
      };
    });
  }, [emptyStates, last?.author, last?.text, last?.time]);

  const openAdoptionCases = useMemo(() => {
    if (emptyStates) return [];
    return cases.filter((item) => item.adoption && item.caseStatus === "active");
  }, [cases, emptyStates]);

  useEffect(() => {
    if (petFilter !== "all" && !openAdoptionCases.some((item) => item.id === petFilter)) {
      setPetFilter("all");
    }
  }, [openAdoptionCases, petFilter]);

  const filteredThreads = useMemo(() => {
    let pool = chatThreads.filter((thread) => !thread.archived);
    if (unreadOnly) pool = pool.filter((thread) => thread.unread > 0);
    if (petFilter !== "all") pool = pool.filter((thread) => thread.petId === petFilter);
    return sortRescuerChatsByUnread(pool);
  }, [chatThreads, unreadOnly, petFilter]);

  const petNameById = useMemo(() => {
    const map = new Map<string, string>();
    openAdoptionCases.forEach((item) => map.set(item.id, item.name));
    cases.forEach((item) => {
      if (!map.has(item.id)) map.set(item.id, item.name);
    });
    return map;
  }, [cases, openAdoptionCases]);

  const petImageById = useMemo(() => {
    const map = new Map<string, string>();
    cases.forEach((item) => map.set(item.id, item.image));
    return map;
  }, [cases]);

  const unreadByPetId = useMemo(() => {
    const totals = new Map<string, number>();
    chatThreads.forEach((thread) => {
      if (thread.archived) return;
      totals.set(thread.petId, (totals.get(thread.petId) ?? 0) + thread.unread);
    });
    return totals;
  }, [chatThreads]);

  return (
    <ScreenShell mode="rescuer" className="match-shell">
      <div className="match-page rescuer-match-page rescuer-messages-page donor-chrome">
        <DonorChromeTop />
        <header className="match-top">
          <h1>Mensajes</h1>
        </header>

        <div className="rescuer-chat-pet-filters" role="tablist" aria-label="Filtrar por mascota">
              <button
                type="button"
                role="tab"
                aria-selected={petFilter === "all"}
                className={`rescuer-chat-pet-card${petFilter === "all" ? " is-active" : ""}`}
                onClick={() => setPetFilter("all")}
              >
                <span className="rescuer-chat-pet-card-avatar rescuer-chat-pet-card-avatar--all" aria-hidden="true">
                  <Icon name="icon-messages.svg" size={22} />
                </span>
                <span className="rescuer-chat-pet-card-name">Todos</span>
              </button>
              {openAdoptionCases.map((caseItem) => {
                const unread = unreadByPetId.get(caseItem.id) ?? 0;
                return (
                  <button
                    type="button"
                    key={caseItem.id}
                    role="tab"
                    aria-selected={petFilter === caseItem.id}
                    className={`rescuer-chat-pet-card${petFilter === caseItem.id ? " is-active" : ""}`}
                    onClick={() => setPetFilter(caseItem.id)}
                  >
                    <span className="rescuer-chat-pet-card-avatar-wrap">
                      <img className="rescuer-chat-pet-card-avatar" src={caseItem.image} alt="" />
                      {unread > 0 ? (
                        <span className="rescuer-chat-pet-card-badge">{unread > 9 ? "9+" : unread}</span>
                      ) : null}
                    </span>
                    <span className="rescuer-chat-pet-card-name">{caseItem.name}</span>
                  </button>
                );
              })}
        </div>

        <div className="rescuer-chats-block">
              <div className="rescuer-chats-panel-head">
                <h2>Chats</h2>
                <button
                  type="button"
                  className={`rescuer-chats-unread-filter${unreadOnly ? " is-active" : ""}`}
                  aria-pressed={unreadOnly}
                  onClick={() => setUnreadOnly((on) => !on)}
                >
                  {unreadOnly ? "Mostrar todos" : "Sin leer"}
                </button>
              </div>
              <section className="rescuer-chats-panel" aria-label="Lista de chats">
                {filteredThreads.length === 0 ? (
                  <p className="rescuer-chats-panel-empty">
                    {unreadOnly ? "No tienes mensajes sin leer." : "Aún no tienes mensajes"}
                  </p>
                ) : (
                  <div className="thread-list rescuer-chats-thread-list">
                    {filteredThreads.map((thread) => {
                      const petName = petNameById.get(thread.petId) ?? "Mascota";
                      const petImage = petImageById.get(thread.petId);
                      return (
                        <button
                          type="button"
                          className="thread-row rescuer-chat-thread-row"
                          key={`${thread.petId}-${thread.adopter}`}
                          onClick={() =>
                            navigate(`/rescuer/messages/${thread.petId}`, { state: { adopter: thread.adopter } })
                          }
                        >
                          {petImage ? (
                            <img className="rescuer-chat-thread-photo" src={petImage} alt="" />
                          ) : (
                            <span className="thread-avatar adopter-thread-avatar" aria-hidden="true">
                              {thread.adopterInitial}
                            </span>
                          )}
                          <span className="thread-main">
                            <span className="thread-head rescuer-chat-thread-head">
                              <span className="rescuer-chat-thread-title">
                                <strong>{petName}</strong>
                                <span className="rescuer-chat-thread-sep" aria-hidden="true">·</span>
                                <span className="rescuer-chat-thread-adopter">{thread.adopter}</span>
                              </span>
                              <time>{thread.time}</time>
                            </span>
                            <p className="rescuer-chat-thread-preview">{thread.preview}</p>
                          </span>
                          {thread.unread > 0 ? <span className="thread-badge">{thread.unread}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
        </div>
      </div>
    </ScreenShell>
  );
}

function rescuerProfileCityFromAddress(address: string) {
  const trimmed = address.trim();
  if (!trimmed) return "";
  return trimmed.includes(",") ? trimmed.split(",").slice(-2).join(",").trim() : trimmed;
}

function useRescuerDeviceLocationLabel(active: boolean) {
  const [label, setLabel] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "unavailable">("idle");

  useEffect(() => {
    if (!active) {
      setLabel(null);
      setStatus("idle");
      return;
    }
    if (!navigator.geolocation) {
      setStatus("unavailable");
      setLabel("Ubicación no disponible en este dispositivo");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const reverse = async () => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`,
              { headers: { Accept: "application/json" } },
            );
            if (!response.ok) throw new Error("reverse-geocode-failed");
            const data = (await response.json()) as {
              address?: Record<string, string>;
            };
            const city =
              data.address?.city ??
              data.address?.town ??
              data.address?.municipality ??
              data.address?.village;
            const state = data.address?.state;
            const next =
              city && state && city !== state
                ? `${city}, ${state}`
                : city || state || "Ubicación detectada";
            setLabel(next);
            setStatus("idle");
          } catch {
            setLabel("Ubicación detectada");
            setStatus("idle");
          }
        };
        void reverse();
      },
      () => {
        setStatus("unavailable");
        setLabel("Permite el acceso a tu ubicación para ver tu ciudad");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  }, [active]);

  const cityHint =
    status === "loading"
      ? "Detectando ubicación…"
      : label ?? (active ? "Detectando ubicación…" : "");
  const muted = active && (status === "loading" || status === "unavailable");

  return { cityHint, muted };
}

function RescuerProfile() {
  const navigate = useNavigate();
  const {
    verification,
    rescuerProfile: profile,
    setAccountMode,
    setVerification,
    cases,
    emptyStates,
  } = usePrototypeStore();
  const verified = verification === "verified";
  const aboutDescription = emptyStates
    ? "Cuéntanos sobre ti."
    : profile.description?.trim() || "Agrega una descripción breve sobre tu trabajo de rescate desde Editar.";
  const contactDisplay = (value: string) => (emptyStates ? "Por completar" : value);
  const accountName = profile.name.trim();
  const accountEmail = profile.email.trim();
  const savedCityHint = rescuerProfileCityFromAddress(profile.address);
  const { cityHint: deviceCityHint, muted: deviceCityMuted } = useRescuerDeviceLocationLabel(emptyStates);
  const cityHint = emptyStates ? deviceCityHint : savedCityHint;
  const cityHintMuted = emptyStates ? deviceCityMuted : false;
  const heroName = accountName || "Tu nombre";
  const heroInitial = (accountName.charAt(0) || "?").toUpperCase();
  const switchToDonor = () => {
    setAccountMode("donor");
    navigate("/adoption");
  };
  const publicProfileCaseId =
    cases.find((item) => rescuerCaseBelongsToProfile(item.rescuer, profile.name))?.id ??
    encodeURIComponent(profile.name.trim() || "María Rescatista");
  const hasSavedAccountData = rescuerHasSavedAccountData(verification, profile.clabe, emptyStates);
  const [verifyIntroOpen, setVerifyIntroOpen] = useState(false);
  const [verifyProfileDialog, setVerifyProfileDialog] = useState<null | { mode: "ready" } | { mode: "gaps"; fields: string[] }>(
    null,
  );
  const [toast, setToast] = useState("");
  const openVerifyCard = () => {
    if (verification === "rejected") {
      navigate("/rescuer/profile/edit");
      return;
    }
    const gaps = rescuerProfileVerificationGaps(profile, emptyStates);
    if (gaps.length) {
      setVerifyProfileDialog({ mode: "gaps", fields: gaps });
      return;
    }
    setVerifyProfileDialog({ mode: "ready" });
  };
  const openMiCuenta = () => {
    if (hasSavedAccountData) {
      navigate("/rescuer/settings");
      return;
    }
    setVerifyIntroOpen(true);
  };

  return (
    <ScreenShell mode="rescuer">
      <div className="profile-page profile-page--soft donor-chrome rescuer-profile-page">
        <DonorChromeTop />
        <header className="match-top">
          <h1>Mi perfil</h1>
        </header>

        <article className={`profile-hero rescuer${verified ? " verified" : ""}`}>
          <div className="profile-hero-main">
            <span
              className={`profile-hero-avatar${!emptyStates && profile.avatar ? " has-photo" : ""}`}
              aria-hidden="true"
            >
              {!emptyStates && profile.avatar ? <img src={profile.avatar} alt="" /> : heroInitial}
            </span>
            <div className="profile-hero-copy">
              <strong className={emptyStates && !accountName ? "rescuer-profile-contact-placeholder" : undefined}>
                {heroName}
              </strong>
              <small className={cityHintMuted ? "rescuer-profile-contact-placeholder" : undefined}>{cityHint}</small>
            </div>
          </div>
          <button
            type="button"
            className="profile-hero-edit"
            onClick={() => navigate("/rescuer/profile/edit")}
          >
            <Icon name="icon-edit.svg" size={16} />
            Editar
          </button>
        </article>

        {verified ? (
          <article
            className="profile-guardian-card is-active rescuer profile-guardian-card--static"
            aria-label="Cuenta verificada"
          >
            <span className="profile-guardian-icon" aria-hidden="true">
              <Icon name="icon-verified.svg" size={20} />
            </span>
            <span className="profile-guardian-copy">
              <strong>Cuenta verificada</strong>
            </span>
          </article>
        ) : verification === "review" ? (
          <article className={`verify-card rescuer-profile-verify rescuer-profile-verify--static ${verification}`}>
            <div className="verify-head">
              <span className="verify-chip">
                <Icon name="icon-shield.svg" size={24} />
              </span>
              <strong>Verificación en proceso</strong>
            </div>
          </article>
        ) : (
          <button
            type="button"
            className={`verify-card link-card rescuer-profile-verify ${verification}`}
            onClick={openVerifyCard}
          >
            <div className="verify-head">
              <span className="verify-chip">
                <Icon name="icon-shield.svg" size={24} />
              </span>
              <strong>
                {verification === "rejected" ? "Revisa tu información" : "Verifica tu cuenta"}
              </strong>
              <Chevron />
            </div>
          </button>
        )}

        <section className="rescuer-profile-about">
            <h2>Sobre ti</h2>
            <p className={emptyStates ? "rescuer-profile-about-placeholder" : undefined}>{aboutDescription}</p>
            <div className="rescuer-profile-contacts">
              <span className={emptyStates ? "rescuer-profile-contact-placeholder" : undefined}>
                <Icon name="icon-phone.svg" size={14} />
                {contactDisplay(profile.phone)}
              </span>
              <span className={emptyStates && !accountEmail ? "rescuer-profile-contact-placeholder" : undefined}>
                <Icon name="icon-mail.svg" size={14} />
                {accountEmail || "Por completar"}
              </span>
              <span className={emptyStates ? "rescuer-profile-contact-placeholder" : undefined}>
                <Icon name="icon-instagram.svg" size={14} />
                {contactDisplay(profile.instagram)}
              </span>
              <span className={emptyStates ? "rescuer-profile-contact-placeholder" : undefined}>
                <Icon name="icon-facebook.svg" size={14} />
                {contactDisplay(profile.facebook)}
              </span>
              {emptyStates || profile.website ? (
                <span className={emptyStates ? "rescuer-profile-contact-placeholder" : undefined}>
                  <Icon name="icon-globe.svg" size={14} />
                  {contactDisplay(profile.website ?? "")}
                </span>
              ) : null}
            </div>
          </section>

        <button
          type="button"
          className="profile-guardian-card is-active rescuer"
          onClick={() => navigate(`/rescuer-profile/${publicProfileCaseId}`)}
        >
          <span className="profile-guardian-icon" aria-hidden="true">
            <Icon name="icon-user.svg" size={20} />
          </span>
          <span className="profile-guardian-copy">
            <strong>Vista previa de tu perfil público</strong>
            <small>Esto es lo que verán los adoptantes.</small>
          </span>
          <Chevron />
        </button>

        <section className="profile-access" aria-label="Pagos y transacciones">
          <h2>Pagos y transacciones</h2>
          <div className="profile-access-grid">
            <button type="button" className="profile-access-item" onClick={openMiCuenta}>
              <span className="profile-access-icon" aria-hidden="true">
                <Icon name="icon-card.svg" size={22} />
              </span>
              <span>Mi cuenta</span>
            </button>
            <button
              type="button"
              className="profile-access-item"
              onClick={() => navigate("/history")}
            >
              <span className="profile-access-icon" aria-hidden="true">
                <Icon name="icon-billing.svg" size={22} />
              </span>
              <span>Mi historial</span>
            </button>
            <button
              type="button"
              className="profile-access-item"
              onClick={() => navigate("/help")}
            >
              <span className="profile-access-icon" aria-hidden="true">
                <Icon name="icon-help.svg" size={22} />
              </span>
              <span>¿Dudas?</span>
            </button>
          </div>
        </section>

        <button type="button" className="profile-feature profile-feature--mode" onClick={switchToDonor}>
          <span className="profile-feature-copy">
            <strong>Consulta casos en adopción</strong>
            <small>
              Cambia tu perfil a modo Adoptante. Siempre podrás regresar a la navegación como Rescatista.
            </small>
          </span>
          <span className="profile-feature-cta" aria-hidden="true">
            <Icon name="rtab-home.svg" size={22} />
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
      {verifyIntroOpen ? (
        <VerificationIntro
          onContinue={() => {
            setVerifyIntroOpen(false);
            navigate("/rescuer/verification");
          }}
          onLater={() => setVerifyIntroOpen(false)}
        />
      ) : null}
      {verifyProfileDialog ? (
        <RescuerVerifyProfileDialog
          mode={verifyProfileDialog.mode}
          missingFields={verifyProfileDialog.mode === "gaps" ? verifyProfileDialog.fields : []}
          onClose={() => setVerifyProfileDialog(null)}
          onEditProfile={() => {
            setVerifyProfileDialog(null);
            navigate("/rescuer/profile/edit");
          }}
          onSubmitRequest={() => {
            setVerification("review");
            setVerifyProfileDialog(null);
            setToast("Solicitud de verificación enviada");
          }}
        />
      ) : null}
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </ScreenShell>
  );
}

const emptyRescuerPublicProfileForm = {
  name: "",
  description: "",
  email: "",
  phone: "",
  phoneVerified: false,
  address: "",
  website: "",
  instagram: "",
  facebook: "",
  avatar: "",
  showPublicToAdopters: true,
};

function emptyRescuerPublicProfileFormFromAccount(profile: RescuerProfile) {
  return {
    ...emptyRescuerPublicProfileForm,
    name: profile.name,
    email: profile.email,
  };
}

function RescuerPhoneSmsVerifyDialog({
  initialPhone,
  onClose,
  onVerified,
}: {
  initialPhone: string;
  onClose: () => void;
  onVerified: (phone: string) => void;
}) {
  const [phone, setPhone] = useState(initialPhone.replace(/\D/g, ""));
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const canConfirm = phone.length >= 10 && code.trim().length >= 4;

  return (
    <div className="modal-backdrop center" onClick={onClose} role="presentation">
      <div
        className="dialog-card rescuer-phone-verify-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rescuer-phone-verify-title"
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 id="rescuer-phone-verify-title">Verifica tu teléfono</h2>
        <p className="dialog-copy">
          Te enviaremos un código por SMS. Ingresa tu número y el código que recibas para vincularlo a tu cuenta.
        </p>
        <label className="dialog-field">
          <span>Número de teléfono</span>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
            placeholder="525512345678"
            autoComplete="tel"
          />
        </label>
        <button
          type="button"
          className="secondary-button rescuer-phone-verify-send"
          disabled={phone.length < 10}
          onClick={() => setCodeSent(true)}
        >
          {codeSent ? "Código enviado" : "Enviar código"}
        </button>
        <label className="dialog-field">
          <span>Código SMS</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="6 dígitos"
            autoComplete="one-time-code"
          />
        </label>
        <button
          type="button"
          className="purple-button"
          disabled={!canConfirm}
          onClick={() => {
            onVerified(phone);
            onClose();
          }}
        >
          Confirmar
        </button>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function rescuerPublicProfileFormFromProfile(profile: RescuerProfile) {
  return {
    name: profile.name,
    description: profile.description,
    email: profile.email,
    phone: profile.phone.replace(/\D/g, ""),
    phoneVerified: profile.phoneVerified ?? false,
    address: profile.address,
    website: profile.website,
    instagram: profile.instagram,
    facebook: profile.facebook,
    avatar: profile.avatar ?? "",
    showPublicToAdopters: profile.showPublicToAdopters ?? true,
  };
}

function rescuerRejectionFieldClass(
  field: RescuerVerificationFixField,
  fieldsToFix: RescuerVerificationFixField[] | undefined,
) {
  return fieldsToFix?.includes(field) ? "field-rejected" : "";
}

type RescuerPublicProfileFormState = ReturnType<typeof rescuerPublicProfileFormFromProfile>;

function rescuerVerificationSensitiveFieldsChanged(
  form: RescuerPublicProfileFormState,
  profile: RescuerProfile,
) {
  const savedPhone = profile.phone.replace(/\D/g, "");
  const formPhone = form.phone.replace(/\D/g, "");
  return (
    form.name.trim() !== profile.name.trim() ||
    (form.avatar ?? "") !== (profile.avatar ?? "") ||
    formPhone !== savedPhone ||
    Boolean(form.phoneVerified) !== Boolean(profile.phoneVerified) ||
    form.instagram.trim() !== profile.instagram.trim() ||
    form.facebook.trim() !== profile.facebook.trim()
  );
}

function RescuerEditPublicProfile() {
  const navigate = useNavigate();
  const {
    rescuerProfile,
    updateRescuerProfile,
    emptyStates,
    cases,
    verification,
    rescuerVerificationFeedback,
    setVerification,
  } = usePrototypeStore();
  const rejectionFeedback =
    verification === "rejected"
      ? rescuerVerificationFeedback ?? defaultRescuerVerificationRejection
      : null;
  const rejectClass = (field: RescuerVerificationFixField) =>
    rescuerRejectionFieldClass(field, rejectionFeedback?.fieldsToFix);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() =>
    emptyStates
      ? emptyRescuerPublicProfileFormFromAccount(rescuerProfile)
      : rescuerPublicProfileFormFromProfile(rescuerProfile),
  );
  useEffect(() => {
    setForm(
      emptyStates
        ? emptyRescuerPublicProfileFormFromAccount(rescuerProfile)
        : rescuerPublicProfileFormFromProfile(rescuerProfile),
    );
  }, [emptyStates, rescuerProfile]);
  const [toast, setToast] = useState("");
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);
  const canSave = Boolean(form.name.trim() && form.email.trim());
  const verificationSensitiveDirty = useMemo(
    () => !emptyStates && rescuerVerificationSensitiveFieldsChanged(form, rescuerProfile),
    [emptyStates, form, rescuerProfile],
  );
  const submitForReReview =
    verification === "rejected" || (verification === "verified" && verificationSensitiveDirty);
  const previewCaseId = useMemo(() => {
    const name = form.name.trim() || rescuerProfile.name;
    return (
      cases.find((item) => rescuerCaseBelongsToProfile(item.rescuer, name))?.id ??
      encodeURIComponent(name.trim() || "María Rescatista")
    );
  }, [cases, form.name, rescuerProfile.name]);

  const openPublicPreview = () => {
    updateRescuerProfile({
      name: form.name.trim(),
      description: form.description.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      phoneVerified: form.phoneVerified,
      address: form.address.trim(),
      website: form.website.trim(),
      instagram: form.instagram.trim(),
      facebook: form.facebook.trim(),
      avatar: form.avatar || undefined,
      showPublicToAdopters: form.showPublicToAdopters,
    });
    navigate(`/rescuer-profile/${previewCaseId}`);
  };

  const pickPhoto = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setForm((current) => ({ ...current, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name || !email) return;
    updateRescuerProfile({
      name,
      description: form.description.trim(),
      email,
      phone: form.phone.trim(),
      phoneVerified: form.phoneVerified,
      address: form.address.trim(),
      website: form.website.trim(),
      instagram: form.instagram.trim(),
      facebook: form.facebook.trim(),
      avatar: form.avatar || undefined,
      showPublicToAdopters: form.showPublicToAdopters,
    });
    if (submitForReReview) {
      setVerification("review");
      setToast("Cambios guardados. Tu solicitud está en revisión.");
    } else {
      setToast("Perfil actualizado");
    }
    window.setTimeout(() => navigate("/rescuer/profile"), 500);
  };
  const saveCtaLabel = submitForReReview ? "Guardar y enviar a revisión" : "Guardar cambios";

  return (
    <div className="plain-screen rescuer-theme">
      <TopBar title="Información básica" back="/rescuer/profile" />
      <div className="content-pad form-stack edit-public-profile">
        {rejectionFeedback ? (
          <div className="rescuer-verification-admin-banner" role="alert">
            <strong>Comentarios del administrador</strong>
            <p>{rejectionFeedback.adminComment}</p>
          </div>
        ) : null}
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
        <section
          className="edit-public-profile-section"
          aria-labelledby="edit-public-profile-basic-heading"
        >
          <h2 id="edit-public-profile-basic-heading">Información básica</h2>
          <div className={`photo-card ${rejectClass("avatar")}`.trim()}>
            <span className={`avatar large ${!emptyStates && form.avatar ? "has-photo" : ""}`}>
              {!emptyStates && form.avatar ? (
                <img src={form.avatar} alt="" />
              ) : (
                form.name.trim().charAt(0) || "?"
              )}
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
          <label className={`publish-field ${rejectClass("name")}`.trim()}>
            <span>Nombre *</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Tu nombre o el de tu refugio"
              autoComplete="name"
            />
          </label>
          <label className={`publish-field ${rejectClass("email")}`.trim()}>
            <span>Correo electrónico *</span>
            <input
              type="email"
              required
              readOnly
              aria-readonly="true"
              value={form.email}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              title="El correo no se puede editar aquí"
            />
          </label>
          <label className={`publish-field publish-field--phone-link ${rejectClass("phone")}`.trim()}>
            <span>Teléfono</span>
            <article className={`card-row ${rejectClass("phone")}`.trim()}>
              <span className="nav-row-text">
                <small>
                  {form.phoneVerified && form.phone
                    ? `+${form.phone}`
                    : "Verifica tu número con un código por SMS"}
                </small>
              </span>
              <button
                type="button"
                className="purple-button compact"
                onClick={() => {
                  if (form.phoneVerified) return;
                  setPhoneVerifyOpen(true);
                }}
              >
                {form.phoneVerified ? "Vinculado" : "Vincular"}
              </button>
            </article>
          </label>
          <label className={`publish-field ${rejectClass("address")}`.trim()}>
            <span>Dirección</span>
            <input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Calle, colonia, ciudad"
              autoComplete="street-address"
            />
          </label>
          <label className={`publish-field ${rejectClass("description")}`.trim()}>
            <span>Sobre ti</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Cuenta quién eres y cómo ayudas a las mascotas"
              rows={5}
            />
          </label>
        </section>
        <section className="edit-public-profile-section" aria-labelledby="edit-public-profile-networks-heading">
          <h2 id="edit-public-profile-networks-heading">Redes</h2>
          <article className={`card-row ${rejectClass("instagram")}`.trim()}>
            <span className="nav-row-text">
              <strong>Instagram</strong>
              <small>Vincula tu cuenta de Instagram</small>
            </span>
            <button
              type="button"
              className="purple-button compact"
              onClick={() => {
                if (form.instagram.trim()) return;
                setForm({ ...form, instagram: "@maria.rescata" });
              }}
            >
              {form.instagram.trim() ? "Vinculado" : "Vincular"}
            </button>
          </article>
          <article className={`card-row ${rejectClass("facebook")}`.trim()}>
            <span className="nav-row-text">
              <strong>Facebook</strong>
              <small>Vincula tu cuenta de Facebook</small>
            </span>
            <button
              type="button"
              className="purple-button compact"
              onClick={() => {
                if (form.facebook.trim()) return;
                setForm({ ...form, facebook: "Maria Rescatista" });
              }}
            >
              {form.facebook.trim() ? "Vinculado" : "Vincular"}
            </button>
          </article>
          <label className={`publish-field ${rejectClass("website")}`.trim()}>
            <span>Página web</span>
            <input
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
              placeholder="www.ejemplo.mx"
              autoComplete="url"
              inputMode="url"
            />
          </label>
        </section>
        <div className="edit-public-profile-visibility check-row">
          <input
            id="rescuer-show-public-profile"
            type="checkbox"
            checked={form.showPublicToAdopters}
            onChange={(event) => setForm({ ...form, showPublicToAdopters: event.target.checked })}
          />
          <label htmlFor="rescuer-show-public-profile" className="edit-public-profile-visibility-copy">
            Quiero mostrar esta información en mi perfil a los adoptantes.{" "}
            <button
              type="button"
              className="edit-public-profile-preview"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openPublicPreview();
              }}
            >
              Ver vista previa &gt;
            </button>
          </label>
        </div>
        <button type="button" className="purple-button" disabled={!canSave} onClick={save}>
          {saveCtaLabel}
        </button>
        <button type="button" className="secondary-button" onClick={() => navigate("/rescuer/profile")}>
          Cancelar
        </button>
      </div>
      {phoneVerifyOpen ? (
        <RescuerPhoneSmsVerifyDialog
          initialPhone={form.phone}
          onClose={() => setPhoneVerifyOpen(false)}
          onVerified={(phone) => {
            setForm({ ...form, phone, phoneVerified: true });
            setToast("Teléfono verificado");
          }}
        />
      ) : null}
      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}

function RescuerSettings() {
  const navigate = useNavigate();
  const { verification, rescuerProfile, updateRescuerProfile } = usePrototypeStore();
  const verified = verification === "verified";
  const [editField, setEditField] = useState<"clabe" | null>(null);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState("");
  const statusCard = {
    unverified: { title: "No verificada", copy: "Completa tu verificación para desbloquear donaciones y reembolsos.", cta: "Iniciar verificación" },
    review: { title: "Verificación en proceso", copy: "Estamos revisando tu información. Te avisaremos en cuanto termine.", cta: "Ver estado" },
    rejected: { title: "Verificación con errores", copy: "Hay información que debes corregir para continuar.", cta: "Corregir información" },
    verified: { title: "Cuenta verificada", copy: "Tu cuenta está activa y puede recibir donaciones.", cta: "" },
  }[verification];

  const openEdit = () => {
    setEditField("clabe");
    setDraft(rescuerProfile.clabe);
  };

  const saveEdit = () => {
    if (!editField) return;
    const value = draft.trim();
    if (!value) return;
    if (!/^\d{18}$/.test(value)) return;
    updateRescuerProfile({ clabe: value });
    setEditField(null);
    setToast("CLABE actualizada");
  };

  const editMeta = editField
    ? {
        title: "Editar CLABE",
        label: "CLABE interbancaria",
        placeholder: "18 dígitos",
        hint: "Debe tener exactamente 18 números.",
        inputMode: "numeric" as const,
        maxLength: 18,
        canSave: /^\d{18}$/.test(draft.trim()),
      }
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
            <h2 className="settings-heading">Datos bancarios</h2>
            <article className="card-row">
              <span className="nav-row-text"><small>CLABE</small><strong>{rescuerProfile.clabe}</strong></span>
              <button type="button" className="icon-button" onClick={openEdit} aria-label="Editar CLABE">
                <Icon name="icon-edit.svg" size={16} />
              </button>
            </article>
            <p className="field-hint">La CLABE solo es visible para ti y nunca se muestra a los donantes.</p>
          </>
        ) : null}
      </div>
      {editField && editMeta ? (
        <div className="modal-backdrop center" onClick={() => setEditField(null)}>
          <div className="dialog-card settings-edit-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="dialog-close" onClick={() => setEditField(null)} aria-label="Cerrar">
              ×
            </button>
            <h2>{editMeta.title}</h2>
            <label className="dialog-field">
              <span>{editMeta.label}</span>
              <input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 18))}
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
    <div className={`plain-screen${accountMode === "rescuer" ? " rescuer-theme" : ""}`}>
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

function rescuerDefiniteArticle(rescuerName: string): "el" | "la" {
  const first = rescuerName.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (first.includes("refugio")) return "el";
  const feminine = ["maría", "maria", "patricia", "ana", "sofía", "sofia", "lucía", "lucia", "irlanda"];
  if (feminine.some((name) => first === name || first.startsWith(name))) return "la";
  return "el";
}

function AdoptStartDialog({
  petName,
  rescuer,
  onClose,
  onConfirm,
}: {
  petName: string;
  rescuer?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const rescuerArticle = rescuerDefiniteArticle(rescuer ?? "María R.");
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
        <h2 id="adopt-start-title">Conectar con {petName}</h2>
        <p>
          Iniciaremos un chat con {rescuerArticle} rescatista para que pueda resolver tus dudas y ayudarte a conocer a
          tu nuevo mejor amigo.
        </p>
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

type RescuerPublicMediaItem = {
  id: string;
  name: string;
  image: string;
  link: string;
  species: "Perro" | "Gato";
  sex: "Macho" | "Hembra";
  size: PetSize;
  personality: PetPersonality[];
};

function PublicRescuerProfile() {
  const navigate = useNavigate();
  const { caseId = "" } = useParams();
  const { cases, rescuerProfile } = usePrototypeStore();
  const fromCase = cases.find((item) => item.id === caseId);
  const name = fromCase?.rescuer ?? decodeURIComponent(caseId);
  const rescuer = rescuers.find((item) => item.name === name) ?? rescuers[0];
  const [tab, setTab] = useState<"adoption" | "support" | "overview">("overview");
  const [report, setReport] = useState(false);
  const [toast, setToast] = useState("");
  const [mediaFilterOpen, setMediaFilterOpen] = useState(false);
  const [draftSpecies, setDraftSpecies] = useState<DiscoverSpeciesChoice | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<DiscoverSpeciesChoice | null>(null);
  const [draftSex, setDraftSex] = useState<"Macho" | "Hembra" | null>(null);
  const [sexFilter, setSexFilter] = useState<"Macho" | "Hembra" | null>(null);
  const [draftSize, setDraftSize] = useState<PetSize | null>(null);
  const [sizeFilter, setSizeFilter] = useState<PetSize | null>(null);
  const [draftPersonality, setDraftPersonality] = useState<PetPersonality[]>([]);
  const [personalityFilter, setPersonalityFilter] = useState<PetPersonality[]>([]);
  const mediaFiltersActive =
    !!speciesFilter || !!sexFilter || !!sizeFilter || personalityFilter.length > 0;
  const openAdoptionFilters = () => {
    setDraftSpecies(speciesFilter);
    setDraftSex(sexFilter);
    setDraftSize(sizeFilter);
    setDraftPersonality(personalityFilter);
    setMediaFilterOpen(true);
  };
  const applyAdoptionFilters = () => {
    setSpeciesFilter(draftSpecies);
    setSexFilter(draftSex);
    setSizeFilter(draftSize);
    setPersonalityFilter(draftPersonality);
    setMediaFilterOpen(false);
  };
  const clearAdoptionFilters = () => {
    setDraftSpecies(null);
    setDraftSex(null);
    setDraftSize(null);
    setDraftPersonality([]);
    setSpeciesFilter(null);
    setSexFilter(null);
    setSizeFilter(null);
    setPersonalityFilter([]);
    setMediaFilterOpen(false);
  };
  const ownCases = cases.filter((item) => item.rescuer === rescuer.name);
  const adoptionList = useMemo(
    () => [
      ...ownCases
        .filter((item) => item.adoption)
        .map((item) => ({
          id: item.id,
          name: item.name,
          image: item.image,
          link: `/case/${item.id}`,
        })),
      ...adoptionPets
        .filter((item) => item.rescuer === rescuer.name)
        .map((item) => ({
          id: item.id,
          name: item.name,
          image: item.image,
          link: `/adoption/${item.id}`,
        })),
    ],
    [ownCases, rescuer.name],
  );
  const isAdoptionListingActive = (id: string) => {
    const pet = adoptionPets.find((entry) => entry.id === id);
    if (pet) return pet.listed !== false;
    const petCase = ownCases.find((entry) => entry.id === id);
    return petCase?.caseStatus === "active";
  };
  const adoptionActiveList = useMemo(
    () => adoptionList.filter((item) => isAdoptionListingActive(item.id)),
    [adoptionList, ownCases],
  );
  const supportActiveList = useMemo(
    () =>
      ownCases.filter(
        (item) =>
          item.caseStatus === "active" &&
          item.needs.some((need) => need.status === "active" && need.funded < need.requested),
      ),
    [ownCases],
  );
  const adoptionMediaList = useMemo((): RescuerPublicMediaItem[] => {
    return adoptionActiveList.map((item) => {
      const pet = adoptionPets.find((entry) => entry.id === item.id);
      const petCase = ownCases.find((entry) => entry.id === item.id);
      let species: "Perro" | "Gato" = petCase?.species ?? "Perro";
      if (pet) {
        if ("species" in pet && (pet.species === "Perro" || pet.species === "Gato")) {
          species = pet.species;
        } else if ("type" in pet && (pet.type === "Perro" || pet.type === "Gato")) {
          species = pet.type;
        }
      }
      const sex = pet?.sex ?? petCase?.sex ?? "Macho";
      const size: PetSize = pet && "size" in pet ? pet.size : "Mediano";
      const personality: PetPersonality[] =
        pet && "personality" in pet ? [...pet.personality] as PetPersonality[] : [];
      return {
        ...item,
        species,
        sex,
        size,
        personality,
      };
    });
  }, [adoptionActiveList, ownCases]);
  const supportMediaList = useMemo((): RescuerPublicMediaItem[] => {
    return supportActiveList.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      link: `/case/${item.id}`,
      species: item.species,
      sex: item.sex,
      size: "Mediano" as PetSize,
      personality: [] as PetPersonality[],
    }));
  }, [supportActiveList]);
  const filterAdoptionMediaList = (items: RescuerPublicMediaItem[]) =>
    items.filter((item) => {
      if (speciesFilter && item.species !== speciesFilter) return false;
      if (sexFilter && item.sex !== sexFilter) return false;
      if (sizeFilter && item.size !== sizeFilter) return false;
      if (
        personalityFilter.length &&
        !personalityFilter.some((trait) => item.personality.includes(trait))
      ) {
        return false;
      }
      return true;
    });
  const renderAdoptionMediaPanel = (items: RescuerPublicMediaItem[], emptyMessage: string) => {
    if (!items.length) {
      return <p className="empty-inline">{emptyMessage}</p>;
    }
    const visible = filterAdoptionMediaList(items);
    return (
      <>
        <div className="rescuer-public-media-head">
          <RescuerPublicFilterButton active={mediaFiltersActive} onClick={openAdoptionFilters} />
        </div>
        {visible.length ? (
          <div className="rescuer-public-media-grid">
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rescuer-public-media-cell"
                onClick={() => navigate(item.link)}
                aria-label={`Ver a ${item.name}`}
              >
                <img src={item.image} alt={item.name} />
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-inline">No hay mascotas con este filtro.</p>
        )}
      </>
    );
  };
  const adoptionActiveCount = adoptionActiveList.length;
  const adoptionClosedCount = ownCases.filter(
    (item) => item.adoption && item.caseStatus === "closed",
  ).length;
  const supportActiveCount = supportActiveList.length;
  const supportClosedCount = ownCases.filter((item) => {
    if (item.adoption || !item.needs.length) return false;
    if (item.caseStatus === "closed") return true;
    const goal = item.needs.reduce((sum, need) => sum + need.requested, 0);
    const received = item.needs.reduce((sum, need) => sum + need.funded, 0);
    return goal > 0 && received >= goal;
  }).length;
  const monthsOnDopmi = rescuer.monthsOnDopmi;
  const rescuerInitial = rescuer.name.trim().charAt(0).toUpperCase();
  const profileMatchesAccount = rescuerCaseBelongsToProfile(rescuer.name, rescuerProfile.name);
  const profileAvatar = profileMatchesAccount && rescuerProfile.avatar ? rescuerProfile.avatar : "";
  const publicContact = profileMatchesAccount
    ? {
        email: rescuerProfile.email,
        phone: rescuerProfile.phone,
        address: rescuerProfile.address,
        website: rescuerProfile.website ?? "",
      }
    : { ...rescuer.contact, website: "" };
  const showAdopterFacingDetails =
    !profileMatchesAccount || (rescuerProfile.showPublicToAdopters ?? true);
  const publicBio = profileMatchesAccount ? rescuerProfile.description.trim() : rescuer.bio.trim();
  const publicInstagram = profileMatchesAccount
    ? rescuerProfile.instagram.trim()
    : rescuer.social.instagram.trim();
  const publicFacebook = profileMatchesAccount
    ? rescuerProfile.facebook.trim()
    : rescuer.social.facebook.trim();
  const publicEmail = publicContact.email.trim();
  const publicPhone = publicContact.phone.trim();
  const publicAddress = publicContact.address.trim();
  const publicWebsite = publicContact.website.trim();
  const showPublicBio = showAdopterFacingDetails && Boolean(publicBio);
  const showPublicEmail = showAdopterFacingDetails && Boolean(publicEmail);
  const showPublicPhone = showAdopterFacingDetails && Boolean(publicPhone);
  const showPublicAddress = showAdopterFacingDetails && Boolean(publicAddress);
  const showPublicWebsite = showAdopterFacingDetails && Boolean(publicWebsite);
  const showPublicContactRow =
    showPublicEmail || showPublicPhone || showPublicAddress || showPublicWebsite;
  const showPublicInstagram = showAdopterFacingDetails && Boolean(publicInstagram);
  const showPublicFacebook = showAdopterFacingDetails && Boolean(publicFacebook);
  const showPublicSocialActions = showPublicInstagram || showPublicFacebook;
  const overviewStats: {
    value: number;
    label: string;
    sub: string;
    tone: keyof typeof ADOPTION_FUNNEL_CARD_SPARK;
  }[] = [
    {
      value: adoptionActiveCount,
      label: "Mascotas están buscando un hogar.",
      sub: "",
      tone: "views",
    },
    {
      value: adoptionClosedCount,
      label: "Mascotas encontraron un hogar.",
      sub: "",
      tone: "matches",
    },
    {
      value: supportActiveCount,
      label: "Mascotas están recibiendo apoyo.",
      sub: "",
      tone: "messages",
    },
    {
      value: supportClosedCount,
      label: "Mascotas recibieron apoyo.",
      sub: "",
      tone: "adoptions",
    },
  ];

  return (
    <div className="plain-screen">
      <TopBar
        back={fromCase ? `/case/${fromCase.id}` : "/saved-rescuers"}
        actions={
          <button className="icon-button" onClick={() => setToast("Enlace del perfil copiado")} aria-label="Compartir">
            <Icon name="icon-share.svg" size={20} />
          </button>
        }
      />
      <div className="content-pad rescuer-public">
        <header className="rescuer-public-header">
          <div className="rescuer-public-card">
            <div className={`rescuer-public-avatar${profileAvatar ? " has-photo" : ""}`}>
              {profileAvatar ? <img src={profileAvatar} alt="" /> : rescuerInitial}
            </div>
            <h1 className="rescuer-public-name">
              {rescuer.name}
              {rescuer.verified ? <AssetIcon name="icon-verified.svg" size={20} alt="Verificado" /> : null}
            </h1>
            <p className="rescuer-public-location">
              <Icon name="location.svg" size={14} />
              {rescuer.city}
            </p>
            {showPublicBio ? <p className="rescuer-public-bio">{publicBio}</p> : null}
            {showPublicContactRow ? (
              <div className="rescuer-public-contact-row" aria-label="Contacto">
                {showPublicEmail ? (
                  <button
                    type="button"
                    className="rescuer-public-circle-btn"
                    aria-label="Correo"
                    onClick={() => setToast(`Correo: ${publicEmail} (simulado)`)}
                  >
                    <Icon name="icon-mail.svg" size={20} />
                  </button>
                ) : null}
                {showPublicPhone ? (
                  <button
                    type="button"
                    className="rescuer-public-circle-btn"
                    aria-label="Teléfono"
                    onClick={() => setToast(`Teléfono: ${publicPhone} (simulado)`)}
                  >
                    <Icon name="icon-phone.svg" size={20} />
                  </button>
                ) : null}
                {showPublicAddress ? (
                  <button
                    type="button"
                    className="rescuer-public-circle-btn"
                    aria-label="Dirección"
                    onClick={() => setToast(`Dirección: ${publicAddress} (simulado)`)}
                  >
                    <Icon name="location.svg" size={20} />
                  </button>
                ) : null}
                {showPublicWebsite ? (
                  <button
                    type="button"
                    className="rescuer-public-circle-btn"
                    aria-label="Página web"
                    onClick={() => setToast(`Página web: ${publicWebsite} (simulado)`)}
                  >
                    <Icon name="icon-globe.svg" size={20} />
                  </button>
                ) : null}
              </div>
            ) : null}
            {showPublicSocialActions ? (
              <div className="rescuer-public-social-actions">
                {showPublicInstagram ? (
                  <button
                    type="button"
                    onClick={() => setToast(`Instagram ${publicInstagram} (simulado)`)}
                  >
                    <Icon name="icon-instagram.svg" size={18} />
                    Instagram
                  </button>
                ) : null}
                {showPublicFacebook ? (
                  <button
                    type="button"
                    onClick={() => setToast(`Facebook ${publicFacebook} (simulado)`)}
                  >
                    <Icon name="icon-facebook.svg" size={18} />
                    Facebook
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <div className="rescuer-public-tabs" role="tablist" aria-label="Contenido del perfil">
          {(
            [
              { id: "overview" as const, label: "Resumen" },
              { id: "adoption" as const, label: "Adopción" },
              { id: "support" as const, label: "Apoyo" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "is-active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="rescuer-public-panel" role="tabpanel">
          {tab === "adoption"
            ? renderAdoptionMediaPanel(
                adoptionMediaList,
                "No hay mascotas en adopción activas por ahora.",
              )
            : null}

          {tab === "support" ? (
            supportMediaList.length ? (
              <div className="rescuer-public-media-grid">
                {supportMediaList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="rescuer-public-media-cell"
                    onClick={() => navigate(item.link)}
                    aria-label={`Ver caso de ${item.name}`}
                  >
                    <img src={item.image} alt={item.name} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-inline">No hay casos en apoyo activos por ahora.</p>
            )
          ) : null}

          {tab === "overview" ? (
            <section className="rescuer-public-overview-block" aria-label="Resumen del rescatista">
              <p className="rescuer-public-overview-lead">Gracias a {rescuer.name}:</p>
              <div className="rh-adoption-funnel rescuer-public-overview">
                {overviewStats.map((stat) => {
                  const displayValue = stat.value.toLocaleString("es-MX");
                  return (
                    <article
                      key={stat.tone}
                      className={`rh-adoption-funnel-card rh-adoption-funnel-card--${stat.tone}`}
                      aria-label={`${displayValue}. ${stat.label}`}
                    >
                      <p className="rh-adoption-funnel-value">{displayValue}</p>
                      <span className="rh-adoption-funnel-card-icon" aria-hidden="true">
                        <Icon name={RESCUER_PUBLIC_OVERVIEW_ICONS[stat.tone]} size={22} />
                      </span>
                      <div className="rh-adoption-funnel-card-copy">
                        <p className="rh-adoption-funnel-label">{stat.label}</p>
                        {stat.sub ? <p className="rh-adoption-funnel-hint">{stat.sub}</p> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="rescuer-public-overview-thanks">
                {rescuer.name} lleva <strong>{monthsOnDopmi} meses activo en DopMi.</strong>
                <br />
                ¡Gracias por ser parte de la manada!
              </p>
            </section>
          ) : null}
        </div>
        <button type="button" className="pet-detail-report pet-detail-report--footer" onClick={() => setReport(true)}>
          <Icon name="icon-alert-circle.svg" size={16} />
          Reportar perfil
        </button>
      </div>
      <AdoptionFilterModal
        open={mediaFilterOpen}
        onClose={() => setMediaFilterOpen(false)}
        showSpecies
        draftSpecies={draftSpecies}
        setDraftSpecies={setDraftSpecies}
        draftSex={draftSex}
        setDraftSex={setDraftSex}
        draftSize={draftSize}
        setDraftSize={setDraftSize}
        draftPersonality={draftPersonality}
        setDraftPersonality={setDraftPersonality}
        onApply={applyAdoptionFilters}
        onClear={clearAdoptionFilters}
      />
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
          <Route path="/apoya-causa" element={<SupportCause shellMode="donor" />} />
          <Route path="/rescuer/apoya-causa" element={<SupportCause shellMode="rescuer" />} />
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
          <Route path="/rescuer/messages/:threadId" element={<Messages />} />
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
