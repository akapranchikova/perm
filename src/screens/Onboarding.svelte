<script lang="ts">
    import AudioWithCaptions from "../components/AudioWithCaptions.svelte";
    import { settings } from '../stores/settings';
    import { router, routes } from '../router';
    type SlideAction = 'next' | 'start' | 'enableAudioNext' | 'disableAudioNext';
    type Caption = { t: number; text: string };
    type Slide = {
        id: string;
        title: string;
        description?: string;
        imageScr?: string;
        imageClass?: string;
        showRing?: boolean;
        background?: string;
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
            imageScr: '/painting.png',
            imageClass: 'collage-img',
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
            title:
                'Приветствуем на выставке «Поленов и ученики»! Мы, AI-гиды Сбера расскажем о наследии Поленова',
            background: '/guides.png',
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
            title: 'Поленов и ученики – это погружение в творчество великого русского художника сквозь его отражение',
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
        class="onboarding-screen"
        style={`--screen-bg: url('${slides[current]?.background ?? '/images/background1.png'}');`}
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

    {#if slides[current]?.imageScr}
        <div class="hero">
            {#if slides[current]?.showRing}
                <div class="hero-ring"></div>
            {/if}
            <img
                    src={slides[current].imageScr}
                    alt={slides[current].title}
                    class={slides[current].imageClass}
            />
            <div class="hero-blur"></div>
        </div>
    {/if}

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
        <div class="text-block">
            <h2>{slides[current].title}</h2>
            {#if slides[current].description}
                <p>{slides[current].description}</p>
            {/if}
        </div>

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
        height: 100%;
        overflow: hidden;
        color: #18160f;
        background: #18160f var(--screen-bg) center/cover no-repeat;
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
        height: 210px;
        background: linear-gradient(180deg, rgba(16, 13, 10, 0.85) 0%, rgba(16, 13, 10, 0.25) 70%, transparent 100%);
    }

    .bottom-gradient {
        bottom: 0;
        height: 340px;
        background: linear-gradient(180deg, rgba(16, 13, 10, 0) 0%, rgba(16, 13, 10, 0.8) 100%);
    }

    .top-container {
        position: absolute;
        top: 48px;
        left: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 3;
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

    .sound-btn {
        width: 52px;
        height: 48px;
        border-radius: 19px;
        padding: 12px 14px;
        border: 1px solid rgba(255, 252, 248, 0.6);
        background: rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(16px);
        display: grid;
        place-items: center;
        cursor: pointer;
    }

    .sound-btn img {
        width: 24px;
        height: 24px;
    }

    .sound-btn.muted {
        border-color: rgba(255, 252, 248, 0.3);
        background: rgba(0, 0, 0, 0.35);
        opacity: 0.85;
    }

    .hero {
        position: absolute;
        top: 130px;
        left: 50%;
        transform: translateX(-50%);
        width: 220px;
        height: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
    }

    .hero-ring {
        position: absolute;
        inset: 0;
        border: 1.5px solid rgba(178, 152, 126, 0.7);
        border-radius: 50%;
        pointer-events: none;
    }

    .hero-img {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        object-fit: cover;
    }

    .collage-img {
        width: 260px;
        height: 200px;
        object-fit: cover;
        border-radius: 24px;
        box-shadow: 0 18px 32px rgba(0, 0, 0, 0.25);
    }

    .guides-img {
        width: 320px;
        height: 240px;
        object-fit: contain;
    }

    .hero-blur {
        position: absolute;
        width: 420px;
        height: 380px;
        left: 50%;
        top: 110px;
        transform: translateX(-50%);
        background: #ffffff;
        filter: blur(90px);
        opacity: 0.35;
        z-index: -1;
    }

    .content-card {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 46px 20px 32px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        z-index: 2;
        background: linear-gradient(180deg, rgba(16, 13, 10, 0) 0%, rgba(16, 13, 10, 0.8) 38%, rgba(16, 13, 10, 0.9) 100%);
    }

    .content-card--audio {
        padding-top: 140px;
    }

    .text-block {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 12px;
        color: #fefefc;
    }

    .content-card h2 {
        margin: 0;
        font-family: 'Prata', 'Times New Roman', serif;
        font-size: 26px;
        line-height: 1.2;
        text-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
    }

    .content-card p {
        margin: 0;
        font-size: 16px;
        line-height: 1.35;
        color: rgba(254, 254, 252, 0.9);
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
    }

    .buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
    }

    .cta-button {
        width: 100%;
        height: 51px;
        border-radius: 100px;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
    }

    .cta-button:active {
        transform: translateY(1px);
    }

    .cta-button.primary {
        background: rgba(254, 254, 252, 1);
        color: rgba(24, 22, 15, 1);
        border: none;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }

    .cta-button.secondary {
        border: 1.5px solid rgba(229, 220, 220, 0.44);
        color: rgba(254, 254, 252, 1);
        background: rgba(24, 22, 15, 0.4);
        backdrop-filter: blur(92.9px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
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

    .onboarding-screen :global(.captions) {
        left: 20px;
        right: 20px;
        bottom: 120px;
        background: rgba(16, 13, 10, 0.75);
        color: rgba(254, 254, 252, 0.96);
        border: 1px solid rgba(254, 254, 252, 0.1);
        text-align: center;
        line-height: 1.35;
        font-size: 14px;
        backdrop-filter: blur(16px);
    }

    @media (min-width: 480px) {
        .content-card {
            padding-left: 32px;
            padding-right: 32px;
        }

        .content-card h2 {
            font-size: 28px;
        }
    }
</style>
