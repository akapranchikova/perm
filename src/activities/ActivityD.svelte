<script>
  import { router, routes } from "../router";
  //import ZoomPan from "../components/ZoomPan.svelte";
  import ActivityShell from "../components/ActivityShell.svelte";
  import { getArtifactForActivity } from "../data/artifacts";

  import NasturtiumsPainting from '../components/NasturtiumsPainting.svelte';
  import CommonButton from '../components/CommonButton.svelte';

  const steps = {
    FIND: "FIND", // зум и “тап по шару”
    LEADIN: "LEADIN", // подводка к квизу
    QUIZ: "QUIZ", // вопрос + 3 ответа
    FINAL: "FINAL",
  };

  let step = $state(steps.FIND);

  // guide texts (из мокапа)
  const guide = {
    avatar: "/guide.png",
    findText: ["объект, который", "кажется необычным", "и нажми на него"],
    hintText: ["Обрати внимание на", "правый нижний угол", "картины"],
    leadinTitle: "Подводка к квизу",
    leadinText: [
      "которые когда-то закладывал",
      "Василий Дмитриевич Поленов.",
      "Мы изучаем его наследие и",
    ],
  };  
  
  function handlePaintingRightBottomTap() {
    console.log('Тап по специальной области!');
    alert('Вы нашли специальную область!');
    step = steps.LEADIN;
  }
  
  function handlePaintingMaxWrongTaps() {
    if (!hintShown) {
      hintShown = true;
    }
    console.log('Достигнуто максимальное количество неправильных тапов.');
    alert('Слишком много неправильных кликов! Картина будет увеличена.');
  }

  // “зона шара”: вся правая нижняя часть — ок.
  // используем нормированные координаты 0..1
  /*const targetZone = { x0: 0.55, y0: 0.55, x1: 1.0, y1: 1.0 };

  let wrongTaps = 0;
  const HINT_AFTER = 3;*/
  let hintShown = $state(false);

  /*
  let zoomPanRef;

  function inZone(p) {
    return (
      p.x >= targetZone.x0 &&
      p.x <= targetZone.x1 &&
      p.y >= targetZone.y0 &&
      p.y <= targetZone.y1
    );
  } */

  /*
  function onPaintingTap(e) {
    // e.detail: {x,y}
    if (step !== steps.FIND) return;

    const p = e.detail;

    if (inZone(p)) {
      // нашли “шар”
      step = steps.LEADIN;
      return;
    }

    wrongTaps += 1;

    if (!hintShown && wrongTaps >= HINT_AFTER) {
      hintShown = true;
      // подсказка + автозум к левому нижнему углу (как ты описал)
      zoomPanRef?.zoomToLeftBottom?.();
    }
  }
  */

  function startQuiz() {
    step = steps.QUIZ;
  }

  // quiz 1 вопрос, 3 ответа (мокап “Вопрос по шару”)
  const quiz = {
    question: "С какой целью Коровин изобразил этот шар на картине?",
    imageUrl: "/quiz-d.jpg",
    answers: ["Ответ 1", "Ответ 2", "Ответ 3"],
    correctIndex: 1,
  };

  let chosen = $state(null);
  let isCorrect = $state(null);

  function choose(i) {
    if (chosen !== null) return;
    chosen = i;
    isCorrect = i === quiz.correctIndex;

    setTimeout(() => {
      step = steps.FINAL;
    }, 350);
  }

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_D);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
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
</script>

<style>
  /* TODO: modify this style */
  :global(.nasturtiums-painting-container) {
    background-color: red;
    height: 250px;
  }
</style>

