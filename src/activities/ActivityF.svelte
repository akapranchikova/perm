<script>
  import { router, routes } from "../router";
  import ActivityShell from "../components/ActivityShell.svelte";
  import FramesHolder from "../components/FramesHolder.svelte";
  import BrightnessSlider from "../components/BrightnessSlider.svelte";
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
  const MAX_VALUE = 100;
  const MAX_SCALE = 10;
  const TOTAL_FRAMES_COUNT = 10;
  const FRAME_NAME_DIGIT_COUNT = 4;
  const FRAME_BASE_PATH = '/activityF/';
  const FRAME_NAME_BASE = 'frame_';
  const FRAME_NAME_EXTENSION = '.png';

  const VIDEO_BASE_PATH = "/activityF/";
  const CIRCLE_VIDEO_SRC = `${VIDEO_BASE_PATH}sick_2.webm`;
  const CIRCLE_VIDEO_SUBS = `${VIDEO_BASE_PATH}sick_2.srt`;

  // $state
  let value = $state(MIN_VALUE);
  let isSliderCompleted = $state(false);
  let bubbleText = $state("");

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_F);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }

  const intro = {
    title: "Больная",
    subtitle: "Василий Поленов",
    description: "Своей картиной Поленов показывает хрупкость жизни: девушка слабеет и угасает, "
      + "а свет в комнате словно подчеркивает тишину и близость конца",
    imageUrl: `${FRAME_BASE_PATH}title-picture.png`,
    imageAlt: "Больная — Василий Поленов",
    mapSvg: `${FRAME_BASE_PATH}floor-map.svg`,
    floorLabel: "2 этаж",
    buttonText: "Начать",
  };

  const finalVideo ={
    src: `${VIDEO_BASE_PATH}sick_3.mp4`,
    subtitles: `${VIDEO_BASE_PATH}sick_3.srt`,
    aspectRatio: "9 / 16",
    autoplay: true,
    loop: false,
    controls: false,
    subtitlesLabel: "Субтитры",
    subtitlesLang: "ru",
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
    }
  }

  const guide = {
    buttonText: "Продолжить",
    video: {
      src: `${VIDEO_BASE_PATH}sick_1.webm`,
      subtitles: `${VIDEO_BASE_PATH}sick_1.srt`,
      //poster: "/images/gigachat.png",
      aspectRatio: "9 / 16",
      autoplay: true,
      loop: false,
      controls: false,
      subtitlesLabel: "Субтитры",
      subtitlesLang: "ru",
    },
  };
</script>

<ActivityShell {intro} {guide}>
  {#if !isSliderCompleted}
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
          <GuideCircleVideo
            src={CIRCLE_VIDEO_SRC}
            subtitlesSrc={CIRCLE_VIDEO_SUBS}
            isMuted={!$settings.audioEnabled}
            autoplay={true}
            isLooped={false}
            on:subtitlechange={handleSubtitleChange}
            cssClass="guide-circle-video"
          />
        <div class="bubble">
          <div class="bubbleText">
            {bubbleText ||
              ""}
          </div>
        </div>
      </div>

      <div class="body">
        <div class="painting-wrapper">
          <FramesHolder
            alt='Картина Василия Поленова - Больная'
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
        </div>
        <div class="painting-caption">
          В. Д.Поленов · 1880-е · Государственный музей-заповедник В. Д. Поленова
        </div>
        <div class="paintingCard">
        </div>
        <div
          class="gesture"
          aria-hidden="true"
        >
          <GestureResizeIndicator />
        </div>
      </div>

      <div class="sliderBlock">
        <BrightnessSlider
          value={value}
          minValue={MIN_VALUE}
          maxValue={MAX_VALUE}
          onValueChanged={handleValueChanged}
        />
      </div>

      <button class="cta-button primary " type="button" onclick={handlePrimaryAction}>
        Далее
      </button>
    </div>
  {/if}

  {#if isSliderCompleted}
    <ActivityGuideIntro
      video={finalVideo}
      buttonText="Завершить"
      onNext={finish}
    />
  {/if}
</ActivityShell>

<style>
  .activity {
    position: relative;
    gap: 16px;
    overscroll-behavior: none;
    display: flex;
    flex-direction: column;
    height: 100dvh;
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

  .body {
    flex: 1;
    align-items: flex-end;
    justify-content: center;
    display: flex;
    flex-direction: row;
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
    top: -5px;
    position: absolute;
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

  .gesture {
    display: grid;
    place-items: center;
    color: var(--accent);
    margin-top: auto;
  }

  :global(.painting) {
    overflow: hidden;
    aspect-ratio: 16 / 10;
  }

  .gesture svg {
    filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.25));
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
    font-family: 'Prata', 'Times New Roman', serif;
    color: rgba(255, 252, 248, 0.96);
  }

  .small {
    font-size: 12px;
    color: rgba(255, 252, 248, 0.65);
    font-weight: 500;
  }
</style>