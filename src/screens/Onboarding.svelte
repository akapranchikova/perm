<script lang="ts">
    import AudioWithCaptions from "../components/AudioWithCaptions.svelte";
    import { settings } from '../stores/settings';
    import { router, routes } from '../router';
    type SlideAction = 'next' | 'start' | 'enableAudioNext' | 'disableAudioNext';
    type Caption = { t: number; text: string };
    type CollageImage = {
        src: string;
        alt: string;
        className?: string;
        objectPosition?: string;
    };

    type Slide = {
        id: string;
        title?: string;
        description?: string;
        imageScr?: string;
        imageClass?: string;
        showRing?: boolean;
        background?: string;
        background2?: string;
        collage?: CollageImage[];
        primaryLabel: string;
        primaryAction?: SlideAction;
        secondaryLabel?: string;
        secondaryAction?: SlideAction;
        audio?: {
            src: string;
            autoplay?: boolean;
            captions: Caption[];
        };
    };

    const slides: Slide[] = [
        {
            id: 'legacy',
            title: 'Наследие великого русского художника',
            description: 'Раскройте многогранный талант Василия Поленова',
            imageScr: '/images/Polenov_by_Repin.png',
            imageClass: 'hero-img',
            showRing: true,
            primaryLabel: 'Далее',
            primaryAction: 'next'
        },
        {
            id: 'impressions',
            title: 'Собирайте впечатления',
            description:
                'Изучайте экспонаты и наполняйте путевой дневник артефактами — каждый из них добавит новый штрих к пониманию гения Поленова',
            collage: [
                {
                    src: '/painting-d.png',
                    alt: 'Сюжет с женщиной у лестницы',
                    className: 'collage-card--left',
                    objectPosition: 'center center'
                },
                {
                    src: '/painting.png',
                    alt: 'Солнечный двор с храмом на заднем плане',
                    className: 'collage-card--center',
                    objectPosition: '60% 45%'
                },
                {
                    src: '/painting.png',
                    alt: 'Поляна с гуляющими детьми',
                    className: 'collage-card--right',
                    objectPosition: '72% 38%'
                }
            ],
            primaryLabel: 'Далее',
            primaryAction: 'next'
        },
        {
            id: 'gigachat',
            title: 'Гигачат AI‑гиды',
            description:
                'Знакомьтесь с мастерством художника вместе с AI-гидами, разработанными с помощью нейросети ГигаЧат от Сбера',
            imageScr: '/images/gigachat.png',
            imageClass: 'guides-img',
            primaryLabel: 'Далее',
            primaryAction: 'next'
        },
        {
            id: 'headphones',
            title: 'Наденьте наушники',
            description: 'Это сделает путешествие по выставке гораздо интереснее',
            imageScr: '/images/headphones.png',
            imageClass: 'hero-img',
            primaryLabel: 'Подключаю',
            primaryAction: 'enableAudioNext',
            secondaryLabel: 'Продолжить без наушников',
            secondaryAction: 'disableAudioNext'
        },
        {
            id: 'audio-welcome',
            background2: '/images/onboarding-couple.png',
            primaryLabel: 'Далее',
            primaryAction: 'next',
            audio: {
                src: '/audio/onboarding-welcome.wav',
                captions: [
                    {
                        t: 0,
                        text:
                            'Приветствуем на выставке «Поленов и ученики»! Мы, AI-гиды Сбера расскажем о наследии Поленова.'
                    }
                ]
            }
        },
        {
            id: 'audio-journey',
            background: '/images/background2.png',
            primaryLabel: 'Начать',
            primaryAction: 'start',
            audio: {
                src: '/audio/onboarding-journey.wav',
                captions: [
                    {
                        t: 0,
                        text:
                            'Поленов и ученики – это погружение в творчество великого русского художника сквозь его отражение.'
                    }
                ]
            }
        }
    ];


    let current = 0;
    const nextSlide = () => {
        current = (current + 1) % slides.length
    };

    const startExperience = () => router.go(routes.PLAYTESTS);


    const handleAction = (action?: SlideAction) => {

        if (!action) return nextSlide();

        if (action === 'start') return startExperience();
        if (action === 'enableAudioNext') {
            settings.update((s) => ({ ...s, audioEnabled: true }));
            return nextSlide();
        }
        if (action === 'disableAudioNext') {
            settings.update((s) => ({ ...s, audioEnabled: false }));
            return nextSlide();
        }

        return nextSlide();
    };

</script>

<div
        class="onboarding-screen onboarding-screen-{current + 1}"
        style={`--screen-bg: url('${slides[current]?.background ?? '/images/background1.png'}'); --screen-bg2: ${slides[current]?.background2 ? 'url(\'' +slides[current]?.background2 + '\')': 'transparent'};`}
