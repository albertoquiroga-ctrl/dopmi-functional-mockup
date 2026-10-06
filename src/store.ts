import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  initialCases,
  initialNotifications,
  rescuerAccount,
  type Need,
  type Notification,
  type PetCase,
  type PetCaseCloseMeta,
} from "./data";

export type AccountMode = "donor" | "rescuer";
export type DonorIntent = "adopt";
export type Verification = "unverified" | "review" | "verified" | "rejected";
export type PaymentOutcome = "success" | "error";

export function adoptionChatIntroText(pet: { name: string; sex?: "Macho" | "Hembra" }) {
  const pronoun = pet.sex === "Hembra" ? "ella" : "él";
  return `¡Hola! 👋 Me encantó ${pet.name}, me gustaría saber un poquito más sobre ${pronoun} 🐾`;
}

export type RescuerProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  instagram: string;
  facebook: string;
  clabe: string;
  avatar?: string;
};

export type Donation = {
  id: string;
  caseId: string;
  needId: string;
  amount: number;
  date: string;
  status: "success";
};

/** Donación recibida en casos de apoyo (bandeja del inicio rescatista). */
export type RescuerSupportPaymentEvent = {
  id: string;
  caseId: string;
  receivedAt: number;
  amount: string;
  title: string;
  metaSuffix: string;
};

export type ChatMessage = {
  id: string;
  author: "donor" | "rescuer";
  text: string;
  time: string;
  threadId?: string;
  image?: string;
};

export type DonorProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  avatar?: string;
};

type PrototypeState = {
  accountMode: AccountMode;
  donorIntent: DonorIntent;
  verification: Verification;
  paymentOutcome: PaymentOutcome;
  guardianAmount: number;
  guardianActive: boolean;
  guardianImpactReady: boolean;
  savedPetIds: string[];
  savedRescuerIds: string[];
  cases: PetCase[];
  donations: Donation[];
  notifications: Notification[];
  messages: ChatMessage[];
  rescuerSupportPaymentEvents: RescuerSupportPaymentEvent[];
  /** Marca de tiempo: pagos con receivedAt mayor se cuentan como nuevos en inicio. */
  rescuerHomePaymentsAcknowledgedAt: number;
  draft: Record<string, string | boolean | string[]>;
  emptyStates: boolean;
  donorProfile: DonorProfile;
  rescuerProfile: RescuerProfile;
  setAccountMode: (mode: AccountMode) => void;
  setDonorIntent: (intent: DonorIntent) => void;
  setVerification: (status: Verification) => void;
  setPaymentOutcome: (outcome: PaymentOutcome) => void;
  setEmptyStates: (value: boolean) => void;
  updateDonorProfile: (values: Partial<DonorProfile>) => void;
  updateRescuerProfile: (values: Partial<RescuerProfile>) => void;
  toggleSavedPet: (id: string) => void;
  toggleSavedRescuer: (id: string) => void;
  donate: (caseId: string, needId: string, amount: number) => void;
  setGuardian: (active: boolean, amount?: number) => void;
  sendMessage: (author: "donor" | "rescuer", text: string, threadId?: string) => void;
  startAdoptionChat: (pet: { id: string; name: string; image: string; sex?: "Macho" | "Hembra" }) => void;
  markNotificationRead: (id: string) => void;
  updateDraft: (values: Record<string, string | boolean | string[]>) => void;
  publishDraft: (status?: PetCase["caseStatus"]) => void;
  updateCaseStatus: (
    id: string,
    status: PetCase["caseStatus"],
    closeMeta?: PetCaseCloseMeta,
  ) => void;
  toggleCaseAdoption: (id: string) => void;
  updateCase: (
    id: string,
    values: Partial<Pick<PetCase, "name" | "age" | "story" | "adoption" | "image">> & { needs?: PetCase["needs"] },
  ) => void;
  submitNeedEvidence: (caseId: string, needId: string) => void;
  acknowledgeRescuerHomePayments: () => void;
  resetPrototype: () => void;
};

const MS_PER_DAY = 86_400_000;

