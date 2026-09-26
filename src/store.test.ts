import { beforeEach, describe, expect, it } from "vitest";
import { usePrototypeStore } from "./store";

describe("DopMi prototype state", () => {
  beforeEach(() => {
    localStorage.clear();
    usePrototypeStore.getState().resetPrototype();
  });

  it("keeps adopter and donor under the same account mode", () => {
    const state = usePrototypeStore.getState();
    state.setAccountMode("donor");
    state.setDonorIntent("adopt");
    expect(usePrototypeStore.getState().accountMode).toBe("donor");
    expect(usePrototypeStore.getState().donorIntent).toBe("adopt");

    usePrototypeStore.getState().setDonorIntent("donate");
    expect(usePrototypeStore.getState().accountMode).toBe("donor");
    expect(usePrototypeStore.getState().donorIntent).toBe("donate");
  });

  it("synchronizes saved pets across surfaces", () => {
    usePrototypeStore.getState().toggleSavedPet("luna");
    expect(usePrototypeStore.getState().savedPetIds).toContain("luna");

    usePrototypeStore.getState().toggleSavedPet("luna");
    expect(usePrototypeStore.getState().savedPetIds).not.toContain("luna");
  });

  it("updates the need, donation history, and notification after success", () => {
    const before = usePrototypeStore
      .getState()
      .cases.find((item) => item.id === "luna")!
      .needs.find((need) => need.id === "luna-vet")!.funded;

    usePrototypeStore.getState().donate("luna", "luna-vet", 10);

    const state = usePrototypeStore.getState();
    const funded = state.cases
      .find((item) => item.id === "luna")!
      .needs.find((need) => need.id === "luna-vet")!.funded;
    expect(funded).toBe(before + 10);
    expect(state.donations[0]).toMatchObject({ caseId: "luna", needId: "luna-vet", amount: 10 });
    expect(state.notifications[0].title).toBe("Donación enviada exitosamente");
  });

  it("changes role without deleting the other role's mock data", () => {
    usePrototypeStore.getState().toggleSavedPet("rocky");
    usePrototypeStore.getState().setAccountMode("rescuer");
    expect(usePrototypeStore.getState().savedPetIds).toEqual(["rocky"]);
    usePrototypeStore.getState().setAccountMode("donor");
    expect(usePrototypeStore.getState().savedPetIds).toEqual(["rocky"]);
  });
});
