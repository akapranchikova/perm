export const quizC = {
  title: 'История Анны',
  avatarUrl: '/anna.png',

  storyIntro: [
    'которые когда-то',
    'закладывал Василий',
    'Дмитриевич Поленов'
  ],

  questions: [
    {
      id: 'q1',
      prompt: 'Вопрос',
      imageUrl: '/quiz-1.png',
      answers: ['Ответ 1', 'Ответ 2', 'Ответ 3'],
      correctIndex: 0,
      explanationCorrect: 'Пояснение почему это верно (для вопроса 1).',
      explanationWrong: 'Пояснение почему это неверно (для вопроса 1).',
      storyAfter: 'Продолжение истории после вопроса 1…'
    },
    {
      id: 'q2',
      prompt: 'Вопрос',
      imageUrl: '/quiz-2.png',
      answers: ['Ответ 1', 'Ответ 2', 'Ответ 3'],
      correctIndex: 1,
      explanationCorrect: 'Пояснение почему это верно (для вопроса 2).',
      explanationWrong: 'Пояснение почему это неверно (для вопроса 2).',
      storyAfter: 'Продолжение истории после вопроса 2…'
    },
    {
      id: 'q3',
      prompt: 'Вопрос',
      imageUrl: '/quiz-3.png',
      answers: ['Ответ 1', 'Ответ 2', 'Ответ 3'],
      correctIndex: 2,
      explanationCorrect: 'Пояснение почему это верно (для вопроса 3).',
      explanationWrong: 'Пояснение почему это неверно (для вопроса 3).',
      storyAfter: 'Окончание истории…'
    }
  ],

  final: {
    buttonText: 'За новым секретом',
    // общий “послесловие от гидов” — можно менять по результату
    afterword: 'Мы изучаем его наследие и продолжаем открывать новые смыслы.'
  }
};