<script>
  import { router, routes } from "../router";
  import ActivityShell from "../components/ActivityShell.svelte";
  import { memories } from "./memories";
  import { getArtifactForActivity } from "../data/artifacts";
  import CameraCatch from "./CameraCatch.svelte";
  import Modal from "../components/Modal.svelte";
  import AudioWithCaptions from "../components/AudioWithCaptions.svelte";

  const steps = { INTRO: "INTRO", CATCH: "CATCH", DETAIL: "DETAIL" };
  let step = steps.INTRO;

const intro = {
    title: "Приветственный адрес Поленову от учеников",
    description:
      "Документ, в котором звучат голоса учеников Василия Дмитриевича. В 1895 году, прощаясь с преподавателем, они написали ему приветственный адрес — слова благодарности",
    imageUrl: "/activityB/background.png",
    imageAlt: "Приветственный адрес Поленову от учеников",
    floorLabel: "1 этаж",
    buttonText: "Начать",
  };

  const guide = {
    buttonText: "Далее",
    audio: {
      src: "/activityB/6947c3f2c84c4900013533c0_tts2_result.mp3",
      captions: [
        {
          t: 0,
          text:
            "В XIX веке наша Академия называлась Московским училищем живописи, ваяния и зодчества. Здесь Поленов преподавал 13 лет."
        },
        {
          t: 1,
          text:
            "Этот приветственный адрес ученики подарили Василию Дмитриевичу, когда он покидал должность преподавателя. Для них это было прощанием с эпохой."
        },
        {
          t: 2,
          text:
            "Поленов говорил, что научить ремеслу легко. Труднее — дать таланту раскрыться. Но именно это он и делал, и его влияние сложно переоценить."
        },
      ],
      autoplay: true,
    },
  };
  
  const catchMemories = memories.slice(0, 3);

  let caughtMemories = [];
  let detailIdx = 0;
  let detailModalOpen = false;
  let isMuted = false;
  let pageFlipAudio;

  $: detailMemo =
    step === steps.DETAIL
      ? (caughtMemories[detailIdx] ?? catchMemories[detailIdx])
      : null;

  function startCatch() {
    step = steps.CATCH;
    caughtMemories = [];
  }

  function handleCatch(event) {
    const { memory } = event.detail;
    caughtMemories = [...caughtMemories, memory];
  }

  function handleCatchComplete() {
    if (!caughtMemories.length) caughtMemories = catchMemories;
    detailIdx = 0;
    isMuted = false;
    detailModalOpen = false;
    step = steps.DETAIL;
  }

  function playPageFlip() {
    if (!pageFlipAudio) pageFlipAudio = new Audio("/activityB/page-flip.mp3");
    pageFlipAudio.currentTime = 0;
    pageFlipAudio.play?.().catch(() => {});
  }

  function nextDetail() {
    if (detailIdx < caughtMemories.length - 1) {
      detailIdx += 1;
      isMuted = false;
      detailModalOpen = false;
      playPageFlip();
    } else {
      finish();
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
  }

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_B);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }
</script>

