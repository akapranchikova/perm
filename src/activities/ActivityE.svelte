<script>
  import { router, routes } from "../router";
  import { trip1899 } from "./routeTrip1899";
  import Modal from "../components/Modal.svelte";
  import AudioWithCaptions from "../components/AudioWithCaptions.svelte";
  import KenBurnsSlideshow from "../components/KenBurnsSlideshow.svelte";
  import ActivityShell from "../components/ActivityShell.svelte";

  import TravelerMap from '../components/TravelerMap.svelte';

  const steps = {
    MAP: "MAP",
    CITY: "CITY",
    FINAL: "FINAL",
  };

  let step = $state(steps.MAP);

  // прогресс
  let visited = $state(new Set()); // cityId
  let activeCityId = null;

  let cities = $derived(trip1899.cities);
  let activeCity = $derived(cities.find((c) => c.id === activeCityId));
  
  let visitedCount = $derived(visited.size);
  let allVisited = $derived(visitedCount === cities.length);
  let canFinish = $derived(visitedCount >= 1);

  // модал общей карты экспонатов (как мокап “отдельное окно”)
  let expoModalOpen = $state(false);
  let expoCity = $state(null);

  function openCity(id) {
    activeCityId = id;
    step = steps.CITY;
    // считаем “изучено” как только открыл деталку
    visited = new Set([...visited, id]);
  }

  function backToMap() {
    activeCityId = null;
    step = allVisited ? steps.FINAL : steps.MAP;
  }

  function finishToGlobalMap() {
    // пока у нас нет “общей карты экспонатов” как отдельного экрана.
    // поэтому показываем модал с городами (как мокап) и затем выходим в плейтесты.
    expoModalOpen = true;
  }

  function openExpoCity(c) {
    expoCity = c;
  }

  function closeExpoCity() {
    expoCity = null;
  }

  function closeExpoModal() {
    expoModalOpen = false;
    expoCity = null;
    router.go(routes.PLAYTESTS);
  }

  const intro = {
    title: "Подводка от учеников",
    imageUrl: 'guides.png',
    textLines: [
      "которые когда-то закладывал",
      "Василий Дмитриевич Поленов.",
      "Мы изучаем его наследие и",
    ],
    buttonText: "Далее",
  };

  let pointsInfo = $state([
    {
      id: 'Constantinople',
      poit: null,
      title: 'Константинополь',
      titlePosition: 'right',
      isOnMap: false,
      isOpened: false
    },
    {
      id: 'Jerusalem',
      poit: null,
      title: 'Иерусалим',
      titlePosition: 'right',
      isOnMap: false,
      isOpened: false
    },
    {
      id: 'Cairo',
      poit: null,
      title: 'Каир',
      titlePosition: 'bottom',
      isOnMap: false,
      isOpened: false
    }
  ]);

  function handleMapPointTap(point) {
    alert(`Точка открыта: ${point.id}`);
    let pointInfo = pointsInfo.find(p => p.id == point.id);
    pointInfo.isOpened = true;
    openCity(point.id);    
  }
</script>

