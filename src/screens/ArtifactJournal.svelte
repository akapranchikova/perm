<script>
  import { router, routes } from "../router";
  import {
    artifactsCatalog,
    journalCopy,
  } from "../data/artifacts";
  import {
    collectedArtifacts,
    collectedCount,
  } from "../stores/artifacts";

  const accent = "rgba(178, 152, 126, 1)";

  $: total = artifactsCatalog.length;
  $: collected = $collectedArtifacts;
  $: count = $collectedCount;

  const goBack = () => router.go(routes.PLAYTESTS);
</script>

<div class="journal-screen" style={`--accent:${accent};`}>
  <header class="journal-header">
    <button class="back-btn" type="button" on:click={goBack} aria-label="Назад">
      ←
    </button>
  </header>

    <div class="titles">
        <h1>{journalCopy.title}</h1>
        <p>{journalCopy.subtitle}</p>
    </div>
    <div class="artifact-list">
        <section class="slider">
            {#each artifactsCatalog as artifact}
                <article class={`card ${collected.find((a) => a.id === artifact.id) ? 'collected' : 'locked'}`}>
                    <div class="image-shell">
                        <img src={artifact.image} alt={artifact.name} loading="lazy" />
                    </div>
                    <div class="card-body">
                        <div class="name">{artifact.name}</div>
                    </div>
                    {#if !collected.find((a) => a.id === artifact.id)}
                        <div class="lock">Не найдено</div>
                    {/if}
                </article>
            {/each}
        </section>
        <div class="progress">{count}/{total}</div>
    </div>

  <div class="footer">
    <button class="cta-button" type="button" on:click={goBack}>
      {journalCopy.ctaLabel}
    </button>
  </div>
</div>

<style>
  .journal-screen {
    min-height: 100vh;
    background: #fdfaf5;
    color: rgba(24, 22, 15, 1);
    display: flex;
    flex-direction: column;
      padding: 20px;
    gap: clamp(12px, 2vh, 18px);
  }

  .journal-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .back-btn {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    border: 1px solid rgba(24, 22, 15, 0.12);
    background: #fff;
    font-size: 18px;
      display: flex;
      justify-content: center;
      align-items: center;
    cursor: pointer;
    box-shadow: 0 10px 22px rgba(24, 22, 15, 0.08);
  }

.titles {
    padding: 0 12px;
    text-align: center;
}

  .titles h1 {
    margin: 0;
    font-family: "Prata", "Times New Roman", serif;
    font-size: 30px;
    line-height: 1.2;
  }

  .titles p {
    margin: 6px 0 0;
    font-size: 15px;
    line-height: 1.35;
    color: rgba(24, 22, 15, 0.7);
  }

  .artifact-list {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: clamp(12px, 2vh, 18px);
    width: 100%;
  }

  .slider {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 100vw;
    gap: 16px;
    overflow-x: auto;
    padding: clamp(4px, 1vh, 8px) 2px clamp(8px, 2vh, 12px);
    scroll-snap-type: x mandatory;
    align-items: center;
      overflow-y: hidden;
    min-height: 0;
    width: 100%;
  }

  .slider::-webkit-scrollbar {
    height: 6px;
  }

  .slider::-webkit-scrollbar-thumb {
    background: rgba(24, 22, 15, 0.18);
    border-radius: 999px;
  }

  .card {
    width: 100%;
    border-radius: 22px;
    padding: clamp(12px, 2vh, 16px);
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 2vh, 12px);
    scroll-snap-align: center;
    position: relative;
    min-height: clamp(230px, 44vh, 320px);
    background: #f3ede7;
  }

  .card.locked {
    opacity: 0.65;
  }

  .image-shell {
    background: #f3ede7;
    border-radius: 18px;
    padding: clamp(10px, 2vh, 14px);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: clamp(160px, 38vh, 220px);
  }

  .image-shell img {
    max-width: clamp(220px, 70vw, 280px);
    max-height: 100%;
    width: 100%;
    height: auto;
    object-fit: contain;
    display: block;
  }

  .card-body {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .name {
    font-family: "Prata", "Times New Roman", serif;
    font-size: 18px;
    color: rgba(24, 22, 15, 1);
  }

  .lock {
    position: absolute;
    top: 14px;
    right: 14px;
    padding: 6px 10px;
    border-radius: 12px;
    background: rgba(24, 22, 15, 0.06);
    color: rgba(24, 22, 15, 0.65);
    font-size: 12px;
    font-weight: 700;
  }

  .footer {
    display: flex;
      flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: clamp(8px, 2vh, 12px);
  }

  .progress {
    font-weight: 400;
      font-size: 14px;
      margin-top: clamp(10px, 2vh, 16px);
    color: rgba(24, 22, 15, 0.7);
    text-align: center;
  }

  .cta-button {
    flex: 1;
    height: 51px;
    border-radius: 100px;
      width: 100%;
    border: none;
    background: var(--accent);
    color: #fff;
    font-size: 16px;
    font-weight: 400;
    box-shadow: 0 10px 30px rgba(24, 22, 15, 0.16);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .cta-button:active {
    transform: translateY(1px) scale(0.98);
    box-shadow: 0 10px 18px rgba(24, 22, 15, 0.22);
  }

  @media (min-width: 480px) {
    .titles h1 {
      font-size: 32px;
    }
  }
</style>
