export type Need = {
  id: string;
  title: string;
  type: "Veterinario" | "Medicina" | "Comida" | "Otra";
  requested: number;
  funded: number;
  urgent?: boolean;
  recurring?: boolean;
  status: "active" | "funded" | "evidence" | "completed";
};

export type PetCase = {
  id: string;
  name: string;
  breed?: string;
  age: string;
  sex: "Macho" | "Hembra";
  species: "Perro" | "Gato";
  image: string;
  story: string;
  location: string;
  rescuer: string;
  distance: string;
  adoption: boolean;
  caseStatus: "draft" | "review" | "active" | "rejected" | "closed";
  /** Motivo de cierre (casos de adopción archivados). */
  closeReason?: "adoptada" | "otro";
  /** Solo si closeReason es adoptada. */
  adoptedWithDopmiSupport?: boolean;
  /** Solo si closeReason es otro. */
  closeReasonDescription?: string;
  /** Días desde que el admin aprobó la publicación (solo casos activos/archivados). */
  daysSinceApproval?: number;
  /** Visualizaciones del perfil público del caso. */
  profileViews?: number;
  /** Veces que adoptantes guardaron la mascota en Mis match (desde Adoptar). */
  matchSaves?: number;
  /** Personas distintas que escribieron por adopción (métrica de embudo). */
  adoptionInquiries?: number;
  health: { vaccinated: boolean; sterilized: boolean; specialCare: string };
  social: { dogs: boolean; cats: boolean; children: boolean };
  needs: Need[];
};

export type PetCaseCloseMeta = {
  closeReason: PetCase["closeReason"];
  adoptedWithDopmiSupport?: boolean;
  closeReasonDescription?: string;
};

