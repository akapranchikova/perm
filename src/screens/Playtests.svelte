<script>
  import { router, routes } from '../router';
  import { settings } from '../stores/settings';

  const hero = {
    lead: '/avatar.png',
    badge: '/guide.png',
    text: 'Изучайте экспонаты, отмеченные на карте, и наполняйте путевой дневник артефактами'
  };

  const items = [
    { id: routes.ACTIVITY_A, title: 'Активность A', desc: null, image: '/activityA/frame_0003.png', floor: 1 },
    { id: routes.ACTIVITY_B, title: 'Активность B', desc: 'Ловить письма', image: '/activityB/background.png', floor: 1 },
    { id: routes.ACTIVITY_C, title: 'Активность C', desc: null, image: '/painting.png', floor: 1 },
    { id: routes.ACTIVITY_D, title: 'Активность D', desc: 'Зум картины → тап по зоне → квиз', image: '/activityE/map.png', floor: 2 },
    { id: routes.ACTIVITY_E, title: 'Активность E', desc: 'Карта и что-то там', image: '/guides.png', floor: 2 }
  ];

  const floors = [
    { label: '1 этаж', value: 1 },
    { label: '2 этаж', value: 2 }
  ];

  let viewMode = 'list';
</script>

<div class="playtests">
  <header class="hero">
    <div class="hero-grid">
      <div class="circle">
        <img src={hero.lead} alt="Гид" loading="lazy" />
      </div>
      <p class="hero-text">{hero.text}</p>
      <div class="circle">
        <img src={hero.badge} alt="Дневник" loading="lazy" />
      </div>
    </div>
  </header>

  <section class="content">
    <div class="switcher" role="tablist" aria-label="Режим отображения">
      <button
        class:active={viewMode === 'list'}
        on:click={() => (viewMode = 'list')}
        role="tab"
        aria-selected={viewMode === 'list'}
      >
        Список
      </button>
      <button
        class:active={viewMode === 'map'}
        on:click={() => (viewMode = 'map')}
        role="tab"
        aria-selected={viewMode === 'map'}
      >
        Карта
      </button>
    </div>

    {#if viewMode === 'list'}
      <div class="floors">
        {#each floors as floor}
          <div class="floor">
            <p class="floor-label">{floor.label}</p>
            <div class="activities">
              {#each items.filter((it) => it.floor === floor.value) as it}
                <button class="activity" on:click={() => router.go(it.id)}>
                  <div class="activity-image">
                    <img src={it.image} alt={it.title} loading="lazy" />
                  </div>
                  <div class="activity-copy">
                    <p class="activity-title">{it.title}</p>
                    {#if it.desc}
                      <p class="activity-desc">{it.desc}</p>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="placeholder">
        <p class="activity-title">Карта появится позже</p>
        <p class="activity-desc">
          Сейчас доступен список активностей. Вы можете включить аудио: {#if $settings.audioEnabled}включено{:else}выкл{/if}.
        </p>
      </div>
    {/if}
  </section>
</div>

<style>
  .playtests {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: rgba(178, 152, 126, 1);
  }

  .hero {
    padding: clamp(16px, 4vw, 24px) clamp(16px, 5vw, 24px) 0;
    color: rgba(254, 254, 252, 1);
  }

  .hero-grid {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: clamp(8px, 2vw, 10px);
    margin-bottom: clamp(26px, 6vw, 36px);
  }

  .circle {
    width: clamp(52px, 14vw, 64px);
    height: clamp(52px, 14vw, 64px);
    border-radius: 50%;
    overflow: hidden;
    background: rgba(254, 254, 252, 0.2);
    display: grid;
    place-items: center;
  }

  .circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-text {
    margin: 0;
    font-size: clamp(14px, 3.6vw, 16px);
    line-height: 1.4;
    font-weight: 600;
  }

  .content {
    flex: 1;
    background: rgba(254, 254, 252, 1);
    border-radius: 28px 28px 0 0;
    padding: clamp(16px, 4vw, 20px);
    display: flex;
    flex-direction: column;
    gap: clamp(18px, 4vw, 24px);
    box-shadow: 0 -8px 24px rgba(24, 22, 15, 0.08);
  }

  .switcher {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    align-items: center;
    background: rgba(243, 237, 227, 1);
    border-radius: 51px;
    padding: 4px;
    height: 51px;
    gap: 4px;
  }

  .switcher button {
    border: none;
    border-radius: 999px;
    background: transparent;
    height: 43px;
    font-size: 15px;
    font-weight: 600;
    color: rgba(24, 22, 15, 0.5);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }

  .switcher button.active {
    background: rgba(254, 254, 252, 1);
    color: rgba(24, 22, 15, 1);
    transform: translateY(-1px);
  }

  .floors {
    display: flex;
    flex-direction: column;
    gap: clamp(18px, 4vw, 26px);
  }

  .floor {
    display: flex;
    flex-direction: column;
  }

  .floor-label {
    margin: 0 0 clamp(14px, 3vw, 20px);
    color: rgba(178, 152, 126, 1);
    font-size: 16px;
    font-weight: 700;
  }

  .activities {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .activity {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 20px;
    align-items: center;
    background: transparent;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }

  .activity-image {
    width: 98px;
    height: 98px;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 6px 14px rgba(24, 22, 15, 0.08);
  }

  .activity-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .activity-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .activity-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: rgba(24, 22, 15, 1);
    line-height: 1.3;
  }

  .activity-desc {
    margin: 0;
    font-size: 14px;
    color: rgba(24, 22, 15, 0.72);
    line-height: 1.35;
  }

  .placeholder {
    background: rgba(243, 237, 227, 0.7);
    border-radius: 18px;
    padding: clamp(14px, 3.5vw, 18px);
  }
</style>
