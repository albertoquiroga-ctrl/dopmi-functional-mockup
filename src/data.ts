export type Need = {
  id: string;
  title: string;
  type: "Veterinario" | "Medicina" | "Comida" | "Otra";
  requested: number;
  funded: number;
  recurring?: boolean;
  status: "active" | "funded" | "evidence" | "completed";
  brand?: string;
  weightKg?: number;
  units?: number;
  ticketSpend?: number;
  medicineName?: string;
  treatment?: string;
  clinicName?: string;
  consultReason?: string;
  clinicPhone?: string;
  ticketPhoto?: string;
};

export type CaseStatus =
  | "draft"
  | "review"
  | "needs_corrections"
  | "approved_stripe_pending"
  | "active"
  | "funded"
  | "rejected"
  | "closed";

export type PetCase = {
  id: string;
  name: string;
  breed?: string;
  age: string;
  sex?: "Macho" | "Hembra";
  species?: "Perro" | "Gato";
  image: string;
  photos?: string[];
  story: string;
  location: string;
  rescuer: string;
  distance: string;
  adoption: boolean;
  caseStatus: CaseStatus;
  health: { vaccinated: boolean; sterilized: boolean; specialCare: string };
  social: { dogs: boolean; cats: boolean; children: boolean };
  needs: Need[];
  feeMxn?: number;
  contextVideo?: string;
  thankYouVideo?: string;
  categoryEvidence?: Array<{ category: string; photo?: string; caption?: string }>;
  size?: "Chico" | "Mediano" | "Grande";
  ageBand?: "Cachorro" | "Adulto" | "Viejo";
  energy?: "Poco activo" | "Activo" | "Muy activo";
  personality?: string;
};

