const imageAssets = [
  '/StartLoading/start-bg.jpg',
  '/activityA/frame_0001.png',
  '/activityA/frame_0002.png',
  '/activityA/frame_0003.png',
  '/activityA/frame_0004.png',
  '/activityA/frame_0005.png',
  '/activityA/frame_0006.png',
  '/activityA/frame_0007.png',
  '/activityA/frame_0008.png',
  '/activityA/frame_0009.png',
  '/activityB/background.png',
  '/activityE/guide.png',
  '/activityE/map.png',
  '/artifacts/belila.png',
  '/assets/logo-arch.png',
  '/assets/logo-giga.png',
  '/assets/logo-sber-circle.png',
  '/assets/logo-sber.png',
  '/assets/sound.svg',
  '/avatar.png',
  '/book.png',
  '/guide.png',
  '/guides.png',
  '/images/Polenov_by_Repin.png',
  '/images/background1.png',
  '/images/background2.png',
  '/images/gigachat.png',
  '/images/headphones.png',
  '/images/onboarding-couple.png',
  '/painting-d.png',
  '/painting.png',
  '/travelerMap.svg'
];

const audioAssets = ['/audio/onboarding-journey.wav', '/audio/onboarding-welcome.wav'];

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    const settle = () => resolve({ src, status: 'ok' });
    img.onload = settle;
    img.onerror = settle;
    img.src = src;
  });
}

function preloadAudio(src) {
  return new Promise((resolve) => {
    const audio = new Audio();
    const settle = () => resolve({ src, status: 'ok' });
    audio.preload = 'auto';
    audio.oncanplaythrough = settle;
    audio.onerror = settle;
    audio.src = src;
    audio.load();
  });
}

let preloadPromise;

export function preloadStaticAssets() {
  if (preloadPromise || typeof window === 'undefined') {
    return preloadPromise ?? Promise.resolve([]);
  }

  const uniqueImages = Array.from(new Set(imageAssets));
  const uniqueAudio = Array.from(new Set(audioAssets));

  preloadPromise = Promise.all([
    ...uniqueImages.map((src) => preloadImage(src)),
    ...uniqueAudio.map((src) => preloadAudio(src))
  ]);

  return preloadPromise;
}
