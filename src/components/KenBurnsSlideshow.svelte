<script>
  import { onMount, onDestroy } from 'svelte';

  export let images = [];
  export let intervalMs = 4500;

  let i = 0;
  let timer;

  $: a = images[i % Math.max(images.length, 1)];
  $: b = images[(i + 1) % Math.max(images.length, 1)];

  function next() {
    if (images.length <= 1) return;
    i = (i + 1) % images.length;
  }

  onMount(() => {
    timer = setInterval(next, intervalMs);
  });

  onDestroy(() => clearInterval(timer));
</script>

<div class="frame">
  {#if images.length === 0}
    <div class="empty"></div>
  {:else if images.length === 1}
    <div class="layer single" style="background-image:url('{images[0]}')"></div>
  {:else}
    <div class="layer layerA" style="background-image:url('{a}')"></div>
    <div class="layer layerB" style="background-image:url('{b}')"></div>
  {/if}

  <div class="play" aria-hidden="true"></div>
</div>

<style>
  .frame{
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(0,0,0,0.05);
  }

  .empty{
    width: 100%;
    height: 100%;
    background: rgba(59,130,246,0.08);
  }

  .layer{
    position:absolute; inset:0;
    background-size: cover;
    background-position: center;
    transform: scale(1.08);
    animation: kb 6s ease-in-out infinite;
    filter: contrast(1.02) saturate(1.02);
  }

  /* B слой поверх, плавно проявляется */
  .layerB{
    opacity: 0;
    animation:
      kb 6s ease-in-out infinite,
      fade 6s ease-in-out infinite;
  }

  @keyframes kb{
    0%   { transform: scale(1.06) translate3d(-1%, -1%, 0); }
    50%  { transform: scale(1.10) translate3d( 1%,  0%, 0); }
    100% { transform: scale(1.06) translate3d(-1%,  1%, 0); }
  }

  @keyframes fade{
    0%, 35% { opacity: 0; }
    55%, 100% { opacity: 1; }
  }

  .play{
    position:absolute;
    left:50%; top:50%;
    transform: translate(-50%, -50%);
    width: 62px; height: 62px;
    border-radius: 18px;
    background: rgba(59,130,246,0.10);
    border: 1px solid rgba(59,130,246,0.20);
    backdrop-filter: blur(6px);
  }
  .play::after{
    content:'';
    position:absolute;
    left: 26px; top: 20px;
    width: 0; height: 0;
    border-left: 16px solid rgba(59,130,246,0.28);
    border-top: 11px solid transparent;
    border-bottom: 11px solid transparent;
  }
</style>