function buildInitialRescuerSupportPaymentEvents(now = Date.now()): RescuerSupportPaymentEvent[] {
  return [
    {
      id: "pay-milo-week",
      caseId: "milo",
      receivedAt: now - 5 * MS_PER_DAY,
      amount: "+$75",
      title: "Donaciones de 9 personas",
      metaSuffix: "Esta semana",
    },
    {
      id: "pay-milo-vet",
      caseId: "milo",
      receivedAt: now - 3 * MS_PER_DAY,
      amount: "+$25",
      title: "Sofía R. — Veterinario",
      metaSuffix: "Hace 2 días",
    },
    {
      id: "pay-nina-week",
      caseId: "nina",
      receivedAt: now - MS_PER_DAY,
      amount: "+$95",
      title: "Donaciones de 12 personas",
      metaSuffix: "Esta semana",
    },
    {
      id: "pay-nina-med",
      caseId: "nina",
      receivedAt: now - 12 * 3_600_000,
      amount: "+$15",
      title: "Luis G. — Medicina",
      metaSuffix: "Hace 3 días",
    },
  ];
}

const baseMessages: ChatMessage[] = [
  {
    id: "m1",
    threadId: "luna",
    author: "donor",
    text: adoptionChatIntroText({ name: "Luna", sex: "Hembra" }),
    image: "/assets/luna-card.png",
    time: "10:30",
  },
  { id: "m2", threadId: "luna", author: "rescuer", text: "¡Hola Ana! Me alegra tu interés. ¿Tienes experiencia con perros?", time: "10:32" },
  { id: "m3", threadId: "luna", author: "donor", text: "Sí, he tenido perros antes. Tengo un jardín amplio para ella.", time: "10:35" },
  { id: "m4", threadId: "luna", author: "rescuer", text: "Perfecto. ¿Cuándo podrías visitarnos para conocerla?", time: "10:36" },
];

const initialState = {
  accountMode: "donor" as const,
  donorIntent: "adopt" as const,
  verification: "verified" as const,
  paymentOutcome: "success" as const,
  guardianAmount: 200,
  guardianActive: false,
  guardianImpactReady: false,
  savedPetIds: [] as string[],
  savedRescuerIds: [] as string[],
  cases: initialCases,
  donations: [] as Donation[],
  notifications: initialNotifications,
  messages: baseMessages,
  rescuerSupportPaymentEvents: buildInitialRescuerSupportPaymentEvents(),
  rescuerHomePaymentsAcknowledgedAt: Date.now() - 2 * MS_PER_DAY,
  draft: {} as Record<string, string | boolean | string[]>,
  emptyStates: false,
  donorProfile: {
    firstName: "Alberto",
    lastName: "Quiroga",
    email: "alberto@email.com",
    phone: "+52 55 1234 5678",
    city: "Monterrey, NL",
  },
  rescuerProfile: { ...rescuerAccount },
};

