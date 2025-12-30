<script>
  import { router, routes } from "../router";
  import ActivityShell from "../components/ActivityShell.svelte";
  import FramesHolder from "../components/FramesHolder.svelte";
  import Slider from "../components/Slider.svelte";
  import GestureResizeIndicator from "../components/GestureResizeIndicator.svelte";
  import GuideCircleVideo from "../components/GuideCircleVideo.svelte";
  import SoundButton from "../components/SoundButton.svelte";
  import ActivityGuideIntro from "../components/ActivityGuideIntro.svelte";
  import { getArtifactForActivity } from "../data/artifacts";
  import "../styles/fonts.css";
  import "../styles/constants.css";
  import "../styles/interactive-elements.css";
  import { settings } from "../stores/settings";

  // Константы конфигурации
  const MIN_VALUE = 0;
  const MAX_VALUE = 365;
  const MAX_SCALE = 10;
  const TOTAL_FRAMES_COUNT = 6;
  const FRAME_NAME_DIGIT_COUNT = 4;
  const FRAME_BASE_PATH = "/activityA/";
  const FRAME_NAME_BASE = "frame_";
  const FRAME_NAME_EXTENSION = ".png";

  const VIDEO_BASE_PATH = "/activityA/";
  const VIDEO_3_SRC = `${VIDEO_BASE_PATH}PAstuh_3.webm`;
  const VIDEO_4_SRC = `${VIDEO_BASE_PATH}PAstuh_4.webm`;
  const VIDEO_3_SUBS = `${VIDEO_BASE_PATH}PAstuh_3.srt`;
  const VIDEO_4_SUBS = `${VIDEO_BASE_PATH}PAstuh_4.srt`;

  // $state
  let value = $state(MIN_VALUE);
  let isSliderCompleted = $state(false);
  let bubbleText = $state("");
  let secondGuideScreenWasShown = $state(false);

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_A);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }

  const intro = {
    title: "Пастух со стадом",
    subtitle: "Егише Татевосян",
    description:
      "Картина показывает тихую сцену деревенской жизни. В работе заметно, как художник играет со светом и тенью, следуя урокам Поленова, мастерски передает атмосферу и глубину пейзажа",
    imageUrl: "/activityA/title-picture.png",
    imageAlt: "Пастух со стадом — Егише Татевосян",
    mapSvg: "/activityA/floor-map.svg",
    floorLabel: "2 этаж",
    buttonText: "Начать",
  };

  function handleValueChanged(newValue) {
    value = newValue;
  }

  function handleVideoSoundTap() {
    settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }));
  }

  function handleSubtitleChange(event) {
    console.log('UPD')
    bubbleText = event?.detail?.text?.trim() ?? "";
  }

  function handlePrimaryAction() {
    if (!isSliderCompleted) {
      isSliderCompleted = true;
      return;
    }

    finish();
  }

  function handleSecondGuideScreenButtonTap() {
    secondGuideScreenWasShown = true;
  }

  const guide = {
    buttonText: "Продолжить",
    video: {
      src: "/activityA/PAstuh_1.webm",
      subtitles: "/activityA/PAstuh_1.srt",
      poster: "/activityA/PAstuh_2.png",
      aspectRatio: "9 / 16",
      autoplay: true,
      loop: false,
      controls: false,
      subtitlesLabel: "Субтитры",
      subtitlesLang: "ru",
    },
  };

  const secondGuideScreenData = {
    topButtonText: "Бывает!",
    bottomButtonText: "Не замечал",
    video: {
      src: "/activityA/PAstuh_2.webm",
      subtitles: "/activityA/PAstuh_2.srt",
      poster: "/activityA/PAstuh_2.png",
      aspectRatio: "9 / 16",
      autoplay: true,
      loop: false,
      controls: false,
      subtitlesLabel: "Субтитры",
      subtitlesLang: "ru",
    },
  };
</script>

<svelte:head>
  <link rel="preload" as="fetch" href={guide.video.src} type="video/webm" crossorigin />
  <link 
    rel="preload" 
    as="image" 
    href={intro.imageUrl} 
    crossorigin
  />
</svelte:head>


