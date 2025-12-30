<script>
    import { onMount, onDestroy, tick } from "svelte";
    import { router, routes } from "../router";
    import { artifactsCatalog, journalCopy } from "../data/artifacts";
    import { collectedArtifacts } from "../stores/artifacts";

    import { assetsStore } from '../stores/assets';
    $: getSrc = (src) => $assetsStore.get(src) || src;

    const accent = "rgba(178, 152, 126, 1)";

    $: total = artifactsCatalog.length;
    $: collected = $collectedArtifacts;

    const goBack = () => router.go(routes.PLAYTESTS);

    let sliderEl;
    let activeIndex = 0;

    let rafId;
    let ro;

    const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

    function getCards() {
        if (!sliderEl) return [];
        return Array.from(sliderEl.querySelectorAll(".card"));
    }

    function updateIndex() {
        if (!sliderEl) return;

        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            const cards = getCards();
            if (!cards.length) {
                activeIndex = 0;
                return;
            }

            const sliderRect = sliderEl.getBoundingClientRect();
            const sliderCenter = sliderRect.left + sliderRect.width / 2;

            let bestIdx = 0;
            let bestDist = Infinity;

            for (let i = 0; i < cards.length; i++) {
                const r = cards[i].getBoundingClientRect();
                const c = r.left + r.width / 2;
                const d = Math.abs(c - sliderCenter);
                if (d < bestDist) {
                    bestDist = d;
                    bestIdx = i;
                }
            }

            activeIndex = clamp(bestIdx, 0, total - 1);
        });
    }

    function scrollToIndex(i) {
        if (!sliderEl) return;
        const idx = clamp(i, 0, total - 1);
        const cards = getCards();
        const el = cards[idx];
        if (!el) return;

        const sliderRect = sliderEl.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        const sliderCenter = sliderRect.left + sliderRect.width / 2;
        const elCenter = elRect.left + elRect.width / 2;

        const delta = elCenter - sliderCenter;
        sliderEl.scrollTo({ left: sliderEl.scrollLeft + delta, behavior: "smooth" });
    }

    onMount(async () => {
        await tick();

        requestAnimationFrame(() => {
            scrollToIndex(0);
            updateIndex();

            requestAnimationFrame(() => {
                scrollToIndex(0);
                updateIndex();
            });
        });

        ro = new ResizeObserver(() => {
            const idx = activeIndex;
            requestAnimationFrame(() => {
                scrollToIndex(idx);
                updateIndex();
            });
        });
        if (sliderEl) ro.observe(sliderEl);
    });

    onDestroy(() => {
        cancelAnimationFrame(rafId);
        ro?.disconnect();
    });
</script>

<div class="journal-screen" style={`--accent:${accent};`}>
    <header class="journal-header">
        <button class="back-btn" type="button" on:click={goBack} aria-label="Назад">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M10 19L3 12L10 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        </button>
    </header>

    <div class="titles">
        <h1>{journalCopy.title}</h1>
        <p>{journalCopy.subtitle}</p>
    </div>

    <div class="artifact-list">
        <section class="slider" bind:this={sliderEl} on:scroll={updateIndex}>
            {#each artifactsCatalog as artifact}
                {@const isCollected = collected.find((a) => a.id === artifact.id)}
                <article class={`card ${isCollected ? "collected" : "locked"}`}>
                    <div class="image-shell">
                        <img
                                src={getSrc(artifact.image)}
                                alt={artifact.name}
                                loading="eager"
                                on:load={updateIndex}
                                on:error={updateIndex}
                        />
                    </div>

                    <div class="card-body">
                        <div class="name">{artifact.name}</div>
                    </div>

                    {#if !isCollected}
                        <div class="lock">Не найдено</div>
                    {/if}
                </article>
            {/each}
        </section>

        <div class="progress">{activeIndex + 1}/{total}</div>

        <!-- если захочешь кнопки -->
        <!--
        <div class="nav">
          <button on:click={() => scrollToIndex(activeIndex - 1)}>prev</button>
          <button on:click={() => scrollToIndex(activeIndex + 1)}>next</button>
        </div>
        -->
    </div>

    <div class="footer">
        <button class="cta-button" type="button" on:click={goBack}>
            {journalCopy.ctaLabel}
        </button>
    </div>
</div>

<style>
    .journal-screen {
        height: 100dvh;
        overflow: hidden;
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
        border: 1px solid rgba(95, 93, 90, 0.6);
        background: transparent;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        color: rgba(95, 93, 90);
    }

    .back-btn svg {
        width: 24px;
        height: 24px;
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
        grid-auto-columns: 90%;
        gap: 8px;

        overflow-x: auto;
        overflow-y: hidden;

        padding: 8px;
        scroll-padding: 8px;

        scroll-snap-type: x mandatory;
        scroll-snap-stop: always;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;

        align-items: center;
        min-height: 0;
        width: 100%;
    }

    .slider::before,
    .slider::after {
        content: "";
        width: 50%;
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
        border-radius: 32px;
        height: 100%;
        border: none;
        padding: clamp(12px, 2vh, 16px);
        display: grid;
        grid-template-rows: 1fr auto;
        gap: clamp(8px, 2vh, 12px);
        scroll-snap-align: center;
        position: relative;
        background: rgba(243, 237, 227, 1);
        overflow: hidden;
    }

    .card.locked {
        opacity: 0.65;
    }

    .image-shell {
        background: #f3ede7;
        flex: 1;
        height: 100%;
        border-radius: 18px;
        padding: clamp(10px, 2vh, 14px);
        display: flex;
        overflow: hidden;
        align-items: center;
        justify-content: center;
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
        margin-top: 0;
        padding: 0;
    }

    .progress {
        font-weight: 400;
        font-size: 14px;
        color: rgba(24, 22, 15, 0.7);
        text-align: center;
    }

    @media (min-width: 480px) {
        .titles h1 {
            font-size: 32px;
        }
    }
</style>