export const usePrototypeStore = create<PrototypeState>()(
  persist(
    (set) => ({
      ...initialState,
      setAccountMode: (accountMode) => set({ accountMode }),
      setDonorIntent: (donorIntent) => set({ donorIntent }),
      setVerification: (verification) => set({ verification }),
      setPaymentOutcome: (paymentOutcome) => set({ paymentOutcome }),
      setEmptyStates: (emptyStates) =>
        set((state) => ({
          emptyStates,
          // Al apagar empty states, muestra el feed de impacto de demo si ya es Guardián.
          guardianImpactReady: emptyStates ? false : state.guardianActive ? true : state.guardianImpactReady,
        })),
      updateDonorProfile: (values) =>
        set((state) => ({
          donorProfile: { ...state.donorProfile, ...values },
        })),
      updateRescuerProfile: (values) =>
        set((state) => ({
          rescuerProfile: { ...state.rescuerProfile, ...values },
        })),
      toggleSavedPet: (id) =>
        set((state) => ({
          savedPetIds: state.savedPetIds.includes(id)
            ? state.savedPetIds.filter((petId) => petId !== id)
            : [...state.savedPetIds, id],
        })),
      toggleSavedRescuer: (id) =>
        set((state) => ({
          savedRescuerIds: state.savedRescuerIds.includes(id)
            ? state.savedRescuerIds.filter((rescuerId) => rescuerId !== id)
            : [...state.savedRescuerIds, id],
        })),
      donate: (caseId, needId, amount) =>
        set((state) => {
          const caseItem = state.cases.find((item) => item.id === caseId);
          const need = caseItem?.needs.find((entry) => entry.id === needId);
          const receivedAt = Date.now();
          const rescuerPaymentEvent =
            caseItem && !caseItem.adoption
              ? {
                  id: `pay-${receivedAt}`,
                  caseId,
                  receivedAt,
                  amount: `+$${amount}`,
                  title: need ? `Donación — ${need.title}` : "Donación recibida",
                  metaSuffix: "Ahora",
                }
              : null;
          return {
            cases: state.cases.map((item) =>
              item.id === caseId
                ? {
                    ...item,
                    needs: item.needs.map((entry) =>
                      entry.id === needId
                        ? {
                            ...entry,
                            funded: Math.min(entry.requested, entry.funded + amount),
                            status: entry.funded + amount >= entry.requested ? "funded" : entry.status,
                          }
                        : entry,
                    ),
                  }
                : item,
            ),
            donations: [
              {
                id: `donation-${receivedAt}`,
                caseId,
                needId,
                amount,
                date: new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date()),
                status: "success" as const,
              },
              ...state.donations,
            ],
            rescuerSupportPaymentEvents: rescuerPaymentEvent
              ? [rescuerPaymentEvent, ...state.rescuerSupportPaymentEvents]
              : state.rescuerSupportPaymentEvents,
            notifications: [
              {
                id: `notification-${receivedAt}`,
                kind: "donation" as const,
                title: "Donación enviada exitosamente",
                body: `Tu aportación de $${amount} MXN ya aparece en el caso.`,
                time: "Ahora",
                target: `/case/${caseId}`,
                read: false,
              },
              ...state.notifications,
            ],
          };
        }),
      setGuardian: (guardianActive, guardianAmount) =>
        set((state) => ({
          guardianActive,
          guardianAmount: guardianAmount ?? state.guardianAmount,
          // Recién activado: feed vacío hasta que haya impacto registrado.
          guardianImpactReady: guardianActive ? false : false,
          notifications: guardianActive
            ? [
                {
                  id: `guardian-${Date.now()}`,
                  kind: "donation" as const,
                  title: "Ya eres Guardián",
                  body: `Tu aportación mensual es de $${guardianAmount ?? state.guardianAmount} MXN.`,
                  time: "Ahora",
                  target: "/impact",
                  read: false,
                },
                ...state.notifications,
              ]
            : state.notifications,
        })),
      sendMessage: (author, text, threadId) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: `message-${Date.now()}`,
              author,
              text,
              threadId,
              time: new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
            },
          ],
          notifications:
            author === "donor"
              ? [
                  {
                    id: `message-notification-${Date.now()}`,
                    kind: "message" as const,
                    title: "Nuevo mensaje para María",
                    body: text,
                    time: "Ahora",
                    target: threadId ? `/messages/${threadId}` : "/messages/luna",
                    read: false,
                  },
                  ...state.notifications,
                ]
              : state.notifications,
        })),
      startAdoptionChat: (pet) =>
        set((state) => {
          const hasThread = state.messages.some((message) => message.threadId === pet.id);
          if (hasThread) return state;
          return {
            messages: [
              ...state.messages,
              {
                id: `intro-${pet.id}-${Date.now()}`,
                threadId: pet.id,
                author: "donor" as const,
                text: adoptionChatIntroText(pet),
                image: pet.image,
                time: new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
              },
            ],
          };
        }),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
        })),
      updateDraft: (values) => set((state) => ({ draft: { ...state.draft, ...values } })),
      publishDraft: (status = "review") =>
        set((state) => {
          const name = String(state.draft.petName || "Nuevo caso");
          const mode = state.draft.publishMode === "donation" ? "donation" : "adoption";
          const photos = Array.isArray(state.draft.photos) ? state.draft.photos : [];
          const mainPetPhoto = String(state.draft.mainPetPhoto || "");
          let donationNeeds: Need[] = [];
          if (mode === "donation") {
            try {
              const parsed = JSON.parse(String(state.draft.needItemsJson || "[]")) as Array<{
                id: string; title: string; type: Need["type"]; amount: number; urgent?: boolean;
              }>;
              donationNeeds = parsed.map((item) => ({
                id: item.id,
                title: item.title,
                type: item.type,
                requested: Number(item.amount || 0),
                funded: 0,
                urgent: Boolean(item.urgent),
                recurring: item.type === "Comida",
                status: "active" as const,
              }));
            } catch {
              donationNeeds = [];
            }
            if (!donationNeeds.length && state.draft.needTitle) {
              donationNeeds = [{
                id: `need-${Date.now()}`,
                title: String(state.draft.needTitle),
                type: "Otra",
                requested: Number(state.draft.amount || 500),
                funded: 0,
                status: "active",
              }];
            }
          }
          const created: PetCase = {
            id: `case-${Date.now()}`,
            name,
            age: String(state.draft.age || "Edad pendiente"),
            sex: state.draft.sex === "Hembra" ? "Hembra" : "Macho",
            species: state.draft.species === "Gato" ? "Gato" : "Perro",
            image: String(
              (mode === "donation" ? mainPetPhoto : photos[0]) || mainPetPhoto || photos[0] || "/assets/luna-card.png",
            ),
            story: String(state.draft.story || "Historia por completar."),
            location: String(state.draft.location || "Monterrey, MX"),
            rescuer: "María R.",
            distance: "0 km",
            adoption: mode === "adoption",
            caseStatus: status,
            health: {
              vaccinated: Boolean(state.draft.vaccinated),
              sterilized: Boolean(state.draft.sterilized),
              specialCare: state.draft.specialCare ? "Requiere cuidados especiales" : "Ninguno",
            },
            social: {
              dogs: Boolean(state.draft.socialDogs),
              cats: Boolean(state.draft.socialCats),
              children: Boolean(state.draft.socialChildren),
            },
            needs: donationNeeds,
          };
          return { cases: [created, ...state.cases], draft: {} };
        }),
      updateCaseStatus: (id, status, closeMeta) =>
        set((state) => ({
          cases: state.cases.map((item) => {
            if (item.id !== id) return item;
            if (status === "closed") {
              if (closeMeta?.closeReason) {
                return {
                  ...item,
                  caseStatus: status,
                  closeReason: closeMeta.closeReason,
                  adoptedWithDopmiSupport:
                    closeMeta.closeReason === "adoptada" ? closeMeta.adoptedWithDopmiSupport : undefined,
                  closeReasonDescription:
                    closeMeta.closeReason === "otro"
                      ? closeMeta.closeReasonDescription?.trim() || undefined
                      : undefined,
                };
              }
              return { ...item, caseStatus: status };
            }
            if (status === "draft") {
              return {
                ...item,
                caseStatus: status,
                closeReason: undefined,
                adoptedWithDopmiSupport: undefined,
                closeReasonDescription: undefined,
              };
            }
            return { ...item, caseStatus: status };
          }),
        })),
      toggleCaseAdoption: (id) =>
        set((state) => ({
          cases: state.cases.map((item) => (item.id === id ? { ...item, adoption: !item.adoption } : item)),
        })),
      updateCase: (id, values) =>
        set((state) => ({
          cases: state.cases.map((item) => (item.id === id ? { ...item, ...values } : item)),
        })),
      submitNeedEvidence: (caseId, needId) =>
        set((state) => {
          const pet = state.cases.find((item) => item.id === caseId);
          const need = pet?.needs.find((entry) => entry.id === needId);
          return {
            cases: state.cases.map((item) =>
              item.id === caseId
                ? {
                    ...item,
                    needs: item.needs.map((entry) =>
                      entry.id === needId ? { ...entry, status: "evidence" as const } : entry,
                    ),
                  }
                : item,
            ),
            notifications: [
              {
                id: `evidence-${Date.now()}`,
                kind: "case" as const,
                title: "Evidencia en revisión",
                body: need
                  ? `Recibimos la evidencia de ${need.title} para ${pet?.name ?? "tu caso"}.`
                  : "Recibimos tu evidencia. Te avisaremos cuando la revisemos.",
                time: "Ahora",
                target: `/rescuer/cases/${caseId}`,
                read: false,
              },
              ...state.notifications,
            ],
          };
        }),
      acknowledgeRescuerHomePayments: () =>
        set({ rescuerHomePaymentsAcknowledgedAt: Date.now() }),
      resetPrototype: () =>
        set({
          ...initialState,
          rescuerSupportPaymentEvents: buildInitialRescuerSupportPaymentEvents(),
          rescuerHomePaymentsAcknowledgedAt: Date.now() - 2 * MS_PER_DAY,
        }),
    }),
    {
      name: "dopmi-functional-prototype-v2",
      version: 23,
      migrate: (persisted, version) => {
        const state = persisted as PrototypeState;
        if (version < 19) {
          return {
            ...state,
            cases: initialCases,
            notifications: initialNotifications,
            emptyStates: false,
            guardianImpactReady: false,
            messages: baseMessages,
            donorProfile: {
              firstName: "Alberto",
              lastName: "Quiroga",
              email: "alberto@email.com",
              phone: "+52 55 1234 5678",
              city: "Monterrey, NL",
            },
            rescuerProfile: { ...rescuerAccount },
          };
        }
        if (version < 21) {
          return {
            ...state,
            cases: initialCases,
            emptyStates: false,
          };
        }
        if (version < 22) {
          const now = Date.now();
          return {
            ...state,
            rescuerSupportPaymentEvents: buildInitialRescuerSupportPaymentEvents(now),
            rescuerHomePaymentsAcknowledgedAt: now - 2 * MS_PER_DAY,
          };
        }
        if (version < 23) {
          return {
            ...state,
            cases: initialCases,
          };
        }
        return state;
      },
    },
  ),
);