export const initialCases: PetCase[] = [
  {
    id: "luna",
    name: "Luna",
    breed: "Mestiza",
    age: "Cachorro",
    sex: "Hembra",
    species: "Perro",
    image: "/assets/luna-card.png",
    story: "La encontraron abandonada en un parque. Es dulce, juguetona y busca una familia para siempre.",
    location: "San Pedro Garza García, NL",
    rescuer: "María R.",
    distance: "1.2 km",
    adoption: true,
    caseStatus: "active",
    ageBand: "Cachorro",
    size: "Chico",
    energy: "Muy activo",
    personality: "Alegre",
    health: { vaccinated: true, sterilized: false, specialCare: "Seguimiento de crecimiento" },
    social: { dogs: true, cats: true, children: true },
    needs: [
      { id: "luna-food", title: "Alimento cachorro 1.5 kg", type: "Comida", requested: 18, funded: 12, recurring: true, status: "active" },
      { id: "luna-meds", title: "Tabletas antiparasitarias", type: "Medicina", requested: 15, funded: 15, status: "funded" },
      { id: "luna-vet", title: "Consulta inicial", type: "Veterinario", requested: 40, funded: 25, status: "active" },
    ],
  },
  {
    id: "milo",
    name: "Milo",
    breed: "Atigrado",
    age: "2 años",
    sex: "Macho",
    species: "Gato",
    image: "/assets/milo-card.png",
    story: "Atropellado; se recupera bien gracias al apoyo de la comunidad.",
    location: "San Pedro, MX",
    rescuer: "Carlos Ruiz",
    distance: "2.1 km",
    adoption: false,
    caseStatus: "active",
    health: { vaccinated: true, sterilized: true, specialCare: "Curación diaria" },
    social: { dogs: false, cats: true, children: true },
    needs: [
      { id: "milo-med", title: "Spray para heridas", type: "Medicina", requested: 12, funded: 8, status: "active" },
      { id: "milo-food", title: "Pack comida húmeda x12", type: "Comida", requested: 22, funded: 22, recurring: true, status: "funded" },
      { id: "milo-vet", title: "Tratamiento de pata", type: "Veterinario", requested: 80, funded: 45, status: "active" },
    ],
  },
  {
    id: "nina",
    name: "Nina",
    breed: "Mestiza",
    age: "4 años",
    sex: "Hembra",
    species: "Perro",
    image: "/assets/nina-card.png",
    story: "Nina necesita una revisión veterinaria antes de encontrar un hogar tranquilo.",
    location: "Guadalupe, MX",
    rescuer: "Refugio Patitas",
    distance: "4.8 km",
    adoption: false,
    caseStatus: "active",
    health: { vaccinated: false, sterilized: true, specialCare: "Revisión de cadera" },
    social: { dogs: true, cats: false, children: true },
    needs: [
      { id: "nina-vet", title: "Estudios de cadera", type: "Veterinario", requested: 95, funded: 45, status: "active" },
    ],
  },
  {
    id: "rocky",
    name: "Rocky",
    breed: "Pastor mestizo",
    age: "Adulto",
    sex: "Macho",
    species: "Perro",
    image: "/assets/rocky.png",
    story: "Rocky ya completó su tratamiento y está listo para encontrar hogar.",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "3.4 km",
    adoption: true,
    caseStatus: "active",
    ageBand: "Adulto",
    size: "Grande",
    energy: "Activo",
    personality: "Cariñoso",
    health: { vaccinated: true, sterilized: true, specialCare: "Ninguno" },
    social: { dogs: true, cats: false, children: true },
    needs: [
      { id: "rocky-vet", title: "Veterinario", type: "Veterinario", requested: 80, funded: 80, status: "funded" },
    ],
  },
  {
    id: "bluh",
    name: "Bluh",
    breed: "Siamés",
    age: "4 años",
    sex: "Macho",
    species: "Gato",
    image: "/assets/milo-card.png",
    story: "Publicación sin terminar.",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "0 km",
    adoption: false,
    caseStatus: "draft",
    health: { vaccinated: false, sterilized: false, specialCare: "Por definir" },
    social: { dogs: true, cats: true, children: true },
    needs: [],
  },
  {
    id: "nube-review",
    name: "Nube",
    breed: "Mestiza",
    age: "8 meses",
    sex: "Hembra",
    species: "Perro",
    image: "/assets/publish-sample-pet.jpg",
    story: "Rescatada hace poco. El caso está en revisión por el equipo DopMi.",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "1.2 km",
    adoption: false,
    caseStatus: "review",
    health: { vaccinated: false, sterilized: false, specialCare: "En evaluación" },
    social: { dogs: true, cats: true, children: true },
    needs: [
      { id: "nube-med", title: "Medicina", type: "Medicina", requested: 320, funded: 0, status: "active" },
    ],
  },
  {
    id: "toby-case",
    name: "Toby",
    breed: "Mestizo",
    age: "1 año",
    sex: "Macho",
    species: "Perro",
    image: "/assets/toby.png",
    story: "Necesita cirugía de emergencia tras un accidente.",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "2.4 km",
    adoption: false,
    caseStatus: "rejected",
    health: { vaccinated: true, sterilized: false, specialCare: "Cirugía pendiente" },
    social: { dogs: true, cats: true, children: true },
    needs: [
      { id: "toby-vet", title: "Cirugía de emergencia", type: "Veterinario", requested: 240, funded: 0, status: "active" },
    ],
  },
];

export const adoptionPets = [
  {
    id: "rocky",
    name: "Rocky",
    sex: "Macho" as const,
    type: "Perro" as const,
    image: "/assets/rocky.png",
    story: "Rescatado de la calle el mes pasado. Muy amistoso y listo para encontrar hogar.",
    distance: "3.4 km",
    rescuer: "Patricia V.",
    location: "Monterrey, MX",
    verified: true,
    ageBand: "Adulto" as const,
    size: "Grande" as const,
    energy: "Activo" as const,
    personality: "Cariñoso",
    health: { vaccinated: true, sterilized: true, specialCare: false },
    social: { dogs: true, cats: false, children: true },
    journey: [
      {
        id: "r1",
        when: "Hace 3 días",
        tag: "Recuperación",
        text: "Ya camina con más energía y busca cariño a cada rato.",
        thanks: "Gracias a Ana P.",
        thanksInitial: "A",
        need: "Consulta de seguimiento · $40",
      },
    ],
  },
  {
    id: "toby",
    name: "Toby",
    sex: "Macho" as const,
    type: "Perro" as const,
    image: "/assets/toby.png",
    story: "Entregado por su familia. Sano, tranquilo y listo para adopción.",
    distance: "6.2 km",
    rescuer: "Diego F.",
    location: "Querétaro, MX",
    verified: true,
    ageBand: "Adulto" as const,
    size: "Mediano" as const,
    energy: "Poco activo" as const,
    personality: "Tranquilo",
    health: { vaccinated: true, sterilized: false, specialCare: false },
    social: { dogs: true, cats: true, children: true },
    journey: [
      {
        id: "t1",
        when: "Hace 1 semana",
        tag: "Recuperación",
        text: "Primer grooming: se ve como otro perrito.",
        thanks: "Gracias a Marta J.",
        thanksInitial: "M",
        need: "Alimento premium adulto · $28",
      },
    ],
  },
  {
    id: "luna",
    name: "Luna",
    sex: "Hembra" as const,
    type: "Perro" as const,
    image: "/assets/luna-card.png",
    story: "La encontraron abandonada en un parque. Es dulce, juguetona y busca una familia para siempre.",
    distance: "1.2 km",
    rescuer: "María R.",
    location: "San Pedro Garza García, NL",
    verified: true,
    ageBand: "Cachorro" as const,
    size: "Chico" as const,
    energy: "Muy activo" as const,
    personality: "Alegre",
    health: { vaccinated: true, sterilized: false, specialCare: true },
    social: { dogs: true, cats: true, children: true },
    journey: [] as Array<{
      id: string;
      when: string;
      tag: string;
      text: string;
      thanks: string;
      thanksInitial: string;
      need: string;
    }>,
  },
];

