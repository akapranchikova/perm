<script>
  import { router, routes } from '../router';
  import ActivityShell from '../components/ActivityShell.svelte';
  import FramesHolder from '../components/FramesHolder.svelte';
  import Slider from '../components/Slider.svelte';
  import { getArtifactForActivity } from '../data/artifacts';
  import '../styles/fonts.css';
  import '../styles/constants.css';
  import '../styles/interactive-elements.css';

  // Константы конфигурации
  const MIN_VALUE = 0;
  const MAX_VALUE = 365;
  const MAX_SCALE = 10;
  const TOTAL_FRAMES_COUNT = 9;
  const FRAME_NAME_DIGIT_COUNT = 4;
  const FRAME_BASE_PATH = '/activityA/';
  const FRAME_NAME_BASE = 'frame_';
  const FRAME_NAME_EXTENSION = '.png';

  // $state
  let value = $state(MIN_VALUE);
  let currentFrameIndex = $state(0);
  let nextFrameIndex = $state(0);
  let isSliderCompleted = $state(false);

  // $derived
  let frameDisplayInfo = $derived({
    current: Math.floor((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE) * (TOTAL_FRAMES_COUNT - 1)) + 1,
    next: Math.floor((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE) * (TOTAL_FRAMES_COUNT - 1)) + 2
  });

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_A);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }

  const intro = {
    title: "Пастух со стадом",
    subtitle: "Егише Татевосян",
    description:
      "Картина показывает тихую сцену деревенской жизни. В работе заметно, как художник играет со светом и тенью, следуя урокам Поленова, мастерски передает атмосферу и глубину пейзажа",
    imageUrl: "/activityA/frame_0003.png",
    imageAlt: "Пастух со стадом — Егише Татевосян",
    floorLabel: "2 этаж",
    buttonText: "Начать",
  };

  function handleValueChanged(newValue) {
    value = newValue;
  }

  function handlePrimaryAction() {
    if (!isSliderCompleted) {
      isSliderCompleted = true;
      return;
    }

    finish();
  }
</script>