<ActivityShell {intro} {guide}>
  <div class="safe activityB">
    {#if step === steps.INTRO}
      <div class="permissionScreen">
        <div class="permissionCard">
          <div class="permissionTitle">Разрешить доступ к камере?</div>
          <div class="permissionSubtitle">
            Доступ необходим для работы дополненной реальности
          </div>

          <div class="permissionBtns">
            <button class="btn-cancel" type="button" on:click={finish}
              >Отмена</button
            >
            <button class="btn-allow" type="button" on:click={startCatch}
              >Разрешить</button
            >
          </div>
        </div>
      </div>
    {/if}

    <CameraCatch
      running={step === steps.CATCH}
      memories={catchMemories}
      overlaySrc="/activityB/overlay.mp4"
      maxSlots={3}
      on:catch={handleCatch}
      on:complete={handleCatchComplete}
      on:error={(event) => console.error("Camera error", event.detail)}
    />

    {#if step === steps.DETAIL && detailMemo}
      <div class="detailScreen">
        <header class="detailHeader">
          <div class="detailBrand">
            <img src="/icons/check.svg" alt="" aria-hidden="true" />
            <span class="divider"></span>
            <img src="/icons/arc.svg" alt="" aria-hidden="true" />
          </div>
          <button
            class="soundToggle"
            type="button"
            on:click={toggleMute}
            aria-label="Переключить звук"
          >
            {#if isMuted}
              <img src="/icons/sound-off.svg" alt="Звук выкл" />
            {:else}
              <img src="/icons/sound-on.svg" alt="Звук вкл" />
            {/if}
          </button>
        </header>

        <div class="detailTitle">
          <div class="detailName">{detailMemo.name}</div>
          <div class="detailRole">{detailMemo.role}</div>
        </div>

        <div class="mediaFrame">
          {#if detailMemo.videoUrl}
            <video
              src={detailMemo.videoUrl}
              autoplay
              loop
              playsinline
              muted
              poster={detailMemo.portraitUrl}
            ></video>
          {:else if detailMemo.portraitUrl}
            <img
              src={detailMemo.portraitUrl}
              alt={`Портрет ${detailMemo.name}`}
            />
          {/if}
        </div>

        <div class="detailExcerpt">{detailMemo.excerpt}</div>

        <div class="detailButtons">
          <button
            class="btn-outline"
            type="button"
            on:click={() => (detailModalOpen = true)}
          >
            Читать полностью
          </button>

          <button class="btn-primary" type="button" on:click={nextDetail}>
            {detailIdx < caughtMemories.length - 1
              ? "Следующее воспоминание"
              : "Завершить активность"}
          </button>
        </div>

        <div class="audioLayer">
          <AudioWithCaptions
            src={detailMemo.audioUrl}
            captions={detailMemo.captions}
            autoplay={true}
            muted={isMuted}
          />
        </div>

        <Modal
          open={detailModalOpen}
          title={detailMemo.name}
          onClose={() => (detailModalOpen = false)}
        >
          <div class="modalRole">{detailMemo.role}</div>
          <div class="modalText">{detailMemo.fullText}</div>
        </Modal>
      </div>
    {/if}
  </div>
</ActivityShell>

<style>
  .activityB {
    position: relative;
    height: 100dvh;
  }

  .permissionScreen {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .permissionCard {
    width: min(360px, 92vw);
    border-radius: 32px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
    padding: 32px 28px 26px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    font-family: "Cormorant Garamond", "Helvetica Neue", serif;
  }

  .permissionTitle {
    font-size: 28px;
    font-weight: 600;
    color: #1f130a;
    line-height: 1.15;
  }

  .permissionSubtitle {
    font-size: 14px;
    font-family: "Inter", sans-serif;
    color: rgba(31, 19, 10, 0.75);
    margin-top: 14px;
  }

  .permissionBtns {
    margin-top: 26px;
    display: flex;
    gap: 12px;
  }

  .permissionBtns button {
    flex: 1;
    border-radius: 999px;
    padding: 14px 0;
    font-size: 15px;
    font-weight: 600;
    border: 0;
    cursor: pointer;
  }

  .btn-cancel {
    background: #f5ede5;
    color: #a3876c;
  }

  .btn-allow {
    background: #b38765;
    color: #fff;
  }

  .detailScreen {
    position: fixed;
    inset: 0;
    padding: 32px 22px calc(env(safe-area-inset-bottom, 16px) + 32px);
    background: radial-gradient(circle at top, #1c150f 0%, #050302 70%);
    color: #f8f5f1;
    display: flex;
    flex-direction: column;
    gap: 18px;
    z-index: 80;
    font-family: "Cormorant Garamond", serif;
  }

  .detailHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detailBrand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .detailBrand img {
    width: 30px;
    height: 30px;
  }

  .detailBrand .divider {
    width: 1px;
    height: 26px;
    background: rgba(255, 255, 255, 0.25);
  }

  .soundToggle {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .soundToggle img {
    width: 22px;
    height: 22px;
  }

  .detailTitle {
    text-align: left;
  }

  .detailName {
    font-size: clamp(24px, 7vw, 36px);
    font-weight: 600;
  }

  .detailRole {
    margin-top: 4px;
    font-family: "Inter", sans-serif;
    font-size: 13px;
    letter-spacing: 0.2px;
    color: rgba(248, 245, 241, 0.7);
  }

  .mediaFrame {
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.45);
  }

  .mediaFrame video,
  .mediaFrame img {
    width: 100%;
    display: block;
  }

  .detailExcerpt {
    font-family: "Inter", sans-serif;
    font-size: 16px;
    line-height: 1.35;
    color: rgba(248, 245, 241, 0.88);
  }

  .detailButtons {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detailButtons .btn-outline,
  .detailButtons .btn-primary {
    border-radius: 999px;
    padding: 16px;
    font-size: 16px;
    font-weight: 600;
  }

  .btn-outline {
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: transparent;
    color: inherit;
  }

  .btn-primary {
    background: #fdf6ea;
    color: #1f130a;
    border: none;
  }

  .audioLayer {
    position: relative;
    height: 0;
  }

  .modalRole {
    margin-top: 6px;
    font-size: 13px;
    color: rgba(17, 24, 39, 0.55);
  }

  .modalText {
    margin-top: 12px;
    white-space: pre-wrap;
    font-size: 15px;
    line-height: 1.4;
  }
</style>
