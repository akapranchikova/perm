<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let src;
  export let alt = '';

  // min/max zoom
  export let minScale = 1;
  export let maxScale = 3.5;

  // наружу: клики в координатах 0..1 относительно видимой области
  const dispatch = createEventDispatcher();

  let container;

  // transform state
  let scale = 1;
  let tx = 0; // px
  let ty = 0; // px

  // gesture state
  let pointers = new Map(); // pointerId -> {x,y}
  let isPanning = false;
  let panStart = { x: 0, y: 0, tx: 0, ty: 0 };

  let pinchStart = null; // {dist, scale, centerX, centerY}

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function containerRect() {
    return container.getBoundingClientRect();
  }

  function setTransform(next) {
    if (next.scale != null) scale = clamp(next.scale, minScale, maxScale);
    if (next.tx != null) tx = next.tx;
    if (next.ty != null) ty = next.ty;
    // ограничение панорамирования: держим изображение в пределах контейнера (грубо)
    // так как img cover/contain может отличаться, делаем мягкий clamp по максимуму смещения
    const r = containerRect();
    const maxX = (r.width * (scale - 1)) / 2;
    const maxY = (r.height * (scale - 1)) / 2;
    tx = clamp(tx, -maxX, maxX);
    ty = clamp(ty, -maxY, maxY);
  }

  // зум к точке в контейнере (cx,cy px)
  function zoomTo(scaleTo, cx, cy) {
    const r = containerRect();
    const x = cx - r.width / 2;
    const y = cy - r.height / 2;

    const prev = scale;
    const nextScale = clamp(scaleTo, minScale, maxScale);
    const k = nextScale / prev;

    // сохраняем “фокус” под пальцами
    const nextTx = tx - x * (k - 1);
    const nextTy = ty - y * (k - 1);

    setTransform({ scale: nextScale, tx: nextTx, ty: nextTy });
  }

  // публичный метод: “автозум” к левому нижнему углу
  export function zoomToLeftBottom() {
    const r = containerRect();
    // целимся чуть внутрь угла, чтобы угол попал в кадр
    const targetPoint = { x: r.width * 0.20, y: r.height * 0.80 };
    // увеличиваем и сдвигаем так, чтобы левый-нижний оказался ближе
    zoomTo(2.6, targetPoint.x, targetPoint.y);

    // дополнительный пан влево/вниз (так как у тебя подсказка про левый нижний)
    setTransform({ tx: tx + r.width * 0.10, ty: ty - r.height * 0.10 });
  }

  function onPointerDown(e) {
    container.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY, tx, ty };
    } else if (pointers.size === 2) {
      isPanning = false;
      const pts = [...pointers.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      // центр pinch
      const centerX = (pts[0].x + pts[1].x) / 2;
      const centerY = (pts[0].y + pts[1].y) / 2;
      pinchStart = { dist, scale, centerX, centerY };
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1 && isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setTransform({ tx: panStart.tx + dx, ty: panStart.ty + dy });
    }

    if (pointers.size === 2 && pinchStart) {
      const pts = [...pointers.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);

      const ratio = dist / pinchStart.dist;
      const nextScale = pinchStart.scale * ratio;

      // центр pinch в координатах контейнера
      const r = containerRect();
      const cx = pinchStart.centerX - r.left;
      const cy = pinchStart.centerY - r.top;

      zoomTo(nextScale, cx, cy);
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) isPanning = false;
  }

  function onClick(e) {
    // координаты клика в 0..1 относительно контейнера
    const r = containerRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    dispatch('tap', { x, y });
  }

  // wheel zoom (десктоп)
  function onWheel(e) {
    e.preventDefault();
    const r = containerRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.08 : 0.92;
    zoomTo(scale * factor, cx, cy);
  }

  onMount(() => {
    // reset
    setTransform({ scale: 1, tx: 0, ty: 0 });
  });

  onDestroy(() => {
    pointers.clear();
  });
</script>

<div
  class="wrap"
  bind:this={container}
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:pointercancel={onPointerUp}
  on:click={onClick}
  on:wheel|nonpassive={onWheel}
>
  <img
    class="img"
    src={src}
    alt={alt}
    draggable="false"
    style="transform: translate3d({tx}px, {ty}px, 0) scale({scale});"
  />
</div>

<style>
  .wrap{
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 16px;
    background: rgba(0,0,0,0.06);
    touch-action: none; /* важно: иначе мобила будет скроллить/зумить страницу */
    user-select:none;
  }
  .img{
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform-origin: center center;
    will-change: transform;
    pointer-events: none; /* клики ловим контейнером */
  }
</style>