<ActivityShell {intro} {guide}>
  {#if !secondGuideScreenWasShown}
    <ActivityGuideIntro
      video={secondGuideScreenData.video}
      hasTwoButtons={true}
      topButtonText={secondGuideScreenData.topButtonText}
      bottomButtonText={secondGuideScreenData.bottomButtonText}
      onTopButtonTap={handleSecondGuideScreenButtonTap}
      onBottomButtonTap={handleSecondGuideScreenButtonTap}
    />
  {:else}
    <div
      class="safe activity media-screen"
      style="--screen-bg: url('/onboarding/background1.jpg'); --overlay-text: var(--txt-white);"
    >
      <div class="bottom-gradient"></div>
      <div class="topbar">
        <div class="logo-group" aria-label="Поленов и Сбер">
          <span class="logo logo-white" aria-hidden="true"></span>
        </div>
        <SoundButton isMuted={!$settings.audioEnabled} onTap={handleVideoSoundTap} />
      </div>

      <div class="quote">
        {#if !isSliderCompleted}
          <GuideCircleVideo
            src={VIDEO_3_SRC}
            subtitlesSrc={VIDEO_3_SUBS}
            isMuted={!$settings.audioEnabled}
            autoplay={true}
            isLooped={false}
            on:subtitlechange={handleSubtitleChange}
            cssClass="guide-circle-video"
          />
        {:else}
          <GuideCircleVideo
            src={VIDEO_4_SRC}
            subtitlesSrc={VIDEO_4_SUBS}
            isMuted={!$settings.audioEnabled}
            autoplay={true}
            isLooped={false}
            on:subtitlechange={handleSubtitleChange}
            cssClass="guide-circle-video"
          />
        {/if}
        <div class="bubble">
          <div class="bubbleText">
            {bubbleText ||
              ""}
          </div>
        </div>
      </div>

      <div class="body">
        <div class="painting-wrapper">
          {#if !isSliderCompleted}
            <FramesHolder
              alt="Картина Егише Татевосян - Пастух со стадом"
              minValue={MIN_VALUE}
              maxValue={MAX_VALUE}
              maxScale={MAX_SCALE}
              totalFramesCount={TOTAL_FRAMES_COUNT}
              frameNameDigitCount={FRAME_NAME_DIGIT_COUNT}
              frameBasePath={FRAME_BASE_PATH}
              frameNameBase={FRAME_NAME_BASE}
              frameNameExtension={FRAME_NAME_EXTENSION}
              {value}
              cssClass="painting"
              paintingStartMinPadding={32}
            />
          {:else}
            <FramesHolder
              alt="Картина Егише Татевосян - Пастух со стадом"
              minValue={MIN_VALUE}
              maxValue={MIN_VALUE + 1}
              maxScale={MAX_SCALE}
              totalFramesCount={1}
              frameNameDigitCount={FRAME_NAME_DIGIT_COUNT}
              frameBasePath={FRAME_BASE_PATH}
              frameNameBase={FRAME_NAME_BASE}
              frameNameExtension={FRAME_NAME_EXTENSION}
              value={MIN_VALUE}
              cssClass="painting"
              paintingStartMinPadding={32}
            />
          {/if}
        </div>
        <div
          class="painting-caption"
          style={`visibility: ${isSliderCompleted ? 'hidden' : 'visible'}`}
        >
          Татевосян Егише М. · 1919 · © Государственный музей Востока
        </div>
        <div class="paintingCard"></div>
        <div
          class="gesture"
          aria-hidden="true"
        >
          <GestureResizeIndicator />
        </div>        
      </div>

      <div
        class="sliderBlock"
        style={`visibility: ${isSliderCompleted ? 'hidden' : 'visible'}`}
      >
        <div class="label">Количество дней под солнцем</div>
        <div class="slider-wrapper">
          <Slider
            {value}
            minValue={MIN_VALUE}
            maxValue={MAX_VALUE}
            onValueChanged={handleValueChanged}
            cssClass="my-custom-slider"
          />
        </div>
      </div>
      
      <button
        class="cta-button primary"
        type="button"
        onclick={handlePrimaryAction}
      >
        {isSliderCompleted ? "Завершить" : "Далее"}
      </button>
    </div>
  {/if}
</ActivityShell>

<style>
  .activity {
    position: relative;
    gap: 16px;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    overflow: hidden;
    overscroll-behavior: none;
    color: var(--txt-white);
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
    z-index: 5;
    padding: 4px 0;
  }

  .logo-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo {
    display: inline-block;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
  }

  .quote {
    z-index: 5;
  }

  :global(.guide-circle-video) {
    width: 58px;
    height: 58px;
    object-fit: cover;
    flex: 0 0 auto;
  }

  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
  }

  .painting-caption {
    font-family: Inter;
    font-weight: 400;
    font-size: 14px;
    line-height: 130%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    color: var(--txt-white);
    position: absolute;
    top: -5px;
  }

  .paintingCard {
    padding: 0;
    height: 220px;
    overflow: hidden;
  }

  .painting-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin-left: -18px;
    margin-right: -18px;
    box-sizing: border-box;
    z-index: 10;
  }

  :global(.painting) {
    overflow: hidden;
    aspect-ratio: 16 / 10;
  }

  .gesture {
    display: grid;
    place-items: center;
    color: var(--accent);
    margin-top: auto;
  }

  :global(.gesture svg) {
    filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.25));
    height: 42px;
    width: 42px;
  }

  .sliderBlock {
    text-align: center;
    padding: 14px 4px 4px;
    color: rgba(255, 252, 248, 0.95);
    display: flex;
    flex-direction: column;
    z-index: 5;
    gap: 12px;
  }

  .label {
    font-size: 15px;
    letter-spacing: 0.01em;
    font-family: "Prata", "Times New Roman", serif;
    color: rgba(255, 252, 248, 0.96);
  }

  .small {
    font-size: 12px;
    color: rgba(255, 252, 248, 0.65);
    font-weight: 500;
  }

  .slider-wrapper {
    width: 100%;
    display: flex;
    height: 40px;
  }

  :global(.my-custom-slider) {
    margin-top: auto;
    margin-bottom: auto;
  }

  /*:global(.my-custom-slider.slider-container) {
    width: 100%;
  }

  :global(.my-custom-slider .slider-track) {
    height: 9px;
    background: rgba(255, 252, 248, 0.25);
    border: 1px solid rgba(255, 252, 248, 0.32);
    border-radius: 999px;
  }

  :global(.my-custom-slider .slider-progress) {
    background: linear-gradient(
      90deg,
      rgba(178, 152, 126, 0.8),
      rgba(178, 152, 126, 1)
    );
    border-radius: 999px;
  }

  :global(.my-custom-slider .slider-thumb) {
    width: 30px;
    height: 30px;
    background: rgba(254, 252, 248, 0.96);
    border: 2px solid rgba(178, 152, 126, 0.98);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
  }

  :global(.my-custom-slider .thumb-value) {
    display: none;
  }

  :global(.my-custom-slider .slider-input) {
    height: 40px;
  }*/
</style>