export type AdoptionListing = (typeof adoptionPets)[number];

export function petCaseToAdoptionListing(item: PetCase): AdoptionListing {
  return {
    id: item.id,
    name: item.name,
    sex: item.sex === "Hembra" ? "Hembra" : "Macho",
    type: item.species === "Gato" ? "Gato" : "Perro",
    image: item.image,
    story: item.story,
    distance: item.distance,
    rescuer: item.rescuer,
    location: item.location,
    verified: false,
    ageBand: item.ageBand || (["Cachorro", "Adulto", "Viejo"].includes(item.age) ? (item.age as AdoptionListing["ageBand"]) : undefined),
    size: item.size,
    energy: item.energy,
    personality: item.personality || undefined,
    health: {
      vaccinated: item.health.vaccinated,
      sterilized: item.health.sterilized,
      specialCare: Boolean(item.health.specialCare && item.health.specialCare !== "Ninguno"),
    },
    social: item.social,
    journey: [],
  };
}

export function mergeAdoptionListings(staticPets: AdoptionListing[], cases: PetCase[]): AdoptionListing[] {
  const fromCases = cases
    .filter(
      (item) =>
        item.adoption &&
        item.caseStatus !== "draft" &&
        item.caseStatus !== "closed" &&
        item.caseStatus !== "rejected",
    )
    .map(petCaseToAdoptionListing);
  const byId = new Map<string, AdoptionListing>();
  staticPets.forEach((pet) => byId.set(pet.id, pet));
  fromCases.forEach((pet) => byId.set(pet.id, { ...byId.get(pet.id), ...pet, journey: byId.get(pet.id)?.journey || [] }));
  return Array.from(byId.values());
}

export type Rescuer = {
  name: string;
  city: string;
  bio: string;
  orgName?: string;
  phone?: string;
  email?: string;
  verified: boolean;
  publishedCases: number;
  social: { instagram: string; facebook: string };
};