<ActivityShell {intro}>
  <div class="safe actE">
    {#if step === steps.MAP}
      <div class="header">
        <div class="title">{trip1899.title}</div>
      </div>

      <div class="mapCard card">
        <div class="map">
          <TravelerMap src="/travelerMap.svg"
            pointColor="#00FF00"
            bind:pointsInfo={pointsInfo}
            alt="Карта маршрута"
            onTap={handleMapPointTap}
            cssClass='map-container'
          />
          <!--
          <img class="mapImg" src={trip1899.mapUrl} alt="Карта маршрута" />

          {#each cities as c}
            {#if visited.has(c.id)}
              <button
                class="pin done"
                style="left:{c.pos.x}%; top:{c.pos.y}%"
                type="button"
                on:click={() => openCity(c.id)}
                aria-label={"Открыть " + c.name}
              >
                <span class="check">✓</span>
              </button>

              <div class="label" style="left:{c.pos.x}%; top:{c.pos.y}%">
                {c.name}
              </div>
            {:else}
              <button
                class="pin unknown"
                style="left:{c.pos.x}%; top:{c.pos.y}%"
                type="button"
                on:click={() => openCity(c.id)}
                aria-label={"Изучить точку: " + c.name}
              >
                <span class="q">?</span>
              </button>
            {/if}
          {/each}

          <div class="hand" aria-hidden="true"></div>
            -->
        </div>
      </div>

      <div class="hint">{trip1899.hint}</div>

      {#if canFinish}
        <button
          class="btn-primary bottomBtn"
          type="button"
          onclick={finishToGlobalMap}
        >
          Завершить
        </button>
      {/if}
    {/if}

    {#if step === steps.CITY && activeCity}
      <div class="topbar">
        <div class="cityTitle">{activeCity.name}</div>
        <button class="icon" type="button" aria-label="Звук">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M11 5L6.5 9H3v6h3.5L11 19V5z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path
              d="M16 9c1.5 1.5 1.5 4.5 0 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="guideRow">
        <img class="avatar" src={trip1899.guideAvatarUrl} alt="" />
        <div class="bubble">
          {#each activeCity.letterLines as line}
            <div class="bubbleLine">{line}</div>
          {/each}
        </div>
      </div>

      <div class="card mediaCard">
        <KenBurnsSlideshow images={activeCity.media} />
        <!-- субтитры поверх экрана -->
        <AudioWithCaptions
          src={activeCity.audioUrl}
          captions={activeCity.captions}
          autoplay={true}
        />
      </div>

      <button class="btn-primary bottomBtn" type="button" onclick={backToMap}>
        Отправиться дальше
      </button>
    {/if}

    {#if step === steps.FINAL}
      <div class="topbar">
        <div class="finalTitle">{trip1899.final.title}</div>
        <button class="icon" type="button" aria-label="Звук">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M11 5L6.5 9H3v6h3.5L11 19V5z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path
              d="M16 9c1.5 1.5 1.5 4.5 0 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="card finalCard">
        <img class="finalImg" src={trip1899.final.imageUrl} alt="" />
        <div class="finalText">
          {#each trip1899.final.textLines as l}
            <div>{l}</div>
          {/each}
        </div>
      </div>

      <button
        class="btn-primary bottomBtn"
        type="button"
        onclick={finishToGlobalMap}
      >
        {trip1899.final.button}
      </button>
    {/if}

    <!-- “Общая карта всех экспонатов” (модал-эмуляция по мокапу) -->
    <Modal
      open={expoModalOpen}
      title="Карта экспонатов"
      onClose={closeExpoModal}
    >
      <div style="margin-bottom:10px;color:rgba(17,24,39,0.6);font-size:12px;">
        Выберите город
      </div>

      <div class="expoList">
        {#each cities as c}
          <button
            class="expoItem"
            type="button"
            onclick={() => openExpoCity(c)}
          >
            <div class="expoName">{c.name}</div>
            <div class="expoMeta">
              {visited.has(c.id) ? "изучено ✓" : "не изучено ?"}
            </div>
          </button>
        {/each}
      </div>

      {#if expoCity}
        <div class="expoCity">
          <div class="expoCityHead">
            <div class="expoCityName">{expoCity.name}</div>
            <button class="expoClose" type="button" onclick={closeExpoCity}
              >Закрыть</button
            >
          </div>
          <div class="expoCityBody">
            Здесь будет окно по мокапу (контент города на общей карте).
          </div>
        </div>
      {/if}
    </Modal>
  </div>

  <style>
    .actE {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card {
      background: rgba(214, 234, 251, 0.55);
      border: 1px solid rgba(17, 24, 39, 0.06);
      border-radius: 18px;
      backdrop-filter: blur(10px);
    }

    .header .title {
      font-weight: 800;
      font-size: 20px;
      color: rgba(17, 24, 39, 0.92);
    }

    .mapCard {
      padding: 10px;
    }
    .map {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      aspect-ratio: 3 / 4;
      background: rgba(0, 0, 0, 0.04);
    }
    .mapImg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    :global(.map-container) {
      width: 100%;
      height: 100%;
      display: block;
    }

    .pin {
      position: absolute;
      transform: translate(-50%, -50%);
      width: 34px;
      height: 34px;
      border-radius: 999px;
      border: 1px solid rgba(17, 24, 39, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
    }
    .pin.unknown {
      background: rgba(255, 255, 255, 0.75);
    }
    .pin.done {
      background: rgba(59, 130, 246, 0.95);
      border-color: rgba(59, 130, 246, 0.3);
      color: white;
    }
    .q {
      font-weight: 900;
      color: rgba(17, 24, 39, 0.55);
    }
    .check {
      font-weight: 900;
    }

    .label {
      position: absolute;
      transform: translate(8px, -50%);
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(17, 24, 39, 0.06);
      font-size: 12px;
      font-weight: 800;
      color: rgba(17, 24, 39, 0.72);
      backdrop-filter: blur(10px);
      white-space: nowrap;
    }

    .hand {
      position: absolute;
      right: 14px;
      bottom: 14px;
      width: 54px;
      height: 54px;
      border-radius: 18px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.18);
    }

    .hint {
      text-align: center;
      font-size: 12px;
      color: rgba(17, 24, 39, 0.6);
      white-space: pre-line;
      font-weight: 700;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding-top: 2px;
    }
    .cityTitle,
    .finalTitle {
      font-weight: 800;
      font-size: 20px;
      color: rgba(17, 24, 39, 0.92);
      line-height: 1.1;
      white-space: pre-line;
    }
    .icon {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(17, 24, 39, 0.08);
      color: rgba(17, 24, 39, 0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
    }

    .guideRow {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar {
      width: 46px;
      height: 46px;
      border-radius: 999px;
      object-fit: cover;
      background: rgba(0, 0, 0, 0.06);
      flex: 0 0 auto;
    }
    .bubble {
      flex: 1;
      border-radius: 16px;
      background: rgba(214, 234, 251, 0.75);
      border: 1px solid rgba(17, 24, 39, 0.06);
      padding: 10px 12px;
      min-height: 52px;
    }
    .bubbleLine {
      font-size: 13px;
      line-height: 1.2;
      color: rgba(17, 24, 39, 0.62);
      font-weight: 600;
    }

    .mediaCard {
      position: relative;
      padding: 10px;
      flex: 1;
    }
    /* субтитры в AudioWithCaptions позиционируются absolute; тут обеспечим “контейнер” */
    .mediaCard :global(.captions) {
      bottom: 16px;
    }

    .finalCard {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }
    .finalImg {
      width: 100%;
      border-radius: 16px;
      display: block;
      background: rgba(255, 255, 255, 0.55);
    }
    .finalText {
      text-align: center;
      padding: 4px 8px 10px;
      font-size: 13px;
      line-height: 1.25;
      color: rgba(17, 24, 39, 0.6);
      font-weight: 700;
    }

    .bottomBtn {
      width: 100%;
      border-radius: 16px;
      padding: 16px 14px;
      font-size: 15px;
      margin-top: auto;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
      border: 0;
      font-weight: 900;
    }

    /* modal list */
    .expoList {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .expoItem {
      text-align: left;
      border-radius: 16px;
      padding: 12px 12px;
      border: 1px solid rgba(17, 24, 39, 0.08);
      background: rgba(255, 255, 255, 0.75);
    }
    .expoName {
      font-weight: 900;
      color: rgba(17, 24, 39, 0.85);
    }
    .expoMeta {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(17, 24, 39, 0.55);
      font-weight: 700;
    }

    .expoCity {
      margin-top: 14px;
      padding: 12px;
      border-radius: 16px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.18);
    }
    .expoCityHead {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .expoCityName {
      font-weight: 900;
    }
    .expoClose {
      border: 0;
      background: rgba(59, 130, 246, 0.14);
      color: rgba(30, 64, 175, 0.95);
      padding: 10px 12px;
      border-radius: 14px;
      font-weight: 800;
    }
    .expoCityBody {
      margin-top: 10px;
      color: rgba(17, 24, 39, 0.7);
      font-size: 13px;
      line-height: 1.35;
    }
  </style>
</ActivityShell>
