<script>
  import { onMount, onDestroy } from 'svelte';

  export let open = false;
  export let title = '';
  export let onClose = () => {};
  export let fullscreen = false; // сразу на весь экран
  export let draggable = false;  // позволяет тянуть за "вставку"

  let sheetEl;
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let maxTranslate = 0;

  function onKey(e) {
    if (!open) return;
    if (e.key === 'Escape') onClose();
  }

  function handleStart(y) {
    if (!draggable) return;
    isDragging = true;
    startY = y;
    currentY = 0;
    sheetEl.style.transition = 'none';
  }

  function handleMove(y) {
    if (!isDragging) return;
    currentY = Math.max(0, y - startY);
    sheetEl.style.transform = `translate(-50%, calc(100% - ${maxTranslate}px + ${currentY}px))`;
  }

  function handleEnd() {
    if (!isDragging) return;
    isDragging = false;
    sheetEl.style.transition = '';
    const shouldClose = currentY > 120; // свайп вниз

    if (shouldClose) {
      onClose();
      return;
    }

    // Возвращаем в исходную позицию
    sheetEl.style.transform = fullscreen
      ? 'translate(-50%, calc(100% - 100%))'
      : `translate(-50%, calc(100% - ${maxTranslate}px))`;
  }

  function bindDragEvents(node) {
    function onTouchStart(e) {
      if (e.touches.length !== 1) return;
      handleStart(e.touches[0].clientY);
    }
    function onTouchMove(e) {
      if (e.touches.length !== 1) return;
      handleMove(e.touches[0].clientY);
    }
    function onTouchEnd() {
      handleEnd();
    }

    function onMouseDown(e) {
      handleStart(e.clientY);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp, { once: true });
    }
    function onMouseMove(e) {
      handleMove(e.clientY);
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      handleEnd();
    }

    node.addEventListener('touchstart', onTouchStart);
    node.addEventListener('touchmove', onTouchMove);
    node.addEventListener('touchend', onTouchEnd);
    node.addEventListener('mousedown', onMouseDown);

    return () => {
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }

  let cleanupDrag;
  onMount(() => {
    cleanupDrag = draggable ? bindDragEvents(sheetEl) : null;
  });

  onDestroy(() => {
    cleanupDrag?.();
  });

  $: maxTranslate = fullscreen ? window.innerHeight : Math.min(520, window.innerHeight * 0.78);

  $: if (sheetEl && open) {
    sheetEl.style.transform = fullscreen
      ? 'translate(-50%, calc(100% - 100%))'
      : `translate(-50%, calc(100% - ${maxTranslate}px))`;
  }
</script>

<svelte:window on:keydown={onKey} />

{#if open}
  <div class="backdrop" on:click={onClose} aria-hidden="true"></div>

  <div
    class="sheet"
    class:fullscreen
    bind:this={sheetEl}
    role="dialog"
    aria-modal="true"
    aria-label={title}
    style={`height: ${fullscreen ? '100dvh' : `${maxTranslate}px`}`}
  >
    <div class="handle" aria-hidden="true"></div>

    <div class="head">
      <div class="title">{title}</div>
      <button class="close" type="button" aria-label="Закрыть" on:click={onClose}>
        ✕
      </button>
    </div>

    <div class="body">
      <slot />
    </div>

    <button class="btn" type="button" on:click={onClose}>Свернуть</button>
  </div>
{/if}

<style>
  :global(body.modal-open) {
    overflow: hidden;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 1200;
  }

  .sheet {
    position: fixed;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 100%);
    width: min(480px, 100vw);
    max-width: 100vw;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 26px 26px 0 0;
    border: 1px solid rgba(17, 24, 39, 0.08);
    backdrop-filter: blur(10px);
    padding: 12px 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 1210;
    transition: transform 0.3s ease;
    touch-action: none;
  }

  .sheet.fullscreen {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    width: 100%;
  }

  .handle {
    width: 74px;
    height: 6px;
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.18);
    margin: 6px auto 10px;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
  }

  .title {
    font-size: 18px;
    font-weight: 700;
    color: rgba(17, 24, 39, 0.85);
  }

  .close {
    border: none;
    background: rgba(17, 24, 39, 0.05);
    border-radius: 12px;
    width: 32px;
    height: 32px;
    font-size: 16px;
    cursor: pointer;
  }

  .body {
    overflow: auto;
    padding: 6px 2px 2px;
    color: rgba(17, 24, 39, 0.78);
    font-size: 15px;
    line-height: 1.42;
    flex: 1;
  }

  .btn {
    border: 1px solid rgba(59, 130, 246, 0.35);
    background: rgba(59, 130, 246, 0.12);
    color: rgba(30, 64, 175, 0.95);
    border-radius: 16px;
    padding: 14px;
    font-weight: 700;
  }
</style>