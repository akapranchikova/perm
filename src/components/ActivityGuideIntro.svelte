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

<div class="guide-screen" style={`--bg: url('${background}');`}>
  <div class="top-gradient"></div>

  <header class="top-container">
    <div class="logo-group">
      <span class="logo logo-sber-circle" aria-hidden="true"></span>
      <span class="logo logo-cross" aria-hidden="true"></span>
      <span class="logo logo-arch" aria-hidden="true"></span>
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
    <div class="audioLayer">
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
    position: relative;
    height: 100vh;
    max-height: 100vh;
    width: 100%;
    background: var(--bg) center / cover no-repeat;
    overflow: hidden;
    color: rgba(254, 254, 252, 1);
  }

  .guide-screen::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.50);
      pointer-events: none;
  }

  .guide-screen::after {
      position: absolute;
      content: '';
      top: 0;
      width: 100%;
      height: 100%;
      background: url('/assets/woman.png') center/cover no-repeat;
  }

  .top-gradient,
  .bottom-gradient {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 1;
    pointer-events: none;
  }

  .top-gradient {
    top: 0;
    height: 210px;
    background: linear-gradient(
      180deg,
      rgba(16, 13, 10, 0.85) 0%,
      rgba(16, 13, 10, 0.25) 70%,
      transparent 100%
    );
  }

  .bottom-gradient {
    bottom: 0;
    height: 340px;
    background: linear-gradient(
      180deg,
      rgba(16, 13, 10, 0) 0%,
      rgba(16, 13, 10, 0.8) 100%
    );
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

  .logo-sber-circle {
    width: 44px;
    height: 44px;
    background-image: url("/assets/logo-sber-circle.png");
  }

  .logo-cross {
    width: 24px;
    height: 1.5px;
    background: #ffffff;
    transform: rotate(-45deg);
    position: relative;
  }

  .logo-cross::after {
    content: "";
    position: absolute;
    width: 24px;
    height: 1.5px;
    background: #ffffff;
    transform: rotate(90deg);
  }

  .logo-arch {
    width: 44px;
    height: 44px;
    background-image: url("/assets/logo-arch.png");
  }

  .content {
    position: relative;
    height: 100%;
  }

  .audioLayer {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
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
