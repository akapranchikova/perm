<script>
  import { onMount } from 'svelte';
  import { router, routes } from '../router';
  import ActivityShell from '../components/ActivityShell.svelte';

  const MIN_DAYS = 0;
  const MAX_DAYS = 365;

  const FRAMES = 9;                 // у тебя 10 картинок
  const FRAME_PAD = 4;               // frame_0001
  const FRAME_BASE = '/activityA/';  // public/activityA

  let days = 135;

  // 0..1
  $: t = (days - MIN_DAYS) / (MAX_DAYS - MIN_DAYS);

  // 0..FRAMES-1 (вещественное)
  $: f = t * (FRAMES - 1);

  // индекс кадра (0..FRAMES-1)
  $: idx = Math.floor(f);

  // прогресс внутри интервала (0..1)
  $: mix = f - idx;

  function frameName(i0based) {
    const n = String(i0based + 1).padStart(FRAME_PAD, '0');
    return `${FRAME_BASE}frame_${n}.png`;
  }

  // два кадра для кроссфейда
  $: srcA = frameName(clamp(idx, 0, FRAMES - 1));
  $: srcB = frameName(clamp(idx + 1, 0, FRAMES - 1));

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // лёгкая easing-кривая для визуально приятного перехода
  function easeInOut(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }
  $: alphaB = easeInOut(mix);

  // preload (чтобы не мигало при первом скраббинге)
  let preloaded = false;
  onMount(() => {
    if (preloaded) return;
    preloaded = true;

    for (let i = 0; i < FRAMES; i++) {
      const img = new Image();
      img.src = frameName(i);
    }
  });

  function finish() {
    router.go(routes.PLAYTESTS);
  }

  const intro = {
    title: 'Подводка от учеников',
    imageUrl: 'guides.png',
    textLines: [
      'которые когда-то закладывал',
      'Василий Дмитриевич Поленов.',
      'Мы изучаем его наследие и'
    ],
    buttonText: 'Далее'
  };

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
    <div class="painting" aria-label="Картина (покадрово)">
      <!-- базовый кадр -->
      <img class="frame a" src={srcA} alt="Картина" />

      <!-- следующий кадр поверх с альфой -->
      <img
        class="frame b"
        src={srcB}
        alt=""
        style="opacity: {alphaB};"
        aria-hidden="true"
      />
    </div>
  </div>

  <div class="sliderBlock">
    <div class="label">Количество дней под солнцем</div>

    <div class="sliderRow">
      <input
        class="range"
        type="range"
        min={MIN_DAYS}
        max={MAX_DAYS}
        step="1"
        bind:value={days}
        aria-label="Количество дней под солнцем"
      />
      <div class="pill" aria-label="Значение">{days}</div>
    </div>

    <div class="small">
      Кадр: {idx + 1}{#if idx < FRAMES - 1} → {idx + 2}{/if}
    </div>
  </div>

  <button class="btn-primary finish" type="button" on:click={finish}>
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
    padding: 10px;
  }
  .painting{
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    background: rgba(0,0,0,0.04);
  }

  .frame{
    position:absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display:block;
  }
  .a{ opacity: 1; }
  .b{
    /* opacity управляется inline */
    will-change: opacity;
  }

  .sliderBlock{
    margin-top: 2px;
    text-align:center;
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
