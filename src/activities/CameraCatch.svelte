<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { settings } from "../stores/settings"; 

  export let running = false;
  // Этот параметр скрывает слоты и надписи, когда мы переходим к просмотру видео
  export let showUI = true; 
  export let memories = [];
  export let overlaySrc = "/activityB/overlay.mp4";
  export let maxSlots = 3;
  export let stopTimings = [];

  const dispatch = createEventDispatcher();

  let cameraEl;
  let overlayVideoEl;
  let stream;
  let collected = [];
  let shouldShowCollected = [];
  let catchAudio;
  let errorMsg = "";

  async function startStream() {
    if (stream || !running) return;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (cameraEl) {
        cameraEl.srcObject = stream;
        await cameraEl.play();
      }
      // Запускаем видео оверлея только если нужен UI
      if (overlayVideoEl && showUI) {
        overlayVideoEl.currentTime = 0;
        overlayVideoEl.play().catch(() => {});
      }
    } catch (err) {
      errorMsg = "Не удалось получить доступ к камере";
      dispatch("error", err);
    }
  }

  function stopStream() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (cameraEl) cameraEl.srcObject = null;
    if (overlayVideoEl) overlayVideoEl.pause();
  }

  function resetState() {
    collected = [];
    shouldShowCollected = [];
    errorMsg = "";
    if (overlayVideoEl) overlayVideoEl.currentTime = 0;
  }

  function playCatchSfx() {
    if (!$settings.audioEnabled) {
      return;
    }

    if (!catchAudio) {
      catchAudio = new Audio("/activityB/paper-catch.mp3");
    }
    catchAudio.currentTime = 0;
    catchAudio.play?.().catch(() => {});
  }

  function handleVideoTimeUpdate() {
    if (!overlayVideoEl || !stopTimings.length) return;
    const targetTime = stopTimings[collected.length];
    if (collected.length >= maxSlots) return;

    if (targetTime && overlayVideoEl.currentTime >= targetTime) {
      overlayVideoEl.pause();
      overlayVideoEl.currentTime = targetTime;
    }
  }

  function handleTap() {
    // Не реагируем на клики, если UI скрыт (режим просмотра)
    if (!running || errorMsg || !showUI) return;
    if (collected.length >= maxSlots) return;

    if (overlayVideoEl && !overlayVideoEl.paused) {
      return;
    }

    const fallback = {
      name: `Воспоминание ${collected.length + 1}`,
      role: "Ученик",
      excerpt: "...",
    };

    const memory =
      memories[collected.length] ??
      memories[collected.length % memories.length] ??
      fallback;

    collected = [...collected, memory];
    setTimeout(() => {
      shouldShowCollected = [...shouldShowCollected, true];
    }, 1500);
    playCatchSfx();
    dispatch("catch", { memory, count: collected.length });

    if (overlayVideoEl) {
      overlayVideoEl.play().catch(() => {});
    }

    if (collected.length === maxSlots) {
      setTimeout(() => dispatch("complete"), 4500);
    }
  }

  $: if (running) {
    if (!stream) {
        resetState();
        startStream();
    }
  } else {
    stopStream();
  }

  // Если UI выключили (перешли к просмотру), ставим оверлей на паузу
  $: if (!showUI && overlayVideoEl) {
      overlayVideoEl.pause();
  }

  onMount(() => {
    if (running) startStream();
  });

  onDestroy(stopStream);
</script>

{#if running}
  <div
    class="cameraCatch"
    on:click={handleTap}
    role="button"
    aria-label="Поймать воспоминание"
  >
    <video class="cameraFeed" bind:this={cameraEl} autoplay playsinline muted
    ></video>
    
    <!-- Затемнение фона: светлее при просмотре видео (0.4), темнее при ловле (0.55) -->
    <div class="dim" style="background: rgba(0, 0, 0, {showUI ? 0.55 : 0.4});"></div>

    {#if showUI}
        {#if overlaySrc}
        {#key overlaySrc}
            <video
            class="overlayVideo"
            bind:this={overlayVideoEl}
            src={overlaySrc}
            muted
            playsinline
            on:timeupdate={handleVideoTimeUpdate}
            ></video>
        {/key}
        {/if}

        <div class="content">
            <div class="slots">
                {#each Array(maxSlots) as _, i}
                <div class="slot" class:filled={!!collected[i]}>
                    {#if collected[i] && shouldShowCollected[i]}
                    <img src={collected[i].portraitUrl} alt={collected[i].name}/>
                    {:else}
                    <div class="slotPlaceholder"></div>
                    {/if}
                </div>
                {/each}
            </div>

            <div class="hint">
                {#if errorMsg}
                {errorMsg}
                {:else}
                Поймайте несколько воспоминаний учеников Поленова
                {/if}
            </div>
        </div>
    {/if}
  </div>
{/if}

<style>
  .cameraCatch {
    position: fixed;
    inset: 0;
    z-index: 60;
    overflow: hidden;
    font-family: "Inter", sans-serif;
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
    backdrop-filter: blur(2px);
    transition: background 0.5s ease;
  }

  .overlayVideo {
    position: absolute;
    top: 10vh;
    left: 50%;
    transform: translateX(-50%);
    width: max(90vw, 500px);
    object-fit: cover;
    height: 90vh;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    opacity: 1;
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

  .hint {
    text-align: center;
    min-height: 20px;
    font-family: Inter;
    font-weight: 500;
    font-size: 18px;
    line-height: 124%;
    color: var(--txt-white);
  }

  .slots {
    display: flex;
    gap: 12px;
    max-width: 500px; 
    margin: 0 auto;
  }

  .slot {
    flex: 1;
    aspect-ratio: 1 / 1;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    overflow: hidden;
    position: relative;
    transition: 0.3s;
    width: 80px;
    height: 80px;
    border-radius: 18px;
    padding: 3px;
    border: 1px solid #FFFCF8;
  }

  .slot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .slotPlaceholder {
    font-size: 12px;
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
</style>
