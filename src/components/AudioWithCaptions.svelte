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
    bottom: 90px;
    padding: 10px 12px;
    border-radius: 14px;
      color: rgba(254, 254, 252, 0.96);
      text-align: center;
      line-height: 1.24;
      font-size: 18px;
      font-family: "Inter", sans-serif;
      backdrop-filter: none;
  }
</style>
