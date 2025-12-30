<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import "../styles/fonts.css";
  import { router, routes } from "../router";
  import ActivityShell from "../components/ActivityShell.svelte";
  import { memories } from "./memories";
  import { getArtifactForActivity } from "../data/artifacts";
  import CameraCatch from "./CameraCatch.svelte";
  import Modal from "../components/Modal.svelte";
  import VideoWithSubtitles from "../components/VideoWithSubtitles.svelte";
  import SoundButton from "../components/SoundButton.svelte";
  import { settings } from "../stores/settings";  

  const steps = { INTRO: "INTRO", CATCH: "CATCH", DETAIL: "DETAIL" };
  let step = steps.INTRO;
  
  // Состояние загрузки
  let isLoading = false;

  const videoConfig = {
    ios: {
      src: "/activityB/Letters_mov_HEVC.mov",
      timings: [3.5, 7.2, 10.5],
    },
    default: {
      src: "/activityB/Comp_webm_VP9_alpha.webm",
      timings: [3.4, 7.1, 10.5],
    },
  };

  let currentOverlay = videoConfig.default;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    currentOverlay = videoConfig.ios;
  } else {
    currentOverlay = videoConfig.default;
  }

  const intro = {
    title: "Приветственный адрес Поленову от учеников",
    description:
      "Документ, в котором звучат голоса учеников Василия Дмитриевича. В 1895 году, прощаясь с преподавателем, они написали ему приветственный адрес — слова благодарности",
    imageUrl: "/activityB/preview_image.png",
    imageAlt: "Приветственный адрес Поленову от учеников",
    mapSvg: "/activityB/floor-map.svg",
    floorLabel: "1 этаж",
    buttonText: "Начать"
  };

  const guide = {
    buttonText: "Далее",
    video: {
      src: "/activityB/guide_in.webm",
      subtitles: "/activityB/guide_in.srt",
      poster: "/images/1.png",
      aspectRatio: "9 / 16",
      autoplay: true,
      loop: false,
      controls: false,
      subtitlesLabel: "Субтитры",
      subtitlesLang: "ru",
    },
  };

  const outro = {
    buttonText: "Далее",
    video: {
      src: "/activityB/guide_out.webm",
      subtitles: "/activityB/guide_out.srt",
      poster: "/images/1.png",
      aspectRatio: "9 / 16",
      autoplay: true,
      loop: false,
      controls: false,
      subtitlesLabel: "Субтитры",
      subtitlesLang: "ru",
    },
  };

  const catchMemories = memories.slice(0, 3);

  let caughtMemories = [];
  let detailIdx = 0;
  let detailModalOpen = false;
  let isMuted = false;
  let pageFlipAudio;

  let currentSubtitle = "";
  let fullTextFromSRT = "";
  let videoWillBeStarting = true;

  $: detailMemo =
    step === steps.DETAIL
      ? (caughtMemories[detailIdx] ?? catchMemories[detailIdx])
      : null;

  onMount(async () => {
    /*
    const assetsToLoad = [
      "/activityB/preview_image.png",
      "/activityB/floor-map.svg"
    ];

    try {
      await Promise.all(assetsToLoad.map(async (src) => {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to load ${src}`);
        await response.blob(); 
      }));
    } catch (e) {
      console.warn("Ошибка предзагрузки (продолжаем работу):", e);
    } finally {
      isLoading = false;
    }
      */
  });

  function startCatch() {
    step = steps.CATCH;
    caughtMemories = [];
  }

  function handleCatch(event) {
    const { memory } = event.detail;
    caughtMemories = [...caughtMemories, memory];
  }

  function handleCatchComplete() {
    if (!caughtMemories.length) caughtMemories = catchMemories;
    detailIdx = 0;
    isMuted = false;
    detailModalOpen = false;
    currentSubtitle = ""; 
    fullTextFromSRT = "";
    videoWillBeStarting = true;
    step = steps.DETAIL;
  }

  function playPageFlip() {
    if (!pageFlipAudio) pageFlipAudio = new Audio("/activityB/page-flip.mp3");
    pageFlipAudio.currentTime = 0;
    pageFlipAudio.play?.().catch(() => {});
  }

  function nextDetail(outro) {
    if (detailIdx < caughtMemories.length - 1) {
      detailIdx += 1;
      isMuted = false;
      detailModalOpen = false;
      currentSubtitle = "";
      fullTextFromSRT = "";
      videoWillBeStarting = true;
      playPageFlip();
    } else {
      outro(finish);
    }
  }

  function handleSoundTap() {
    settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }));
  }

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_B);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }
</script>

