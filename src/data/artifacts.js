import { routes } from '../router';

export const artifactsCatalog = [
  {
    id: 'sun-proof-whites',
    name: 'Невыцветающие нa солнце белила',
    description: 'Тюбик с белилами, которые не выцветают на солнце',
    image: '/artifacts/belila.png',
    activityRoute: routes.ACTIVITY_A,
    caption: 'Белила',
  },
  {
    id: 'sun-proof-whites-1',
    name: 'Карандашный эскиз «Больной»',
    description: 'Карандашный эскиз «Больной» до того, как в нём загорелся свет',
    image: '/artifacts/skitze.png',
    activityRoute: routes.ACTIVITY_F,
    caption: 'Эскиз',
  },
  {
    id: 'memoir-letter',
    name: 'Приветственный адрес от  учеников',
    description: 'Приветственный адрес с тёплыми словами учеников Поленова',
    image: '/artifacts/tablet.png',
    activityRoute: routes.ACTIVITY_B,
    caption: 'Блокнот',
  },
  // {
  //   id: 'palette-mark',
  //   name: 'Нотная строка из записей Поленова',
  //   description: 'Нотная строка из театральных записей Поленова',
  //   image: '/artifacts/note.png',
  //   activityRoute: routes.ACTIVITY_C,
  //   caption: 'Ноты',
  // },
  {
    id: 'glass-sphere',
    name: 'Учебная схема светотени',
    description: 'Учебная схема, через которую Поленов объяснял светотеневую моделировку ученикам',
    image: '/artifacts/ball.png',
    activityRoute: routes.ACTIVITY_D,
    caption: 'Шар',
  },
  {
    id: 'travel-sketch',
    name: 'Почтовая марка из Константинополя',
    description: 'Почтовая марка из Константинополя, маленький след большого восточного путешествия',
    image: '/artifacts/mark.png',
    activityRoute: routes.ACTIVITY_E,
    caption: 'Марка',
  }
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
