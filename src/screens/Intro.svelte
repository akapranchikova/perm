<script lang="ts">
  type Slide = {
    id: number;
    badge?: string;
    title: string;
    text: string;
    image: string;
    imageAlt: string;
    primaryCta: { label: string; action: () => void };
    secondaryCta?: { label: string; action: () => void };
  };

  const slides: Slide[] = [
    {
      id: 1,
      badge: 'Наследие',
      title: 'Наследие великого русского художника',
      text: 'Раскройте многогранный талант Василия Поленова.',
      image: '/img/onboarding/polenov-portrait.png',
      imageAlt: 'Василий Поленов',
      primaryCta: { label: 'Далее', action: () => next() }
    },
    {
      id: 2,
      badge: 'Впечатления',
      title: 'Собирайте впечатления',
      text: 'Изучайте экспонаты и наполняйте путевой дневник артефактами — каждый из них добавит новый штрих к пониманию гения Поленова.',
      image: '/img/onboarding/artifacts.png',
      imageAlt: 'Экспонаты',
      primaryCta: { label: 'Далее', action: () => next() }
    },
    {
      id: 3,
      badge: 'ГигаЧат',
      title: 'Гигачат AI‑гиды',
      text: 'Знакомьтесь с мастерством художника вместе с AI-гидом от Сбера, основанным на нейросети ГигаЧат.',
      image: '/img/onboarding/gigachat-guides.png',
      imageAlt: 'AI-гиды',
      primaryCta: { label: 'Далее', action: () => next() }
    },
    {
      id: 4,
      badge: 'Подкаст',
      title: 'Наденьте наушники',
      text: 'Это сделает путешествие по выставке гораздо интереснее.',
      image: '/img/onboarding/earpods.png',
      imageAlt: 'Наушники',
      primaryCta: { label: 'Подключаю', action: () => console.log('Connecting...') },
      secondaryCta: { label: 'Продолжить без наушников', action: () => console.log('Skip audio') }
    }
  ];

  let current = 0;

  const next = () => {
    if (current < slides.length - 1) current += 1;
  };

  const prev = () => {
    if (current > 0) current -= 1;
  };

  const progress = () => ((current + 1) / slides.length) * 100;
</script>

<div class="onboarding">
  <div class="phone-shell">
    <header class="status-bar">
      <span class="time">9:15</span>
      <div class="status-icons">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </header>

    <div class="progress-bar">
      <div class="progress-fill" style={`width: ${progress()}%`}></div>
    </div>

    <section class="slide" aria-live="polite">
      <div class="arch-background"></div>
      <div class="badge" aria-hidden={!slides[current].badge}>
        {slides[current].badge}
      </div>
      <img class="hero-image" src={slides[current].image} alt={slides[current].imageAlt} />

      <div class="content">
        <h1>{slides[current].title}</h1>
        <p>{slides[current].text}</p>
      </div>
    </section>

    <footer class="actions">
      {#if slides[current].secondaryCta}
        <button class="ghost" on:click={slides[current].secondaryCta.action}>
          {slides[current].secondaryCta.label}
        </button>
      {/if}

      <button class="primary" on:click={slides[current].primaryCta.action}>
        {slides[current].primaryCta.label}
      </button>

      <div class="pagination">
        {#each slides as slide, index}
          <button
            class:active={index === current}
            on:click={() => (current = index)}
            aria-label={`Перейти на шаг ${index + 1}`}
          ></button>
        {/each}
      </div>
    </footer>
  </div>

  {#if current > 0}
    <button class="nav prev" on:click={prev} aria-label="Предыдущий слайд">‹</button>
  {/if}
  {#if current < slides.length - 1}
    <button class="nav next" on:click={next} aria-label="Следующий слайд">›</button>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: 'PT Serif', 'Georgia', serif;
    background: #1f1f1f;
    display: grid;
    place-items: center;
    min-height: 100vh;
  }

  .onboarding {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .phone-shell {
    width: 320px;
    height: 660px;
    background: linear-gradient(180deg, #f3ede4 0%, #c9b8a2 80%);
    border-radius: 40px;
    padding: 1rem;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #4d4438;
    margin-bottom: 0.25rem;
  }

  .status-icons {
    display: flex;
    gap: 0.15rem;
  }

  .dot {
    width: 4px;
    height: 4px;
    background: #483c2f;
    border-radius: 50%;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ad7c4a, #d9b18b);
    transition: width 0.3s ease;
  }

  .slide {
    flex: 1;
    position: relative;
    padding: 0 0.5rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .arch-background {
    position: absolute;
    inset: 0;
    border-radius: 32px;
    background: radial-gradient(80% 60% at 50% 0%, rgba(255,255,255,0.95), rgba(214,197,177,0.7));
    z-index: 0;
  }

  .badge {
    margin-top: 1rem;
    padding: 0.2rem 0.75rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6e5b48;
    z-index: 1;
  }

  .hero-image {
    width: 220px;
    max-height: 220px;
    object-fit: contain;
    margin: 1.4rem 0;
    z-index: 1;
    filter: drop-shadow(0 10px 25px rgba(0,0,0,0.25));
  }

  .content {
    z-index: 1;
    color: #2b231a;
  }

  .content h1 {
    font-size: 1.42rem;
    line-height: 1.25;
    margin-bottom: 0.7rem;
  }

  .content p {
    font-size: 0.95rem;
    line-height: 1.45;
    color: #4a3c2e;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding-top: 0.5rem;
  }

  .actions button {
    border: none;
    border-radius: 999px;
    padding: 0.9rem;
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .actions button:active {
    transform: scale(0.98);
  }

  .primary {
    background: linear-gradient(180deg, #ede4d4, #d9c2a9);
    color: #3a2d21;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 12px rgba(143,113,81,0.35);
  }

  .ghost {
    background: transparent;
    border: 1px solid rgba(58, 45, 33, 0.3);
    color: #3a2d21;
  }

  .pagination {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    margin-top: 0.2rem;
  }

  .pagination button {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    padding: 0;
    border: none;
    background: rgba(58, 45, 33, 0.3);
  }

  .pagination button.active {
    width: 22px;
    border-radius: 999px;
    background: rgba(58, 45, 33, 0.9);
  }

  .nav {
    border: none;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    color: #e5d5c4;
    font-size: 1.4rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .nav:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  .prev {
    order: -1;
  }
</style>