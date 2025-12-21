<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  export let running = false;
  export let memories = [];
  export let overlaySrc = '/activityB/overlay.mp4'; // замените на ваш ролик
  export let maxSlots = 3;

  const dispatch = createEventDispatcher();

  let cameraEl;
  let stream;
  let collected = [];
  let catchAudio;
  let errorMsg = '';

  async function startStream() {
    if (stream || !running) return;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      if (cameraEl) {
        cameraEl.srcObject = stream;
        await cameraEl.play();
      }
    } catch (err) {
      errorMsg = 'Не удалось получить доступ к камере';
      dispatch('error', err);
    }
  }

  function stopStream() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (cameraEl) cameraEl.srcObject = null;
  }

  function resetState() {
    collected = [];
    errorMsg = '';
  }

  function playCatchSfx() {
    if (!catchAudio) {
      catchAudio = new Audio('/activityB/paper-catch.mp3'); // положите сюда звук шуршания
    }
    catchAudio.currentTime = 0;
    catchAudio.play?.().catch(() => {});
  }

  function handleTap() {
    if (!running || errorMsg) return;
    if (collected.length >= maxSlots) return;

    const fallback = {
      name: `Воспоминание ${collected.length + 1}`,
      role: 'Ученик',
      excerpt: '...',
    };

    const memory =
      memories[collected.length] ??
      memories[collected.length % memories.length] ??
      fallback;

    collected = [...collected, memory];
    playCatchSfx();
    dispatch('catch', { memory, count: collected.length });

    if (collected.length === maxSlots) {
      setTimeout(() => dispatch('complete'), 600);
    }
  }

  $: if (running) {
    resetState();
    startStream();
  } else {
    stopStream();
  }

  onMount(() => {
    if (running) startStream();
  });

  onDestroy(stopStream);
</script>

{#if running}
  <div class="cameraCatch" on:click={handleTap} role="button" aria-label="Поймать воспоминание">
    <video class="cameraFeed" bind:this={cameraEl} autoplay playsinline muted></video>
    <div class="dim"></div>

    {#if overlaySrc}
      <video
        class="overlayVideo"
        src={overlaySrc}
        autoplay
        loop
        muted
        playsinline
      ></video>
    {/if}

    <div class="content">
      <div class="topInfo">
        <div class="title">Поймайте воспоминание</div>
        <div class="counter">{collected.length}/{maxSlots}</div>
      </div>

      <div class="hint">
        {#if collected.length < maxSlots}
          Тапните в любом месте экрана
        {:else}
          Все воспоминания собраны
        {/if}
      </div>

      <div class="slots">
        {#each Array(maxSlots) as _, i}
          <div class="slot" class:filled={!!collected[i]}>
            {#if collected[i]}
              <div class="slotName">{collected[i].name}</div>
              <div class="slotRole">{collected[i].role}</div>
            {:else}
              <div class="slotPlaceholder">Пусто</div>
            {/if}
          </div>
        {/each}
      </div>

      {#if errorMsg}
        <div class="error">{errorMsg}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .cameraCatch {
    position: fixed;
    inset: 0;
    z-index: 60;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
    color: #fff;
  }

  .cameraFeed {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dim {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
  }

  .overlayVideo {
    position: absolute;
    top: 10vh;
    left: 50%;
    transform: translateX(-50%);
    width: min(90vw, 500px);
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    opacity: 0.9;
    mix-blend-mode: screen;
  }

  .content {
    position: absolute;
    inset: 0;
    padding: 24px 18px 30px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 20px;
  }

  .topInfo {
    position: absolute;
    top: 30px;
    left: 0;
    width: 100%;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .counter {
    font-size: 14px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .hint {
    text-align: center;
    font-size: 15px;
    opacity: 0.9;
  }

  .slots {
    display: flex;
    gap: 12px;
  }

  .slot {
    flex: 1;
    aspect-ratio: 1 / 1;
    border-radius: 18px;
    border: 1px dashed rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 10px;
    transition: 0.3s;
  }

  .slot.filled {
    border-style: solid;
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  }

  .slotName {
    font-weight: 700;
    font-size: 13px;
    line-height: 1.2;
  }

  .slotRole {
    margin-top: 4px;
    font-size: 11px;
    opacity: 0.8;
  }

  .slotPlaceholder {
    font-size: 12px;
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .error {
    text-align: center;
    font-size: 14px;
    color: #ffb4b4;
  }
</style>