<script>
  import { router, routes } from '../router';
  import ActivityShell from '../components/ActivityShell.svelte';
  import FramesHolder from '../components/FramesHolder.svelte';
  import Slider from '../components/Slider.svelte';
  import { getArtifactForActivity } from '../data/artifacts';

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
</script>

<ActivityShell {intro}>
<div class="safe activity">
  <div class="topbar">
    <div class="spacer"></div>
    <button class="icon" type="button" aria-label="Звук">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M11 5L6.5 9H3v6h3.5L11 19V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 9c1.5 1.5 1.5 4.5 0 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M18.5 6.5c3 3 3 8 0 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <div class="quote card">
    <img class="avatar" src="/avatar.png" alt="" />
    <div class="bubble">
      <div class="bubbleText">
        которые когда-то закладывал Василий Дмитриевич Поленов
      </div>
    </div>
  </div>

  <div class="paintingCard card">
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

  <div class="sliderBlock">
    <div class="label">Количество дней под солнцем</div>

    <!--div class="sliderRow">
      <input
        class="range"
        type="range"
        min={MIN_VALUE}
        max={MAX_VALUE}
        step="1"
        bind:value
        aria-label="Количество дней под солнцем"
      />
      <div class="pill" aria-label="Значение">{value}</div>
    </div-->

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

  <button class="btn-primary finish" type="button" onclick={finish}>
    Завершить
  </button>
</div>

<style>
  .activity{
    gap: 14px;
    display:flex;
    flex-direction:column;
    height: 100%;
  }

  .topbar{
    display:flex;
    justify-content:flex-end;
    align-items:center;
    height: 28px;
  }
  .icon{
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: rgba(255,255,255,0.55);
    border: 1px solid rgba(17,24,39,0.08);
    color: rgba(17,24,39,0.65);
    display:flex;
    align-items:center;
    justify-content:center;
  }

  .card{
    background: rgba(255,255,255,0.75);
    border-radius: 18px;
    padding: 12px;
    border: 1px solid rgba(17,24,39,0.06);
    backdrop-filter: blur(8px);
  }

  .quote{
    display:flex;
    gap: 10px;
    align-items:center;
    padding: 10px 12px;
  }
  .avatar{
    width: 44px;
    height: 44px;
    border-radius: 999px;
    object-fit: cover;
    background: rgba(0,0,0,0.06);
    flex: 0 0 auto;
  }
  .bubble{
    flex: 1;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(226, 232, 240, 0.65);
  }
  .bubbleText{
    font-size: 13px;
    line-height: 1.25;
    color: rgba(17,24,39,0.75);
  }

  .paintingCard{
    height: 220px;
  }

  .painting {
    /*border-radius: 16px;*/
    overflow: hidden;
    aspect-ratio: 4 / 3;
    background: rgba(0,0,0,0.04);
  }

  .my-custom-slider {
  }

  .sliderBlock{
    margin-top: 2px;
    text-align:center;
    background-color: #00000033;
  }
  .label{
    font-size: 13px;
    color: rgba(17,24,39,0.75);
    margin-bottom: 10px;
  }
  .sliderRow{
    display:flex;
    align-items:center;
    gap: 12px;
    justify-content:center;
  }
  .range{
    width: min(320px, 78vw);
    accent-color: #3b82f6;
  }

  .pill{
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: rgba(59,130,246,0.95);
    color: white;
    font-weight: 700;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size: 12px;
    box-shadow: 0 6px 18px rgba(59,130,246,0.25);
    user-select:none;
  }

  .small{
    margin-top: 8px;
    font-size: 11px;
    color: rgba(17,24,39,0.45);
    font-weight: 700;
  }

  .finish{
    margin-top:auto;
    width: 100%;
    border-radius: 16px;
    padding: 16px 14px;
    font-size: 15px;
  }
</style>
</ActivityShell>
