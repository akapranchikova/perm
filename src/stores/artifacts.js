import { derived, writable } from 'svelte/store';
import { artifactsCatalog } from '../data/artifacts';

const STORAGE_KEY = 'polenov-artifacts';

const baseState = { collectedIds: [] };

function loadFromStorage() {
  if (typeof localStorage === 'undefined') return baseState;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return baseState;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.collectedIds)) {
      return { collectedIds: parsed.collectedIds };
    }
  } catch (error) {
    console.warn('[artifacts] parse storage failed', error);
  }

  return baseState;
}

function persist(state) {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[artifacts] persist failed', error);
  }
}

function createArtifactStore() {
  const store = writable(loadFromStorage());

  if (typeof window !== 'undefined') {
    store.subscribe((value) => persist(value));
  }

  const collect = (id) =>
    store.update((state) => {
      if (state.collectedIds.includes(id)) return state;
      const next = { ...state, collectedIds: [...state.collectedIds, id] };
      persist(next);
      return next;
    });

  const reset = () => {
    persist(baseState);
    store.set(baseState);
  };

  return {
    subscribe: store.subscribe,
    collect,
    reset,
  };
}

export const artifactProgress = createArtifactStore();

export const collectedArtifacts = derived(artifactProgress, ($progress) =>
  $progress.collectedIds
    .map((id) => artifactsCatalog.find((artifact) => artifact.id === id))
    .filter(Boolean)
);

export const collectedCount = derived(
  artifactProgress,
  ($progress) => $progress.collectedIds.length
);