<ActivityShell {intro}>
  <div class="safe actD">
    {#if step === steps.FIND}
      <div class="topbar">
        <div class="spacer"></div>
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

      <div class="paintingCard card">
        <div class="paintingArea">
          <!-- TODO: this is replaced by NasturtiumsPainting
          <ZoomPan
            bind:this={zoomPanRef}
            src="/painting-d.png"
            alt="Картина"
            on:tap={onPaintingTap}
          /> -->
          <NasturtiumsPainting
            containerCssClass='nasturtiums-painting-container'
            paintingStartMinPadding={10}
            src="/painting-d.png"
            alt="Картина 'Настурции'. Константин Алексеевич Коровин"
            maxScale={10}
            minScale={1}
            maxWrongTapsCount={3}
            onRightBottomTap={handlePaintingRightBottomTap}
            onMaxWrongTaps={handlePaintingMaxWrongTaps}
          />

          <!-- иконка “тап” (как в мокапе) --
          <div class="tapIcon" aria-hidden="true"></div>

          !-- подсветка зоны на мокапе справа снизу (покажем только когда подсказка) --
          {#if hintShown}
            <div class="zoneRing" aria-hidden="true"></div>
          {/if}-->
        </div>
      </div>

      <div class="guideRow">
        <img class="avatar" src={guide.avatar} alt="" />
        <div class="bubble">
          {#if hintShown}
            {#each guide.hintText as line}
              <div class="bubbleLine">{line}</div>
            {/each}
          {:else}
            {#each guide.findText as line}
              <div class="bubbleLine">{line}</div>
            {/each}
          {/if}
        </div>
      </div>
    {/if}

    {#if step === steps.LEADIN}
      <div class="topbar">
        <div class="title">Подводка к квизу</div>
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

      <div class="card leadinCard">
        <img class="portrait" src={guide.avatar} alt="Гид" />
        <div class="leadinText">
          {#each guide.leadinText as line}
            <div>{line}</div>
          {/each}
        </div>
      </div>

      <!--<button class="btn-primary bottomBtn" type="button" on:click={startQuiz}>
        Начать
      </button>-->
      <CommonButton text='Начать'
        fillMode='filled'
        colorMode='dark'
        cssClass='bottomBtn'
        disabled={false}
        onTap={startQuiz}
      />
    {/if}

    {#if step === steps.QUIZ}
      <div class="topbar">
        <div class="title">Вопрос по шару</div>
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
        <img class="avatar" src={guide.avatar} alt="" />
        <div class="bubble">
          <div class="bubbleLine">{quiz.question}</div>
        </div>
      </div>

      <div class="card quizImgCard">
        <img class="qimg" src={quiz.imageUrl} alt="" />
      </div>

      <div class="answers">
        {#each quiz.answers as a, i}
          <!--<button
            class="answerBtn"
            type="button"
            on:click={() => choose(i)}
            disabled={chosen !== null}
          >
            {a}
          </button>-->
          <CommonButton text={a}
            fillMode='bordered'
            colorMode='dark'
            cssClass='answerBtn'
            disabled={chosen !== null}
            onTap={() => choose(i)}
          />
        {/each}
      </div>
    {/if}

    {#if step === steps.FINAL}
      <div class="topbar">
        <div class="title">
          {#if isCorrect}Верно{:else}Не верно{/if} + послесловие от гидов
        </div>
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
        <img class="finalImg" src="/final-d.jpg" alt="" />
        <div class="finalCaption">
          которые когда-то закладывал <b>Василий Дмитриевич Поленов</b>.<br />
          Мы изучаем его наследие и
        </div>
      </div>

      <!--<button class="btn-primary bottomBtn" type="button" on:click={finish}>
        За новым секретом
      </button>-->
      <CommonButton text='За новым секретом'
        fillMode='filled'
        colorMode='dark'
        cssClass='bottomBtn'
        disabled={false}
        onTap={finish}
      />
    {/if}
  </div>

  <style>
    .actD {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding-top: 2px;
      min-height: 36px;
    }
    .title {
      font-weight: 800;
      font-size: 20px;
      color: rgba(17, 24, 39, 0.92);
      line-height: 1.1;
      max-width: 300px;
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

    .card {
      background: rgba(214, 234, 251, 0.55);
      border: 1px solid rgba(17, 24, 39, 0.06);
      border-radius: 18px;
      backdrop-filter: blur(10px);
    }

    .paintingCard {
      padding: 10px;
    }
    .paintingArea {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.04);
    }

    .tapIcon {
      position: absolute;
      left: 50%;
      bottom: 12px;
      transform: translateX(-50%);
      width: 46px;
      height: 46px;
      opacity: 0.9;
      background: rgba(59, 130, 246, 0.12);
      border-radius: 999px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .tapIcon::after {
      content: "";
      position: absolute;
      left: 18px;
      top: 14px;
      width: 10px;
      height: 14px;
      border-radius: 8px;
      background: rgba(59, 130, 246, 0.35);
    }

    .zoneRing {
      position: absolute;
      right: 8%;
      bottom: 10%;
      width: 120px;
      height: 120px;
      border-radius: 999px;
      border: 3px solid rgba(59, 130, 246, 0.55);
      background: rgba(59, 130, 246, 0.08);
      pointer-events: none;
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

    .leadinCard {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      text-align: center;
    }
    .portrait {
      width: 100%;
      max-width: 260px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.55);
    }
    .leadinText {
      color: rgba(17, 24, 39, 0.6);
      font-weight: 700;
      line-height: 1.25;
      font-size: 13px;
    }

    .quizImgCard {
      padding: 10px;
    }
    .qimg {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.55);
      display: block;
    }

    .answers {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .answerBtn {
      width: 100%;
      /*border-radius: 14px;
      padding: 14px 14px;
      font-weight: 800;
      color: rgba(17, 24, 39, 0.75);
      background: rgba(214, 234, 251, 0.95);
      border: 1px solid rgba(17, 24, 39, 0.06);*/
    }
    /*.answerBtn:disabled {
      opacity: 0.88;
    }*/

    .finalCard {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .finalImg {
      width: 100%;
      border-radius: 16px;
      display: block;
      background: rgba(255, 255, 255, 0.55);
    }
    .finalCaption {
      text-align: center;
      padding: 4px 8px 10px;
      font-size: 13px;
      line-height: 1.25;
      color: rgba(17, 24, 39, 0.6);
      font-weight: 700;
    }

    .bottomBtn {
      width: 100%;
      /*border-radius: 16px;
      padding: 16px 14px;
      font-size: 15px;*/
      margin-top: auto;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
      border: 0;
      font-weight: 900;
    }
  </style>
</ActivityShell>
