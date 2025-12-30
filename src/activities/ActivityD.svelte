<script>
  import "../styles/fonts.css";
  import "../styles/constants.css";
  import "../styles/interactive-elements.css";
  import '../styles/app.css';
  import { router, routes } from "../router";
  import ActivityShell from "../components/ActivityShell.svelte";
  import ActivityGuideIntro from "../components/ActivityGuideIntro.svelte";
  import { getArtifactForActivity } from "../data/artifacts";
  import { settings } from "../stores/settings";

  import NasturtiumsPainting from '../components/NasturtiumsPainting.svelte';
  import SoundButton from "../components/SoundButton.svelte";
  import GuideCircleVideo from "../components/GuideCircleVideo.svelte";
  import GestureTapIndicator from "../components/GestureTapIndicator.svelte";

  const steps = {
    FIND: "FIND", // зум и “тап по шару”
    LEADIN: "LEADIN", // подводка к квизу
    QUIZ: "QUIZ", // вопрос + 3 ответа
    FINAL: "FINAL",
  };

  let step = $state(steps.FIND);
  let hintShown = $state(false);
  let bubbleText = $state("");
  let chosen = $state(null);
  let isCorrect = $state(null);

  function handlePaintingRightBottomTap() {
    step = steps.LEADIN;
  }
  
  function handlePaintingMaxWrongTaps() {
    if (!hintShown) {
      hintShown = true;
    }
  }

  function startQuiz() {
    step = steps.QUIZ;
  }

  const hintGuideInfo = {
    guideVideoSrc: "/activityD/guide_hint.webm",
    guideSubtitlesSrc: "/activityD/guide_hint.srt",
  };

  const leadininVideo ={
    src: "/activityD/guide_leadin.webm",
    subtitles: "/activityD/guide_leadin.srt",
    aspectRatio: "9 / 16",
    autoplay: true,
    loop: false,
    controls: false,
    subtitlesLabel: "Субтитры",
    subtitlesLang: "ru",
  };

  const finalVideo ={
    src: "/activityD/guide_out.webm",
    subtitles: "/activityD/guide_out.srt",
    aspectRatio: "9 / 16",
    autoplay: true,
    loop: false,
    controls: false,
    subtitlesLabel: "Субтитры",
    subtitlesLang: "ru",
  };

  // quiz 1 вопрос, 3 ответа (мокап “Вопрос по шару”)
  const quiz = {
    question: "Как помог Коровину шар при написании «Настурций»?",
    imageUrl: "/quiz-d.jpg",
    answers: ["Выстроить светотень", "Выстроить золотое сечение", "Подчеркнуть главного героя"],
    correctIndex: 0,
  };

  function choose(i) {
    if (chosen !== null) return;
    chosen = i;
    isCorrect = i === quiz.correctIndex;

    setTimeout(() => {
      step = steps.FINAL;
    }, 350);
  }

  function handleGuideVideoSoundTap() {
    settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }));
  }

  function handleGuideSubtitleChange(event) {
    bubbleText = event?.detail?.text?.trim() ?? "";
  }

  function handleGuideVideoLoad() {
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
    imageUrl: `/activityD/title-picture.png`,
    imageAlt: "Настурции — Константин Коровин",
    mapSvg: "/activityD/floor-map.svg",
    floorLabel: "2 этаж",
    buttonText: "Начать",
  };

  const guide = {
    buttonText: "Далее",
    video: {
      src: "/activityD/guide_in.webm",
      subtitles: "/activityD/guide_in.srt",
      poster: "/images/gigachat.png",
      aspectRatio: "9 / 16",
      autoplay: true,
      loop: false,
      controls: false,
      subtitlesLabel: "Субтитры",
      subtitlesLang: "ru",
    },
    findText: ["объект, который", "кажется необычным", "и нажми на него"],
    hintText: ["Обрати внимание на", "правый нижний угол", "картины"],
    leadinTitle: "Подводка к квизу",
    leadinText: [
      "которые когда-то закладывал",
      "Василий Дмитриевич Поленов.",
      "Мы изучаем его наследие и",
    ],
  };
</script>

