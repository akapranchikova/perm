import { writable, get } from 'svelte/store';

// Создаем store, который хранит Map<исходный_путь, blob_url>
export const assetsStore = writable<Map<string, string>>(new Map());

// Хелпер для сохранения (используем в Onboarding)
export function registerAsset(src: string, blobUrl: string) {
  assetsStore.update(map => {
    // Важно создать новый Map или мутировать существующий, 
    // но для реактивности Svelte лучше возвращать тот же объект, если мутируем через update
    map.set(src, blobUrl); 
    return map;
  });
}

// Хелпер для получения URL (можно использовать в JS коде)
export function getAssetUrl(src: string | undefined): string {
  if (!src) return "";
  const map = get(assetsStore);
  return map.get(src) || src;
}