>
    <div class="top-gradient"></div>

    <header class="top-container">
        <div class="logo-group">
            <span class="logo logo-sber-circle" aria-hidden="true"></span>
            <span class="logo logo-cross" aria-hidden="true"></span>
            <span class="logo logo-arch" aria-hidden="true"></span>
        </div>

        {#if slides[current]?.audio}
            <button
                    class="sound-btn"
                    class:muted={!$settings.audioEnabled}
                    type="button"
                    aria-label={$settings.audioEnabled ? 'Выключить звук' : 'Включить звук'}
                    on:click={() => settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }))}
            >
                <img src="/assets/sound.svg" alt="" />
            </button>
        {/if}
    </header>

    <div class="main-block">
        {#if slides[current]?.collage?.length}
            <div class="hero collage-hero">
                <div class="collage">
                    {#each slides[current].collage as collageImage}
                        <div class={`collage-card ${collageImage.className ?? ''}`}>
                            <img
                                    src={collageImage.src}
                                    alt={collageImage.alt}
                                    style={`object-position: ${collageImage.objectPosition ?? 'center'};`}
                            />
                        </div>
                    {/each}
                </div>
                <div class="hero-blur"></div>
            </div>
        {:else if slides[current]?.imageScr}
            <div class="hero {slides[current]?.showRing ? 'hero-ring' : ''}">
                <!--{#if slides[current]?.showRing}-->
<!--                    <div class="hero-ring"></div>-->
<!--                {/if}-->
                <img
                        src={slides[current].imageScr}
                        alt={slides[current].title}
                        class={slides[current].imageClass}
                />
                <div class="hero-blur"></div>
            </div>
        {/if}

        <div class="text-block">
            {#if slides[current].title}
                <h2>{slides[current].title}</h2>
            {/if}

            {#if slides[current].description}
                <p>{slides[current].description}</p>
            {/if}
        </div>
    </div>


    {#if slides[current]?.audio}
        <div class="audioLayer">
            <AudioWithCaptions
                    src={slides[current].audio.src}
                    captions={slides[current].audio.captions}
                    autoplay={slides[current].audio.autoplay ?? true}
                    muted={!$settings.audioEnabled}
            />
        </div>
    {/if}

    <div class={`content-card ${slides[current]?.audio ? 'content-card--audio' : ''}`}>


        <div class="buttons">
            {#if slides[current]?.secondaryLabel}
                <button
                        class="cta-button secondary"
                        type="button"
                        on:click={() => handleAction(slides[current]?.secondaryAction)}
                >
                    {slides[current].secondaryLabel}
                </button>
            {/if}

            <button
                    class="cta-button primary"
                    type="button"
                    on:click={() => handleAction(slides[current].primaryAction)}
            >
                {slides[current]?.primaryLabel}
            </button>
        </div>
    </div>

    <div class="bottom-gradient"></div>
</div>


<style>
    :global(body.onboarding-bg) {
        background: #18160f url('/images/background1.png') center/cover no-repeat;
    }

    .onboarding-screen {
        position: relative;
        width: 100%;
        min-height: 100svh;
        overflow: hidden;
        color: #18160f;
        background: var(--screen-bg) center/cover no-repeat;
        display: flex;
        flex-direction: column;
        padding: 20px;
        gap: clamp(18px, 4vw, 28px);
        box-sizing: border-box;
    }

    .onboarding-screen::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.50);
        pointer-events: none;
    }
    .onboarding-screen-6::before {
        background: transparent;
    }

    .onboarding-screen::after {
        position: absolute;
        content: '';
        width: 100%;
        height: 100%;
        background: var(--screen-bg2) center/cover no-repeat;
    }

    .top-gradient,
    .bottom-gradient {
        position: absolute;
        left: 0;
        width: 100%;
        z-index: 1;
        pointer-events: none;
    }

    .top-gradient {
        top: 0;
        height: clamp(150px, 28vh, 210px);
        background: linear-gradient(180deg, rgba(16, 13, 10, 0.85) 0%, rgba(16, 13, 10, 0.25) 70%, transparent 100%);
    }

    .bottom-gradient {
        bottom: 0;
        height: clamp(240px, 42vh, 340px);
        background: linear-gradient(180deg, rgba(16, 13, 10, 0) 0%, rgba(16, 13, 10, 0.8) 100%);
    }

    .top-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 3;
        padding: 0 clamp(2px, 1vw, 4px);
    }

    .logo-group {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .logo-cross {
        width: 24px;
        height: 1.5px;
        background: #ffffff;
        transform: rotate(-45deg);
        position: relative;
    }

    .logo-cross::after {
        content: '';
        position: absolute;
        width: 24px;
        height: 1.5px;
        background: #ffffff;
        transform: rotate(90deg);
    }

    .logo {
        display: inline-block;
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
    }

    .logo-arch {
        width: 44px;
        height: 44px;
        background-image: url('/assets/logo-arch.png');
    }

    .logo-sber-circle {
        width: 44px;
        height: 44px;
        background-image: url('/assets/logo-sber-circle.png');
    }

    .main-block {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: clamp(16px, 4vw, 26px);
        width: 100%;
        padding: clamp(16px, 4vw, 26px);
        box-sizing: border-box;
    }

    .hero {
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        width: fit-content;
        position: relative;
    }

    .hero-ring::before {
        content: '';
        position: absolute;
        inset: 0;
        top: -6px;
        left: -6px;
        bottom: -6px;
        right: -6px;
        border: 1.5px solid rgba(178, 152, 126, 0.7);
        border-radius: 50%;
        pointer-events: none;
    }

    .hero-img {
        width: clamp(156px, 38vw, 210px);
        height: clamp(156px, 38vw, 210px);
        border-radius: 50%;
        object-fit: cover;
    }

    .guides-img {
        width: clamp(230px, 70vw, 320px);
        height: clamp(170px, 56vw, 240px);
        object-fit: contain;
    }

    .collage-hero {
        width: 100%;
    }

    .collage {
        position: relative;
        width: min(100%, 420px);
        height: clamp(180px, 44vw, 230px);
        margin: 0 auto;
    }

    .collage-card {
        position: absolute;
        border-radius: 4px;
        overflow: hidden;
        background: #d8d0c8;
        transition: transform 0.2s ease;
    }

    .collage-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .collage-card--left {
        width: clamp(150px, 48vw, 182px);
        height: clamp(120px, 36vw, 140px);
        top: clamp(32px, 10vw, 56px);
        z-index: 3;
        left: clamp(-12%, -6vw, -4%);
        transform: rotate(-8deg);
    }

    .collage-card--center {
        width: clamp(186px, 54vw, 230px);
        height: clamp(132px, 38vw, 150px);
        top: clamp(-10px, 2vw, -2px);
        left: clamp(16px, 10vw, 48px);
        transform: rotate(3deg);
    }

    .collage-card--right {
        width: clamp(150px, 44vw, 176px);
        height: clamp(120px, 36vw, 140px);
        top: clamp(24px, 9vw, 40px);
        right: clamp(-8%, -3vw, 0%);
        transform: rotate(8deg);
    }

    @media (min-width: 480px) {
        .collage {
            width: 360px;
            height: 230px;
        }

        .collage-card--left {
            width: 192px;
            height: 148px;
            top: 60px;
            left: 0;
        }

        .collage-card--center {
            width: 242px;
            height: 156px;
            top: 0;
            left: 58px;
        }

        .collage-card--right {
            width: 186px;
            height: 146px;
            top: 42px;
            right: 0;
        }
    }

    .hero-blur {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        top: 0;
        transform: translateX(-50%);
        background: #ffffff;
        filter: blur(90px);
        opacity: 0.35;
        z-index: -1;
    }

    .content-card {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: clamp(14px, 4vw, 22px);
        z-index: 2;
        margin-top: auto;
        box-sizing: border-box;
    }

    .content-card--audio {
        padding-top: clamp(96px, 22vw, 140px);
    }

    .text-block {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: clamp(16px, 4vw, 24px);
        max-width: 520px;
    }

    .main-block h2 {
        margin: 0;
        font-family: 'Prata', 'Times New Roman', serif;
        font-size: clamp(26px, 6vw, 32px);
        color: rgba(24, 22, 15, 1);
        line-height: 1.2;
    }

    .main-block p {
        margin: 0;
        font-size: clamp(14px, 3.5vw, 16px);
        line-height: 1.35;
        color: rgba(24, 22, 15, 1);

    }

    .audioLayer {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
    }

    .audioLayer :global(audio) {
        display: none;
    }

    .buttons {
        display: flex;
        flex-direction: column;
        gap: clamp(10px, 3vw, 14px);
        width: 100%;
    }

    .onboarding-screen :global(.captions) {
        left: 20px;
        right: 20px;
        bottom: 90px;
        color: rgba(254, 254, 252, 0.96);
        text-align: center;
        line-height: 1.24;
        font-size: 18px;
        font-family: "Inter", sans-serif;
        backdrop-filter: none;
        background: transparent;
        border: none;
    }

    @media (min-width: 480px) {
        .content-card {
            padding-left: 32px;
            padding-right: 32px;
        }
    }
</style>
