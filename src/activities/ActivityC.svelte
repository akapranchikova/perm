<script>
  import { router, routes } from "../router";
  import { quizC } from "./quizC";
  import ActivityShell from "../components/ActivityShell.svelte";
  import { getArtifactForActivity } from "../data/artifacts";

  const stages = /** @type {const} */ ({
    STORY: "STORY",
    QUESTION: "QUESTION",
    FINAL: "FINAL",
  });

  let stage = stages.STORY;

  let qIndex = 0;
  let selectedIndex = null;

  // массив ответов пользователя
  let answers = []; // {qId, selectedIndex, correct}

  $: total = quizC.questions.length;
  $: q = quizC.questions[qIndex];
  $: questionNumber = qIndex + 1;

  $: last = answers[answers.length - 1];
  $: lastWasCorrect = last ? last.correct : null;

  $: score = answers.reduce((s, a) => s + (a.correct ? 1 : 0), 0);

  function goNextFromStory() {
    stage = stages.QUESTION;
    selectedIndex = null;
  }

  function chooseAnswer(i) {
    if (selectedIndex !== null) return; // блок повторного выбора
    selectedIndex = i;

    const correct = i === q.correctIndex;
    answers = [...answers, { qId: q.id, selectedIndex: i, correct }];

    // небольшой “пауза-отклик”, затем показываем story continuation (как на мокапах)
    setTimeout(() => {
      if (qIndex >= total - 1) {
        stage = stages.FINAL;
      } else {
        // идём к следующему “story” экрану
        qIndex += 1;
        stage = stages.STORY;
      }
    }, 500);
  }

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_C);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }

  // Тексты в бабле: на story — интро/продолжение, на вопрос — просто prompt (как в мокапе "Вопрос")
  $: bubbleLines = (() => {
    if (stage === stages.QUESTION) return [q.prompt];
    // story экран: до 1-го — интро, далее — "storyAfter" предыдущего вопроса
    if (qIndex === 0) return quizC.storyIntro;
    const prev = quizC.questions[qIndex - 1];
    return [prev.storyAfter];
  })();

  $: finalTitle = (() => {
    // На мокапе: “Верно/Неверно + пояснение + послесловие”
    // Сформируем заголовок на основе последнего ответа
    if (lastWasCorrect === null) return "Результат";
    return lastWasCorrect ? "Верно" : "Неверно";
  })();

  $: finalExplanation = (() => {
    const prev = quizC.questions[total - 1];
    if (lastWasCorrect === null) return "";
    return lastWasCorrect ? prev.explanationCorrect : prev.explanationWrong;
  })();

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

<ActivityShell {intro}>
  <div class="safe quiz">
    <!-- шапка -->
    <div class="header">
      <div class="hgroup">
        {#if stage === stages.FINAL}
          <div class="subtitle">Вопрос {total}/{total}</div>
          <div class="title">
            {finalTitle} + пояснение + послесловие от гидов
          </div>
        {:else}
          <div class="title">{quizC.title}</div>
          {#if stage === stages.QUESTION}
            <div class="subtitle">Вопрос {questionNumber}</div>
          {/if}
        {/if}
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

    <!-- бабл -->
    <div class="bubbleRow">
      <img class="avatar" src={quizC.avatarUrl} alt="" />
      <div class="bubble">
        {#each bubbleLines as line}
          <div class="bubbleLine">{line}</div>
        {/each}
      </div>
    </div>

    {#if stage === stages.STORY}
      <div class="card bigCard">
        <div class="placeholder">
          <div class="play" aria-hidden="true"></div>
        </div>
      </div>

      <button
        class="btn-primary bottomBtn"
        type="button"
        on:click={goNextFromStory}
      >
        Далее
      </button>
    {/if}

    {#if stage === stages.QUESTION}
      <div class="card bigCard">
        <img class="qImage" src={q.imageUrl} alt="" />
      </div>

      <div class="answers">
        {#each q.answers as a, i}
          <button
            type="button"
            class="answerBtn"
            disabled={selectedIndex !== null}
            on:click={() => chooseAnswer(i)}
          >
            {a}
          </button>
        {/each}
      </div>
    {/if}

    {#if stage === stages.FINAL}
      <div class="card finalCard">
        <img class="finalImage" src="/final.png" alt="" />
        <div class="finalText">
          <div class="finalSmall">
            {quizC.storyIntro.join(" ")}
          </div>

          <div class="finalMain">
            {quizC.final.afterword}
          </div>

          <div class="finalMeta">
            Результат: {score}/{total}
          </div>
        </div>
      </div>

      <button class="btn-primary bottomBtn" type="button" on:click={finish}>
        {quizC.final.buttonText}
      </button>
    {/if}
  </div>

  <style>
    .quiz {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding-top: 2px;
    }
    .hgroup {
      min-width: 0;
    }
    .title {
      font-weight: 800;
      font-size: 20px;
      color: rgba(17, 24, 39, 0.92);
      line-height: 1.1;
    }
    .subtitle {
      margin-top: 6px;
      font-size: 12px;
      color: rgba(17, 24, 39, 0.55);
      font-weight: 700;
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

    .bubbleRow {
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

    .card {
      background: rgba(214, 234, 251, 0.55);
      border: 1px solid rgba(17, 24, 39, 0.06);
      border-radius: 18px;
      backdrop-filter: blur(10px);
    }

    .bigCard {
      padding: 12px;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .placeholder {
      width: 72%;
      aspect-ratio: 1 / 1;
      border-radius: 16px;
      background: rgba(59, 130, 246, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .play {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: rgba(59, 130, 246, 0.1);
      position: relative;
    }
    .play::after {
      content: "";
      position: absolute;
      left: 19px;
      top: 14px;
      width: 0;
      height: 0;
      border-left: 14px solid rgba(59, 130, 246, 0.22);
      border-top: 9px solid transparent;
      border-bottom: 9px solid transparent;
    }

    .qImage,
    .finalImage {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 16px;
      display: block;
      background: rgba(255, 255, 255, 0.5);
    }

    .answers {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-bottom: 6px;
    }
    .answerBtn {
      width: 100%;
      border: 0;
      border-radius: 14px;
      padding: 14px 14px;
      font-weight: 800;
      color: rgba(17, 24, 39, 0.75);
      background: rgba(214, 234, 251, 0.95);
      border: 1px solid rgba(17, 24, 39, 0.06);
    }
    .answerBtn:disabled {
      opacity: 0.85;
    }

    .bottomBtn {
      width: 100%;
      border-radius: 16px;
      padding: 16px 14px;
      font-size: 15px;
      margin-top: 6px;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
      border: 0;
      font-weight: 900;
    }

    .finalCard {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .finalText {
      padding: 2px 8px 8px;
      text-align: center;
    }
    .finalSmall {
      color: rgba(17, 24, 39, 0.55);
      font-weight: 700;
      font-size: 12px;
      line-height: 1.25;
    }
    .finalMain {
      margin-top: 8px;
      color: rgba(17, 24, 39, 0.75);
      font-weight: 700;
      font-size: 13px;
      line-height: 1.25;
    }
    .finalMeta {
      margin-top: 10px;
      color: rgba(17, 24, 39, 0.45);
      font-weight: 800;
      font-size: 12px;
    }
  </style>
</ActivityShell>
