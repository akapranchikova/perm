<script lang="ts">
    type Slide = {
        title: string;
        description: string;
        imageScr: string;
        imageClass: string;
        background?: string;
        accent?: string;
    };

    const slides: Slide[] = [
        {
            title: "Наследие великого русского художника",
            description: "Раскройте многогранный талант Василия Поленова",
            imageScr: "/images/Polenov_by_Repin.png",
            imageClass: "hero-img",
        },
        {
            title: "Собирайте впечатления",
            description:
                "Изучайте экспонаты и наполняйте путевой дневник артефактами — каждый из них добавит новый штрих к пониманию гения Поленова",
            imageScr: "/images/repin_workshop.jpg",
            imageClass: "hero-img",
        },
        {
            title: " ",
            description:
                "Знакомьтесь с мастерством художника вместе с AI-гидами, разработанными с помощью нейросети ГигаЧат от Сбера",
            imageScr: "/images/gigachat.png",
            imageClass: "guides-img",
        },
        {
            title: "Наденьте наушники",
            description: "Это сделает путешествие по выставке гораздо интереснее",
            imageClass: "hero-img",
            imageScr: "/images/headphones.png",
        }
    ];

    let current = 0;
    const nextSlide = () => (current = (current + 1) % slides.length);
</script>

<div
    class="onboarding-screen"
    style={`--screen-bg: ${slides[current].background ?? "#f0f0f0 url(\"images/background1.png\") cover no-repeat center;"};`}
>
    <div class="top-gradient"></div>

    <div class="top-container">
        <span class="logo logo-sber-circle"></span>
        <span class="logo logo-cross"></span>
        <span class="logo logo-arch"></span>
    </div>

    <div class="hero">
        {#if current == 0}
        <div
            class="hero-ring"
            style={`--accent:${slides[current].accent ?? "rgba(178,152,126,0.7)"}`}
        ></div>
        {/if}
        <img
            src={slides[current].imageScr}
            alt={slides[current].title}
            class={slides[current].imageClass}
        />
        <div class="hero-blur"></div>
    </div>

    <div class="content-card">
        <h2>{slides[current].title}</h2>
        <p>{slides[current].description}</p>

        <button class="primary-btn" on:click={nextSlide}>Далее</button>
    </div>

    <div class="bottom-gradient"></div>
</div>

<style>
    :global(body) {
        display: grid;
        place-items: center;
        min-height: 100vh;
        background: #101010;
        font-family: "Inter", "Helvetica Neue", system-ui, sans-serif;
    }

    .onboarding-screen {
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        color: #18160f;
        background: var(--screen-bg);
        box-shadow: 0 50px 120px rgba(0, 0, 0, 0.35);
    }

    .top-gradient,
    .bottom-gradient {
        position: absolute;
        left: 0;
        width: 100%;
        z-index: 1;
    }

    .top-gradient {
        top: 0;
        height: 170px;
        background: linear-gradient(
            180deg,
            rgba(31, 20, 14, 0.6) 0%,
            rgba(31, 20, 14, 0) 100%
        );
    }

    .bottom-gradient {
        bottom: 0;
        height: 238px;
        background: linear-gradient(
            180deg,
            rgba(31, 20, 14, 0) 0%,
            rgba(31, 20, 14, 0.6) 100%
        );
    }

    .top-container {
        position: absolute;
        top: 57px;
        left: 16px;
        right: 16px;
        width: 160px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 2;
    }

    .logo-cross {
        width: 24px;
        height: 1.5px;
        background: #ffffff;
        transform: rotate(-45deg);
        position: relative;
    }

    .logo-cross::after {
        content: "";
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
        background-image: url("/assets/logo-arch.png");
    }

    .logo-sber-circle {
        width: 44px;
        height: 44px;
        background-image: url("/assets/logo-sber-circle.png");
    }

    .hero {
        position: absolute;
        top: 150px;
        height: 181px;
        z-index: 3;
    }

    .hero-ring {
        position: absolute;
        inset: 0;
        border: 1.5px solid var(--accent, rgba(178, 152, 126, 0.7));
        border-radius: 50%;
        pointer-events: none;
    }

    .hero-img {
        width: 168px;
        height: 168px;
        border-radius: 50%;
        object-fit: cover;
        position: absolute;
        left: 6.5px;
        top: 6.5px;
    }

    .guides-img {
        width: 318px;
        height: 245px;
        object-fit: cover;
        position: absolute;
        left: 6.5px;
        top: 6.5px;
    }

    .hero-blur {
        position: absolute;
        width: 376px;
        height: 406px;
        left: 50%;
        top: 149px;
        transform: translateX(-50%);
        background: #ffffff;
        filter: blur(80px);
        opacity: 0.35;
        z-index: -1;
    }

    .content-card {
        position: absolute;
        left: 0;
        right: 0;
        height: calc(100vh - 353px);
        top: 353px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        padding: 40px 32px 160px;
        backdrop-filter: blur(25px);
        border-radius: 16px;
        z-index: 2;
    }

    .content-card h2 {
        font-family: "Prata", "Times New Roman", serif;
        font-size: 32px;
        line-height: 1;
        text-align: center;
    }

    .content-card p {
        font-size: 16px;
        line-height: 1.2;
        text-align: center;
        max-width: 269px;
    }

    .primary-btn {
        position: absolute;
        bottom: 32px;
        left: 50%;
        transform: translate(-50%, -50%);
        width: calc(100% - 32px);
        max-width: 343px;
        height: 51px;
        border-radius: 100px;
        border: none;
        background: #fefefc;
        color: #18160f;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
    }
</style>
