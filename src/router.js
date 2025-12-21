import { writable } from "svelte/store";

export const routes = /** @type {const} */ ({
  SPLASH: "SPLASH",
  INTRO: "INTRO",
  PLAYTESTS: "PLAYTESTS",
  ACTIVITY_A: "ACTIVITY_A",
  ACTIVITY_F: "ACTIVITY_F",
  ACTIVITY_B: "ACTIVITY_B",
  ACTIVITY_C: "ACTIVITY_C",
  ACTIVITY_D: "ACTIVITY_D",
  ACTIVITY_E: 'ACTIVITY_E',
  ARTIFACT_REWARD: 'ARTIFACT_REWARD',
  ARTIFACT_JOURNAL: 'ARTIFACT_JOURNAL'
});

function createRouter() {
  const { subscribe, set, update } = writable({
    name: routes.INTRO,
    params: {},
  });

  return {
    subscribe,
    go: (name, params = {}) => {
      console.log("[router.go]", name, params);
      set({ name, params });
    },
    backTo: (name, params = {}) => set({ name, params }),
    patchParams: (patch) =>
      update((r) => ({ ...r, params: { ...r.params, ...patch } })),
  };
}

export const router = createRouter();
