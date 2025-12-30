<script>
  import "../styles/fonts.css";
  import { onMount, onDestroy } from "svelte";

   let {
    src,
    captions = [], // [{t, text}]
    autoplay = true,
    muted = false,
  } = $props();

  let audio = $state(null);
  let current = $state("");

  function updateCaptions() {
    if (!audio) return;
    
    const t = audio.currentTime || 0;
    
    let text = "";
    for (let i = 0; i < captions.length; i++) {
      if (captions[i].t <= t) text = captions[i].text;
      else break;
    }
    
    current = text;
  }

  function removeEventListeners() {
    audio.removeEventListener('timeupdate', updateCaptions);
    audio.removeEventListener('seeked', updateCaptions);
    audio.removeEventListener('playing', updateCaptions);
    audio.removeEventListener('loadedmetadata', updateCaptions);
    audio.removeEventListener('loadeddata', updateCaptions);
    audio.removeEventListener('play', updateCaptions);
    audio.removeEventListener('volumechange', updateCaptions);
  }

  onMount(() => {
    if (!audio) {
      return;
    }
    
    audio.addEventListener('timeupdate', updateCaptions);
    audio.addEventListener('seeked', updateCaptions);
    audio.addEventListener('playing', updateCaptions);
    audio.addEventListener('loadedmetadata', updateCaptions);
    audio.addEventListener('loadeddata', updateCaptions);
    audio.addEventListener('play', updateCaptions);
    audio.addEventListener('volumechange', updateCaptions);
    
    return removeEventListeners;
  });

  $effect(() => {
    if (audio) {
      audio.muted = muted;
      updateCaptions();
    }
  });

  $effect(() => {
    if (audio && src) {
      const wasPlaying = !audio.paused;
      
      audio.pause();
      audio.src = src;
      audio.currentTime = 0;

      if (autoplay || wasPlaying) {
        queueMicrotask(() => {
          audio.play().catch((err) => {
            console.log("Audio play failed:", err.message);
          });
        });
      }
      
      updateCaptions();
    }
  });

  $effect(() => {
    if (audio) {
      updateCaptions();
    } else {
      current = "";
    }
  });

  onDestroy(() => {
    if (audio) {
      audio.pause();
    }
    removeEventListeners();
  });
</script>

<audio bind:this={audio} playsinline></audio>

{#if current}
  <div class="captions" aria-live="polite">{current}</div>
{/if}

<style>
  .captions {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 90px;
    padding: 10px 12px;
    border-radius: 14px;
    color: rgba(254, 254, 252, 0.96);
    text-align: center;
    line-height: 1.24;
    font-size: 18px;
    font-family: "Inter", sans-serif;
    backdrop-filter: none;
    pointer-events: none;
  }
</style>