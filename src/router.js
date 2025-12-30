// router.js
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
  ACTIVITY_E: "ACTIVITY_E",
  ARTIFACT_REWARD: "ARTIFACT_REWARD",
  ARTIFACT_JOURNAL: "ARTIFACT_JOURNAL",
});

const routeToInt = {
  1: routes.ACTIVITY_B,
  2: routes.ACTIVITY_D,
  3: routes.ACTIVITY_C,
  4: routes.ACTIVITY_F,
  5: routes.ACTIVITY_E,
  6: routes.ACTIVITY_A,
};

const ONBOARDING_FLAG_KEY = "onboardingPassed";

const isBrowser = typeof window !== "undefined";

function hasCompletedOnboarding() {
  if (!isBrowser) return false;
  return localStorage.getItem(ONBOARDING_FLAG_KEY) === "true";
}

export function setOnboardingCompleted(value = true) {
  if (!isBrowser) return;
  localStorage.setItem(ONBOARDING_FLAG_KEY, value ? "true" : "false");
}

function getActivityID() {
  if (!isBrowser) return null;

  const urlParams = new URLSearchParams(window.location.search);
  const idValue = urlParams.get("id");
  const idInt = parseInt(idValue, 10);

  if (isNaN(idInt) || idInt < 1 || idInt > 6) {
    return null;
  }

  return routeToInt[idInt];
}

function createRouter() {
  let activityName = getActivityID() ?? routes.INTRO;

  if (!hasCompletedOnboarding()) {
    activityName = routes.INTRO;
  }

  const { subscribe, set, update } = writable({
    name: activityName,
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