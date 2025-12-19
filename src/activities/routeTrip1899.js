export const trip1899 = {
  title: 'Восточная поездка 1899 г.',
  mapUrl: '/activityE/map.png',
  guideAvatarUrl: '/activityE/guide.png',
  hint: 'Нажимай на неизвестные точки на карте\nчтобы узнать полный маршрут',

  // 3 точки: позиция в процентах (0..100) внутри области карты
  cities: [
    {
      id: 'Cairo',
      name: 'Каир',
      pos: { x: 58, y: 18 },
      audioUrl: '/activityRoute/audio_kiev.mp3',
      captions: [
        { t: 0.0, text: 'Киев встретил нас светом и просторным небом…' },
        { t: 4.5, text: 'Я писал в письме о дороге и людях…' }
      ],
      media: ['/activityRoute/city_kiev_1.jpg', '/activityRoute/city_kiev_2.jpg'],
      letterLines: ['которые когда-то', 'закладывал Василий', 'Дмитриевич Поленов']
    },
    {
      id: 'Jerusalem',
      name: 'Иерусалим',
      pos: { x: 62, y: 30 },
      audioUrl: '/activityRoute/audio_odessa.mp3',
      captions: [{ t: 0, text: 'В Одессе шум портового города…' }],
      media: ['/activityRoute/city_odessa_1.jpg', '/activityRoute/city_odessa_2.jpg'],
      letterLines: ['несколько предложений', 'из письма о поездке']
    },
    {
      id: 'Constantinople',
      name: 'Константинополь',
      pos: { x: 54, y: 46 },
      audioUrl: '/activityRoute/audio_istanbul.mp3',
      captions: [{ t: 0, text: 'Константинополь — дыхание Востока…' }],
      media: ['/activityRoute/city_istanbul_1.jpg', '/activityRoute/city_istanbul_2.jpg'],
      letterLines: ['аудио + субтитры', 'и лёгкие шумы местности']
    }
  ],

  final: {
    title: 'Отлично!\nТеперь ты узнал…',
    imageUrl: '/activityRoute/final.jpg',
    textLines: ['которые когда-то закладывал', 'Василий Дмитриевич Поленов.', 'Мы изучаем его наследие и'],
    button: 'За новым секретом'
  }
};