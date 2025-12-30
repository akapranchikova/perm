export const trip1899 = {
  title: "Восточная поездка 1899 г.",
  mapUrl: "/travelerMap.svg",
  guideAvatarUrl: "/activityE/guide.png",
  hint: "Нажимайте на неизвестные точки на карте и узнайте о маршруте и заметках путешественника",

  // 3 точки: позиция в процентах (0..100) внутри области карты
  cities: [
    {
      id: "Cairo",
      name: "Каир",
      pos: { x: 58, y: 18 },
      audioUrl: "/audio/onboarding-journey.wav",
      captions: [
        {
          t: 0.0,
          text: "Сюжет восточной поездки наглядно показывал ученикам, как Поленов работал с натурой.",
        },
        {
          t: 5.5,
          text: "Край света и песок на снимках напоминали мне о его поисках света.",
        },
      ],
      media: ["/painting.png"],
      videoPoster: "/activityE/Cairo.jpeg",
      videoUrl: "/activityE/Cairo.webm",
      letterLines: [
        "Снимки восточной поездки",
        "показывали ученикам, как искать",
        "свет и фактуру в реальных городах.",
      ],
      video: {
        src: "/activityE/guide_stage_2.webm",
        subtitles: "/activityE/guide_stage_2.srt",
        poster: "/images/gigachat.png",
        autoplay: true,
        loop: false,
        controls: false,
        subtitlesLabel: "Субтитры",
        subtitlesLang: "ru",
      },
    },
    {
      id: "Jerusalem",
      name: "Иерусалим",
      pos: { x: 62, y: 30 },
      audioUrl: "/audio/onboarding-welcome.wav",
      captions: [
        {
          t: 0,
          text: "Поленов любил показывать ученикам город с его куполами и шумными улицами.",
        },
        { t: 5, text: "Каждая зарисовка становилась учебным материалом." },
      ],
      media: ["/painting-d.png"],
      videoPoster: "/activityE/Jerusalem.jpeg",
      videoUrl: "/activityE/Jes.webm",
      letterLines: [
        "Поленов показывал на примере Иерусалима,",
        "как заметки из путешествий",
        "превращаются в будущие картины.",
      ],
      video: {
        src: "/activityE/guide_stage_3.webm",
        subtitles: "/activityE/guide_stage_3.srt",
        poster: "/images/gigachat.png",
        autoplay: true,
        loop: false,
        controls: false,
        subtitlesLabel: "Субтитры",
        subtitlesLang: "ru",
      },
    },
    {
      id: "Constantinople",
      name: "Константинополь",
      pos: { x: 54, y: 46 },
      audioUrl: "/audio/onboarding-welcome.wav",
      captions: [
        {
          t: 0,
          text: "Художник наглядно показывал ученикам, что путешествие — источник вдохновения.",
        },
      ],
      media: ["/book.png"],
      videoPoster: "/activityE/Constantinople.jpeg",
      videoUrl: "/activityE/Konst.webm",
      letterLines: [
        "Художник наглядно показывал ученикам,",
        "что путешествие — источник вдохновения.",
      ],
      video: {
        src: "/activityE/guide_stage_1.webm",
        subtitles: "/activityE/guide_stage_1.srt",
        poster: "/images/gigachat.png",
        autoplay: true,
        loop: false,
        controls: false,
        subtitlesLabel: "Субтитры",
        subtitlesLang: "ru",
      },
    },
  ],

  final: {
    title: "Маршрут окончен!",
    imageUrl: "/guides.png",
    backgroundUrl: "/guides.png",
    text: "Маршрут окончен! Надеюсь, вы сохранили себе пару точек для будущего путешествия?",
    button: "Завершить",
  },
};
