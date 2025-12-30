<script>
  import "../styles/fonts.css";
  import "../styles/constants.css";
  import "../styles/interactive-elements.css";
  import { onMount, onDestroy } from "svelte";

  import { assetsStore } from '../stores/assets';
  $: getSrc = (src) => $assetsStore.get(src) || src;

  const defaultMapSvg = "/images/default_map.svg";

  export let title = "Экспонат";
  export let subtitle = "";
  export let description = "";
  export let imageUrl = "";
  export let imageAlt = "";
  export let floorLabel = "";
  export let mapSvg = defaultMapSvg;
  export let footerText = "Подойдите к экспонату и нажмите кнопку";
  export let buttonText = "Начать";
  export let onNext = () => {};
  export let onBack = () => {};

  $: computedMap = mapSvg || defaultMapSvg;

  let bodyElement = null;

  function resetBodyScrolledMask() {
    if (!bodyElement) {
      return;
    }
    
    const isScrolled = bodyElement.scrollTop > 0;
    bodyElement.classList.toggle('scrolled', isScrolled);
  }

  function removeEventListeners() {
    if (bodyElement) {
      bodyElement.removeEventListener('scroll', resetBodyScrolledMask);
    }
  }

  onMount(() => {
    bodyElement = document.querySelector('.intro-screen .body');
    if (bodyElement) {
      bodyElement.addEventListener('scroll', resetBodyScrolledMask);
    } 

    return removeEventListeners;
  });

  onDestroy(removeEventListeners);
</script>

<div class="intro-screen">
  <header class="topbar">
    <button class="back-btn" type="button" aria-label="Назад" on:click={onBack}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M21 12H3.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M10 19L3 12L10 5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </header>

  <div class="body">
    <div class="titles">
      <h1>{@html title}</h1>
      {#if subtitle}
        <p class="subtitle">{subtitle}</p>
      {/if}
    </div>

    {#if imageUrl}
      <div class="hero">
        <img src={getSrc(imageUrl)} alt={imageAlt || title} />
      </div>
    {/if}

    {#if description}
      <p class="description">{description}</p>
    {/if}

    <div class="map-block">
      {#if floorLabel}
        <div class="floor-label">{floorLabel}</div>
      {/if}
      <div class="map" aria-hidden="true">
        <img class="map-img" src="{getSrc(computedMap)}" alt="Карта"/>
      </div>
    </div>
  </div>

  <footer class="footer">
    <p class="footer-text">{footerText}</p>
    <button class="cta-button" type="button" on:click={onNext}>{buttonText}</button>
  </footer>
</div>

<style>
  :global(body) {
    background: #fefcf8;
  }

  .intro-screen {
    overscroll-behavior: none;
    height: 100svh;
    background: #fefcf8;
    color: rgba(24, 22, 15, 1);
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 18px 18px 0;
  }

  .topbar {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-height: 42px;
  }

  .back-btn {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    border: 1px solid rgba(95, 93, 90, 0.6);
    background: transparent;
    font-size: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: rgba(95, 93, 90);
  }
  .back-btn svg {
      width: 24px;
      height: 24px;
      min-width: 24px;
      min-height: 24px;
      flex-shrink: 0;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    padding: 0 6px;
    flex: 1;
    overflow-y: auto;
  }

  :global(.intro-screen .body.scrolled) {
    mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 15px,
      black 100%
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 15px,
      black 100%
    );
  }

  .titles {
    text-align: center;
  }

  .titles h1 {
    margin: 0;
    font-family: "Prata", "Times New Roman", serif;
    font-size: 32px;
    line-height: 1.2;
    color: rgba(24, 22, 15, 1);
  }

  .subtitle {
    margin: 6px 0 0;
    font-family: "Inter", sans-serif;
    font-size: 16px;
    line-height: 1.2;
    color: rgba(24, 22, 15, 0.8);
  }

  .hero {
    display: table;
    width: 100%;
    min-height: 150px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(178, 152, 126, 0.7);
    background: #fff;
  }

  .hero img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
  }

  .description {
    margin: 0;
    text-align: center;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 1.2;
    letter-spacing: 0;
    color: rgba(24, 22, 15, 0.82);
  }

  .map-block {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .floor-label {
    font-family: "Prata", "Times New Roman", serif;
    font-size: 18px;
    color: var(--accent, #b2987e);
  }

  .map {
    width: 100%;
    max-width: 340px;
    display: flex;
  }

  .map-img {
    margin-left: auto;
    margin-right: auto;
  }

  .map :global(svg) {
    width: 100%;
    height: auto;
    display: block;
  }

  .footer {
    margin: auto -20px 0;
    background: rgba(255, 252, 248, 0.96);
    padding: 16px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    border-top: 1px solid rgba(178, 152, 126, 0.6);
    border-left: 1px solid rgba(178, 152, 126, 0.45);
    border-right: 1px solid rgba(178, 152, 126, 0.45);
  }

  .footer-text {
    margin: 0;
    text-align: center;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 1.2;
    color: rgba(24, 22, 15, 0.88);
  }
</style>
