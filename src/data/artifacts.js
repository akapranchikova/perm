import { routes } from '../router';

export const artifactsCatalog = [
  {
    id: 'sun-proof-whites',
    name: 'Невыцветающие на солнце белила',
    description: 'Тюбик с белилами, которые не выцветают на солнце',
    image: '/artifacts/belila.png',
    activityRoute: routes.ACTIVITY_A,
    caption: 'Белила',
  },
  {
    id: 'memoir-letter',
    name: 'Письмо ученика',
    description: 'Лист с воспоминаниями, который удалось поймать в AR',
    image: '/artifacts/belila.png',
    activityRoute: routes.ACTIVITY_B,
    caption: 'Письмо',
  },
  {
    id: 'palette-mark',
    name: 'Палитра из мастерской',
    description: 'Оттенки, которые помогают разгадать вопросы экспозиции',
    image: '/artifacts/belila.png',
    activityRoute: routes.ACTIVITY_C,
    caption: 'Палитра',
  },
  {
    id: 'glass-sphere',
    name: 'Стеклянный шар',
    description: 'Тот самый шар, который скрывал загадку квиза',
    image: '/artifacts/belila.png',
    activityRoute: routes.ACTIVITY_D,
    caption: 'Шар',
  },
  {
    id: 'travel-sketch',
    name: 'Путевой эскиз',
    description: 'Эскиз маршрута путешествия 1899 года',
    image: '/artifacts/belila.png',
    activityRoute: routes.ACTIVITY_E,
    caption: 'Эскиз',
  },
];

export const rewardCopy = {
  title: 'Вы нашли артефакт',
  subtitleFallback: 'Каждый найденный экспонат сохраняется в вашем путевом дневнике',
  ctaLabel: 'К другим экспонатам',
};

export const journalCopy = {
  title: 'Путевой дневник',
  subtitle: 'Здесь собраны все артефакты, которые вы нашли на выставке',
  ctaLabel: 'Раскрыть все секреты',
};

export function getArtifactById(id) {
  return artifactsCatalog.find((artifact) => artifact.id === id);
}

export function getArtifactForActivity(activityRoute) {
  return artifactsCatalog.find((artifact) => artifact.activityRoute === activityRoute);
}
