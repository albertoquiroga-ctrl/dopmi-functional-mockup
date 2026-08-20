import { create } from "zustand";
import { persist } from "zustand/middleware";
import { initialCases, initialNotifications, rescuerAccount, type Need, type Notification, type PetCase } from "./data";

export type AccountMode = "donor" | "rescuer";
export type DonorIntent = "adopt" | "donate";
export type Verification = "unverified" | "review" | "verified" | "rejected";
export type PaymentOutcome = "success" | "error";

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

export type ChatMessage = {
  id: string;
  author: "donor" | "rescuer";
  text: string;
  time: string;
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
  draft: Record<string, string | boolean | string[]>;
  emptyStates: boolean;
  rescuerProfile: RescuerProfile;
  setAccountMode: (mode: AccountMode) => void;
  setDonorIntent: (intent: DonorIntent) => void;
  setVerification: (status: Verification) => void;
  setPaymentOutcome: (outcome: PaymentOutcome) => void;
  setEmptyStates: (value: boolean) => void;
  updateRescuerProfile: (values: Partial<RescuerProfile>) => void;
  toggleSavedPet: (id: string) => void;
  toggleSavedRescuer: (id: string) => void;
  donate: (caseId: string, needId: string, amount: number) => void;
  setGuardian: (active: boolean, amount?: number) => void;
  sendMessage: (author: "donor" | "rescuer", text: string) => void;
  markNotificationRead: (id: string) => void;
  updateDraft: (values: Record<string, string | boolean | string[]>) => void;
  publishDraft: (status?: PetCase["caseStatus"]) => void;
  updateCaseStatus: (id: string, status: PetCase["caseStatus"]) => void;
  toggleCaseAdoption: (id: string) => void;
  updateCase: (id: string, values: Partial<Pick<PetCase, "name" | "age" | "story" | "adoption">> & { needs?: PetCase["needs"] }) => void;
  submitNeedEvidence: (caseId: string, needId: string) => void;
  resetPrototype: () => void;
};

const baseMessages: ChatMessage[] = [
  { id: "m1", author: "donor", text: "¡Hola! Me interesa adoptar a Luna.", time: "10:30" },
  { id: "m2", author: "rescuer", text: "¡Hola Ana! Me alegra tu interés. ¿Tienes experiencia con perros?", time: "10:32" },
  { id: "m3", author: "donor", text: "Sí, he tenido perros antes. Tengo un jardín amplio para ella.", time: "10:35" },
  { id: "m4", author: "rescuer", text: "Perfecto. ¿Cuándo podrías visitarnos para conocerla?", time: "10:36" },
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
  draft: {} as Record<string, string | boolean | string[]>,
  emptyStates: false,
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
        set((state) => ({
          cases: state.cases.map((item) =>
            item.id === caseId
              ? {
                  ...item,
                  needs: item.needs.map((need) =>
                    need.id === needId
                      ? {
                          ...need,
                          funded: Math.min(need.requested, need.funded + amount),
                          status: need.funded + amount >= need.requested ? "funded" : need.status,
                        }
                      : need,
                  ),
                }
              : item,
          ),
          donations: [
            {
              id: `donation-${Date.now()}`,
              caseId,
              needId,
              amount,
              date: new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date()),
              status: "success" as const,
            },
            ...state.donations,
          ],
          notifications: [
            {
              id: `notification-${Date.now()}`,
              kind: "donation" as const,
              title: "Donación enviada exitosamente",
              body: `Tu aportación de $${amount} MXN ya aparece en el caso.`,
              time: "Ahora",
              target: `/case/${caseId}`,
              read: false,
            },
            ...state.notifications,
          ],
        })),
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
      sendMessage: (author, text) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: `message-${Date.now()}`,
              author,
              text,
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
                    target: "/messages/luna",
                    read: false,
                  },
                  ...state.notifications,
                ]
              : state.notifications,
        })),
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
            image: String(photos[0] || "/assets/luna-card.png"),
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
      updateCaseStatus: (id, status) =>
        set((state) => ({
          cases: state.cases.map((item) => (item.id === id ? { ...item, caseStatus: status } : item)),
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
      resetPrototype: () => set({ ...initialState }),
    }),
    {
      name: "dopmi-functional-prototype-v2",
      version: 9,
      // Las versiones previas no tienen los casos ni las notificaciones con el formato actual.
      migrate: (persisted) => ({
        ...(persisted as PrototypeState),
        cases: initialCases,
        notifications: initialNotifications,
        emptyStates: false,
        guardianImpactReady: false,
        rescuerProfile: { ...rescuerAccount },
      }),
    },
  ),
);
