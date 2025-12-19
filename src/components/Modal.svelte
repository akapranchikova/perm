<script>
  export let open = false;
  export let title = '';
  export let onClose = () => {};

  function onKey(e) {
    if (!open) return;
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window on:keydown={onKey} />

{#if open}
  <div class="backdrop" on:click={onClose} aria-hidden="true"></div>

  <div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
    <div class="handle" aria-hidden="true"></div>
    <div class="head">
      <div class="title">{title}</div>
    </div>
    <div class="body">
      <slot />
    </div>
    <button class="btn" type="button" on:click={onClose}>Свернуть</button>
  </div>
{/if}

<style>
  .backdrop{
    position: fixed; inset:0;
    background: rgba(0,0,0,0.35);
    z-index: 50;
  }
  .sheet{
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 16px;

    width: min(420px, calc(100vw - 24px));
    max-height: min(78vh, 680px);
    background: rgba(255,255,255,0.92);
    border-radius: 22px;
    border: 1px solid rgba(17,24,39,0.08);
    backdrop-filter: blur(10px);

    z-index: 60;
    padding: 10px 14px 14px;
    display:flex;
    flex-direction:column;
    gap: 10px;
  }
  .handle{
    width: 72px;
    height: 5px;
    border-radius: 999px;
    background: rgba(17,24,39,0.18);
    margin: 4px auto 2px;
  }
  .head{ padding: 2px 4px; }
  .title{ font-weight: 700; color: rgba(17,24,39,0.85); }
  .body{
    overflow:auto;
    padding: 8px 6px;
    color: rgba(17,24,39,0.78);
    font-size: 13.5px;
    line-height: 1.4;
    flex: 1;
  }
  .btn{
    border: 1px solid rgba(59,130,246,0.35);
    background: rgba(59,130,246,0.12);
    color: rgba(30,64,175,0.95);
    border-radius: 16px;
    padding: 14px 14px;
    font-weight: 700;
  }
</style>