<svelte:head>
  {#if step === steps.INTRO}
    <link rel="preload" as="fetch" href={guide.video.src} type="video/webm" crossorigin />
  {/if}

  {#if step !== steps.DETAIL}
    <link 
      rel="preload" 
      as="fetch" 
      href={currentOverlay.src} 
      type={isIOS ? "video/quicktime" : "video/webm"} 
      crossorigin
    />
  {/if}
</svelte:head>

{#if isLoading}
  <!-- Экран загрузки -->
  <div class="loading-screen" out:fade={{ duration: 500 }}>
    <div class="spinner"></div>
    <div class="loading-text">Загрузка материалов...</div>
  </div>
{:else}
  <!-- Основной контент появляется плавно -->
  <div class="content-wrapper" in:fade={{ duration: 500 }}>
    <ActivityShell let:next {intro} {guide} {outro}>
      <div class="safe activityB">
        {#if step === steps.INTRO}
          <div class="permissionScreen" transition:fade={{ duration: 300 }}>
            <div class="permissionCard">
              <div class="permissionTitle">Разрешить доступ к камере?</div>
              <div class="permissionSubtitle">
                Доступ необходим для работы дополненной реальности
              </div>

              <div class="permissionBtns">
                <button class="btn-cancel" type="button" on:click={finish}
                  >Отмена</button
                >
                <button class="btn-allow" type="button" on:click={startCatch}
                  >Разрешить</button
                >
              </div>
            </div>
          </div>
        {/if}

        {#if step === steps.CATCH || (step === steps.DETAIL && detailMemo)}
          <header class="top-container">
            <div class="logo-group">
              <span class="logo logo-white" aria-hidden="true"></span>
            </div>

            <SoundButton isMuted={!$settings.audioEnabled} onTap={handleSoundTap} />
          </header>
        {/if}

        <CameraCatch
          running={step === steps.CATCH || step === steps.DETAIL}
          showUI={step === steps.CATCH}
          memories={catchMemories}
          overlaySrc={currentOverlay.src}
          stopTimings={currentOverlay.timings}
          maxSlots={3}
          on:catch={handleCatch}
          on:complete={handleCatchComplete}
          on:error={(event) => console.error("Camera error", event.detail)}
        />

        {#if step === steps.DETAIL && detailMemo}
          <div class="detailScreen" transition:fade={{ duration: 400 }}>
            <div class="detailTitle">
              <div class="detailName">{detailMemo.name}</div>
            </div>

            <div class="mediaFrame">
              <VideoWithSubtitles
                src={isIOS ? detailMemo.videoUrlMov : detailMemo.videoUrl}
                subtitlesSrc={detailMemo.srtUrl}
                autoplay={true}
                muted={!$settings.audioEnabled}
                loop={false}
                onSubtitleUpdate={(text) => {
                  if (videoWillBeStarting) {
                    setTimeout(() => {
                      currentSubtitle = text;
                      videoWillBeStarting = false;
                    }, 800);
                  } else {
                    currentSubtitle = text;
                  }
                }}
                onCaptionsLoaded={(text) => {
                  fullTextFromSRT = text;          
                }}
              />
            </div>

            <div class="audioLayer">
              {#if currentSubtitle}
                <div class="captions">
                  {@html currentSubtitle}
                </div>
              {/if}

              <button
                class="captionsTap"
                type="button"
                aria-label="Читать полную версию воспоминания"
                on:click={() => (detailModalOpen = true)}
              ></button>
            </div>

            <Modal
              open={detailModalOpen}
              title={detailMemo.name}
              fullscreen
              onClose={() => (detailModalOpen = false)}
            >
              <div class="modalRole">{detailMemo.role}</div>
              <div class="modalText">
                {fullTextFromSRT || "Текст загружается..."}
              </div>
            </Modal>

            <div class="detailButtons">
              <button class="btn-primary" type="button" on:click={() => nextDetail(next)}>
                {detailIdx < caughtMemories.length - 1
                  ? "Следующее воспоминание"
                  : "Далее"}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </ActivityShell>
  </div>
{/if}

<style>
  .loading-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: url("/onboarding/background1.jpg") center/cover no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #1f130a;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(179, 135, 101, 0.3);
    border-radius: 50%;
    border-top-color: #b38765;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }

  .loading-text {
    font-family: "Cormorant Garamond", serif;
    font-size: 18px;
    font-weight: 500;
    color: #1f130a;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .content-wrapper {
    height: 100%;
    width: 100%;
  }

  .activityB {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    overscroll-behavior: none;
    height: 100dvh;
    min-height: 100svh; 
    
    overflow: hidden;
    background: url("/onboarding/background1.jpg") center/cover no-repeat;
  }

  .permissionScreen {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative; 
    z-index: 80;
  }

  .permissionCard {
    width: min(360px, 92vw);
    border-radius: 32px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
    padding: 32px 28px 26px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    font-family: "Cormorant Garamond", "Helvetica Neue", serif;
  }

  .permissionTitle {
    font-size: 28px;
    font-weight: 600;
    color: #1f130a;
    line-height: 1.15;
  }

  .permissionSubtitle {
    font-size: 14px;
    font-family: "Inter", sans-serif;
    color: rgba(31, 19, 10, 0.75);
    margin-top: 14px;
  }

  .permissionBtns {
    margin-top: 26px;
    display: flex;
    gap: 12px;
  }

  .permissionBtns button {
    flex: 1;
    border-radius: 999px;
    padding: 14px 0;
    font-size: 15px;
    font-weight: 500;
    border: 0;
    cursor: pointer;
  }

  .btn-cancel {
    border: 1px solid #a3876c !important;
    background: transparent;
    color: #a3876c;
  }

  .btn-allow {
    background: #b38765;
    color: #fff;
  }

  .detailTitle {
    text-align: left;
    margin-bottom: 16px;
    margin-top: 16px;
  }

  .activityB .detailName {
    font-family: Prata;
    font-weight: 400;
    font-size: 26px;
    line-height: 120%;
    color:rgb(255, 252, 248);
  }

  :global(.activityB .mediaFrame) {
    border-radius: 28px;
    overflow: hidden;
    box-shadow: none;
    height: 50vh;
    background: transparent;
    position: relative;
    display: block;
    margin-top: auto;
    margin-bottom: auto;
  }

  .activityB .mediaFrame :global(> *) {
    width: 100%;
    height: 100%;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
  }

  .activityB .mediaFrame :global(video) {
    width: 100% !important;
    height: 100% !important;
    height: 50vh;
    object-fit: cover !important; 
    background: transparent !important;
    display: block;
    margin-top: auto;
    margin-bottom: auto;
  }

  .detailButtons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: auto;
  }

  .detailButtons .btn-primary {
    border-radius: 999px;
    padding: 16px;
    font-size: 16px;
    font-weight: 500;
  }

  .btn-primary {
    background: #fdf6ea;
    color: #1f130a;
    border: none;
  }

  .modalRole {
    margin-top: 6px;
    font-size: 13px;
    color: rgba(17, 24, 39, 0.55);
  }

  .modalText {
    margin-top: 12px;
    white-space: pre-wrap;
    font-size: 15px;
    line-height: 1.4;
  }

  .activityB .audioLayer {
    position: relative;
    margin-top: 0px;
    min-height: 20vh;
    display: flex;
  }

  .detailScreen {
    position: absolute;
    top: 60px;
    width: 92vw;
    height: calc(100dvh - 80px);
    display: flex;
    flex-direction: column;
    z-index: 70; 
  }

  .activityB :global(.video-wrapper-inner video) {
    width: 100%;
    height: 100%;
    object-fit: contain !important;
    background: transparent !important;
    display: block;
  }

  .activityB .captions {
    width: min(520px, 90vw);
    padding: 12px 16px;
    margin-top: auto;
    margin-bottom: 15px;
    color: rgba(254, 254, 252, 0.96);
    pointer-events: none;
    z-index: 5;
    font-family: Inter;
    font-weight: 500;
    font-size: 18px;
    line-height: 124%;
    text-align: center;
    color: var(--txt-white);
  }

  .captionsTap {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: min(520px, 90vw);
    height: 100%;
    border: none;
    background: transparent;
    cursor: pointer;
    z-index: 6;
  }

  .top-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 100;
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
</style>