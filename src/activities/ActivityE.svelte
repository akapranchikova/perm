<script>
  import { router, routes } from "../router";
  import { trip1899 } from "./routeTrip1899";
  import AudioWithCaptions from "../components/AudioWithCaptions.svelte";
  import ActivityShell from "../components/ActivityShell.svelte";
  import TravelerMap from '../components/TravelerMap.svelte';
  import { getArtifactForActivity } from "../data/artifacts";
  import { settings } from "../stores/settings";
  import CommonButton from "../components/CommonButton.svelte";

  const steps = {
    MAP: "MAP",
    CITY: "CITY",
    FINAL: "FINAL",
  };

  let step = $state(steps.MAP);

  // прогресс
  let visited = $state(new Set()); // cityId
  let activeCityId = null;

  let cities = $derived(trip1899.cities);
  let activeCity = $derived(cities.find((c) => c.id === activeCityId));
  
  let visitedCount = $derived(visited.size);
  let allVisited = $derived(visitedCount === cities.length);
  let finalText = $derived(trip1899.final.text ?? trip1899.final.textLines?.join(" ") ?? "");

  function openCity(id) {
    activeCityId = id;
    step = steps.CITY;
    // считаем “изучено” как только открыл деталку
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
    title: "Альбом с фотографиями из восточной поездки",
    subtitle: "Леонид Кандауров",
    description:
      "Этот фотоальбом словно «сторис» XIX века. Вы видите маршрут второго путешествия Поленова по Востоку",
    imageUrl: "/activityE/guide.png",
    imageAlt: "Альбом с фотографиями из восточной поездки",
    floorLabel: "2 этаж",
    buttonText: "Начать",
  };

  let pointsInfo = $state([
    {
      id: 'Constantinople',
      poit: null,
      title: 'Константинополь',
      titlePosition: 'right',
      isOnMap: false,
      isOpened: false
    },
    {
      id: 'Jerusalem',
      poit: null,
      title: 'Иерусалим',
      titlePosition: 'right',
      isOnMap: false,
      isOpened: false
    },
    {
      id: 'Cairo',
      poit: null,
      title: 'Каир',
      titlePosition: 'bottom',
      isOnMap: false,
      isOpened: false
    }
  ]);

  function handleMapPointTap(point) {
    pointsInfo = pointsInfo.map((p) =>
      p.id === point.id
        ? { ...p, isOpened: true }
        : p
    );
    openCity(point.id);    
  }
</script>

