<script>
  import { fade } from "svelte/transition"; // Добавьте импорт анимации

  import AudioWithCaptions from "./AudioWithCaptions.svelte";
  import VideoWithSubtitles from "./VideoWithSubtitles.svelte";
  import SoundButton from "./SoundButton.svelte";
  import { settings } from "../stores/settings";
  import '../styles/fonts.css';

  export let background = "/onboarding/background1.jpg";
  export let buttonText = "Далее";
  export let audio = {
    src: "/audio/onboarding-welcome.wav",
    captions: [
      { t: 0, text: "Думаю, что главная черта гениальности – актуальность..." },
    ],
    autoplay: true,
  };
  export let video = null; 
  export let onNext = () => {};

  export let hasTwoButtons = false;
  export let topButtonText = "Далее";
  export let bottomButtonText = "Завершить";
  export let onTopButtonTap = () => {};
  export let onBottomButtonTap = () => {};

  let currentSubtitle = ""; // Локальное состояние для текста субтитров

  $: hasVideo = Boolean(video?.src);
  $: hasAudio = !hasVideo && Boolean(audio?.src);
  $: videoMuted = !$settings.audioEnabled || Boolean(video?.muted);

  function handleSoundTap() {
    $settings.audioEnabled = !$settings.audioEnabled;
  }

  function handleSubtitleUpdate(text) {
    if(text === undefined || text=== null || text.length === 0)
      return
    currentSubtitle = text;
  }
</script>

<div
  class="guide-screen media-screen"
  style={`--screen-bg: url('${background}'); --overlay-text: rgba(254, 254, 252, 1);`}
>
  <div class="media-foreground"></div>
  <div class="top-gradient"></div>

  <header class="top-container">
    <div class="logo-group">
      <span class="logo logo-white" aria-hidden="true"></span>
    </div>

    <SoundButton isMuted={videoMuted} onTap={handleSoundTap} />
  </header>

  <div class="content">
    <div class={`media-layer ${hasVideo ? "media-layer--video" : ""}`}>
      {#if hasVideo}
        {#key video.src}
        <div
          class="video-wrapper"
          style={`aspect-ratio: ${video?.aspectRatio || "16 / 9"}`}
        >
          <VideoWithSubtitles
            src={video.src}
            subtitlesSrc={video.subtitles}
            autoplay={video?.autoplay ?? true}
            loop={video?.loop ?? false}
            controls={video?.controls ?? false}
            muted={videoMuted}
            onSubtitleUpdate={handleSubtitleUpdate} 
          />
        </div>
        {/key}
      {:else if hasAudio}
        <AudioWithCaptions
          src={audio.src}
          captions={audio.captions}
          autoplay={audio.autoplay ?? true}
          muted={!$settings.audioEnabled}
        />
      {/if}
    </div>

    <div class="bottom-gradient"></div>

    <div class="content-card content-card--audio">
      <div class="subtitles">
        {#if hasVideo}
          {@html currentSubtitle}
        {:else}
          К августу краски потрескались и потеряли яркость! А вы с таким сталкивались?
        {/if}
      </div>

      <div class="buttons">
        {#if !hasTwoButtons}
          <button class="cta-button primary" type="button" on:click={onNext}>
            {buttonText}
          </button>         
        {:else}
          <button class="cta-button secondary" type="button" on:click={onTopButtonTap}>
            {topButtonText}
          </button>
          <button class="cta-button secondary" type="button" on:click={onBottomButtonTap}>
            {bottomButtonText}
          </button> 
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .guide-screen {
    min-height: 100dvh;
    overflow: hidden;
    height: 100svh;
    overscroll-behavior: none;
  }

  .top-container {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 3;
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
  }

  .content {
    position: relative;
    height: 100%;
  }

  .content-card {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    z-index: 3;
  }

  .content-card--audio {
    padding-top: 140px;
  }

  .subtitles {   
    font-family: Inter;
    font-weight: 500;
    font-size: 18px;
    line-height: 124%;
    text-align: center;
    min-height: 1.2em; /* Чтобы блок не схлопывался, если субтитров нет */
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
    .media-layer {
    position: relative;
    height: 100%;
  }

  .media-layer--video {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: clamp(40px, 6vw, 80px) clamp(12px, 4vw, 32px) 180px;
  }

  .video-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: min(860px, 100%);
    overflow: hidden;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
    background: transparent; 
  }
  </style>