<ActivityShell {intro}>
  <div class="safe activity">
    <div class="topbar">
      <div class="logo-group" aria-label="Поленов и Сбер">
        <span class="logo logo-sber-circle" aria-hidden="true"></span>
        <span class="logo logo-cross" aria-hidden="true"></span>
        <span class="logo logo-arch" aria-hidden="true"></span>
      </div>

      <button class="icon" type="button" aria-label="Звук">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M11 5L6.5 9H3v6h3.5L11 19V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M16 9c1.5 1.5 1.5 4.5 0 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M18.5 6.5c3 3 3 8 0 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="quote">
      <img class="avatar" src="/guide.png" alt="" />
      <div class="bubble">
        <div class="bubbleText">
          которые когда-то закладывал Василий Дмитриевич Поленов
        </div>
      </div>
    </div>

      <div class="body">
          <div class="paintingCard">
              <FramesHolder
                      alt='Картина Егише Татевосян - Пастух со стадом'
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
              />
          </div>

          <div class="gesture" aria-hidden="true">
              <svg width="44" height="47" viewBox="0 0 44 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_898_8675)">
                      <path d="M24.4978 46.7116C24.4134 46.6281 24.3442 46.338 24.3442 46.0662C24.3442 45.796 24.1706 45.0668 23.9586 44.4485C23.6506 43.5508 23.0984 42.861 21.2235 41.0331C18.8904 38.7585 18.8611 38.7164 16.9871 34.921C14.9194 30.7331 13.8682 29.0029 12.1346 26.9334C10.9148 25.4774 10.5492 24.5976 10.919 24.0087C11.5341 23.0295 13.4452 22.7871 14.8543 23.51C16.016 24.1056 17.2543 25.4225 18.669 27.5672C19.8979 29.4297 20.5187 29.8338 21.0476 29.1153C21.4611 28.5535 21.4533 21.6924 21.0396 20.5551C20.8788 20.1148 19.9144 18.6735 18.8969 17.3522C16.4911 14.2288 16.423 14.0945 16.7492 13.1126C17.1008 12.054 17.9811 11.4043 19.0638 11.4043C19.8993 11.4043 20.0502 11.5354 22.5446 14.4299C23.9787 16.0941 25.3334 17.6642 25.5551 17.9189C25.9243 18.3429 25.9776 18.3496 26.1897 17.9984C26.5133 17.4639 27.6491 17.2664 28.6019 17.5787C29.7807 17.9642 30.3334 18.7867 30.3334 20.1529V20.5943C30.3334 20.8276 30.6262 20.9318 30.7736 20.751C31.1336 20.3095 31.4311 20.2109 32.4045 20.2109C33.4583 20.2109 33.6724 20.2984 34.2671 20.958C34.7371 21.4806 34.9391 21.9447 34.9391 22.5022V22.6503C34.9391 22.8905 35.2292 23.0113 35.3997 22.842C36.3343 21.9133 38.4091 22.5042 38.9802 23.8624C39.2266 24.4486 40.2656 35.1559 39.39 37.7637C39.0366 38.8164 38.0837 40.5395 38.0837 40.5395C36.8691 42.9854 36.3203 44.7434 36.3203 46.1878C36.3203 46.5607 36.018 46.863 35.6451 46.863H30.4864C27.2778 46.863 24.5823 46.795 24.4978 46.7116Z" fill="#B2987E" fill-opacity="0.7"/>
                      <path d="M30.4003 0.196293C30.399 0.355253 30.1435 1.83884 29.8324 3.4893L29.4649 5.43963C29.3718 5.93407 28.8006 6.16907 28.3866 5.88326C27.9025 5.55037 27.4756 5.31576 27.4381 5.36459C27.4009 5.41543 26.5908 6.49179 25.6387 7.76011C24.6867 9.02843 23.8388 10.1067 23.7544 10.1557C23.6701 10.2055 23.3 9.99439 22.932 9.68995C22.559 9.3805 22.4993 8.83077 22.797 8.4482L23.0142 8.16907C23.4275 7.63783 24.2712 6.51691 24.8891 5.67788L25.418 4.95974C25.7538 4.50391 25.6832 3.86675 25.2559 3.49566C24.8949 3.18223 24.9674 2.60276 25.3944 2.38761L26.6941 1.73272C30.3222 -0.0956307 30.403 -0.128784 30.4003 0.196293Z" fill="#B2987E" fill-opacity="0.7"/>
                      <path d="M1.59033 39.2555C1.58829 39.0966 1.81202 37.6079 2.0878 35.9513L2.41347 33.9937C2.49603 33.4974 3.06209 33.2504 3.48207 33.5274C3.97322 33.85 4.40496 34.0755 4.44147 34.0259C4.47755 33.9743 5.26448 32.8811 6.18923 31.593C7.11398 30.3049 7.93867 29.209 8.02191 29.1582C8.10519 29.1067 8.47968 29.3099 8.85415 29.6065C9.23362 29.9081 9.30511 30.4564 9.01565 30.8452L8.80445 31.1288C8.4026 31.6686 7.58303 32.8071 6.98323 33.659L6.46973 34.3881C6.14379 34.8509 6.22795 35.4864 6.66312 35.8484C7.03066 36.1542 6.97061 36.735 6.5483 36.9592L5.26285 37.6413C1.67465 39.5457 1.59455 39.5806 1.59033 39.2555Z" fill="#B2987E" fill-opacity="0.7"/>
                  </g>
                  <defs>
                      <clipPath id="clip0_898_8675">
                          <rect width="44" height="47" fill="white"/>
                      </clipPath>
                  </defs>
              </svg>
          </div>
      </div>


      {#if !isSliderCompleted}
          <div class="sliderBlock">
              <div class="label">Количество дней под солнцем</div>

              <Slider
                      value={value}
                      minValue={MIN_VALUE}
                      maxValue={MAX_VALUE}
                      onValueChanged={handleValueChanged}
                      cssClass="my-custom-slider"
              />

              <div class="small">
                  Кадр: {frameDisplayInfo.current}
                  {#if frameDisplayInfo.current < TOTAL_FRAMES_COUNT}
                      → {frameDisplayInfo.next}
                  {/if}
              </div>
          </div>
      {/if}

    <button class="finish" type="button" on:click={handlePrimaryAction}>
      {isSliderCompleted ? 'Завершить' : 'Далее'}
    </button>
  </div>
    <div class="bottom-gradient"></div>

</ActivityShell>

<style>
  .activity {
    position: relative;
    gap: 16px;
    display: flex;
    flex-direction: column;
    height: 100%;
    color: var(--txt-white);
      background: url('/images/background1.png') center / cover no-repeat;
  }

  .activity::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.50);
      pointer-events: none;
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

  .logo-sber-circle {
    width: 36px;
    height: 36px;
    background-image: url('/assets/logo-sber-circle.png');
  }

  .logo-cross {
    width: 18px;
    height: 1.5px;
    background: #fefcf8;
    transform: rotate(-45deg);
    position: relative;
    opacity: 0.9;
  }

  .logo-cross::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 1.5px;
    background: #fefcf8;
    transform: rotate(90deg);
    inset: 0;
  }

  .logo-arch {
    width: 36px;
    height: 36px;
    background-image: url('/assets/logo-arch.png');
  }

  .icon {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.18);
    border: 1px solid rgba(255, 252, 248, 0.36);
    color: #fefcf8;
    display: flex;
    align-items: center;
      padding: 0;
    justify-content: center;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(12px);
  }

  .quote {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 4px 16px 4px 4px;
      z-index: 5;
      border-radius: 1000px;
      background: rgba(178, 152, 126, 0.82);
      color: #fefcf8;

  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 999px;
    object-fit: cover;
    border: 1px solid rgba(254, 254, 252, 1);
    flex: 0 0 auto;
  }

  .bubble {
    flex: 1;
  }

  .bubbleText {
    font-size: 14px;
    line-height: 1.3;
    color: #fefcf8;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
  }

  .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
  }

  .paintingCard {
    padding: 0;
      height: 220px;
    overflow: hidden;
  }

  .paintingCard.card {
  }

  .painting {
    overflow: hidden;
    aspect-ratio: 16 / 10;
  }

  .gesture {
    display: grid;
    place-items: center;
    margin-top: -4px;
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

  :global(.my-custom-slider.slider-container) {
    width: 100%;
  }

  :global(.my-custom-slider .slider-track) {
    height: 9px;
    background: rgba(255, 252, 248, 0.25);
    border: 1px solid rgba(255, 252, 248, 0.32);
    border-radius: 999px;
  }

  :global(.my-custom-slider .slider-progress) {
    background: linear-gradient(90deg, rgba(178, 152, 126, 0.8), rgba(178, 152, 126, 1));
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
  }

  .finish {
    margin-top: auto;
    width: 100%;
    border-radius: 26px;
    padding: 16px 14px;
    font-size: 16px;
      z-index: 5;
    font-weight: 400;
    background: rgba(254, 252, 248, 0.92);
    color: #1e1b16;
    border: 1px solid rgba(255, 252, 248, 0.55);
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
  }

  .bottom-gradient {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 1;
      pointer-events: none;
      bottom: 0;
      height: 340px;
      background: linear-gradient(
              180deg,
              rgba(16, 13, 10, 0) 0%,
              rgba(16, 13, 10, 0.8) 100%
      );
  }

  .finish:active {
    transform: translateY(1px) scale(0.99);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  }
</style>
