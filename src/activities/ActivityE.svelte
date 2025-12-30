<script>
  import "../styles/app.css";
  import "../styles/constants.css";
  import { router, routes } from "../router";
  import { trip1899 } from "./routeTrip1899";
  import ActivityShell from "../components/ActivityShell.svelte";
  import ActivityGuideIntro from "../components/ActivityGuideIntro.svelte";
  import TravelerMap from "../components/TravelerMap.svelte";
  import GuideCircleVideo from "../components/GuideCircleVideo.svelte";
  import { getArtifactForActivity } from "../data/artifacts";
  import { settings } from "../stores/settings";
  import SoundButton from "../components/SoundButton.svelte";

  const steps = {
    MAP: "MAP",
    CITY: "CITY",
    FINAL: "FINAL",
  };

  let step = $state(steps.MAP);

  // прогресс
  let visited = $state(new Set()); // cityId
  let activeCityId = $state(null);
  let bubbleText = $state("");

  let cities = $derived(trip1899.cities);
  let activeCity = $derived(cities.find((c) => c.id === activeCityId));

  let visitedCount = $derived(visited.size);
  let allVisited = $derived(visitedCount === cities.length);
  let finalText = $derived(
    trip1899.final.text ?? trip1899.final.textLines?.join(" ") ?? ""
  );

  function openCity(id) {
    activeCityId = id;
    step = steps.CITY;
    visited = new Set([...visited, id]);
  }

  function backToMap() {
    activeCityId = null;
    step = allVisited ? steps.FINAL : steps.MAP;
  }

  function finishToGlobalMap() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_E);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }

  const intro = {
    title: "Альбом с&nbsp;фотографиями из&nbsp;восточной поездки",
    subtitle: "Леонид Кандауров",
    description:
      "Этот фотоальбом словно «сторис» XIX века. Вы видите маршрут второго путешествия Поленова по Востоку",
    imageUrl: "/activityE/image_preview.png",
    imageAlt: "Альбом с фотографиями из восточной поездки",
    mapSvg: `/activityE/floor-map.svg`,
    floorLabel: "2 этаж",
    buttonText: "Начать",
  };

  const guide = {
    buttonText: "Далее",
    video: {
      src: "/activityE/guide_in.webm",
      subtitles: "/activityE/guide_in.srt",
      poster: "/images/guide_in.png",
      aspectRatio: "9 / 16",
      autoplay: true,
      loop: false,
      controls: false,
      subtitlesLabel: "Субтитры",
      subtitlesLang: "ru",
    },
  };

  const finalVideo = {
    src: "/activityE/guide_out.webm",
    subtitles: "/activityE/guide_out.srt",
    poster: "/images/guide_out.png",
    aspectRatio: "9 / 16",
    autoplay: true,
    loop: false,
    controls: false,
    subtitlesLabel: "Субтитры",
    subtitlesLang: "ru",
  };

  let pointsInfo = $state([
    {
      id: "Constantinople",
      poit: null,
      title: "Константинополь",
      titlePosition: "right",
      isOnMap: false,
      isOpened: false,
    },
    {
      id: "Jerusalem",
      poit: null,
      title: "Иерусалим",
      titlePosition: "right",
      isOnMap: false,
      isOpened: false,
    },
    {
      id: "Cairo",
      poit: null,
      title: "Каир",
      titlePosition: "bottom",
      isOnMap: false,
      isOpened: false,
    },
  ]);

  function handleMapPointTap(point) {
    pointsInfo = pointsInfo.map((p) =>
      p.id === point.id ? { ...p, isOpened: true } : p
    );
    openCity(point.id);
  }

  function handleGuideVideoSoundTap() {
    settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }));
  }

  function handleGuideSubtitleChange(event) {
    bubbleText = event?.detail?.text?.trim() ?? "";
  }

  let videoEl; // ссылка на элемент

  // Эффект, который срабатывает при появлении элемента или смене src
  $effect(() => {
    if (videoEl && activeCity?.videoUrl) {
      // Пытаемся запустить. catch нужен, чтобы не сыпались ошибки в консоль,
      // если браузер запретит (например, в режиме энергосбережения)
      videoEl.play().catch((e) => console.log("Autoplay blocked", e));
    }
  });
</script>

