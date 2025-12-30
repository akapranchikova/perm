<script>
  import '../styles/app.css';
  import { router, routes } from "../router";
  import { quizC } from "./quizC";
  import ActivityShell from "../components/ActivityShell.svelte";
  import ActivityGuideIntro from "../components/ActivityGuideIntro.svelte";
  import SoundButton from "../components/SoundButton.svelte";
  import GuideCircleVideo from "../components/GuideCircleVideo.svelte";
  import { getArtifactForActivity } from "../data/artifacts";
  import { settings } from "../stores/settings";

  const stages = /** @type {const} */ ({
    INTRO: "INTRO",
    QUESTION: "QUESTION",
    FEEDBACK: "FEEDBACK",
    FINAL_GUIDE: "FINAL_GUIDE",
  });

  // Начинаем с интро, если оно есть, иначе сразу с вопроса
  let stage = quizC.intro ? stages.INTRO : stages.QUESTION;
  
  let currentRoundIndex = 0;
  let selectedIndex = null;
  let isLastAnswerCorrect = false;
  let answers = [];
  let bubbleText = "";

  // Вычисляемые свойства
  $: totalRounds = quizC.rounds.length;
  $: currentRound = quizC.rounds[currentRoundIndex];
  
  // Определяем данные для текущего экрана (Интро или Фидбек)
  $: currentFeedbackData = stage === stages.INTRO 
      ? quizC.intro 
      : (isLastAnswerCorrect ? currentRound.feedbackCorrect : currentRound.feedbackIncorrect);

  $: guideVideoIsMuted = !$settings.audioEnabled;
  $: questionNumber = currentRoundIndex + 1;

  // Переход от Интро или Фидбека к следующему шагу
  function goNext() {
    if (stage === stages.INTRO) {
      stage = stages.QUESTION;
      return;
    }

    if (stage === stages.FEEDBACK) {
      // Сбрасываем выбор
      selectedIndex = null;
      bubbleText = "";
      
      if (currentRoundIndex < totalRounds - 1) {
        currentRoundIndex++;
        stage = stages.QUESTION;
      } else {
        stage = stages.FINAL_GUIDE;
      }
    }
  }

  // Обработка выбора ответа
  function chooseAnswer(i) {
    if (selectedIndex !== null) return; // блокируем повторный клик
    selectedIndex = i;

    const correct = i === currentRound.correctIndex;
    isLastAnswerCorrect = correct;

    answers = [
      ...answers,
      { qId: currentRound.id, selectedIndex: i, correct },
    ];

    // Небольшая задержка перед показом реакции, чтобы пользователь увидел свой выбор
    setTimeout(() => {
      stage = stages.FEEDBACK;
    }, 450);
  }

  function handleGuideVideoSoundTap() {
    settings.update((s) => ({ ...s, audioEnabled: !s.audioEnabled }));
  }

  function handleGuideVideoLoad() {
  }

  function handleGuideSubtitleChange(event) {
    bubbleText = event?.detail?.text?.trim() ?? "";
  }

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_C);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }

  const introData = {
    title: "Музыкальная рукопись «Анна Бретонская»",
    subtitle: "Василий Поленов",
    description:
      "Поленов очень любил историю о герцогине Анне Бретонской, написанную на французском. Художник перевел рассказ и написал пьесу, а позже – детскую оперу",
    imageUrl: "/activityC/preview_image.png",
    imageAlt: "Музыкальная рукопись «Анна Бретонская»",
    mapSvg: "/activityC/floor-map.svg",
    floorLabel: "1 этаж",
    buttonText: "Начать",
  };

  const guide = {
    buttonText: "Далее",
    video: {
      src: "/activityC/guide_in.webm",
      subtitles: "/activityC/guide_in.srt",
      poster: "/images/gigachat.png",
      aspectRatio: "9 / 16",
      autoplay: true,
      loop: false,
      controls: false,
      subtitlesLabel: "Субтитры",
      subtitlesLang: "ru",
    }
  };
</script>

