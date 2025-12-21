export const trip1899 = {
  title: 'Восточная поездка 1899 г.',
  mapUrl: '/travelerMap.svg',
  guideAvatarUrl: '/activityE/guide.png',
  hint: 'Нажимайте на неизвестные точки на карте и узнайте о маршруте и заметках путешественника',

  // 3 точки: позиция в процентах (0..100) внутри области карты
  cities: [
    {
      id: 'Cairo',
      name: 'Каир',
      pos: { x: 58, y: 18 },
      audioUrl: '/audio/onboarding-journey.wav',
      captions: [
        { t: 0.0, text: 'Сюжет восточной поездки наглядно показывал ученикам, как Поленов работал с натурой.' },
        { t: 5.5, text: 'Край света и песок на снимках напоминали мне о его поисках света.' }
      ],
      media: ['/painting.png'],
      videoPoster: '/painting.png',
      videoUrl: '/StartLoading/6944fe39e6e2ba74169403b6_result.mp4',
      letterLines: ['Снимки восточной поездки', 'показывали ученикам, как искать', 'свет и фактуру в реальных городах.']
    },
    {
      id: 'Jerusalem',
      name: 'Иерусалим',
      pos: { x: 62, y: 30 },
      audioUrl: '/audio/onboarding-welcome.wav',
      captions: [
        { t: 0, text: 'Поленов любил показывать ученикам город с его куполами и шумными улицами.' },
        { t: 5, text: 'Каждая зарисовка становилась учебным материалом.' }
      ],
      media: ['/painting-d.png'],
      videoPoster: '/painting-d.png',
      videoUrl: '/StartLoading/6944fe39e6e2ba74169403b6_result.mp4',
      letterLines: ['Поленов показывал на примере Иерусалима,', 'как заметки из путешествий', 'превращаются в будущие картины.']
    },
    {
      id: 'Constantinople',
      name: 'Константинополь',
      pos: { x: 54, y: 46 },
      audioUrl: '/audio/onboarding-welcome.wav',
      captions: [
        { t: 0, text: 'Художник наглядно показывал ученикам, что путешествие — источник вдохновения.' }
      ],
      media: ['/book.png'],
      videoPoster: '/book.png',
      videoUrl: '/StartLoading/6944fe39e6e2ba74169403b6_result.mp4',
      letterLines: ['Художник наглядно показывал ученикам,', 'что путешествие — источник вдохновения.']
    }
  ],

  final: {
    title: 'Маршрут окончен!',
    imageUrl: '/guides.png',
    backgroundUrl: '/guides.png',
    text: 'Маршрут окончен! Надеюсь, вы сохранили себе пару точек для будущего путешествия?',
    button: 'Завершить'
  }
};
