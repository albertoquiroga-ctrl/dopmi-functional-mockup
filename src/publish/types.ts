export const TRANSACTION_FEE_MXN = 50;

export type NeedCategory = "Comida" | "Medicina" | "Veterinario";

export type DraftNeedItem = {
  id: string;
  type: NeedCategory;
  title: string;
  amount: number;
  // Comida
  brand?: string;
  weightKg?: number;
  units?: number;
  ticketSpend?: number;
  // Medicina
  medicineName?: string;
  treatment?: string;
  // Veterinario
  clinicName?: string;
  consultReason?: string;
  clinicPhone?: string;
  ticketPhoto?: string;
};

export type CategoryEvidence = {
  category: NeedCategory;
  photo?: string;
  caption?: string;
};

export type AdoptionSize = "Chico" | "Mediano" | "Grande";
export type AdoptionAgeBand = "Cachorro" | "Adulto" | "Viejo";
export type AdoptionEnergy = "Poco activo" | "Activo" | "Muy activo";

export const PERSONALITY_OPTIONS = [
  "Alegre",
  "Cariñoso",
  "Dramático",
  "Flojo",
  "Gruñón",
  "Juguetón",
  "Tranquilo",
  "Travieso",
] as const;

export type PersonalityTrait = (typeof PERSONALITY_OPTIONS)[number];

export type PublishDraftState = {
  publishMode: "adoption" | "donation";
  petName: string;
  species: "Perro" | "Gato" | "";
  sex: "Macho" | "Hembra" | "";
  age: string;
  story: string;
  location: string;
  vaccinated: boolean;
  sterilized: boolean;
  specialCare: boolean;
  socialDogs: boolean;
  socialCats: boolean;
  socialChildren: boolean;
  size: AdoptionSize | "";
  ageBand: AdoptionAgeBand | "";
  energy: AdoptionEnergy | "";
  personality: PersonalityTrait | "";
  needItems: DraftNeedItem[];
  needTicketById: Record<string, string>;
  thankYouVideo: string;
  categoryEvidence: CategoryEvidence[];
  mainPhoto: string;
  extraPhotos: string[];
  contextVideo: string;
};

export const emptyPublishDraft = (): PublishDraftState => ({
  publishMode: "donation",
  petName: "",
  species: "",
  sex: "",
  age: "",
  story: "",
  location: "San Pedro Garza García, Nuevo León",
  vaccinated: false,
  sterilized: false,
  specialCare: false,
  socialDogs: false,
  socialCats: false,
  socialChildren: false,
  size: "",
  ageBand: "",
  energy: "",
  personality: "",
  needItems: [],
  needTicketById: {},
  thankYouVideo: "",
  categoryEvidence: [],
  mainPhoto: "",
  extraPhotos: [],
  contextVideo: "",
});

export function needsSubtotal(items: DraftNeedItem[]) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function publicGoal(items: DraftNeedItem[]) {
  return needsSubtotal(items) + TRANSACTION_FEE_MXN;
}

export function categoriesUsed(items: DraftNeedItem[]): NeedCategory[] {
  return (["Comida", "Medicina", "Veterinario"] as NeedCategory[]).filter((cat) =>
    items.some((item) => item.type === cat),
  );
}

export function newNeedId() {
  return `need-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
