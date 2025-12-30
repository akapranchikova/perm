<script>
  import { router, routes } from "../router";

  import { assetsStore } from "../stores/assets";
  $: getSrc = (src) => $assetsStore.get(src) || src;

  import { settings } from "../stores/settings";
  import { collectedArtifacts } from "../stores/artifacts";
  import PaintingVisitorMap from "../components/PaintingVisitorMap.svelte";
  import { onMount } from "svelte";

  const hero = {
    lead: "/guide.png",
    badge: "/book.png",
    text: "Изучайте экспонаты, отмеченные на карте, и наполняйте путевой дневник артефактами",
  };

  const items = [
    {
      id: routes.ACTIVITY_B,
      title: "Приветственный адрес Поленову от учеников",
      desc: "Василий Поленов",
      image: "/activityList/01.png",
      floor: 1,
    },
    {
      id: routes.ACTIVITY_A,
      title: "Пастух со стадом",
      desc: "Егише Татевосян",
      image: "/activityList/03.png",
      floor: 2,
    },
    {
      id: routes.ACTIVITY_E,
      title: "Альбом с фотографиями из восточной поездки",
      desc: "Леонид Кандауров",
      image: "/activityList/04.png",
      floor: 2,
    },
    {
      id: routes.ACTIVITY_F,
      title: "Больная",
      desc: "Василий Поленов",
      image: "/activityList/05.png",
      floor: 2,
    },
    {
      id: routes.ACTIVITY_D,
      title: "Настурции",
      desc: "Константин Коровин",
      image: "/activityList/06.png",
      floor: 2,
    },
  ];

  let floors = [];

  function updateFloors() {
    function paintingIsVisited(activityId) {
      return (
        Array.isArray($collectedArtifacts) &&
        $collectedArtifacts.some(
          (artifact) => artifact.activityRoute === activityId
        )
      );
    }

    floors = [
      {
        label: "1 этаж",
        value: 1,
        markedMapSrc: "/images/floor-1-marked.svg",
        pointsInfo: [
          {
            id: "activityC",
            poit: null,
            title: "Музыкальная рукопись «Анна Бретонская»",
            titlePosition: "bottom",
            shouldShowTitle: false,
            isOnMap: false,
            isOpened: paintingIsVisited(routes.ACTIVITY_C),
            shouldDisplay: false,
            onTap: () => router.go(routes.ACTIVITY_C),
          },
          {
            id: "activityB",
            poit: null,
            title: "Приветственный адрес Поленову от учеников",
            titlePosition: "right",
            shouldShowTitle: false,
            isOnMap: false,
            isOpened: paintingIsVisited(routes.ACTIVITY_B),
            shouldDisplay: true,
            onTap: () => router.go(routes.ACTIVITY_B),
          },
        ],
      },
      {
        label: "2 этаж",
        value: 2,
        markedMapSrc: "/images/floor-2-marked.svg",
        pointsInfo: [
          {
            id: "activityF",
            poit: null,
            title: "Больная — Василий Поленов",
            titlePosition: "right",
            shouldShowTitle: false,
            isOnMap: false,
            isOpened: paintingIsVisited(routes.ACTIVITY_F),
            shouldDisplay: true,
            onTap: () => router.go(routes.ACTIVITY_F),
          },
          {
            id: "activityD",
            poit: null,
            title: "Настурции — Константин Коровин",
            titlePosition: "top",
            shouldShowTitle: false,
            isOnMap: false,
            isOpened: paintingIsVisited(routes.ACTIVITY_D),
            shouldDisplay: true,
            onTap: () => router.go(routes.ACTIVITY_D),
          },
          {
            id: "activityA",
            poit: null,
            title: "Пастух со стадом — Егише Татевосян",
            titlePosition: "bottom",
            shouldShowTitle: false,
            isOnMap: false,
            isOpened: paintingIsVisited(routes.ACTIVITY_A),
            shouldDisplay: true,
            onTap: () => router.go(routes.ACTIVITY_A),
          },
          {
            id: "activityE",
            poit: null,
            title: "Альбом с фотографиями из восточной поездки",
            titlePosition: "left",
            shouldShowTitle: false,
            isOnMap: false,
            isOpened: paintingIsVisited(routes.ACTIVITY_E),
            shouldDisplay: true,
            onTap: () => router.go(routes.ACTIVITY_E),
          },
        ],
      },
    ];
  }

  onMount(() => {
    updateFloors();
  });

  $: {
    updateFloors();
  }

  const floorMaps = {
    1: "/images/floor-1.svg",
    2: "/images/floor-2.svg",
  };

  let viewMode = "list";

  $: isCompleted = (activityId) => {
    return $collectedArtifacts.some(
      (artifact) => artifact.activityRoute === activityId
    );
  };