<ActivityShell intro={introData} {guide}>
  {#if stage === stages.FINAL_GUIDE}
    <ActivityGuideIntro
      video={quizC.finalGuide?.video}
      buttonText={quizC.finalGuide?.buttonText ?? "Далее"}
      onNext={finish}
    />
  {:else}
    <div class="safe quiz">
      <div class="topbar">
        <div class="logo-group" aria-label="Поленов и Сбер">
          <span class="logo {stage === stages.QUESTION ? 'logo-brown' : 'logo-white'} " aria-hidden="true"></span>
        </div>
        {#if stage === stages.INTRO || stage === stages.FEEDBACK}
          <SoundButton
            cssClass={stage === stages.QUESTION ? 'sound-brown' : 'sound-white'}
            isMuted={!$settings.audioEnabled}
            onTap={handleGuideVideoSoundTap} />
        {/if}
      </div>

      <!-- Блок с Гидом (Интро или Реакция на ответ) -->
      {#if stage === stages.INTRO || stage === stages.FEEDBACK}
        <div class="quote">
          <GuideCircleVideo
            src={currentFeedbackData.guideVideoSrc}
            subtitlesSrc={currentFeedbackData.guideSubtitlesSrc}
            isMuted={guideVideoIsMuted}
            autoplay={true}
            isLooped={false}
            onLoad={handleGuideVideoLoad}
            on:subtitlechange={handleGuideSubtitleChange}
            cssClass="guide-circle-video"
          />
          <div class="bubble">
            <div class="bubbleText">
              {bubbleText || "..."}
            </div>
          </div>
        </div>

        <div class="storyBody">
          <div class="mediaCard">
            <div class="media">
              <!-- Используем mainVideoUrl из текущего фидбека или интро -->
              {#if currentFeedbackData.videoUrl || currentFeedbackData.mainVideoUrl}
                 <video 
                    muted 
                    autoplay 
                    loop
                    class="video" 
                    src={currentFeedbackData.videoUrl || currentFeedbackData.mainVideoUrl} 
                    alt={currentFeedbackData.videoAlt || ""} 
                 />
              {/if}
            </div>
          </div>

          <div class="ctaRow">
            <button class="outline-btn" type="button" on:click={goNext}>
              Далее
            </button>
          </div>
        </div>
      {/if}

      <!-- Блок с Вопросом -->
      {#if stage === stages.QUESTION}
          <div class="question-body">
              <div class="question">
                  <div class="questionNumber">Вопрос {questionNumber}</div>
                  <div class="questionTitle">{currentRound.prompt}</div>
              </div>

              <div class="answers">
                  {#each currentRound.answers as a, i}
                      <button
                              type="button"
                              class="answerBtn"
                              class:selected={selectedIndex === i}
                              disabled={selectedIndex !== null}
                              on:click={() => chooseAnswer(i)}
                      >
                          {a}
                      </button>
                  {/each}
              </div>
          </div>
      {/if}
    </div>
  {/if}

  <style>
    .quiz {
      position: relative;
      height: 100dvh;
      display: flex;
      overflow: hidden;
      flex-direction: column;
      gap: 14px;
      overscroll-behavior: none;
      background: linear-gradient(180deg, #fefcf8 0%, #fefefc 60%, #fff 100%);
      color: var(--text-primary);
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding-top: 2px;
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

    .quote {
      background: rgba(178, 152, 126, 0.86);
      color: #fefcf8;
      box-shadow: 0 12px 28px rgba(24, 22, 15, 0.18);
    }

    .storyBody {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
      min-height: 0;
    }

    .mediaCard {
      flex: 1;
      margin: 0 -20px;
      display: flex;
      align-items: stretch;
      justify-content: center;
      min-height: 320px;
    }

    .media {
      position: relative;
      overflow: hidden;
      width: 100%;
    }

    .media video {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }

    .ctaRow {
      margin-top: auto;
    }

    .question-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .outline-btn {
      width: 100%;
      border-radius: 999px;
      padding: 14px 16px;
      border: 1px solid rgba(178, 152, 126, 1);
      background: rgba(254, 252, 248, 0.92);
      color: rgba(178, 152, 126, 1);
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 12px 28px rgba(24, 22, 15, 0.12);
      backdrop-filter: blur(50px);
    }

    .question {
      padding: 12px 4px 2px;
      text-align: center;
    }

    .questionNumber {
      color: rgba(178, 152, 126, 1);
      margin-bottom: 18px;
        font-family: Prata, serif;
        font-weight: 400;
        font-size: 18px;
        line-height: 120%;
        letter-spacing: 0%;

    }

    .questionTitle {
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

    .answerBtn:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 10px 22px rgba(24, 22, 15, 0.12);
    }

    .answerBtn:disabled {
      opacity: 0.82;
    }

    .answerBtn.selected {
      border-color: rgba(178, 152, 126, 0.9);
      background: rgba(178, 152, 126, 0.1);
    }

    .sound-brown {
      color: var(--accent);
      border-color: var(--accent);
    }

    .sound-white {
      color: var(--bg-muted);
    }

    :global(.guide-circle-video) {
      width: 58px;
      height: 58px;
      object-fit: cover;
      flex: 0 0 auto;
    }

    .video{
      width: 100%;
      height: 100%;
    }

    @media (max-width: 390px) {
      .questionTitle {
        font-size: 24px;
      }

      .mediaCard {
        min-height: 260px;
      }
    }
  </style>
</ActivityShell>
