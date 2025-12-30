<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";

  export let running = false;

  const dispatch = createEventDispatcher();

  let cameraEl;
  let stream;
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
    } catch (err) {
      errorMsg = "Не удалось получить доступ к камере";
      dispatch("error", err);
    }
  }

  function stopStream() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (cameraEl) cameraEl.srcObject = null;
  }

  function resetState() {
    errorMsg = "";
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
  <div
    class="cameraCatch"
    role="button"
    aria-label="Поймать воспоминание"
  >
    <video
      class="cameraFeed"
      bind:this={cameraEl}
      autoplay
      playsinline
      muted
    >
    </video>
    <div class="dim"></div>
  </div>
{/if}

<style>
  .cameraCatch {
    position: fixed;
    inset: 0;
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
    background: rgba(0, 0, 0, 0.23);
    backdrop-filter: blur(2px);
  }

  .error {
    text-align: center;
    font-size: 14px;
    color: #ffb4b4;
  }
</style>