</script>

<div class="playtests">
  <header class="hero">
    <div class="hero-grid">
      <div class="circle">
        <img src={hero.lead} alt="Гид" />
      </div>
      <p class="hero-text">{hero.text}</p>
      <button
        class="circle action"
        type="button"
        on:click={() => router.go(routes.ARTIFACT_JOURNAL)}
        aria-label="Открыть путевой дневник"
      >
        <img src={hero.badge} alt="Дневник" />
      </button>
    </div>
  </header>

  <section class="content">
    <div class="switcher" role="tablist" aria-label="Режим отображения">
      <button
        class:active={viewMode === "list"}
        on:click={() => (viewMode = "list")}
        role="tab"
        aria-selected={viewMode === "list"}
      >
        Список
      </button>
      <button
        class:active={viewMode === "map"}
        on:click={() => (viewMode = "map")}
        role="tab"
        aria-selected={viewMode === "map"}
      >
        Карта
      </button>
    </div>

    {#if viewMode === "list"}
      <div class="floors">
        {#each floors as floor}
          <div class="floor">
            <p class="floor-label">{floor.label}</p>
            <div class="activities">
              {#each items.filter((it) => it.floor === floor.value) as it}
                <button class="activity" on:click={() => router.go(it.id)}>
                  <div class="activity-image">
                    <img src={getSrc(it.image)} alt={it.title} />

                    <!-- 3. Условный рендеринг оверлея -->
                    {#if isCompleted(it.id)}
                      <div class="completed-overlay">
                        <!-- Здесь SVG галочки. Можно заменить на <img src="..."> если есть файл -->
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="white"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </div>
                    {/if}
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
              <PaintingVisitorMap
                src={floor.markedMapSrc}
                pointColor="#00FF00"
                pointsInfo={floor.pointsInfo}
                alt="Карта этажа"
                cssClass=""
              />
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
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    overflow: hidden;
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
    width: 58px;
    height: 58px;
    border-radius: 50%;
    overflow: hidden;
    padding: 0;
    border: 1px solid rgba(255, 252, 248, 1);
    display: grid;
    place-items: center;
  }

  .circle.action {
    border: 1px solid rgba(254, 254, 252, 0.4);
    cursor: pointer;
    transform: rotate(24deg);
  }

  .circle.action:active {
    transform: translateY(1px) scale(0.98);
  }

  .circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-text {
    margin: 0;
    font-size: 16px;
    line-height: 1.2;
    font-weight: 500;
  }

  .content {
    flex: 1;
    background: rgba(254, 254, 252, 1);
    border-radius: 28px 28px 0 0;
    padding: clamp(16px, 4vw, 20px);
    display: flex;
    overflow-y: auto;
    flex-direction: column;
    gap: 28px;
  }

  .switcher {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    align-items: center;
    background: rgba(243, 237, 227, 1);
    border-radius: 51px;
    padding: 5px 4px 4px;
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
    transition:
      background 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
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
    margin-bottom: 20px;
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
    border-radius: 24px;
    overflow: hidden;
    padding: 4px;
    border: 1px solid rgba(178, 152, 126, 1);
    /* 4. Добавляем position relative, чтобы оверлей позиционировался относительно картинки */
    position: relative;
  }

  .activity-image img {
    width: 100%;
    height: 100%;
    border-radius: 22px;
    object-fit: cover;
    display: block;
  }

  .completed-overlay {
    position: absolute;
    top: 4px; /* Учитываем padding родителя */
    left: 4px;
    right: 4px;
    bottom: 4px;
    background: rgba(178, 152, 126, 0.6); /* Полупрозрачный акцентный цвет */
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    backdrop-filter: blur(1px); /* Опционально: легкое размытие */
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
    font-size: 12px;
    font-weight: 400;
    color: rgba(24, 22, 15, 1);
    line-height: 1.25;
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
