<script>
  import { onMount } from "svelte";
  import { router, routes } from "../router";

  import { assetsStore } from '../stores/assets';
  $: getSrc = (src) => $assetsStore.get(src) || src;

  import {
      artifactsCatalog,
      getArtifactById, getArtifactForActivity,
      rewardCopy,
  } from "../data/artifacts";
  import { artifactProgress } from "../stores/artifacts";

  const accent = "rgba(178, 152, 126, 1)";

  $: params = $router.params;
  $: artifactId = params?.artifactId;
  $: artifact = artifactId
    ? getArtifactById(artifactId)
    : artifactsCatalog[0];

  onMount(() => {
    if (artifact) {
      artifactProgress.collect(artifact.id);
    }
  });

  function goMenu() {
      router.go(routes.PLAYTESTS);
  }

  const openJournal = () => router.go(routes.ARTIFACT_JOURNAL);
</script>

<div class="reward-screen" style={`--accent:${accent};`}>
  <header class="top-container">
    <div class="logo-group">
      <span class="logo logo-brown" aria-hidden="true"></span>
    </div>

  </header>

  <main class="content">
    <div class="text-block">
      <h1>{rewardCopy.title}</h1>
      <p>{artifact?.description ?? rewardCopy.subtitleFallback}</p>
    </div>

    <div class="artifact-frame">
      <div class="arch {artifact?.id}">
        <img src={getSrc(artifact?.image)} alt={artifact?.name} />
      </div>
    </div>

    <div class="cta">
      <button class="cta-button" type="button" on:click={goMenu}>
        {rewardCopy.ctaLabel}
      </button>
    </div>
  </main>
</div>

<style>
  .reward-screen {
    position: relative;
    width: 100%;
    height: 100dvh;
    background: #fdfaf5;
    overscroll-behavior: none;
    color: rgba(24, 22, 15, 1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .top-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 0;
    color: #fff;
  }

  .logo-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo {
    display: inline-block;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
  }

  .journal-btn {
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
    border-radius: 999px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    backdrop-filter: blur(8px);
  }

  .content {
    padding: 14px 22px clamp(20px, 5vh, 32px) clamp(18px, 2vh, 26px);
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex: 1;
    min-height: 0;
  }

  .text-block {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 0;
    max-width: 480px;
    padding: 0;
  }

  h1 {
    margin: 0;
    font-family: "Prata", "Times New Roman", serif;
      font-weight: 400;
      font-size: 32px;
      line-height: 100%;
      text-align: center;
  }

  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.2;
    color: rgba(95, 93, 90, 1);
  }

  .artifact-frame {
    width: min(420px, 100%);
    flex: 1;
    min-height: 0;
    padding: clamp(12px, 3vh, 20px) 16px;
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 2vh, 16px);
      position: relative;

  }

  .arch {
    padding: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
      height: 100%;
    min-height: clamp(220px, 50vh, 360px);

  }
  .artifact-frame::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      border-radius: 999px 999px 0 0;
      border: 1.5px solid rgba(178, 152, 126, 0.5);
      mask-image: linear-gradient(
              to bottom,
              black 0%,
              black 50%,
              transparent 90%,
              transparent 100%
      );
  }
  .artifact-frame::after {
      content: "";
      position: absolute;
      top: 15px;
      left: 15px;
      bottom: 0;
      right: 15px;
      border-radius: 999px 999px 0 0;
      border: 1.5px solid rgba(178, 152, 126, 0.5);
      mask-image: linear-gradient(
              to bottom,
              black 0%,
              black 50%,
              transparent 90%,
              transparent 100%
      );
  }

  .arch img {
    width: 100%;
    height: 100%;
    max-height: 100%;
    display: block;
    object-fit: contain;
  }

  .artifact-caption {
    font-family: "Prata", "Times New Roman", serif;
    font-size: 18px;
    color: rgba(24, 22, 15, 0.78);
  }

  .cta {
    width: 100%;
    margin-top: auto;
    max-width: 360px;
  }

  .memoir-letter, .sun-proof-whites-1 {
      transform: rotate(-5deg);
  }
  .glass-sphere, .travel-sketch {
      transform: rotate(5deg);
  }

  @media (min-width: 480px) {
    h1 {
      font-size: 32px;
    }
  }
</style>