<ActivityShell {intro} {guide}>
  <div class="safe actD">
    {#if step === steps.FIND}
      <section
        class="safe activity media-screen"
        style="--screen-bg: url('/onboarding/background1.jpg'); --overlay-text: var(--txt-white);"
      >
        <div class="bottom-gradient"></div>
        <div class="topbar">
          <div class="logo-group" aria-label="Поленов и Сбер">
            <span
              class="logo {step === steps.QUIZ ? 'logo-brown' : 'logo-white' }"
              aria-hidden="true">
            </span>
          </div>
          {#if hintShown}
            <SoundButton
              isMuted={!$settings.audioEnabled}
              onTap={handleGuideVideoSoundTap} />
          {/if}
        </div>

        <div class="painting-caption">
          К. А.Коровин · 1888 · © Государственный музей-заповедник В. Д. Поленова
        </div>

        {#if hintShown}
          <div class="quote">
            <GuideCircleVideo
              src={hintGuideInfo.guideVideoSrc}
              subtitlesSrc={hintGuideInfo.guideSubtitlesSrc}
              isMuted={!$settings.audioEnabled}
              autoplay={true}
              isLooped={false}
              onLoad={handleGuideVideoLoad}
              on:subtitlechange={handleGuideSubtitleChange}
              cssClass="guide-circle-video"
            />
            <div class="bubble">
              <div class="bubbleText">
                {bubbleText || ""}
              </div>
            </div>
          </div>
        {/if}

        <div class="paintingShell">
          <div class="paintingFrame">
            <NasturtiumsPainting
              containerCssClass='nasturtiums-painting-container'
              paintingStartMinPadding={18}
              src="/activityD/painting.png"
              alt="Картина 'Настурции'. Константин Алексеевич Коровин"
              maxScale={10}
              minScale={1}
              maxWrongTapsCount={3}
              specialAreaSideToOriginalSideRatio={0.18}
              onRightBottomTap={handlePaintingRightBottomTap}
              onMaxWrongTaps={handlePaintingMaxWrongTaps}
            />
          </div>
        </div>

        <div class="findCaption">
          <div
            class="tapIcon"
            aria-hidden="true"
          >
            <GestureTapIndicator />
          </div>
          <div class="captionText">Выберите объект на картине, который кажется необычным</div>
        </div>
      </section>
    {/if}

    {#if step === steps.LEADIN}
      <ActivityGuideIntro
        video={leadininVideo}
        buttonText="Далее"
        onNext={startQuiz}
      />
    {/if}

    {#if step === steps.QUIZ}
      <section class="screen screen--quiz">
        <div class="topbar">
          <div class="logo-group" aria-label="Поленов и Сбер">
            <span class="logo logo-brown" aria-hidden="true"></span>
          </div>
        </div>

        <div class="quizContent">
          <div class="quizTitle">{quiz.question}</div>

          <div class="answers">
            {#each quiz.answers as a, i}
              <button
                class="cta-button outline"
                onclick={() => choose(i)}
              >
                {a}
              </button>
            {/each}
          </div>
        </div>
      </section>
    {/if}

    {#if step === steps.FINAL}
      <ActivityGuideIntro
        video={finalVideo}
        buttonText="Завершить"
        onNext={finish}
      />
    {/if}
  </div>

  <style>
    .actD {
      padding: 0;
      height: 100dvh;
      overscroll-behavior: none;
      display: flex;
      overflow: hidden;
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
      background: url("/onboarding/background1.jpg") center / cover no-repeat;
      z-index: -3;
      filter: saturate(0.95);
    }

    .screen-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(24, 22, 15, 0.25) 60%);
      z-index: -2;
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
      width: 100%;
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

    .logo-group--accent {
      color: #b2987e;
    }

    .painting-caption {
      position: absolute;
      top: 65px;
      font-family: Inter;
      font-weight: 400;
      font-size: 14px;
      line-height: 130%;
      text-align: center;
      vertical-align: middle;
      color: var(--txt-white);
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

    :global(.guide-circle-video) {
      width: 58px;
      height: 58px;
      object-fit: cover;
      flex: 0 0 auto;
    }

    :global(.nasturtiums-painting-container) {
      width: 100%;
      height: 100%;
    }
    :global(.nasturtiums-painting-container .image) {
      width: 100%;
      height: 100%;
      object-fit: contain;
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
      z-index: 1;
    }

    .tapIcon {
      width: 54px;
      height: 60px;
      margin-bottom: 50px;
      display: grid;
      place-items: center;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
      color: var(--txt-white)
    }

    .captionText {
      font-size: 18px;
      line-height: 1.24;
      max-width: 340px;
      color: rgba(254, 254, 252, 1);
      font-weight: 500;
    }

    .quote {
      position: absolute;
      top: 84px;
      left: 18px;
      right: 18px;
      background: rgba(178, 152, 126, 0.86);
      color: #fefcf8;
      box-shadow: 0 12px 28px rgba(24, 22, 15, 0.18);
      z-index: 3;
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
        position: absolute;
        z-index: 1;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .heroImage img {
      width: 100%;
      max-height: 100%;
      object-fit: cover;
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
      flex: 1;
      justify-content: center;
      align-items: center;
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

    .quizTitle {
        color: var(--text-primary);
        margin: 0 auto;
        max-width: 520px;
        font-family: Prata, serif;
        font-weight: 400;
        font-size: 32px;
        line-height: 100%;
        letter-spacing: 0;
        text-align: center;

    }

    .answers {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        margin-top: 18px;
        padding-bottom: 12px;
    }

    .answerBtn {
        width: 100%;
        border-radius: 999px;
        padding: 14px 16px;
        border: 1px solid rgba(178, 152, 126, 1);
        background: rgba(254, 252, 248, 0.94);
        color: rgba(178, 152, 126, 1);
        font-size: 16px;
        font-weight: 500;
        transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.2s ease;
    }


    .bottomBtn {
      width: 100%;
      margin-top: auto;
    }
  </style>
</ActivityShell>
