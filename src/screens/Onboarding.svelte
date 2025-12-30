<script lang="ts">
  import { fade } from "svelte/transition";

  import { assetsStore, registerAsset } from "../stores/assets";

  import AudioWithCaptions from "../components/AudioWithCaptions.svelte";
  import VideoWithSubtitles from "../components/VideoWithSubtitles.svelte";
  import SoundButton from "../components/SoundButton.svelte";

  import { settings } from "../stores/settings";
  import { router, routes } from "../router";

  import { setOnboardingCompleted } from "../router.js";

  const Polenov_by_Repin = "/onboarding/polenov.jpg";
  const gigachat = "/onboarding/gigachat.png";
  const painting1 = "/onboarding/pic1.png";
  const painting2 = "/onboarding/pic2.png";
  const painting3 = "/onboarding/pic3.png";
  const headphones = "/onboarding/headphones.png";
  const background1 = "/onboarding/background1.jpg";
  //const background2 = "/onboarding/background2.png";

  const imageUrls = [
    "/preload/preload.png",
    background1,
    Polenov_by_Repin,
    gigachat,
    painting1,
    painting2,
    painting3,
    headphones,
    "/onboarding/onboarding_1.png",
    "/onboarding/onboarding_2.png",
    "/activityList/01.png",
    "/activityList/02.png",
    "/activityList/03.png",
    "/activityList/04.png",
    "/activityList/05.png",
    "/activityList/06.png",
    "/artifacts/ball.png",
    "/artifacts/belila.png",
    "/artifacts/draft.png",
    "/artifacts/mark.png",
    "/artifacts/note.png",
    "/artifacts/skitze.png",
    "/artifacts/tablet.png",
    "/activityA/PAstuh_2.png",
    "/activityA/PAstuh_1.png",
    "/activityA/title-picture.png",
    "/activityA/floor-map.svg",
    "/activityB/title-picture.png",
    "/activityB/floor-map.svg",
    "/activityC/floor-map.svg",
    "/activityC/preview_image.png",
    "/activityD/title-picture.png",
    "/activityD/floor-map.svg",
    "/activityE/image_preview.png",
    "/activityE/floor-map.svg",
    "/activityF/title-picture.png",
    "/activityF/floor-map.svg",
    "/travelerMap.svg"
  ];

  const otherAssets = ["/onboarding/onboarding_1.webm"];


  //const assetsMap = new Map<string, string>();
  const getAssetUrl = (src: string | undefined) => {
    if (!src) return "";
    return $assetsStore.get(src) || src;
  };

  async function loadAssetAsBlob(src) {
    try {
      if ($assetsStore.has(src)) return $assetsStore.get(src);

      const response = await fetch(src);
      if (!response.ok) throw new Error(`Failed to load ${src}`);
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      registerAsset(src, objectUrl);
      
      return objectUrl;
    } catch (err) {
      console.warn(`Failed to load asset as blob: ${src}`, err);
      return src; 
    }
  }

  function preloadImage(src) {

    const cache = [];

    //framesCache = cache;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;

      cache.push(img);


      if (img.decode) {
        img
          .decode()
          .then(() => resolve(src))
          .catch((err) => {
            console.warn(`Failed to decode image: ${src}`, err);
            resolve(src);
          });
      } else {
        img.onload = () => resolve(src);
        img.onerror = () => {
          console.warn(`Failed to load image: ${src}`);
          resolve(src);
        };
      }
    });

  }

  function preloadAsset(src) {
    return fetch(src).then((response) => {
      if (!response.ok) throw new Error(`Failed to load ${src}`);
      return response.blob(); // Читаем тело, чтобы убедиться, что загрузка завершена
    });
  }

  function loadFont(name, url, descriptors = {}) {
    const font = new FontFace(name, `url(${url})`, descriptors);
    return font.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
      return loadedFont;
    });
  }



  let imgready = $state(false);

  const loadingTasks = [
    ...imageUrls.map(loadAssetAsBlob),
    //...otherAssets.map(preloadAsset),
    loadFont("Prata", "/fonts/Prata-Regular.ttf"),
    loadFont("Inter", "/fonts/cyrillic-400.woff2", { weight: "400" }),
    loadFont("Inter", "/fonts/cyrillic-500.woff2", { weight: "500" }),
  ];

  let assetsReady = $state(false);
  let videoFinished = $state(false);

  const checkReady = () => {
    if (assetsReady && videoFinished) {
      imgready = true;
      //preloadStaticAssets();
    }
  };

  Promise.all(loadingTasks)
    .then(() => {
      console.log("All assets loaded and decoded");
      assetsReady = true;
      checkReady();
    })
    .catch(() => {
      console.log("Error load all assets");
      setTimeout(() => {
        assetsReady = true;
        checkReady();
      }, 500);
    });

  const handleVideoEnd = () => {
    videoFinished = true;
    checkReady();
  };

  /*
  onMount(async () => {
    await Promise.all(imageUrls.map(preloadImage));
    console.log('Load all images')
    ready = true;
  });
  */

  type SlideAction = "next" | "start" | "enableAudioNext" | "disableAudioNext";
  type Caption = { t: number; text: string };
  type CollageImage = {
    src: string;
    alt: string;
    className?: string;
    objectPosition?: string;
  };

  type Slide = {
    id: string;
    title?: string;
    description?: string;
    imageScr?: string;
    imageClass?: string;
    showRing?: boolean;
    background?: string;
    background2?: string;
    collage?: CollageImage[];
    primaryLabel: string;
    primaryAction?: SlideAction;
    secondaryLabel?: string;
    secondaryAction?: SlideAction;
    video?: {
      src: string;
      captions?: string;
    };
    audio?: {
      src: string;
      autoplay?: boolean;
      captions: Caption[];
    };
  };

  const slides: Slide[] = [
    {
      id: "legacy",
      title: "Наследие великого русского художника",
      description: "Раскройте многогранный талант Василия Поленова",
      imageScr: Polenov_by_Repin,
      imageClass: "hero-img1",
      showRing: true,
      primaryLabel: "Далее",
      primaryAction: "next",
    },
    {
      id: "impressions",
      title: "Собирайте впечатления",
      description:
        "Изучайте экспонаты и наполняйте путевой дневник артефактами — каждый из них добавит новый штрих к пониманию гения Поленова",
      collage: [
        {
          src: painting3,
          alt: "Сюжет с женщиной у лестницы",
          className: "collage-card--left",
          objectPosition: "center center",
        },
        {
          src: painting2,
          alt: "Солнечный двор с храмом на заднем плане",
          className: "collage-card--center",
          objectPosition: "60% 45%",
        },
        {
          src: painting1,
          alt: "Поляна с гуляющими детьми",
          className: "collage-card--right",
          objectPosition: "72% 38%",
        },
      ],
      primaryLabel: "Далее",
      primaryAction: "next",
    },
    {
      id: "gigachat",
      description:
        "Знакомьтесь с мастерством художника вместе с AI-гидами, разработанными с помощью нейросети ГигаЧат от Сбера",
      imageScr: gigachat,
      imageClass: "guides-img",
      primaryLabel: "Далее",
      primaryAction: "next",
    },
    {
      id: "headphones",
      title: "Наденьте наушники",
      description: "Это сделает путешествие по выставке гораздо интереснее",
      imageScr: headphones,
      imageClass: "hero-img",
      primaryLabel: "Подключаю",
      primaryAction: "enableAudioNext",
      secondaryLabel: "Продолжить без наушников",
      secondaryAction: "disableAudioNext",
    },
    {
      id: "audio-welcome",
      background2: "/onboarding/onboarding_1.png",
      primaryLabel: "Далее",
      primaryAction: "next",
      video: {
        src: "/onboarding/onboarding_1.webm",
        captions: "/onboarding/onboarding_1.srt",
      },
    },
    {
      id: "audio-journey",
      background2: "/onboarding/onboarding_2.png",
      video: {
        src: "/onboarding/onboarding_2.webm",
        captions: "/onboarding/onboarding_2.srt",
      },
      primaryLabel: "Начать",
      primaryAction: "start",
    },
  ];

  let current = $state(0);
  const nextSlide = () => {
    current = (current + 1) % slides.length;
  };

  const startExperience = () => router.go(routes.PLAYTESTS);

  const handleAction = (action?: SlideAction) => {
    if (!action) return nextSlide();

    if (action === "start") return startExperience();
    if (action === "enableAudioNext") {
      settings.update((s) => ({ ...s, audioEnabled: true }));
      setOnboardingCompleted();
      return nextSlide();
    }
    if (action === "disableAudioNext") {
      settings.update((s) => ({ ...s, audioEnabled: false }));
      setOnboardingCompleted();
      return nextSlide();
    }

    return nextSlide();
  };

  function handleSoundTap() {
    settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }));
  }

  let currentSubtitle = $state("Загрузка субтитров ...");

  function handleSubtitleUpdate(text) {
    if (text === undefined || text === null || text.length === 0) return;
    currentSubtitle = text;
  }
