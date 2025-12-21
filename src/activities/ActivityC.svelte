<script>
  import { router, routes } from "../router";
  import { quizC } from "./quizC";
  import ActivityShell from "../components/ActivityShell.svelte";
  import ActivityGuideIntro from "../components/ActivityGuideIntro.svelte";
  import { getArtifactForActivity } from "../data/artifacts";

  const stages = /** @type {const} */ ({
    STORY: "STORY",
    QUESTION: "QUESTION",
    GUIDE: "GUIDE",
  });

  let stage = stages.STORY;
  let storyIndex = 0;
  let selectedIndex = null;
  let answers = [];

  $: totalQuestions = quizC.questions.length;
  $: currentQuestionIndex = Math.min(storyIndex, totalQuestions - 1);
  $: questionNumber = currentQuestionIndex + 1;
  $: currentStory = quizC.stories[storyIndex];
  $: currentQuestion = quizC.questions[currentQuestionIndex];
  $: hasQuestionAfterStory = storyIndex < totalQuestions;

  function goNextFromStory() {
    if (hasQuestionAfterStory) {
      selectedIndex = null;
      stage = stages.QUESTION;
    } else {
      stage = stages.GUIDE;
    }
  }

  function chooseAnswer(i) {
    if (selectedIndex !== null) return; // блок повторного выбора
    selectedIndex = i;

    const correct = i === currentQuestion.correctIndex;
    answers = [
      ...answers,
      { qId: currentQuestion.id, selectedIndex: i, correct },
    ];

    setTimeout(() => {
      storyIndex = Math.min(storyIndex + 1, quizC.stories.length - 1);
      stage = stages.STORY;
      selectedIndex = null;
    }, 450);
  }

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_C);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }

  const intro = {
    title: "Музыкальная рукопись «Анна Бретонская»",
    subtitle: "Василий Поленов",
    description:
      "Поленов очень любил историю о герцогине Анне Бретонской, написанную на французском. Художник перевел рассказ и написал пьесу, а позже – детскую оперу",
    imageUrl: "/painting.png",
    imageAlt: "Музыкальная рукопись «Анна Бретонская»",
    floorLabel: "1 этаж",
    buttonText: "Начать",
  };
</script>

<ActivityShell {intro}>
  {#if stage === stages.GUIDE}
    <ActivityGuideIntro
      audio={quizC.finalGuide?.audio}
      buttonText={quizC.finalGuide?.buttonText ?? "Далее"}
      onNext={finish}
    />
  {:else}
    <div class="safe quiz">
      <div class="topbar">
        <div class="logo-group" aria-label="Поленов и Сбер">
          <span class="logo logo-sber-circle" aria-hidden="true"></span>
          <span class="logo logo-cross" aria-hidden="true"></span>
          <span class="logo logo-arch" aria-hidden="true"></span>
        </div>

        <button class="sound-btn" type="button" aria-label="Звук">
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

      {#if stage === stages.STORY}
        <div class="quote">
          <img class="avatar" src={quizC.avatarUrl} alt="" />
          <div class="bubble">
            <!--{#each currentStory.lines as line}-->
            <!--  <div class="bubbleText">{line}</div>-->
            <!--{/each}-->
              <div class="bubbleText">{currentStory.lines.join(' ')}</div>
          </div>
        </div>

        <div class="storyBody">
          <div class="mediaCard">
            <div class="media">
              <img src={currentStory.videoUrl} alt={currentStory.videoAlt} />
              <div class="play" aria-hidden="true">
                  <svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 5.70975C0 2.55875 2.55875 0 5.70975 0H97.7903C100.941 0 103.5 2.55875 103.5 5.70975V97.7903C103.498 99.3041 102.896 100.756 101.826 101.826C100.756 102.896 99.3041 103.498 97.7903 103.5H5.70975C4.19543 103.5 2.74313 102.898 1.67235 101.828C0.601561 100.757 0 99.3046 0 97.7903V5.70975ZM43.8265 31.1362C43.4804 30.9054 43.0782 30.7727 42.6627 30.7523C42.2472 30.7319 41.834 30.8246 41.467 31.0205C41.1 31.2163 40.793 31.5081 40.5787 31.8647C40.3644 32.2212 40.2508 32.6292 40.25 33.0452V70.4548C40.2508 70.8708 40.3644 71.2788 40.5787 71.6353C40.793 71.9919 41.1 72.2837 41.467 72.4795C41.834 72.6754 42.2472 72.7681 42.6627 72.7477C43.0782 72.7273 43.4804 72.5946 43.8265 72.3637L71.8808 53.6647C72.1962 53.4548 72.4549 53.1701 72.6339 52.8361C72.8129 52.5021 72.9065 52.129 72.9065 51.75C72.9065 51.371 72.8129 50.9979 72.6339 50.6639C72.4549 50.3299 72.1962 50.0452 71.8808 49.8353L43.8265 31.1362Z" fill="#E5DCDC" fill-opacity="0.44"/>
                  </svg>
              </div>
            </div>
          </div>

          <div class="ctaRow">
            <button class="outline-btn" type="button" on:click={goNextFromStory}>
              Далее
            </button>
          </div>
        </div>
      {/if}

      {#if stage === stages.QUESTION}
          <div class="question-body">
              <div class="question">
                  <div class="questionNumber">Вопрос {questionNumber}</div>
                  <div class="questionTitle">{currentQuestion.prompt}</div>
              </div>

              <div class="answers">
                  {#each currentQuestion.answers as a, i}
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
      flex-direction: column;
      gap: 14px;
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

    .logo-sber-circle {
      width: 34px;
      height: 34px;
      background-image: url("/assets/logo-sber-circle.png");
    }

    .logo-cross {
      width: 18px;
      height: 1.5px;
      background: var(--accent);
      transform: rotate(-45deg);
      position: relative;
      opacity: 0.75;
    }

    .logo-cross::after {
      content: "";
      position: absolute;
      width: 18px;
      height: 1.5px;
      background: var(--accent);
      transform: rotate(90deg);
      inset: 0;
    }

    .logo-arch {
      width: 34px;
      height: 34px;
      background-image: url("/assets/logo-arch.png");
    }

    .sound-btn {
      width: 42px;
      height: 42px;
      padding: 6px;
      border-radius: 16px;
      background: rgba(254, 252, 248, 0.85);
      border: 1px solid var(--border-strong);
      color: var(--accent);
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      box-shadow: 0 12px 28px rgba(24, 22, 15, 0.08);
      backdrop-filter: blur(16px);
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

    .media img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }

    .play {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
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