<ActivityShell {intro}>
  <div class={`safe actE ${step === steps.FINAL ? 'finalState' : ''}`}>
    {#if step === steps.MAP}
      <section class="map-screen">
        <div class="header">
          <div class="title">{trip1899.title}</div>
        </div>

        <div class="mapCard card">
          <div class="map">
            <TravelerMap src="/travelerMap.svg"
              pointColor="#00FF00"
              bind:pointsInfo={pointsInfo}
              alt="Карта маршрута"
              onTap={handleMapPointTap}
              cssClass='map-container'
            />
          </div>
        </div>

      <div class="hint">{trip1899.hint}</div>

      {#if canFinish}
        <button
          class="btn-primary bottomBtn"
          type="button"
          onclick={finishToGlobalMap}
        >
          Завершить
        </button>
      {/if}
    {/if}

    {#if step === steps.CITY && activeCity}
      <div class="topbar">
          <div class="logo-group">
              <span class="logo logo-brown" aria-hidden="true"></span>
          </div>
          <button class="sound-btn" type="button" aria-label="Звук">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                          d="M11 5L6.5 9H3v6h3.5L11 19V5z"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linejoin="round"
                  />
                  <path
                          d="M16 9c1.5 1.5 1.5 4.5 0 6"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                  />
              </svg>
          </button>
      </div>
        <div class="cityTitle">{activeCity.name}</div>


        <div class="quote">
          <img class="avatar" src={trip1899.guideAvatarUrl} alt="Гид" />
          <div class="bubble">
            <div class="bubbleText">{activeCity.letterLines.join(' ')}</div>
          </div>
        </div>

        <div class="videoCard">
          {#if activeCity.videoUrl}
            <video
              class="video"
              poster={activeCity.videoPoster ?? activeCity.media?.[0]}
              src={activeCity.videoUrl}
              controls
              playsinline
            >
              <track kind="captions" srclang="ru" label="Субтитры" />
            </video>
          {:else}
            <img class="video" src={activeCity.videoPoster ?? activeCity.media?.[0]} alt={activeCity.name} />
            <div class="playBtn" aria-hidden="true">
              <svg width="96" height="96" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 5.70975C0 2.55875 2.55875 0 5.70975 0H97.7903C100.941 0 103.5 2.55875 103.5 5.70975V97.7903C103.498 99.3041 102.896 100.756 101.826 101.826C100.756 102.896 99.3041 103.498 97.7903 103.5H5.70975C4.19543 103.5 2.74313 102.898 1.67235 101.828C0.601561 100.757 0 99.3046 0 97.7903V5.70975ZM43.8265 31.1362C43.4804 30.9054 43.0782 30.7727 42.6627 30.7523C42.2472 30.7319 41.834 30.8246 41.467 31.0205C41.1 31.2163 40.793 31.5081 40.5787 31.8647C40.3644 32.2212 40.2508 32.6292 40.25 33.0452V70.4548C40.2508 70.8708 40.3644 71.2788 40.5787 71.6353C40.793 71.9919 41.1 72.2837 41.467 72.4795C41.834 72.6754 42.2472 72.7681 42.6627 72.7477C43.0782 72.7273 43.4804 72.5946 43.8265 72.3637L71.8808 53.6647C72.1962 53.4548 72.4549 53.1701 72.6339 52.8361C72.8129 52.5021 72.9065 52.129 72.9065 51.75C72.9065 51.371 72.8129 50.9979 72.6339 50.6639C72.4549 50.3299 72.1962 50.0452 71.8808 49.8353L43.8265 31.1362Z" fill="#E5DCDC" fill-opacity="0.44"/>
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

        <section class="screen screen--hero">
            <div class="arch-bg"></div>
            <div class="screen-overlay"></div>
            <div class="top-gradient"></div>
            <div class="bottom-gradient"></div>

            <header class="topbar topbar-final">
                <div class="logo-group">
                    <span class="logo logo-white 2" aria-hidden="true"></span>
                </div>

                <button
                        class="sound-btn"
                        class:muted={!$settings.audioEnabled}
                        type="button"
                        aria-label={$settings.audioEnabled ? "Выключить звук" : "Включить звук"}
                        onclick={() =>
              settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }))
            }
                >
                    <img src="/assets/sound.svg" alt="" />
                </button>
            </header>

            <div class="heroImage">
                <img src="/assets/woman.png" alt="Гид" />
            </div>

            <div class="contentPanel dark">
                <div class="panelText">
                    Посмотрите на блик, на глубину тени, на мягкий переход света. Шар — это упражнение
                </div>
                <CommonButton text='Завершить'
                              fillMode='filled'
                              colorMode='light'
                              cssClass='bottomBtn'
                              disabled={false}
                              onTap={finishToGlobalMap}
                />
            </div>
        </section>
    {/if}
  </div>

  <style>
    .actE {
      height: 100dvh;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: linear-gradient(180deg, #fefcf8 0%, #ffffff 100%);
      color: var(--text-primary);
    }

    .card {
        background: transparent;
        border: none;
      border-radius: 24px;
        padding: 0;
    }

    .header .title {
      color: rgba(24, 22, 15, 1);
        font-family: Prata, serif;
        font-weight: 400;
        font-size: 28px;
        line-height: 120%;
        letter-spacing: 0;
        text-align: center;

    }

    .mapCard {
    }
    .map {
      position: relative;
      border-radius: 18px;
      overflow: hidden;
      aspect-ratio: 3 / 4;
    }
    .mapImg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    :global(.map-container) {
      width: 100%;
      height: 100%;
      display: block;
    }

    .hintRow {
      display: flex;
      align-items: center;
      gap: 10px;
      color: rgba(24, 22, 15, 0.86);
      font-family: Inter, sans-serif;
      font-weight: 500;
      font-size: 14px;
      line-height: 140%;
      text-align: center;
      justify-content: center;
      padding: 0 8px;
    }

    .hint {
      color: rgba(24, 22, 15, 1);
      white-space: pre-line;
        font-family: Inter, sans-serif;
        font-weight: 400;
        font-size: 16px;
        line-height: 120%;
        text-align: center;

    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding-top: 2px;
    }
    .cityTitle,
    .finalTitle {
        font-family: Prata, serif;
        font-weight: 400;
        font-size: 18px;
        line-height: 120%;

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
        background: linear-gradient(180deg, rgba(16, 13, 10, 0) 0%, rgba(16, 13, 10, 0.82) 100%);
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
        background: url("/images/background1.png") center / cover no-repeat;
        z-index: -3;
        filter: saturate(0.95);
    }

    .screen-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(24, 22, 15, 0.25) 60%);
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
        background: linear-gradient(180deg, rgba(16, 13, 10, 0.85) 0%, rgba(16, 13, 10, 0.2) 70%, transparent 100%);
    }
    .bottom-gradient {
        bottom: 0;
        height: 320px;
        background: linear-gradient(180deg, rgba(16, 13, 10, 0) 0%, rgba(16, 13, 10, 0.82) 100%);
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