</script>

<svelte:head>
  
</svelte:head>

{#if imgready}
  <!-- Добавляем контейнер-обертку для позиционирования -->
  <div class="slides-container">
    {#key current}
      <div
        class="onboarding-screen onboarding-screen-{current + 1} media-screen"
        in:fade={{ duration: 300 }}
        out:fade={{ duration: 300 }}
        style={`--screen-bg: url('${slides[current]?.background ?? background1}'); --screen-foreground: ${slides[current]?.background2 ? "url('" + slides[current]?.background2 + "')" : "transparent"}; --screen-overlay: ${slides[current]?.id === "audio-journey" ? "transparent" : "rgba(255, 255, 255, 0.50)"};`}
      >
        {#if slides[current]?.video && slides[current]?.background2}
          <img
            src={getAssetUrl(slides[current].background2)}
            class="video-poster-fallback"
            alt=""
          />
        {/if}
        {#if slides[current]?.video}
          {#if !slides[current]?.video.captions}
            <video
              class="background-video"
              src={slides[current].video.src}
              autoplay
              muted
              loop
              playsinline
            ></video>
          {:else}
            <VideoWithSubtitles
              cssClass="guide-video"
              src={slides[current].video.src}
              subtitlesSrc={slides[current].video.captions}
              poster={getAssetUrl(slides[current].background2)}
              autoplay={true}
              loop={false}
              controls={false}
              muted={!$settings.audioEnabled}
              onSubtitleUpdate={handleSubtitleUpdate}
            />
          {/if}
        {/if}

        <div class="top-gradient"></div>
        <div class="media-foreground"></div>

        <header class="top-container">
          <div class="logo-group">
            <span class="logo logo-white" aria-hidden="true"></span>
          </div>

          {#if slides[current]?.audio || slides[current]?.video?.captions}
            <SoundButton
              isMuted={!$settings.audioEnabled}
              onTap={handleSoundTap}
            />
          {/if}
        </header>

        <div class="main-block">
          {#if slides[current]?.collage?.length}
            <div class="hero collage-hero">
              <div class="collage">
                {#each slides[current].collage as collageImage}
                  <div class={`collage-card ${collageImage.className ?? ""}`}>
                    <img
                      src={getAssetUrl(collageImage.src)}
                      alt={collageImage.alt}
                      style={`object-position: ${collageImage.objectPosition ?? "center"};`}
                    />
                  </div>
                {/each}
              </div>
              <div class="hero-blur"></div>
            </div>
          {:else if slides[current]?.imageScr}
            <div class="hero {slides[current]?.showRing ? 'hero-ring' : ''}">
              <img
                src={getAssetUrl(slides[current].imageScr)}
                alt={slides[current].title}
                class={slides[current].imageClass}
              />
              <div class="hero-blur"></div>
            </div>
          {/if}

          <div class="text-block">
            {#if slides[current].title}
              <h2>{slides[current].title}</h2>
            {/if}

            {#if slides[current].description}
              <p>{slides[current].description}</p>
            {/if}
          </div>
        </div>

        {#if slides[current]?.audio}
          <div class="audio-layer">
            <AudioWithCaptions
              src={slides[current].audio.src}
              captions={slides[current].audio.captions}
              autoplay={slides[current].audio.autoplay ?? true}
              muted={!$settings.audioEnabled}
            />
          </div>
        {/if}

        <div
          class={`content-card ${slides[current]?.audio ? "content-card--audio" : ""}`}
        >
          {#if slides[current].video}
            {#if slides[current].video.captions}
              <div class="subtitles">
                {@html currentSubtitle}
              </div>
            {/if}
          {/if}

          <div class="buttons">
            {#if slides[current]?.secondaryLabel}
              <button
                class="cta-button secondary"
                type="button"
                on:click={() => handleAction(slides[current]?.secondaryAction)}
              >
                {slides[current].secondaryLabel}
              </button>
            {/if}

            <button
              class="cta-button primary"
              type="button"
              on:click={() => handleAction(slides[current].primaryAction)}
            >
              {slides[current]?.primaryLabel}
            </button>
          </div>
        </div>

        <div class="bottom-gradient"></div>
      </div>
    {/key}
  </div>
{:else}
  <div class="preloader-container" out:fade={{ duration: 600 }}>
    <video
      src="/preload/preload.webm"
      preload="auto"
      autoplay
      muted
      poster={getAssetUrl("/preload/preload.png")}
      on:ended={handleVideoEnd}
      playsinline
      class="preloader-video"
    ></video>
    {#if videoFinished && !assetsReady}
      <div class="loading-overlay" in:fade={{ duration: 300 }}>
        <div class="preloader__spinner"></div>
        <p>Загрузка материалов...</p>
      </div>
    {/if}
  </div>
{/if}

<style>
  :global(body.onboarding-bg) {
    background: #18160f url("/images/background1.jpg") center/cover no-repeat;
  }

  .onboarding-screen {
    position: absolute; /* Меняем с relative на absolute */
    top: 0;
    left: 0;
    width: 100%;
    height: 100dvh;
    overscroll-behavior: none;
    min-height: 100svh;
    overflow: hidden;
    color: #18160f;
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: clamp(18px, 4vw, 28px);
    box-sizing: border-box;
    z-index: 1;
  }

  .top-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 3;
    padding: 0 clamp(2px, 1vw, 4px);
  }

  .logo-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo {
    display: inline-block;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
  }

  .main-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    /*justify-content: center;*/
    gap: 25px;
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
  }

  .hero {
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    width: fit-content;
    position: absolute;
    top: clamp(110px, 20vh, 150px);
  }

  .hero-ring::before {
    content: "";
    position: absolute;
    inset: 0;
    top: -6px;
    left: -6px;
    bottom: -6px;
    right: -6px;
    border: 1.5px solid rgba(178, 152, 126, 0.7);
    border-radius: 50%;
    pointer-events: none;
  }

  .hero-img {
    width: 210px;
    height: 215px;
    border-radius: 50%;
    object-fit: cover;
  }

  .hero-img1 {
    width: 168px;
    height: 168px;
    border-radius: 50%;
    object-fit: cover;
  }

  .guides-img {
    width: clamp(230px, 70vw, 320px);
    height: clamp(170px, 56vw, 240px);
    object-fit: contain;
  }

  .collage-hero {
    width: 100%;
  }

  .collage {
    position: relative;
    width: 100%;
    height: clamp(180px, 44vw, 230px);
    margin: 0 auto;
  }

  .collage-card {
    position: absolute;
    border-radius: 4px;
    overflow: hidden;
    background: #d8d0c8;
    transition: transform 0.2s ease;
  }

  .collage-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .collage-card--left {
    width: clamp(150px, 48vw, 182px);
    height: clamp(120px, 36vw, 140px);
    top: clamp(32px, 10vw, 56px);
    z-index: 3;
    left: -6%;
    transform: rotate(-5deg);
  }

  .collage-card--center {
    width: clamp(186px, 54vw, 230px);
    height: clamp(132px, 38vw, 150px);
    top: -35%;
    left: 20%;
    transform: rotate(7deg);
  }

  .collage-card--right {
    width: clamp(200px, 54vw, 317px);
    height: clamp(132px, 38vw, 150px);
    top: 0;
    right: -6%;
    transform: rotate(7deg);
  }

  @media (min-width: 480px) {
    .collage {
      width: 360px;
      height: 230px;
    }

    .collage-card--left {
      width: 192px;
      height: 148px;
      top: 60px;
      left: 0;
    }

    .collage-card--center {
      width: 242px;
      height: 156px;
      top: 0;
      left: 58px;
    }

    .collage-card--right {
      width: 186px;
      height: 146px;
      top: 42px;
      right: 0;
    }
  }

  .hero-blur {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    top: 0;
    transform: translateX(-50%);
    background: #ffffff;
    filter: blur(90px);
    opacity: 0.35;
    z-index: -1;
  }

  .content-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: clamp(14px, 4vw, 22px);
    z-index: 2;
    margin-top: auto;
    box-sizing: border-box;
  }

  .content-card--audio {
    padding-top: clamp(96px, 22vw, 140px);
  }

  .text-block {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(16px, 4vw, 24px);
    max-width: calc(100% - 30px);
    position: absolute;
    bottom: clamp(140px, 21vh, 180px);
  }

  .main-block h2 {
    margin: 0;
    font-weight: 400;
    font-family: "Prata", "Times New Roman", serif;
    font-size: 32px;
    color: rgba(24, 22, 15, 1);
    line-height: 1.2;
  }

  .main-block p {
    margin: 0;
    max-width: 290px;
    font-size: 16px;
    line-height: 1.2;
    font-weight: 400;
    color: rgba(24, 22, 15, 1);
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 3vw, 14px);
    width: 100%;
  }

  .onboarding-screen :global(.captions) {
    left: 20px;
    right: 20px;
    bottom: 90px;
    color: rgba(254, 254, 252, 0.96);
    text-align: center;
    line-height: 1.24;
    font-size: 18px;
    font-family: "Inter", sans-serif;
    backdrop-filter: none;
    background: transparent;
    border: none;
  }

  @media (min-width: 480px) {
    .content-card {
      padding-left: 32px;
      padding-right: 32px;
    }
  }

  .preloader {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    justify-content: center;
    background: #18160f;
    color: #fefefc;
    font-family: "Inter", sans-serif;
  }

  .preloader__spinner {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid rgba(254, 254, 252, 0.2);
    border-top-color: #fefefc;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .background-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  :global(.guide-video) {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
  }

  .subtitles {
    color: rgba(254, 254, 252);
    font-family: Inter;
    font-weight: 500;
    font-size: 18px;
    line-height: 124%;
    text-align: center;
    min-height: 1.2em;
  }

  .preloader-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #18160f; /* Цвет фона на случай, если видео долго грузится */
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(24, 22, 15, 0.6);
    backdrop-filter: blur(5px);
    z-index: 10;
    gap: 20px;
    color: #fefefc;
    font-family: "Inter", sans-serif;
    font-size: 16px;
  }

  .preloader-video {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Видео заполнит весь экран без искажений */
    display: block;
  }

  .slides-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100dvh;
    min-height: 100svh;
    background: #18160f;
    overflow: hidden;
  }

  .video-poster-fallback {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  :global(body.onboarding-bg) {
    background: #18160f url("/images/background1.jpg") center/cover no-repeat;
  }
</style>