export const rescuers: Rescuer[] = [
  {
    name: "Diego F.",
    city: "Querétaro, MX",
    bio: "Rescata perros entregados por familias y los prepara para adopción responsable.",
    verified: true,
    publishedCases: 1,
    social: { instagram: "@diego.patitas", facebook: "Diego F Rescates" },
  },
  {
    name: "María R.",
    city: "Ciudad de México, CDMX",
    bio: "Refugio dedicado al rescate y rehabilitación de animales en situación de calle. Trabajamos con amor y compromiso para darles una segunda oportunidad.",
    orgName: "Patitas del Centro",
    phone: "+52 55 1234 5678",
    email: "maria@rescatista.com",
    verified: true,
    publishedCases: 1,
    social: { instagram: "@maria.rescata", facebook: "Maria Rescatista" },
  },
  {
    name: "Carlos Ruiz",
    city: "San Pedro, MX",
    bio: "Enfocado en gatos heridos. Colabora con el Centro de Bienestar Animal San Pedro.",
    verified: true,
    publishedCases: 1,
    social: { instagram: "@carlos.patitas", facebook: "Carlos Ruiz" },
  },
  {
    name: "Patricia V.",
    city: "CDMX, MX",
    bio: "Casa hogar temporal para perros medianos y grandes en la Ciudad de México.",
    verified: true,
    publishedCases: 1,
    social: { instagram: "@patricia.hogar", facebook: "Patricia V." },
  },
  {
    name: "Refugio Patitas",
    city: "Guadalupe, MX",
    bio: "Refugio comunitario con 12 años apoyando animales en situación de calle.",
    orgName: "Refugio Patitas",
    verified: false,
    publishedCases: 1,
    social: { instagram: "@refugiopatitas", facebook: "Refugio Patitas" },
  },
  {
    name: "Diego F.",
    city: "Monterrey, MX",
    bio: "Voluntario de rescate y transporte de mascotas hacia sus familias adoptivas.",
    verified: true,
    publishedCases: 1,
    social: { instagram: "@diego.rescate", facebook: "Diego F." },
  },
];

/** Identidad pública: el refugio reemplaza al nombre personal cuando existe. */
export function rescuerDisplayName(person: { name: string; orgName?: string | null }) {
  return person.orgName?.trim() || person.name;
}

export function resolveRescuerDisplayName(
  key: string,
  live?: { name: string; orgName?: string | null } | null,
) {
  if (live) {
    const liveOrg = live.orgName?.trim();
    if (key === live.name || (liveOrg && key === liveOrg)) {
      return rescuerDisplayName(live);
    }
  }
  const found = rescuers.find((item) => item.name === key || item.orgName === key);
  return found ? rescuerDisplayName(found) : key;
}


export const rescuerAccount = {
  name: "María R.",
  email: "maria@rescatista.com",
  phone: "+52 55 1234 5678",
  address: "Ciudad de México, CDMX",
  description:
    "Refugio dedicado al rescate y rehabilitación de animales en situación de calle. Trabajamos con amor y compromiso para darles una segunda oportunidad.",
  orgName: "Patitas del Centro",
  instagram: "@maria.rescata",
  facebook: "Maria Rescatista",
  clabe: "012345678901234567",
};


export type PaymentMovement = {
  id: string;
  caseName: string;
  needTitle: string;
  amount: number;
  date: string;
  status: "received" | "processing";
};

export const rescuerPaymentMovements: PaymentMovement[] = [
  {
    id: "mov-1",
    caseName: "Luna",
    needTitle: "Cirugía veterinaria",
    amount: 250,
    date: "28 ago 2026",
    status: "received",
  },
  {
    id: "mov-2",
    caseName: "Rocky",
    needTitle: "Medicamentos",
    amount: 500,
    date: "27 ago 2026",
    status: "received",
  },
  {
    id: "mov-3",
    caseName: "Mila",
    needTitle: "Alimento especial",
    amount: 180,
    date: "25 ago 2026",
    status: "processing",
  },
];

export type NotificationKind = "message" | "donation" | "case" | "pet";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  target: string;
  read: boolean;
};

export const initialNotifications: Notification[] = [
  {
    id: "n-guardian",
    kind: "donation",
    title: "Ya eres Guardián",
    body: "Tu aportación mensual es de $50 MXN.",
    time: "Ahora",
    target: "/impact",
    read: false,
  },
  {
    id: "n-donation",
    kind: "donation",
    title: "Donación enviada exitosamente",
    body: "Tu aportación de $120 MXN a Luna ya aparece en el caso.",
    time: "Hace 1 h",
    target: "/case/luna",
    read: false,
  },
  {
    id: "n1",
    kind: "message",
    title: "Nuevo mensaje de Rescatista",
    body: "María te respondió sobre el caso de Luna.",
    time: "Hace 5 min",
    target: "/messages/luna",
    read: false,
  },
  {
    id: "n2",
    kind: "case",
    title: "Actualización del caso",
    body: "El rescatista subió nueva evidencia del apoyo recibido.",
    time: "Ayer",
    target: "/case/luna",
    read: false,
  },
  {
    id: "n3",
    kind: "pet",
    title: "Nueva mascota en adopción",
    body: "Hay una nueva mascota cerca de tu zona.",
    time: "Hace 2 días",
    target: "/adoption",
    read: true,
  },
];

