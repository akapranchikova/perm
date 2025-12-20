<script>
  import { onDestroy } from 'svelte';

  export let src;
  export let captions = []; // [{t, text}]
  export let autoplay = true;
  export let muted = false;

  let audio;
  let current = '';

  let raf;
  function tick() {
    if (!audio) return;
    const t = audio.currentTime || 0;

    // находим последнюю caption где caption.t <= t
    let text = '';
    for (let i = 0; i < captions.length; i++) {
      if (captions[i].t <= t) text = captions[i].text;
      else break;
    }
    current = text;
    raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    cancelAnimationFrame(raf);
  }

  $: if (audio && src) {
    // при смене трека
    audio.pause();
    audio.currentTime = 0;
    audio.src = src;
    audio.muted = muted;

    if (autoplay) {
      audio.play().catch(() => {
        // на мобиле автоплей может быть запрещён — оставим как есть
      });
    }
    startLoop();
  }

  onDestroy(() => stopLoop());
</script>

<audio bind:this={audio} playsinline></audio>

{#if current}
  <div class="captions" aria-live="polite">{current}</div>
{/if}

<style>
  .captions{
    position: absolute;
    left: 16px; right: 16px;
    bottom: 110px;
    background: rgba(17,24,39,0.55);
    color: rgba(255,255,255,0.95);
    padding: 10px 12px;
    border-radius: 14px;
    font-size: 13px;
    line-height: 1.25;
    backdrop-filter: blur(8px);
    text-align: center;
  }
</style>
