<script>
  import AudioWithCaptions from "./AudioWithCaptions.svelte";
  import { settings } from "../stores/settings";

  export let background = "/images/background1.png";
  export let buttonText = "Далее";
  export let audio = {
    src: "/audio/onboarding-welcome.wav",
    captions: [
      {
        t: 0,
        text:
          "Думаю, что главная черта гениальности – актуальность. Вот и Поленов до сих пор не дает нам...",
      },
    ],
    autoplay: true,
  };
  export let onNext = () => {};
</script>

<div
  class="guide-screen media-screen"
  style={`--screen-bg: url('${background}'); --screen-foreground: url('/assets/woman.png'); --overlay-text: rgba(254, 254, 252, 1);`}
>
  <div class="media-foreground"></div>
  <div class="top-gradient"></div>

  <header class="top-container">
    <div class="logo-group">
      <span class="logo logo-white" aria-hidden="true"></span>
    </div>

    <button
      class="sound-btn"
      class:muted={!$settings.audioEnabled}
      type="button"
      aria-label={$settings.audioEnabled ? "Выключить звук" : "Включить звук"}
      on:click={() =>
        settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }))
      }
    >
      <img src="/assets/sound.svg" alt="" />
    </button>
  </header>

  <div class="content">
    <div class="audio-layer">
      <AudioWithCaptions
        src={audio.src}
        captions={audio.captions}
        autoplay={audio.autoplay ?? true}
        muted={!$settings.audioEnabled}
      />
    </div>

    <div class="bottom-gradient"></div>

    <div class="content-card content-card--audio">
      <div class="buttons">
        <button class="cta-button primary" type="button" on:click={onNext}>
          {buttonText}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .guide-screen {
    min-height: 100dvh;
    height: 100svh;
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

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
</style>
