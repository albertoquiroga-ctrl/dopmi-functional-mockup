import { create } from "zustand";
import { persist } from "zustand/middleware";
import { initialCases, initialNotifications, rescuerAccount, type Need, type Notification, type PetCase } from "./data";

export type AccountMode = "donor" | "rescuer";
export type DonorIntent = "adopt" | "donate";
export type Verification = "unverified" | "review" | "verified" | "rejected";
export type PaymentOutcome = "success" | "error";

export type StripeStatus = "unlinked" | "pending" | "linked" | "error";

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
  orgName?: string;
  wantsVerification?: boolean;
  verificationPhoto?: string;
  verificationVideo?: string;
  profileComplete?: boolean;
};

export type PhoneVerification = {
  status: "idle" | "code_sent" | "verified" | "wrong_code" | "expired";
  phone: string;
};

export type DonorProfile = {
  name: string;
  email: string;
  phone: string;
  city: string;
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
  donorProfile: DonorProfile;
  stripeStatus: StripeStatus;
  phoneVerification: PhoneVerification;
  pendingActions: Array<{ id: string; caseId?: string; kind: "stripe" | "corrections"; title: string; body: string }>;
  setAccountMode: (mode: AccountMode) => void;
  setDonorIntent: (intent: DonorIntent) => void;
  setVerification: (status: Verification) => void;
  setPaymentOutcome: (outcome: PaymentOutcome) => void;
  setEmptyStates: (value: boolean) => void;
  updateRescuerProfile: (values: Partial<RescuerProfile>) => void;
  updateDonorProfile: (values: Partial<DonorProfile>) => void;
  setStripeStatus: (status: StripeStatus) => void;
  setPhoneVerification: (values: Partial<PhoneVerification>) => void;
  completeStripeAndPublish: (caseId?: string) => void;
  dismissPendingAction: (id: string) => void;
  toggleSavedPet: (id: string) => void;
  toggleSavedRescuer: (id: string) => void;
  donate: (caseId: string, needId: string, amount: number) => void;
  setGuardian: (active: boolean, amount?: number) => void;
  sendMessage: (author: "donor" | "rescuer", text: string) => void;
  markNotificationRead: (id: string) => void;
  updateDraft: (values: Record<string, string | boolean | string[]>) => void;
  publishDraft: (status?: PetCase["caseStatus"]) => string;
  updateCaseStatus: (id: string, status: PetCase["caseStatus"]) => void;
  approveCaseForPublish: (id: string) => void;
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
  cases: [
    ...initialCases,
    {
      ...initialCases[0],
      id: "approved-stripe-demo",
      name: "Coco",
      adoption: false,
      caseStatus: "approved_stripe_pending",
      needs: [
        { id: "coco-food", title: "Croquetas 5 kg", type: "Comida", requested: 450, funded: 0, status: "active" },
      ],
      feeMxn: 50,
    },
  ],
  donations: [] as Donation[],
  notifications: initialNotifications,
  messages: baseMessages,
  draft: {} as Record<string, string | boolean | string[]>,
  emptyStates: false,
  rescuerProfile: { ...rescuerAccount, profileComplete: false, wantsVerification: false },
  stripeStatus: "unlinked" as StripeStatus,
  phoneVerification: { status: "idle" as const, phone: "" },
  pendingActions: [
    {
      id: "pending-stripe-demo",
      caseId: "approved-stripe-demo",
      kind: "stripe",
      title: "Vincula tu cuenta de Stripe",
      body: "Tu caso fue aprobado. Vincula tu cuenta de Stripe para publicarlo y comenzar a recibir donaciones.",
    },
  ] as Array<{ id: string; caseId?: string; kind: "stripe" | "corrections"; title: string; body: string }>,
  donorProfile: {
    name: "Alberto Quiroga",
    email: "alberto@email.com",
    phone: "+52 55 1234 5678",
    city: "Ciudad de México",
  },
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
      updateDonorProfile: (values) =>
        set((state) => ({
          donorProfile: { ...state.donorProfile, ...values },
        })),
      setStripeStatus: (stripeStatus) => set({ stripeStatus }),
      setPhoneVerification: (values) =>
        set((state) => ({
          phoneVerification: { ...state.phoneVerification, ...values },
        })),
      dismissPendingAction: (id) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter((item) => item.id !== id),
        })),
      completeStripeAndPublish: (caseId) =>
        set((state) => {
          const targetId =
            caseId || state.pendingActions.find((item) => item.kind === "stripe")?.caseId;
          return {
            stripeStatus: "linked" as const,
            cases: state.cases.map((item) =>
              item.caseStatus === "approved_stripe_pending"
                ? { ...item, caseStatus: "active" as const }
                : item,
            ),
            pendingActions: state.pendingActions.filter((item) => item.kind !== "stripe"),
            notifications: [
              {
                id: `stripe-${Date.now()}`,
                kind: "case" as const,
                title: "Stripe vinculado",
                body: "Los casos aprobados ya pueden publicarse y recibir donaciones.",
                time: "Ahora",
                target: targetId ? `/rescuer/cases/${targetId}` : "/rescuer/cases",
                read: false,
              },
              ...state.notifications,
            ],
          };
        }),
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
          cases: state.cases.map((item) => {
            if (item.id !== caseId) return item;
            const needs = item.needs.map((need) =>
              need.id === needId
                ? {
                    ...need,
                    funded: Math.min(need.requested, need.funded + amount),
                    status: need.funded + amount >= need.requested ? ("funded" as const) : need.status,
                  }
                : need,
            );
            const allCovered = needs.length > 0 && needs.every((need) => need.funded >= need.requested);
            return {
              ...item,
              needs,
              caseStatus:
                allCovered && (item.caseStatus === "active" || item.caseStatus === "funded")
                  ? ("funded" as const)
                  : item.caseStatus,
            };
          }),
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
      publishDraft: (status = "review") => {
        let createdId = "";
        set((state) => {
          let parsed: Record<string, any> = {};
          try {
            parsed = JSON.parse(String(state.draft.publishDraftJson || "{}"));
          } catch {
            parsed = {};
          }
          const mode = parsed.publishMode === "adoption" || state.draft.publishMode === "adoption" ? "adoption" : "donation";
          const name = String(parsed.petName || state.draft.petName || "Nuevo caso");
          const photos = parsed.mainPhoto
            ? [parsed.mainPhoto, ...(parsed.extraPhotos || [])]
            : Array.isArray(state.draft.photos)
              ? (state.draft.photos as string[])
              : [];
          let donationNeeds: Need[] = [];
          if (mode === "donation") {
            const items = Array.isArray(parsed.needItems) ? parsed.needItems : [];
            donationNeeds = items.map((item: any) => ({
              id: String(item.id),
              title: String(item.title || "Necesidad"),
              type:
                item.type === "Veterinario"
                  ? ("Veterinario" as const)
                  : item.type === "Medicina"
                    ? ("Medicina" as const)
                    : ("Comida" as const),
              requested: Number(item.amount || 0),
              funded: 0,
              recurring: item.type === "Comida",
              status: "active" as const,
              brand: item.brand,
              weightKg: item.weightKg,
              units: item.units,
              ticketSpend: item.ticketSpend,
              medicineName: item.medicineName,
              treatment: item.treatment,
              clinicName: item.clinicName,
              consultReason: item.consultReason,
              clinicPhone: item.clinicPhone,
              ticketPhoto: parsed.needTicketById?.[item.id],
            }));
          }
          createdId = `case-${Date.now()}`;
          const rawPersonality = parsed.personality;
          const personality =
            typeof rawPersonality === "string"
              ? rawPersonality
              : Array.isArray(rawPersonality)
                ? String(rawPersonality[0] || "")
                : undefined;
          const created: PetCase = {
            id: createdId,
            name,
            age:
              mode === "adoption"
                ? String(parsed.ageBand || parsed.age || "Edad pendiente")
                : String(parsed.ageBand || parsed.age || ""),
            sex:
              parsed.sex === "Hembra" || parsed.sex === "Macho"
                ? parsed.sex
                : mode === "adoption"
                  ? "Macho"
                  : undefined,
            species:
              parsed.species === "Gato" || parsed.species === "Perro"
                ? parsed.species
                : mode === "adoption"
                  ? "Perro"
                  : undefined,
            image: String(photos[0] || "/assets/luna-card.png"),
            photos: photos.length ? photos : undefined,
            story: String(parsed.story || state.draft.story || "Historia por completar."),
            location: String(parsed.location || state.draft.location || ""),
            rescuer: state.rescuerProfile.name || "Rescatista",
            distance: "0 km",
            adoption: mode === "adoption",
            caseStatus: status,
            health: {
              vaccinated: Boolean(parsed.vaccinated ?? state.draft.vaccinated),
              sterilized: Boolean(parsed.sterilized ?? state.draft.sterilized),
              specialCare: parsed.specialCare || state.draft.specialCare ? "Requiere cuidados especiales" : "Ninguno",
            },
            social: {
              dogs: Boolean(parsed.socialDogs ?? state.draft.socialDogs),
              cats: Boolean(parsed.socialCats ?? state.draft.socialCats),
              children: Boolean(parsed.socialChildren ?? state.draft.socialChildren),
            },
            needs: donationNeeds,
            feeMxn: mode === "donation" ? 50 : undefined,
            contextVideo: parsed.contextVideo || undefined,
            thankYouVideo: parsed.thankYouVideo || undefined,
            categoryEvidence: Array.isArray(parsed.categoryEvidence)
              ? parsed.categoryEvidence.filter((entry: { photo?: string }) => Boolean(entry?.photo))
              : undefined,
            size: parsed.size || undefined,
            ageBand: parsed.ageBand || undefined,
            energy: parsed.energy || undefined,
            personality: personality || undefined,
          };
          const pendingActions =
            mode === "donation" && state.stripeStatus !== "linked"
              ? [
                  {
                    id: `pending-stripe-${createdId}`,
                    caseId: createdId,
                    kind: "stripe" as const,
                    title: "Vincula tu cuenta de Stripe",
                    body: "Tu caso fue aprobado. Vincula tu cuenta de Stripe para publicarlo y comenzar a recibir donaciones.",
                  },
                  ...state.pendingActions,
                ]
              : state.pendingActions;
          return { cases: [created, ...state.cases], draft: {}, pendingActions };
        });
        return createdId;
      },
      updateCaseStatus: (id, status) =>
        set((state) => ({
          cases: state.cases.map((item) => (item.id === id ? { ...item, caseStatus: status } : item)),
        })),
      approveCaseForPublish: (id) =>
        set((state) => {
          const target = state.cases.find((item) => item.id === id);
          if (!target) return {};
          const needsStripe = target.needs.length > 0 && state.stripeStatus !== "linked";
          const nextStatus = needsStripe ? ("approved_stripe_pending" as const) : ("active" as const);
          const alreadyPending = state.pendingActions.some((item) => item.kind === "stripe" && item.caseId === id);
          return {
            cases: state.cases.map((item) => (item.id === id ? { ...item, caseStatus: nextStatus } : item)),
            pendingActions:
              needsStripe && !alreadyPending
                ? [
                    {
                      id: `pending-stripe-${id}`,
                      caseId: id,
                      kind: "stripe" as const,
                      title: "Vincula tu cuenta de Stripe",
                      body: "Tu caso fue aprobado. Vincula tu cuenta de Stripe para publicarlo y comenzar a recibir donaciones.",
                    },
                    ...state.pendingActions,
                  ]
                : state.pendingActions,
          };
        }),
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
      version: 20,
      // Las versiones previas no tienen los casos ni las notificaciones con el formato actual.
      migrate: (persisted) => {
        const prev = persisted as PrototypeState & { rescuerProfile?: Partial<RescuerProfile> };
        const priorProfile = prev.rescuerProfile || {};
        return {
          ...prev,
          cases: [
            ...initialCases,
            {
              ...initialCases[0],
              id: "approved-stripe-demo",
              name: "Coco",
              adoption: false,
              caseStatus: "approved_stripe_pending",
              needs: [
                { id: "coco-food", title: "Croquetas 5 kg", type: "Comida", requested: 450, funded: 0, status: "active" },
              ],
              feeMxn: 50,
            },
          ],
          notifications: initialNotifications,
          emptyStates: false,
          guardianImpactReady: false,
          rescuerProfile: {
            ...rescuerAccount,
            profileComplete: false,
                        wantsVerification: false,
            ...priorProfile,
            name: priorProfile.name === "María Rescatista" ? "María R." : priorProfile.name || rescuerAccount.name,
            orgName: priorProfile.orgName ?? rescuerAccount.orgName,
          },
          stripeStatus: prev.stripeStatus || "unlinked",
          phoneVerification: prev.phoneVerification || { status: "idle", phone: "" },
          pendingActions: prev.pendingActions || [],
          donorProfile: {
            name: "Alberto Quiroga",
            email: "alberto@email.com",
            phone: "+52 55 1234 5678",
            city: "Ciudad de México",
            ...prev.donorProfile,
          },
        };
      },
    },
  ),
);