export type LogEntry = {
  id: string;
  date: string;
  caseId: string;
  caseName: string;
  concept: string;
  amount: string;
  status: "completada" | "activa";
};

export const donationLog: LogEntry[] = [
  { id: "l1", date: "29 abr", caseId: "milo", caseName: "Max", concept: "Comida", amount: "$100", status: "completada" },
  { id: "l2", date: "25 abr", caseId: "luna", caseName: "Luna", concept: "Medicina", amount: "$120", status: "completada" },
  { id: "l3", date: "20 abr", caseId: "nina", caseName: "Rocky", concept: "Apadrinamiento mensual", amount: "$10/mes", status: "activa" },
  { id: "l4", date: "15 abr", caseId: "milo", caseName: "Milo", concept: "Tratamiento veterinario", amount: "$25", status: "completada" },
  { id: "l5", date: "10 abr", caseId: "nina", caseName: "Nina", concept: "Comida", amount: "$15", status: "completada" },
];

export type SubscriptionPlan = { id: string; name: string; amount: number; recommended?: boolean };

export const subscriptionPlans: SubscriptionPlan[] = [
  { id: "basico", name: "Community Member Básico", amount: 50 },
  { id: "plus", name: "Community Member Plus", amount: 200, recommended: true },
  { id: "pro", name: "Community Member Pro", amount: 500 },
];

export const paymentHistory = [
  { id: "p1", date: "3 junio 2026", method: "Visa 4242", amount: "$50.00 MXN" },
  { id: "p2", date: "3 mayo 2026", method: "Apple Pay", amount: "$50.00 MXN" },
  { id: "p3", date: "3 abril 2026", method: "Visa 4242", amount: "$50.00 MXN" },
];

export const savedCards = [
  { id: "visa", brand: "Visa", digits: "4242", default: true },
  { id: "mastercard", brand: "Mastercard", digits: "1881", default: false },
];

export type FaqItem = { q: string; a: string };

export const donorFaqs: FaqItem[] = [
  {
    q: "¿Cómo funciona mi suscripción mensual?",
    a: "Cada mes se cobra el monto que elegiste y se reparte entre los casos activos que más lo necesitan. Puedes cambiar la cantidad o cancelarla desde Suscripción y pagos.",
  },
  {
    q: "¿Cómo sé que mi donación se usó correctamente?",
    a: "El rescatista sube evidencia (fotos y comprobantes) por cada necesidad cubierta. Te avisamos con una notificación cuando hay una nueva.",
  },
  {
    q: "¿Dónde veo las evidencias de los casos que apoyé?",
    a: "En Tu Impacto y en el detalle de cada caso encontrarás la evidencia publicada por el rescatista.",
  },
  {
    q: "¿Cómo puedo cancelar mi suscripción?",
    a: "Entra a Perfil › Configuración › Suscripción y pagos y toca Cancelar suscripción. Puedes volver a suscribirte cuando quieras.",
  },
  {
    q: "¿Cómo guardo una mascota o caso?",
    a: "Usa el marcador en la tarjeta o en el detalle. Lo encontrarás después en Perfil › Mascotas guardadas.",
  },
];

export const rescuerFaqs: FaqItem[] = [
  {
    q: "¿Cómo verifico mi cuenta?",
    a: "Sube una identificación oficial, un comprobante de domicilio y tus datos bancarios. La revisión tarda hasta 48 horas.",
  },
  {
    q: "¿Por qué necesito verificarme para recibir donaciones?",
    a: "La verificación protege a la comunidad: garantiza que los fondos llegan a una persona real y responsable del caso.",
  },
  {
    q: "¿Cómo publico una mascota en adopción?",
    a: "Desde Publicar elige Dar en adopción y completa los cuatro pasos: fotos, información básica, necesidades y revisión.",
  },
  {
    q: "¿Cómo publico un caso para recibir donaciones?",
    a: "Desde Publicar elige Recibir donaciones y define cada necesidad con su monto objetivo.",
  },
  {
    q: "¿Cómo subo evidencia de gastos?",
    a: "En el detalle del caso, toca la necesidad cubierta y sube la foto del comprobante. Los donantes reciben una notificación.",
  },
];
