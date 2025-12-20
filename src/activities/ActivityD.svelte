<script>
  import { router, routes } from "../router";
  //import ZoomPan from "../components/ZoomPan.svelte";
  import ActivityShell from "../components/ActivityShell.svelte";
  import { getArtifactForActivity } from "../data/artifacts";
  import { settings } from "../stores/settings";

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
    step = steps.LEADIN;
  }
  
  function handlePaintingMaxWrongTaps() {
    if (!hintShown) {
      hintShown = true;
    }
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
    title: "Настурции",
    subtitle: "Константин Коровин",
    description:
      "Константин Коровин был учеником Поленова. Эту картину он подарил Наталье Васильевне Поленовой, жене своего учителя",
    imageUrl: "/painting-d.png",
    imageAlt: "Настурции — Константин Коровин",
    floorLabel: "2 этаж",
    buttonText: "Начать",
  };
</script>

<ActivityShell {intro}>
  <div class="safe actD">
    {#if step === steps.FIND}
      <section class="screen screen--find">
        <div class="arch-bg"></div>
        <div class="screen-overlay"></div>
        <div class="top-gradient"></div>
        <div class="bottom-gradient"></div>

        <header class="topbar">
          <div class="logo-group">
            <span class="logo logo-sber-circle" aria-hidden="true"></span>
            <span class="logo logo-cross" aria-hidden="true"></span>
            <span class="logo logo-arch" aria-hidden="true"></span>
          </div>

          <button
            class="sound-btn"
            class:muted={!$settings.audioEnabled}
            type="button"
            aria-label={$settings.audioEnabled ? "Выключить звук" : "Включить звук"}
            onclick={() =>
              settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }))
            }
          >
            <img src="/assets/sound.svg" alt="" />
          </button>
        </header>

        {#if hintShown}
          <div class="floating-hint">
            <img class="floating-avatar" src={guide.avatar} alt="Гид" />
            <div class="floating-bubble">
              {#each guide.hintText as line}
                <div class="bubbleLine">{line}</div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="paintingShell">
          <div class="paintingFrame">
            <NasturtiumsPainting
              containerCssClass='nasturtiums-painting-container'
              paintingStartMinPadding={18}
              src="/painting-d.png"
              alt="Картина 'Настурции'. Константин Алексеевич Коровин"
              maxScale={10}
              minScale={1}
              maxWrongTapsCount={3}
              onRightBottomTap={handlePaintingRightBottomTap}
              onMaxWrongTaps={handlePaintingMaxWrongTaps}
            />
          </div>
        </div>

        <div class="findCaption">
          <div class="tapIcon" aria-hidden="true">
            <svg width="41" height="47" viewBox="0 0 41 47" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.8226 16.0099C7.8226 16.3902 7.68794 16.7198 7.41862 16.9987C7.16154 17.2649 6.84937 17.398 6.48211 17.398H1.34049C0.973235 17.398 0.654944 17.2649 0.385621 16.9987C0.12854 16.7198 0 16.3902 0 16.0099C0 15.6297 0.12854 15.3064 0.385621 15.0402C0.654944 14.7613 0.973235 14.6219 1.34049 14.6219H6.48211C6.84937 14.6219 7.16154 14.7613 7.41862 15.0402C7.68794 15.3064 7.8226 15.6297 7.8226 16.0099ZM10.0078 10.4008C9.75071 10.667 9.43854 10.8064 9.07128 10.8191C8.70402 10.8191 8.38573 10.6796 8.11641 10.4008L4.51728 6.63595C4.24796 6.36975 4.11329 6.04651 4.11329 5.66622C4.12554 5.27326 4.2602 4.93735 4.51728 4.65847C4.77436 4.40495 5.08653 4.27819 5.45379 4.27819C5.82105 4.26551 6.13934 4.39227 6.40866 4.65847L10.0078 8.46131C10.2894 8.71483 10.424 9.03807 10.4118 9.43103C10.4118 9.81131 10.2771 10.1346 10.0078 10.4008ZM15.4799 8.08102C15.1127 8.08102 14.7944 7.94792 14.5251 7.68173C14.268 7.40285 14.1394 7.07961 14.1394 6.712V1.38803C14.1394 0.995075 14.268 0.665496 14.5251 0.399298C14.7944 0.133099 15.1127 0 15.4799 0C15.8472 0 16.1594 0.133099 16.4165 0.399298C16.6858 0.665496 16.8204 0.995075 16.8204 1.38803V6.712C16.8204 7.07961 16.6858 7.40285 16.4165 7.68173C16.1594 7.94792 15.8472 8.08102 15.4799 8.08102ZM20.9154 10.4198C20.6583 10.1409 20.5297 9.81131 20.5297 9.43103C20.5297 9.05075 20.6583 8.72751 20.9154 8.46131L24.5512 4.67749C24.8083 4.41129 25.1205 4.28453 25.4877 4.2972C25.855 4.2972 26.1733 4.42396 26.4426 4.67749C26.6997 4.94369 26.8282 5.27326 26.8282 5.66622C26.8282 6.04651 26.6997 6.36975 26.4426 6.63595L22.8251 10.4198C22.5435 10.686 22.2191 10.8191 21.8519 10.8191C21.4969 10.8191 21.1847 10.686 20.9154 10.4198ZM32.7778 46.0904C29.9866 47.1425 27.2322 47.2819 24.5145 46.5087C21.809 45.7481 19.2443 43.8087 16.8204 40.6903L10.981 33.2178C10.8831 33.091 10.7852 32.9452 10.6872 32.7804C10.5893 32.6156 10.5036 32.4255 10.4301 32.21C10.2343 31.6523 10.2588 31.1072 10.5036 30.5748C10.7484 30.0297 11.183 29.6431 11.8074 29.4149C12.2603 29.2375 12.6827 29.2184 13.0744 29.3579C13.4784 29.4846 13.8579 29.7508 14.2129 30.1565L18.6384 35.0812C18.9199 35.3854 19.1831 35.4931 19.428 35.4044C19.5626 35.341 19.6606 35.2396 19.7218 35.1002C19.783 34.9481 19.7769 34.7706 19.7034 34.5678L13.0928 15.7627C12.8602 15.0909 12.8602 14.4761 13.0928 13.9184C13.3254 13.3479 13.7416 12.9487 14.3414 12.7205C14.9168 12.5177 15.4677 12.5494 15.9941 12.8156C16.5327 13.0818 16.9184 13.5571 17.151 14.2416L21.705 27.2093C21.8151 27.5262 21.9621 27.7417 22.1457 27.8558C22.3416 27.9698 22.5374 27.9889 22.7333 27.9128C22.9047 27.8494 23.0271 27.7163 23.1006 27.5135C23.174 27.298 23.1556 27.0318 23.0455 26.7149L21.6499 22.779C21.4173 22.1071 21.6682 21.6255 22.4028 21.3339C23.1985 21.0424 23.9452 21.0614 24.643 21.3909C25.3408 21.7078 25.8672 22.386 26.2222 23.4255L26.8833 25.2698C26.9935 25.5994 27.1404 25.8149 27.324 25.9163C27.5077 26.0177 27.6974 26.0304 27.8933 25.9543C28.0769 25.891 28.2054 25.7579 28.2789 25.555C28.3523 25.3396 28.3279 25.0734 28.2054 24.7565L27.5077 22.76C27.2751 22.0755 27.526 21.5938 28.2605 21.3149C29.0563 21.0233 29.8091 21.0677 30.5192 21.448C31.2414 21.8156 31.7679 22.4684 32.0984 23.4064L32.4289 24.3572C32.5513 24.6741 32.7044 24.8896 32.888 25.0036C33.0716 25.105 33.2614 25.1177 33.4572 25.0417C33.6409 24.9783 33.7694 24.8452 33.8429 24.6424C33.9163 24.4396 33.8918 24.1734 33.7694 23.8438L33.2736 22.3797C33.1022 21.9233 33.2491 21.6128 33.7143 21.448C34.5713 21.1184 35.471 21.2959 36.4137 21.9804C37.3685 22.6649 38.1153 23.7804 38.6539 25.3269L39.8659 28.7304C40.8085 31.4558 41.1635 33.9593 40.931 36.241C40.7106 38.5227 39.9149 40.5002 38.5438 42.1734C37.1727 43.8594 35.2507 45.165 32.7778 46.0904Z" fill="#FEFEFC"/>
            </svg>
          </div>
          <div class="captionText">Выберите объект на картине, который кажется необычным</div>
        </div>
      </section>
    {/if}

    {#if step === steps.LEADIN}
      <section class="screen screen--hero">
        <div class="arch-bg"></div>
        <div class="screen-overlay"></div>
        <div class="top-gradient"></div>
        <div class="bottom-gradient"></div>

        <header class="topbar">
          <div class="logo-group">
            <span class="logo logo-sber-circle" aria-hidden="true"></span>
            <span class="logo logo-cross" aria-hidden="true"></span>
            <span class="logo logo-arch" aria-hidden="true"></span>
          </div>

          <button
            class="sound-btn"
            class:muted={!$settings.audioEnabled}
            type="button"
            aria-label={$settings.audioEnabled ? "Выключить звук" : "Включить звук"}
            onclick={() =>
              settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }))
            }
          >
            <img src="/assets/sound.svg" alt="" />
          </button>
        </header>

        <div class="heroImage">
          <img src="/assets/woman.png" alt="Гид" />
        </div>

        <div class="contentPanel dark">
          <div class="panelText">
            Все верно! Этот шар кажется маленьким и незначительным, но Коровин разместил его специально
          </div>
          <CommonButton text='Далее'
            fillMode='filled'
            colorMode='light'
            cssClass='bottomBtn'
            disabled={false}
            onTap={startQuiz}
          />
        </div>
      </section>
    {/if}

    {#if step === steps.QUIZ}
      <section class="screen screen--quiz">
        <header class="topbar topbar--light">
          <div class="logo-group logo-group--accent">
            <span class="logo logo-sber-circle" aria-hidden="true"></span>
            <span class="logo logo-cross" aria-hidden="true"></span>
            <span class="logo logo-arch" aria-hidden="true"></span>
          </div>

          <button
            class="sound-btn sound-btn--light"
            class:muted={!$settings.audioEnabled}
            type="button"
            aria-label={$settings.audioEnabled ? "Выключить звук" : "Включить звук"}
            onclick={() =>
              settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }))
            }
          >
            <img src="/assets/sound.svg" alt="" />
          </button>
        </header>

        <div class="quizContent">
          <div class="quizTitle">{quiz.question}</div>

          <div class="answers">
            {#each quiz.answers as a, i}
              <CommonButton text={a}
                fillMode='bordered'
                colorMode='dark'
                cssClass={`answerBtn ${chosen === i ? 'answerBtn--chosen' : ''}`}
                disabled={chosen !== null}
                onTap={() => choose(i)}
              />
            {/each}
          </div>
        </div>
      </section>
    {/if}

    {#if step === steps.FINAL}
      <section class="screen screen--hero">
        <div class="arch-bg"></div>
        <div class="screen-overlay"></div>
        <div class="top-gradient"></div>
        <div class="bottom-gradient"></div>

        <header class="topbar">
          <div class="logo-group">
            <span class="logo logo-sber-circle" aria-hidden="true"></span>
            <span class="logo logo-cross" aria-hidden="true"></span>
            <span class="logo logo-arch" aria-hidden="true"></span>
          </div>

          <button
            class="sound-btn"
            class:muted={!$settings.audioEnabled}
            type="button"
            aria-label={$settings.audioEnabled ? "Выключить звук" : "Включить звук"}
            onclick={() =>
              settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }))
            }
          >
            <img src="/assets/sound.svg" alt="" />
          </button>
        </header>

        <div class="heroImage">
          <img src="/assets/woman.png" alt="Гид" />
        </div>

        <div class="contentPanel dark">
          <div class="panelText">
            Посмотрите на блик, на глубину тени, на мягкий переход света. Шар — это упражнение
          </div>
          <CommonButton text='Завершить'
            fillMode='filled'
            colorMode='light'
            cssClass='bottomBtn'
            disabled={false}
            onTap={finish}
          />
        </div>
      </section>
    {/if}
  </div>

  <style>
    .actD {
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #18160f;
      color: #fefefc;
      position: relative;
    }

    .screen {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      color: #fefefc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      isolation: isolate;
    }

    .screen--find {
      background: #18160f;
    }

    .screen--quiz {
      background: #fdfaf5;
      color: var(--txt-primary);
      padding: 28px 18px 36px;
      box-sizing: border-box;
      justify-content: flex-start;
      gap: 26px;
    }

    .screen--hero {
      background: #18160f;
    }

    .arch-bg {
      position: absolute;
      inset: 0;
      background: url("/images/background1.png") center / cover no-repeat;
      z-index: -3;
      filter: saturate(0.95);
    }

    .screen-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(24, 22, 15, 0.25) 60%);
      z-index: -2;
    }

    .top-gradient,
    .bottom-gradient {
      position: absolute;
      left: 0;
      right: 0;
      pointer-events: none;
      z-index: -1;
    }
    .top-gradient {
      top: 0;
      height: 200px;
      background: linear-gradient(180deg, rgba(16, 13, 10, 0.85) 0%, rgba(16, 13, 10, 0.2) 70%, transparent 100%);
    }
    .bottom-gradient {
      bottom: 0;
      height: 320px;
      background: linear-gradient(180deg, rgba(16, 13, 10, 0) 0%, rgba(16, 13, 10, 0.82) 100%);
    }

    .topbar {
      position: absolute;
      top: 18px;
      left: 18px;
      right: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 4;
      color: #fefefc;
    }

    .topbar--light {
      position: relative;
      top: 0;
      left: 0;
      right: 0;
      color: var(--txt-primary);
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo {
      display: inline-block;
      background-repeat: no-repeat;
      background-size: contain;
      background-position: center;
    }
    .logo-sber-circle {
      width: 38px;
      height: 38px;
      background-image: url("/assets/logo-sber-circle.png");
    }
    .logo-cross {
      width: 22px;
      height: 1.5px;
      background: currentColor;
      transform: rotate(-45deg);
      position: relative;
    }
    .logo-cross::after {
      content: "";
      position: absolute;
      width: 22px;
      height: 1.5px;
      background: currentColor;
      transform: rotate(90deg);
    }
    .logo-arch {
      width: 38px;
      height: 38px;
      background-image: url("/assets/logo-arch.png");
    }

    .logo-group--accent {
      color: #b2987e;
    }
    .logo-group--accent .logo-sber-circle {
      filter: invert(51%) sepia(6%) saturate(1524%) hue-rotate(348deg) brightness(92%) contrast(88%);
    }
    .logo-group--accent .logo-arch {
      filter: invert(51%) sepia(6%) saturate(1524%) hue-rotate(348deg) brightness(92%) contrast(88%);
    }

    .sound-btn {
      width: 48px;
      height: 46px;
      padding: 0;
    }
    .sound-btn--light {
      background: rgba(255, 255, 255, 0.8);
      border-color: rgba(178, 152, 126, 0.45);
      width: 44px;
      height: 44px;
      color: var(--text-primary);
      box-shadow: 0 8px 18px rgba(24, 22, 15, 0.12);
    }
    .sound-btn--light img {
      filter: invert(28%) sepia(10%) saturate(773%) hue-rotate(350deg) brightness(96%) contrast(91%);
    }

    .paintingShell {
      position: absolute;
      inset: 0 0 100px;
      display: flex;
      align-items: center;
        z-index: 2;
      justify-content: center;
    }
    .paintingFrame {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    :global(.nasturtiums-painting-container) {
      width: 100%;
      height: 100%;
      border-radius: 14px;
      background: rgba(12, 10, 8, 0.6);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
    }
    :global(.nasturtiums-painting-container .image) {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }

    .findCaption {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 0 22px 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      text-align: center;
      background: linear-gradient(180deg, rgba(16, 13, 10, 0) 0%, rgba(16, 13, 10, 0.75) 60%, rgba(16, 13, 10, 0.95) 100%);
      z-index: 1;
    }

    .tapIcon {
      width: 54px;
      height: 60px;
        margin-bottom: 50px;
      display: grid;
      place-items: center;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
    }

    .captionText {
      font-size: 18px;
      line-height: 1.24;
      max-width: 340px;
      color: rgba(254, 254, 252, 1);
      font-weight: 500;
    }

    .floating-hint {
      position: absolute;
      top: 84px;
      left: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 18px;
      background: rgba(114, 88, 62, 0.92);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
      z-index: 2;
      max-width: 260px;
    }
    .floating-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.15);
    }
    .floating-bubble .bubbleLine {
      color: #fefefc;
      font-weight: 600;
      font-size: 12.5px;
      line-height: 1.25;
    }

    .heroImage {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 40px;
      padding: 0 28px;
      width: 100%;
    }
    .heroImage img {
      width: min(86%, 360px);
      max-height: 62vh;
      object-fit: contain;
      filter: drop-shadow(0 24px 40px rgba(0, 0, 0, 0.32));
    }

    .contentPanel {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 24px 20px 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      align-items: center;
      z-index: 1;
    }
    .contentPanel.dark {
      background: linear-gradient(180deg, rgba(16, 13, 10, 0) 0%, rgba(16, 13, 10, 0.82) 100%);
    }
    .panelText {
      color: #fefefc;
      font-size: 15px;
      font-weight: 500;
      line-height: 1.4;
      text-align: center;
      max-width: 360px;
      text-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    }

    .quizContent {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 26px;
      width: 100%;
      align-items: center;
    }
    .quizTitle {
      font-size: 28px;
      line-height: 1.22;
      font-weight: 500;
      color: var(--txt-primary);
      text-align: center;
      max-width: 360px;
    }
    .answers {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      max-width: 360px;
    }
    .answerBtn {
      width: 100%;
      border-radius: 30px;
      height: 54px;
      font-weight: 500;
    }
    .answerBtn--chosen {
      background: #b2987e !important;
      color: #fefefc !important;
      border-color: #b2987e !important;
    }

    .bottomBtn {
      width: 100%;
      margin-top: auto;
    }
  </style>
</ActivityShell>