export const initialCases: PetCase[] = [
  {
    id: "luna",
    name: "Luna",
    breed: "Mestiza",
    age: "3 meses",
    sex: "Hembra",
    species: "Perro",
    image: "/assets/luna-card.png",
    story: "Ejemplo mockup: adopción activa en seguimiento (estatus Activo).",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "1.2 km",
    adoption: true,
    caseStatus: "active",
    daysSinceApproval: 23,
    profileViews: 100,
    matchSaves: 28,
    adoptionInquiries: 12,
    health: { vaccinated: true, sterilized: false, specialCare: "Seguimiento de crecimiento" },
    social: { dogs: true, cats: true, children: true },
    needs: [
      { id: "luna-food", title: "Alimento cachorro 1.5 kg", type: "Comida", requested: 18, funded: 12, recurring: true, status: "active" },
      { id: "luna-meds", title: "Tabletas antiparasitarias", type: "Medicina", requested: 15, funded: 15, urgent: true, status: "funded" },
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
    story: "Ejemplo mockup: apoyo activo con meta en curso (estatus Activo, tarjeta crema).",
    location: "San Pedro, MX",
    rescuer: "Carlos Ruiz",
    distance: "2.1 km",
    adoption: false,
    caseStatus: "active",
    daysSinceApproval: 41,
    profileViews: 68,
    health: { vaccinated: true, sterilized: true, specialCare: "Curación diaria" },
    social: { dogs: false, cats: true, children: true },
    needs: [
      { id: "milo-med", title: "Spray para heridas", type: "Medicina", requested: 12, funded: 8, urgent: true, status: "active" },
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
    story: "Ejemplo mockup: apoyo activo con meta cumplida (estatus Finalizado, tarjeta verde).",
    location: "Guadalupe, MX",
    rescuer: "Refugio Patitas",
    distance: "4.8 km",
    adoption: false,
    caseStatus: "active",
    daysSinceApproval: 9,
    profileViews: 34,
    health: { vaccinated: false, sterilized: true, specialCare: "Revisión de cadera" },
    social: { dogs: true, cats: false, children: true },
    needs: [
      { id: "nina-vet", title: "Estudios de cadera", type: "Veterinario", requested: 95, funded: 95, urgent: true, status: "funded" },
    ],
  },
  {
    id: "mia-draft",
    name: "Mía",
    breed: "Mestiza",
    age: "2 años",
    sex: "Hembra",
    species: "Perro",
    image: "/assets/nina-card.png",
    story: "Borrador de adopción para el mockup de estatus.",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "1.0 km",
    adoption: true,
    caseStatus: "draft",
    health: { vaccinated: false, sterilized: false, specialCare: "Por definir" },
    social: { dogs: true, cats: true, children: true },
    needs: [],
  },
  {
    id: "sol-review",
    name: "Sol",
    breed: "Mestizo",
    age: "1 año",
    sex: "Macho",
    species: "Perro",
    image: "/assets/publish-sample-pet.jpg",
    story: "Caso de adopción en revisión (ejemplo de estatus).",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "1.5 km",
    adoption: true,
    caseStatus: "review",
    health: { vaccinated: true, sterilized: false, specialCare: "Ninguno" },
    social: { dogs: true, cats: false, children: true },
    needs: [],
  },
  {
    id: "max-rejected",
    name: "Max",
    breed: "Mestizo",
    age: "3 años",
    sex: "Macho",
    species: "Perro",
    image: "/assets/rocky.png",
    story: "Caso de adopción rechazado que requiere corrección (ejemplo de estatus).",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "2.2 km",
    adoption: true,
    caseStatus: "rejected",
    health: { vaccinated: true, sterilized: true, specialCare: "Ninguno" },
    social: { dogs: true, cats: true, children: false },
    needs: [],
  },
  {
    id: "rocky",
    name: "Rocky",
    breed: "Pastor mestizo",
    age: "4 años",
    sex: "Macho",
    species: "Perro",
    image: "/assets/rocky.png",
    story:
      "Rocky llegó con heridas y desnutrición. Con tu apoyo cubriremos su cirugía, controles y alimentación mientras se recupera y busca un hogar.",
    location: "Monterrey, MX",
    rescuer: "Patricia V.",
    distance: "3.4 km",
    adoption: true,
    caseStatus: "active",
    daysSinceApproval: 12,
    profileViews: 56,
    health: { vaccinated: true, sterilized: true, specialCare: "Recuperación post-cirugía" },
    social: { dogs: true, cats: false, children: true },
    needs: [
      { id: "rocky-surgery", title: "Cirugía", type: "Veterinario", requested: 1450, funded: 250, urgent: true, status: "active" },
      { id: "rocky-vet", title: "Cita veterinario", type: "Veterinario", requested: 700, funded: 200, status: "active" },
      { id: "rocky-meds", title: "Desparasitante", type: "Medicina", requested: 250, funded: 50, status: "active" },
      { id: "rocky-food", title: "Croquetas", type: "Comida", requested: 100, funded: 0, status: "active" },
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
    story: "Rescatada hace poco. Caso de apoyo activo para el mockup del inicio rescatista.",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "1.2 km",
    adoption: false,
    caseStatus: "active",
    daysSinceApproval: 14,
    profileViews: 41,
    health: { vaccinated: false, sterilized: false, specialCare: "En evaluación" },
    social: { dogs: true, cats: true, children: true },
    needs: [
      { id: "nube-med", title: "Medicina", type: "Medicina", requested: 320, funded: 185, urgent: true, status: "active" },
      { id: "nube-vet", title: "Consulta veterinaria", type: "Veterinario", requested: 120, funded: 120, status: "funded" },
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
      { id: "toby-vet", title: "Cirugía de emergencia", type: "Veterinario", requested: 240, funded: 0, urgent: true, status: "active" },
    ],
  },
  {
    id: "cielo",
    name: "Cielo",
    breed: "Mestiza",
    age: "5 años",
    sex: "Hembra",
    species: "Perro",
    image: "/assets/nina-card.png",
    story: "Ejemplo mockup: adopción archivada tras adopción (estatus Adoptado, verde).",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "2.0 km",
    adoption: true,
    caseStatus: "closed",
    closeReason: "adoptada",
    daysSinceApproval: 120,
    profileViews: 210,
    health: { vaccinated: true, sterilized: true, specialCare: "Ninguno" },
    social: { dogs: true, cats: false, children: true },
    needs: [],
  },
  {
    id: "bruno-adopt-cerrado",
    name: "Bruno",
    breed: "Mestizo",
    age: "6 años",
    sex: "Macho",
    species: "Perro",
    image: "/assets/toby.png",
    story: "Ejemplo mockup: adopción archivada con motivo distinto a adopción (estatus Cerrado).",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "2.8 km",
    adoption: true,
    caseStatus: "closed",
    closeReason: "otro",
    closeReasonDescription: "La familia canceló el proceso de adopción.",
    daysSinceApproval: 45,
    profileViews: 88,
    health: { vaccinated: true, sterilized: true, specialCare: "Ninguno" },
    social: { dogs: true, cats: false, children: true },
    needs: [],
  },
  {
    id: "copo-apoyo-arch-final",
    name: "Copo",
    breed: "Mestizo",
    age: "3 años",
    sex: "Macho",
    species: "Perro",
    image: "/assets/milo-card.png",
    story: "Ejemplo mockup: apoyo archivado al completar la meta (estatus Finalizado, tarjeta verde).",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "1.6 km",
    adoption: false,
    caseStatus: "closed",
    daysSinceApproval: 62,
    profileViews: 142,
    health: { vaccinated: true, sterilized: true, specialCare: "Ninguno" },
    social: { dogs: true, cats: true, children: true },
    needs: [
      { id: "copo-vet", title: "Esterilización", type: "Veterinario", requested: 60, funded: 60, status: "funded" },
      { id: "copo-food", title: "Alimento recuperación", type: "Comida", requested: 35, funded: 35, status: "funded" },
    ],
  },
  {
    id: "flecha-apoyo-arch-cerrado",
    name: "Flecha",
    breed: "Mestiza",
    age: "2 años",
    sex: "Hembra",
    species: "Perro",
    image: "/assets/luna-card.png",
    story: "Ejemplo mockup: apoyo archivado antes de la meta (estatus Cerrado, tarjeta gris).",
    location: "Monterrey, MX",
    rescuer: "María R.",
    distance: "3.1 km",
    adoption: false,
    caseStatus: "closed",
    daysSinceApproval: 28,
    profileViews: 51,
    health: { vaccinated: false, sterilized: false, specialCare: "Control veterinario" },
    social: { dogs: true, cats: false, children: true },
    needs: [
      { id: "flecha-vet", title: "Consulta y estudios", type: "Veterinario", requested: 70, funded: 30, status: "active" },
      { id: "flecha-med", title: "Antibiótico", type: "Medicina", requested: 25, funded: 10, status: "active" },
    ],
  },
];

export const adoptionPets = [
  {
    id: "rocky",
    name: "Rocky",
    sex: "Macho" as const,
    type: "Perro" as const,
    size: "Grande" as const,
    age: "Adulto",
    personality: ["alegre", "jugueton"] as const,
    convivencia: ["Social con niños", "Social con otras mascotas", "Necesita patio"] as const,
    image: "/assets/rocky.png",
    story: "Rescatado de la calle el mes pasado. Muy amistoso y listo para encontrar hogar.",
    distance: "3.4 km",
    rescuer: "Patricia V.",
    location: "Monterrey, MX",
    verified: true,
    listed: true,
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
    size: "Mediano" as const,
    age: "Adulto",
    personality: ["tranquilo", "cariñoso"] as const,
    convivencia: ["Social con niños", "Social con otras mascotas", "Ideal para departamento", "Ideal para primerizos"] as const,
    image: "/assets/toby.png",
    story: "Entregado por su familia. Sano, tranquilo y listo para adopción.",
    distance: "6.2 km",
    rescuer: "Diego F.",
    location: "Querétaro, MX",
    verified: true,
    listed: true,
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
    id: "misha",
    name: "Misha",
    sex: "Hembra" as const,
    type: "Gato" as const,
    size: "Chico" as const,
    age: "Adulto",
    personality: ["tranquilo", "timido"] as const,
    convivencia: ["Social con niños", "Ideal para departamento", "Ideal para primerizos"] as const,
    image: "/assets/luna-card.png",
    story: "Rescatada de un estacionamiento. Cariñosa, curiosa y lista para un hogar tranquilo.",
    distance: "2.1 km",
    rescuer: "Patricia V.",
    location: "Monterrey, MX",
    verified: true,
    listed: true,
    health: { vaccinated: true, sterilized: true, specialCare: false },
    social: { dogs: false, cats: true, children: true },
    journey: [
      {
        id: "m1",
        when: "Hace 5 días",
        tag: "Recuperación",
        text: "Ya come solita y busca mimos por las tardes.",
        thanks: "Gracias a Luis R.",
        thanksInitial: "L",
        need: "Arena y alimento · $22",
      },
    ],
  },
  {
    id: "canela",
    name: "Canela",
    sex: "Hembra" as const,
    type: "Perro" as const,
    size: "Chico" as const,
    age: "Cachorro",
    personality: ["alegre", "jugueton"] as const,
    convivencia: ["Social con niños", "Social con otras mascotas", "Ideal para departamento"] as const,
    image: "/assets/luna-card.png",
    story: "Cachorra juguetona, ya vacunada y lista para crecer con una familia paciente.",
    distance: "4.1 km",
    rescuer: "María R.",
    location: "Monterrey, MX",
    verified: true,
    listed: true,
    health: { vaccinated: true, sterilized: false, specialCare: false },
    social: { dogs: true, cats: true, children: true },
    journey: [],
  },
  {
    id: "bruno",
    name: "Bruno",
    sex: "Macho" as const,
    type: "Perro" as const,
    size: "Grande" as const,
    age: "Senior",
    personality: ["tranquilo", "obediente"] as const,
    convivencia: ["Social con niños", "Necesita patio", "Mejor para alguien con experiencia"] as const,
    image: "/assets/rocky.png",
    story: "Tranquilo y noble. Ideal para casa con patio y paseos diarios.",
    distance: "5.5 km",
    rescuer: "Diego F.",
    location: "Apodaca, MX",
    verified: true,
    listed: true,
    health: { vaccinated: true, sterilized: true, specialCare: false },
    social: { dogs: true, cats: false, children: true },
    journey: [],
  },
  {
    id: "nube",
    name: "Nube",
    sex: "Hembra" as const,
    type: "Gato" as const,
    size: "Mediano" as const,
    age: "Adulto",
    personality: ["tranquilo", "nervioso"] as const,
    convivencia: ["Ideal para departamento", "Mejor para alguien con experiencia"] as const,
    image: "/assets/milo-card.png",
    story: "Independiente pero cariñosa. Busca un hogar tranquilo lejos del bullicio.",
    distance: "3.0 km",
    rescuer: "Carlos Ruiz",
    location: "San Pedro, MX",
    verified: true,
    listed: true,
    health: { vaccinated: true, sterilized: true, specialCare: false },
    social: { dogs: false, cats: true, children: false },
    journey: [],
  },
];

export type Rescuer = {
  name: string;
  city: string;
  bio: string;
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
    city: "Monterrey, MX",
    bio: "Rescata perritos de calle desde 2019. Trabaja con una clínica veterinaria aliada en Monterrey.",
    verified: true,
    publishedCases: 1,
    social: { instagram: "@maria.rescata", facebook: "Maria Rescata" },
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

export const rescuerAccount = {
  name: "María Rescatista",
  email: "maria@rescatista.com",
  phone: "+52 55 1234 5678",
  address: "Calle Reforma 123, Col. Centro, Ciudad de México, CDMX",
  description:
    "Refugio dedicado al rescate y rehabilitación de animales en situación de calle. Trabajamos con amor y compromiso para darles una segunda oportunidad.",
  instagram: "@maria.rescata",
  facebook: "Maria Rescatista",
  clabe: "012345678901234567",
};

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

export type PaymentStatus = "pagado" | "cancelado" | "enproceso" | "fallado";

export type LogEntry = {
  id: string;
  date: string;
  caseId: string;
  caseName: string;
  concept: string;
  method: string;
  amount: string;
  status: PaymentStatus;
};

export const donationLog: LogEntry[] = [
  { id: "l1", date: "29 abr", caseId: "milo", caseName: "Max", concept: "Alimento", method: "Visa *4242", amount: "$100", status: "pagado" },
  { id: "l2", date: "25 abr", caseId: "luna", caseName: "Luna", concept: "Medicina", method: "Apple Pay", amount: "$120", status: "pagado" },
  { id: "l3", date: "20 abr", caseId: "nina", caseName: "Rocky", concept: "Alimento", method: "Visa *4242", amount: "$50", status: "enproceso" },
  { id: "l4", date: "15 abr", caseId: "milo", caseName: "Milo", concept: "Veterinario", method: "Mastercard *1881", amount: "$25", status: "pagado" },
  { id: "l5", date: "10 abr", caseId: "nina", caseName: "Nina", concept: "Alimento", method: "Visa *4242", amount: "$15", status: "fallado" },
];

export type SubscriptionPlan = { id: string; name: string; amount: number; recommended?: boolean };

export const subscriptionPlans: SubscriptionPlan[] = [
  { id: "basico", name: "Community Member Básico", amount: 50 },
  { id: "plus", name: "Community Member Plus", amount: 200, recommended: true },
  { id: "pro", name: "Community Member Pro", amount: 500 },
];

export const paymentHistory = [
  { id: "p1", date: "3 jun", method: "Visa *4242", amount: "$50.00", status: "pagado" as const },
  { id: "p2", date: "3 may", method: "Apple Pay", amount: "$50.00", status: "pagado" as const },
  { id: "p3", date: "3 abr", method: "Visa *4242", amount: "$50.00", status: "cancelado" as const },
];

export const savedCards = [
  { id: "visa", brand: "Visa", digits: "4242", default: true },
  { id: "mastercard", brand: "Mastercard", digits: "1881", default: false },
];

export type FaqItem = { q: string; a: string };

export type HelpAudience = "donor" | "rescuer" | "both";

export type HelpBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "faq"; q: string; a: string }
  | { type: "action"; label: string; action: "delete-account" };

export type HelpTopic = {
  id: string;
  label: string;
  audience: HelpAudience;
  blocks: HelpBlock[];
};

export const helpTopics: HelpTopic[] = [
  {
    id: "apoyos",
    label: "Cómo funcionan los apoyos",
    audience: "both",
    blocks: [
      { type: "heading", text: "Cuando apoyas a un caso" },
      {
        type: "paragraph",
        text: "Tu apoyo va a una necesidad concreta de esa mascota: comida, medicina o una consulta.",
      },
      {
        type: "bullets",
        items: [
          "La mayor parte llega a la rescatista.",
          "Una parte cubre la comisión del procesador de pago.",
          "Una parte pequeña (alrededor del 2%) mantiene funcionando DopMi.",
        ],
      },
      {
        type: "paragraph",
        text: "La rescatista recibe los fondos cuando sube la evidencia de en qué los usó, y tú puedes ver esa evidencia en el caso.",
      },
      { type: "heading", text: "Cuando eres Guardián" },
      {
        type: "paragraph",
        text: "Tu aportación mensual es un pago por el servicio de DopMi, que mantiene listo un fondo para responder a las urgencias de rescate. No va a una mascota en específico.",
      },
      {
        type: "bullets",
        items: [
          "Urgencias primero. El fondo siempre atiende primero las urgencias: operaciones, hospitalizaciones o traslados.",
          "Con criterio, no a dedo. Cuando hay excedente, se usa para completar casos que llevan tiempo esperando, siguiendo criterios claros.",
          "Te contamos a dónde fue. Cada mes recibes un reporte con los casos que atendió el fondo, con nombre, foto y desenlace.",
        ],
      },
    ],
  },
  {
    id: "apoyar",
    label: "Apoyar",
    audience: "donor",
    blocks: [
      {
        type: "faq",
        q: "¿Cómo sé que mi apoyo llega a un caso real?",
        a: "Cada caso que pide apoyo lo publica una rescatista verificada por DopMi, y revisamos cada mascota antes de que aparezca en la app.",
      },
      {
        type: "faq",
        q: "¿Dónde veo en qué se usó mi apoyo?",
        a: "En el caso que apoyaste, en la sección de actividad. También te avisamos con una notificación cuando la rescatista sube evidencia nueva.",
      },
      {
        type: "faq",
        q: "¿Qué pasa cuando una necesidad se completa?",
        a: "Deja de recibir apoyos. La rescatista usa los fondos, sube la evidencia y tú recibes la actualización.",
      },
      {
        type: "faq",
        q: "Mi pago no se completó, ¿se me cobró?",
        a: 'Si viste la pantalla "Pago no completado", tu apoyo no se registró. Si ves un cargo en tu estado de cuenta, escríbenos con la fecha y el monto.',
      },
      {
        type: "faq",
        q: "¿Puedo apoyar a la misma mascota cada mes?",
        a: "Sí. En el caso, elige apadrinar, selecciona las necesidades y define el monto y la frecuencia. Puedes editarlo o cancelarlo cuando quieras.",
      },
      {
        type: "faq",
        q: "¿Dónde veo todos mis apoyos?",
        a: "En tu perfil, en Historial de apoyos.",
      },
    ],
  },
  {
    id: "guardian",
    label: "Guardián",
    audience: "donor",
    blocks: [
      {
        type: "faq",
        q: "¿Qué es ser Guardián?",
        a: "Es una suscripción mensual que mantiene listo un fondo para responder a las urgencias de rescate. Cada mes te contamos qué se logró.",
      },
      {
        type: "faq",
        q: "¿Puedo elegir a qué mascota va mi aportación?",
        a: "No. El fondo se asigna con criterios claros, siempre urgencias primero. Lo que sí hacemos es mostrarte después, con detalle, a dónde fue.",
      },
      {
        type: "faq",
        q: "¿Cómo cambio mi monto o cancelo?",
        a: "Desde Tu impacto, en la sección de suscripción. Puedes cambiar el monto o cancelar cuando quieras, sin penalizaciones.",
      },
      {
        type: "faq",
        q: "¿Cuándo recibo mi reporte?",
        a: "Cada mes, en la sección Tu impacto. Te avisamos con una notificación.",
      },
    ],
  },
  {
    id: "adoptar",
    label: "Adoptar",
    audience: "donor",
    blocks: [
      {
        type: "faq",
        q: "¿Cómo contacto a una rescatista?",
        a: "En la mascota que te interesa, toca el botón de mensajes. Hablas directo con quien la cuida.",
      },
      {
        type: "faq",
        q: "La rescatista no me ha respondido, ¿qué hago?",
        a: "Muchas rescatistas cuidan a varios animales a la vez y a veces tardan en contestar. Mientras tanto, guarda tus mascotas favoritas y escríbele también a otras rescatistas.",
      },
      {
        type: "faq",
        q: "¿DopMi participa en la adopción?",
        a: "DopMi te conecta con la rescatista y verifica que la mascota sea real. El cierre de adopción (entrevista, visita y entrega) lo acuerdas directamente con ella.",
      },
    ],
  },
  {
    id: "verificacion",
    label: "Verificación",
    audience: "rescuer",
    blocks: [
      {
        type: "faq",
        q: "¿Por qué necesito verificarme?",
        a: "Para pedir apoyo económico. La verificación les da confianza a quienes apoyan tus casos.",
      },
      {
        type: "faq",
        q: "¿Necesito verificarme si solo quiero dar en adopción?",
        a: "No. Puedes publicar mascotas en adopción sin la verificación completa. Solo la necesitas cuando pides apoyo económico.",
      },
      {
        type: "faq",
        q: "Mi verificación tiene observaciones, ¿cómo la corrijo?",
        a: 'Desde tu inicio, toca "Corregir información". Te marcamos exactamente qué hay que ajustar para que puedas reenviarla.',
      },
      {
        type: "faq",
        q: "¿Cuánto tarda la revisión?",
        a: "La revisamos lo antes posible y te avisamos con una notificación en cuanto esté lista.",
      },
    ],
  },
  {
    id: "publicar",
    label: "Publicar casos",
    audience: "rescuer",
    blocks: [
      {
        type: "faq",
        q: "¿Cómo publico un caso?",
        a: 'Desde tu inicio o desde Mis casos, toca "Publicar caso". Puedes guardar un borrador y seguir después.',
      },
      {
        type: "faq",
        q: "¿Tengo que pedir apoyo económico?",
        a: "No. Las necesidades son opcionales. Puedes publicar una mascota solo para adopción.",
      },
      {
        type: "faq",
        q: "¿Qué cuenta como necesidad urgente?",
        a: "Una necesidad médica o veterinaria que no puede esperar. Para marcarla como urgente, sube un video donde aparezcan tú y la mascota. DopMi lo revisa.",
      },
      {
        type: "faq",
        q: "¿Por qué no se aprobó mi caso?",
        a: 'En Mis casos verás las observaciones. Toca "Corregir", ajusta lo necesario y vuelve a enviarlo.',
      },
      {
        type: "faq",
        q: "¿Cómo cierro un caso?",
        a: 'Edita el caso y toca "Cerrar caso". Si la mascota fue adoptada, puedes compartir un video de despedida con quienes la apoyaron.',
      },
    ],
  },
  {
    id: "fondos",
    label: "Fondos y evidencia",
    audience: "rescuer",
    blocks: [
      {
        type: "faq",
        q: "¿Cuándo recibo los fondos?",
        a: "Cuando la necesidad se completa y subes la evidencia de su uso. Después de revisarla, liberamos los fondos.",
      },
      {
        type: "faq",
        q: "¿Qué evidencia tengo que subir?",
        a: "Depende de la necesidad: ticket o recibo, fotos o video con la mascota y una breve descripción.",
      },
      {
        type: "faq",
        q: "Ya pagué algo con mi dinero, ¿puedo pedir reembolso?",
        a: "Sí. En la necesidad, solicita el reembolso y sube el ticket y la evidencia. Te avisamos cuando esté aprobado.",
      },
      {
        type: "faq",
        q: "¿Cómo vuelvo a pedir comida?",
        a: 'Al terminar la evidencia de comida, toca "Solicitar comida". Puedes elegir otro producto o pedir la misma comida.',
      },
    ],
  },
  {
    id: "cuenta",
    label: "Mi cuenta",
    audience: "both",
    blocks: [
      {
        type: "faq",
        q: "¿Cómo cambio entre cuenta de Donante y de Rescatista?",
        a: 'En Configuración, toca "Cambiar tipo de cuenta". Tu información se conserva en ambas.',
      },
      {
        type: "faq",
        q: "¿Cómo edito mis datos?",
        a: "En Configuración puedes cambiar tu foto, nombre, correo y teléfono.",
      },
      {
        type: "faq",
        q: "¿Cómo elimino mi cuenta?",
        a: 'En Centro de ayuda, toca "Eliminar mi cuenta". Te explicamos qué se borra y qué se conserva antes de confirmar.',
      },
      { type: "action", label: "Eliminar mi cuenta", action: "delete-account" },
    ],
  },
  {
    id: "confianza",
    label: "Confianza y seguridad",
    audience: "both",
    blocks: [
      {
        type: "faq",
        q: "¿Cómo reporto un caso o un perfil?",
        a: 'En el caso o en el perfil de la rescatista, toca "Reportar". Revisamos cada reporte.',
      },
      {
        type: "faq",
        q: "¿Cómo protegen mis datos de pago?",
        a: "DopMi no guarda los datos de tu tarjeta. Los pagos se procesan con un proveedor de pagos certificado.",
      },
    ],
  },
];
