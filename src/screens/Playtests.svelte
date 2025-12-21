<script>
  import { router, routes } from '../router';
  import { settings } from '../stores/settings';

  const hero = {
    lead: '/guide.png',
    badge: '/book.png',
    text: 'Изучайте экспонаты, отмеченные на карте, и наполняйте путевой дневник артефактами'
  };

  const items = [
    { id: routes.ACTIVITY_A, title: 'Пастух со стадом', desc: 'Егише Татевосян', image: '/activityA/frame_0003.png', floor: 2 },
    { id: routes.ACTIVITY_F, title: 'Больная', desc: 'Василий Поленов', image: '/activityA/frame_0001.png', floor: 2 },
    { id: routes.ACTIVITY_B, title: 'Приветственный адрес Поленову от учеников', desc: null, image: '/activityB/background.png', floor: 1 },
    { id: routes.ACTIVITY_C, title: 'Музыкальная рукопись «Анна Бретонская»', desc: 'Василий Поленов', image: '/painting.png', floor: 1 },
    { id: routes.ACTIVITY_D, title: 'Настурции', desc: 'Константин Коровин', image: '/painting-d.png', floor: 2 },
    { id: routes.ACTIVITY_E, title: 'Альбом с фотографиями из восточной поездки', desc: 'Леонид Кандауров', image: '/guides.png', floor: 2 }
  ];

  const floors = [
    { label: '1 этаж', value: 1 },
    { label: '2 этаж', value: 2 }
  ];

  const floorMaps = {
    1: '/images/floor-1.svg',
    2: '/images/floor-2.svg'
  };

  let viewMode = 'list';
</script>

<div class="playtests">
  <header class="hero">
    <div class="hero-grid">
      <div class="circle">
        <img src={hero.lead} alt="Гид" loading="lazy" />
      </div>
      <p class="hero-text">{hero.text}</p>
      <button class="circle action" type="button" on:click={() => router.go(routes.ARTIFACT_JOURNAL)} aria-label="Открыть путевой дневник">
        <img src={hero.badge} alt="Дневник" loading="lazy" />
      </button>
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
      <div class="maps">
        {#each floors as floor}
          <div class="floor map-floor">
            <p class="floor-label">{floor.label}</p>
            <div class="map-image">
              <img src={floorMaps[floor.value]} alt={`Карта ${floor.label}`} loading="lazy" />
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .playtests {
    display: flex;
    flex-direction: column;
    height: 100dvh;
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
      padding: 0;
      background: rgba(243, 237, 227, 1);
      border: 1px solid rgba(255, 252, 248, 1);
    display: grid;
    place-items: center;
  }

  .circle.action {
    border: 1px solid rgba(254, 254, 252, 0.4);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .circle.action:active {
    transform: translateY(1px) scale(0.98);
    box-shadow: 0 10px 18px rgba(24, 22, 15, 0.16);
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
      overflow-y: auto;
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
    font-weight: 400;
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

  .maps {
    display: flex;
    flex-direction: column;
    gap: clamp(18px, 4vw, 26px);
  }

  .floor {
    display: flex;
    flex-direction: column;
  }

  .map-floor {
    gap: clamp(12px, 3vw, 16px);
  }

  .floor-label {
      text-align: center;
      font-family: "Prata", serif;
    margin: 0 0 clamp(14px, 3vw, 20px);
    color: rgba(178, 152, 126, 1);
    font-size: 16px;
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
    width: 104px;
    height: 104px;
    border-radius: 22px;
    overflow: hidden;
      padding: 4px;
      border: 1px solid rgba(178, 152, 126, 1);
  }

  .activity-image img {
    width: 100%;
    height: 100%;
      border-radius: 22px;
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
    font-weight: 400;
      font-family: "Prata", serif;
    color: rgba(24, 22, 15, 1);
    line-height: 1.3;
  }

  .activity-desc {
    margin: 0;
    font-size: 14px;
      font-weight: 400;
    color: rgba(24, 22, 15, 0.72);
    line-height: 1.35;
  }

  .map-image {
    padding: clamp(12px, 3vw, 16px);
    display: grid;
    place-items: center;
  }

  .map-image img {
    width: 100%;
    height: auto;
    display: block;
  }
</style>