<ActivityShell {intro} {guide}>
  <div class={`safe actE ${step === steps.FINAL ? "finalState" : ""}`}>
    {#if step === steps.MAP}
      <section class="map-screen">
        <div class="header">
          <div class="title">{trip1899.title}</div>
        </div>

        <div class="mapCard card">
          <div class="map">
            <TravelerMap
              src="/travelerMap.svg"
              pointColor="#00FF00"
              bind:pointsInfo
              alt="Карта маршрута"
              onTap={handleMapPointTap}
              cssClass="map-wrapper"
            />
          </div>
        </div>

        <div class="hintRow">
          <div class="hint">{trip1899.hint}</div>
        </div>
      </section>
    {:else if step === steps.CITY && activeCity}
      <section class="city-screen">
        <div class="topbar">
          <div class="topbar-left">
            <span class="logo logo-brown" aria-hidden="true"></span>
          </div>
          <SoundButton
            cssClass="sound-brown"
            isMuted={!$settings.audioEnabled}
            onTap={handleGuideVideoSoundTap}
          />
        </div>
        <div class="cityTitle">{activeCity.name}</div>

        <div class="quote">
          <GuideCircleVideo
            src={activeCity.video.src}
            subtitlesSrc={activeCity.video.subtitles}
            isMuted={!$settings.audioEnabled}
            autoplay={true}
            isLooped={false}
            on:subtitlechange={handleGuideSubtitleChange}
            cssClass="guide-circle-video"
          />
          <div class="bubble">
            <div class="bubbleText">
              {bubbleText || ""}
            </div>
          </div>
        </div>

        <div class="videoCard">
          {#if activeCity.videoUrl}
            {#key activeCity.id}
              <video
                class="video"
                bind:this={videoEl}
                poster={activeCity.videoPoster ?? activeCity.media?.[0]}
                src={activeCity.videoUrl}
                muted
                autoplay
                playsinline
                loop
              >
              </video>
            {/key}
          {:else}
            <img
              class="video"
              src={activeCity.videoPoster ?? activeCity.media?.[0]}
              alt={activeCity.name}
            />
            <div class="playBtn" aria-hidden="true">
              <svg
                width="96"
                height="96"
                viewBox="0 0 104 104"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 5.70975C0 2.55875 2.55875 0 5.70975 0H97.7903C100.941 0 103.5 2.55875 103.5 5.70975V97.7903C103.498 99.3041 102.896 100.756 101.826 101.826C100.756 102.896 99.3041 103.498 97.7903 103.5H5.70975C4.19543 103.5 2.74313 102.898 1.67235 101.828C0.601561 100.757 0 99.3046 0 97.7903V5.70975ZM43.8265 31.1362C43.4804 30.9054 43.0782 30.7727 42.6627 30.7523C42.2472 30.7319 41.834 30.8246 41.467 31.0205C41.1 31.2163 40.793 31.5081 40.5787 31.8647C40.3644 32.2212 40.2508 32.6292 40.25 33.0452V70.4548C40.2508 70.8708 40.3644 71.2788 40.5787 71.6353C40.793 71.9919 41.1 72.2837 41.467 72.4795C41.834 72.6754 42.2472 72.7681 42.6627 72.7477C43.0782 72.7273 43.4804 72.5946 43.8265 72.3637L71.8808 53.6647C72.1962 53.4548 72.4549 53.1701 72.6339 52.8361C72.8129 52.5021 72.9065 52.129 72.9065 51.75C72.9065 51.371 72.8129 50.9979 72.6339 50.6639C72.4549 50.3299 72.1962 50.0452 71.8808 49.8353L43.8265 31.1362Z"
                  fill="#E5DCDC"
                  fill-opacity="0.44"
                />
              </svg>
            </div>
          {/if}

          <!--          <AudioWithCaptions-->
          <!--            src={activeCity.audioUrl}-->
          <!--            captions={activeCity.captions}-->
          <!--            autoplay={true}-->
          <!--            muted={!$settings.audioEnabled}-->
          <!--          />-->
        </div>

        <button class="cta-button outline" type="button" onclick={backToMap}>
          Отправиться дальше
        </button>
      </section>
    {:else if step === steps.FINAL}
      <ActivityGuideIntro
        video={finalVideo}
        buttonText="Завершить"
        onNext={finishToGlobalMap}
      />
    {/if}
  </div>

  <style>
    .actE {
      min-height: 100dvh;
      height: 100dvh;
      overscroll-behavior: none;
      display: flex;
      overflow: hidden;
      flex-direction: column;
      gap: 16px;
      background: linear-gradient(180deg, #fefcf8 0%, #ffffff 100%);
      color: var(--text-primary);
    }

    .card {
      background: rgba(254, 252, 248, 0.9);
      padding: 0;
      border: none;
      box-shadow: none;
      margin-left: auto;
      margin-right: auto;
    }

    .map-screen {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }

    .map-screen,
    .city-screen {
      min-height: 0;
    }

    .header .title {
      color: rgba(59, 42, 31, 1);
      font-family: Prata, serif;
      font-weight: 400;
      font-size: 30px;
      line-height: 120%;
      text-align: center;
      margin: 0;
    }

    .map {
      position: relative;
      border-radius: 18px;
      overflow: hidden;
      aspect-ratio: 335 / 412;
      background: rgba(254, 252, 248, 0.82);
    }

    :global(.map-wrapper) {
      width: 100%;
      height: 100%;
      display: block;
    }

    .sound-brown {
      color: var(--accent);
      border-color: var(--accent);
    }

    :global(.sound-white) {
      color: var(--bg-muted);
    }

    :global(.guide-circle-video) {
      width: 58px;
      height: 58px;
      object-fit: cover;
      flex: 0 0 auto;
    }

    .hintRow {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--txt-primary);
      font-family: Inter, sans-serif;
      font-weight: 400;
      font-size: 16px;
      line-height: 120%;
      text-align: center;
      justify-content: center;
      padding: 6px 8px 0;
    }

    .hint {
      max-width: 320px;
    }

    .city-screen {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding-top: 2px;
    }

    .finalState {
      padding: 0;
    }

    .topbar-left {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .cityTitle {
      font-family: Prata, serif;
      font-weight: 400;
      font-size: 22px;
      line-height: 120%;
      color: var(--text-primary);
    }

    .videoCard {
      position: relative;
      overflow: hidden;
      margin: 0 -20px;
      min-height: 0;
      flex: 1 1 auto;
      /*max-height: 42dvh;*/
    }

    .video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .playBtn {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      pointer-events: none;
      backdrop-filter: none;
    }

    .videoCard :global(.captions) {
      left: 12px;
      right: 12px;
      bottom: 18px;
      font-size: 16px;
      color: rgba(254, 254, 252, 0.98);
      text-shadow: 0 6px 18px rgba(0, 0, 0, 0.36);
    }

    .city-screen .cta-button {
      margin-top: auto;
    }

    .final-screen {
      position: relative;
      min-height: 100dvh;
      width: 100%;
      background: var(
        --bg-image,
        linear-gradient(180deg, #fefcf8 0%, #ffffff 100%)
      );
      background-size: cover;
      background-position: center;
      color: #fefcfc;
      overflow: hidden;
      border-radius: 0;
    }

    .final-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(24, 22, 15, 0.28) 0%,
        rgba(24, 22, 15, 0.8) 100%
      );
      z-index: 1;
    }

    .final-topbar {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      z-index: 2;
    }

    .final-content {
      position: absolute;
      left: 18px;
      right: 18px;
      bottom: 20px;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: center;
      align-items: center;
    }

    .finalText {
      font-size: 16px;
      line-height: 1.4;
      color: rgba(254, 254, 252, 0.92);
      text-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
    }

    .heroImage {
      position: absolute;
      z-index: 1;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .heroImage img {
      width: 100%;
      max-height: 100%;
      object-fit: cover;
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

    .panelText {
      color: #fefefc;
      font-size: 15px;
      font-weight: 500;
      line-height: 1.4;
      text-align: center;
      max-width: 360px;
      text-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    }

    .contentPanel {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 24px 20px 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      align-items: center;
      z-index: 1;
    }
    .contentPanel.dark {
      background: linear-gradient(
        180deg,
        rgba(16, 13, 10, 0) 0%,
        rgba(16, 13, 10, 0.82) 100%
      );
    }
    .panelText {
      color: #fefefc;
      font-size: 15px;
      font-weight: 500;
      line-height: 1.4;
      text-align: center;
      max-width: 360px;
      text-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    }

    .screen--hero {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      color: #fefefc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      isolation: isolate;
    }

    .arch-bg {
      position: absolute;
      inset: 0;
      background: url("/onboarding/background1.jpg") center / cover no-repeat;
      z-index: -3;
      filter: saturate(0.95);
    }

    .screen-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.62) 0%,
        rgba(24, 22, 15, 0.25) 60%
      );
      z-index: -2;
    }

    .top-gradient,
    .bottom-gradient {
      position: absolute;
      left: 0;
      right: 0;
      pointer-events: none;
      z-index: -1;
    }
    .top-gradient {
      top: 0;
      height: 200px;
      background: linear-gradient(
        180deg,
        rgba(16, 13, 10, 0.85) 0%,
        rgba(16, 13, 10, 0.2) 70%,
        transparent 100%
      );
    }
    .bottom-gradient {
      bottom: 0;
      height: 320px;
      background: linear-gradient(
        180deg,
        rgba(16, 13, 10, 0) 0%,
        rgba(16, 13, 10, 0.82) 100%
      );
    }

    .topbar-final {
      position: absolute;
      top: 18px;
      left: 18px;
      right: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 4;
      color: #fefefc;
    }

    .bottomBtn {
      width: 100%;
      margin-top: auto;
    }
  </style>
</ActivityShell>
