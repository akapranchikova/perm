export const quizC = {
  title: "История Анны",
  avatarUrl: "/avatar.png",
  // Вступление (опционально, можно показать перед первым вопросом)
  intro: {
    id: "intro",
    videoUrl: "/activityC/stage_1.webm",
    videoAlt: "Рождение",
    guideVideoSrc: "/activityC/guide_stage_1.webm",
    guideSubtitlesSrc: "/activityC/guide_stage_1.srt",
  },
  // Основной цикл: Вопрос -> Реакция
  rounds: [
    {
      id: "q1",
      prompt: "Как Анна выразила протест против брака?",
      answers: [
        "Не танцевала на свадьбе",
        "Привезла две кровати на свадьбу",
        "Не пришла на торжество",
      ],
      correctIndex: 1,
      // Что показываем после ответа
      feedbackCorrect: {
        guideVideoSrc: "/activityC/guide_stage_2.webm",
        guideSubtitlesSrc: "/activityC/guide_stage_2.srt",
        mainVideoUrl: "/activityC/stage_2.webm", // Фоновое видео
      },
      feedbackIncorrect: {
        guideVideoSrc: "/activityC/guide_hint_stage_1.webm",
        guideSubtitlesSrc: "/activityC/guide_hint_stage_1.srt",
        mainVideoUrl: "/activityC/stage_2.webm",
      },
    },
    {
      id: "q2",
      prompt: "Как умер Карл VIII?",
      answers: [
        "Ударился головой о дверную притолоку",
        "Упал с коня",
        "Задохнулся от сильного смеха",
      ],
      correctIndex: 0,
      feedbackCorrect: {
        guideVideoSrc: "/activityC/guide_stage_3.webm",
        guideSubtitlesSrc: "/activityC/guide_stage_3.srt",
        mainVideoUrl: "/activityC/stage_3.webm",
      },
      feedbackIncorrect: {
        guideVideoSrc: "/activityC/guide_hint_stage_2.webm",
        guideSubtitlesSrc: "/activityC/guide_hint_stage_2.srt",
        mainVideoUrl: "/activityC/stage_3.webm",
      },
    },
    {
      id: "q3",
      prompt: "Какой экспонат хранится в память об Анне Бретонской?",
      answers: [
        "Её дневники",
        "Золотой ковчег с сердцем Анны",
        "Перчатки",
      ],
      correctIndex: 0,
      feedbackCorrect: {
        guideVideoSrc: "/activityC/guide_stage_4.webm",
        guideSubtitlesSrc: "/activityC/guide_stage_4.srt",
        mainVideoUrl: "/activityC/stage_4.webm",
      },
      feedbackIncorrect: {
        guideVideoSrc: "/activityC/guide_hint_stage_3.webm", // НОВЫЙ URL
        guideSubtitlesSrc: "/activityC/guide_hint_stage_3.srt",
        mainVideoUrl: "/activityC/stage_4.webm",
      },
    }
  ],
  finalGuide: {
    buttonText: "Завершить",
    video: {
      src: "/activityC/guide_out.webm",
      subtitles: "/activityС/guide_out.srt",
      poster: "/images/gigachat.png",
      aspectRatio: "9 / 16",
      autoplay: true,
      loop: false,
      controls: false,
      subtitlesLabel: "Субтитры",
      subtitlesLang: "ru",
    },
  },
};
