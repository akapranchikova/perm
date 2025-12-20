<script>
  import { router, routes } from '../router';
  import { memories } from './memories';
  import Modal from '../components/Modal.svelte';
  import AudioWithCaptions from '../components/AudioWithCaptions.svelte';
  import XR8Scene from './XR8Scene.svelte';
  import ActivityShell from '../components/ActivityShell.svelte';
  import { getArtifactForActivity } from '../data/artifacts';

  // шаги
  const steps = /** @type {const} */ ({
    INTRO: 'INTRO',
    AR: 'AR',
    DETAIL: 'DETAIL'
  });

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

  // индекс текущего воспоминания (0..n-1)
  let idx = 0;
  $: memo = memories[idx];

  let modalOpen = false;

  // Запуск AR
  function startAR() {
    step = steps.AR;
  }

  // Тап в AR по любому листу -> открыть следующее воспоминание по очереди
  function onPageTap() {
    step = steps.DETAIL;
    modalOpen = false;
    // аудио начнёт играть в DETAIL (компонент AudioWithCaptions)
  }

  // “Поймать другое” -> следующий по очереди (циклично)
  function nextMemory() {
    idx = (idx + 1) % memories.length;
    // если уже в деталях — перезапустим проигрывание (AudioWithCaptions реагирует на смену src)
  }

  // после прослушивания/прочтения можно вернуться в AR (по мокапу это "поймать другое" — оставим в деталях, но можно вернуть в AR)
  function backToAR() {
    step = steps.AR;
    modalOpen = false;
  }

  function finish() {
    const artifact = getArtifactForActivity(routes.ACTIVITY_B);
    router.go(routes.ARTIFACT_REWARD, { artifactId: artifact?.id });
  }
</script>

<ActivityShell {intro}>
  <div class="safe activityB">

    <!-- XR слой (fixed) — показываем только когда step === AR -->
    <XR8Scene running={step === steps.AR} on:pagetap={onPageTap} />

    {#if step === steps.INTRO}
      <div class="intro">
        <div class="introArt" aria-hidden="true">
          <img src="/activityB/background.png" alt="Back"/>
          <div class="circle"></div>
        </div>

        <div class="card introCard">
          <div class="introText">
            Поймай страницу и узнай воспоминания от самых выдающихся учеников мастера
          </div>
        </div>

        <div class="btns">
          <button class="btn-primary" type="button" on:click={startAR}>Начать</button>
          <button class="btn-outline" type="button" on:click={finish}>Завершить</button>
        </div>
      </div>
    {/if}

    {#if step === steps.DETAIL}
      <div class="detail">
        <div class="top">
          <div>
            <div class="name">{memo.name}</div>
            <div class="role">{memo.role}</div>
          </div>
          <button class="sound-btn" type="button" aria-label="Звук (мьют)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M11 5L6.5 9H3v6h3.5L11 19V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M16 9c1.5 1.5 1.5 4.5 0 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="card portraitCard">
          <img class="portrait" src={memo.portraitUrl} alt="Портрет" />
        </div>

        <div class="excerpt">{memo.excerpt}</div>

        <!-- аудио + субтитры -->
        <div class="audioLayer">
          <AudioWithCaptions src={memo.audioUrl} captions={memo.captions} autoplay={true} />
        </div>

        <div class="btns" style="margin-top: 12px;">
          <button class="btn-outline" type="button" on:click={() => (modalOpen = true)}>
            Прочитать воспоминание
          </button>
          <button class="btn-primary" type="button" on:click={nextMemory}>
            Поймать другое
          </button>
          <button class="btn-outline" type="button" on:click={backToAR}>
            Вернуться в AR
          </button>
        </div>

        <div class="footerRow">
          <button class="link" type="button" on:click={finish}>Завершить активность</button>
        </div>

        <Modal open={modalOpen} title={memo.name} onClose={() => (modalOpen = false)}>
          <div class="modalRole">{memo.role}</div>
          <div class="modalText">{memo.fullText}</div>
        </Modal>
      </div>
    {/if}
  </div>
</ActivityShell>

<style>
  .activityB{
    position: relative;
    height: 100dvh;
  }

  .card{
    background: rgba(255,255,255,0.78);
    border-radius: 18px;
    padding: 12px;
    border: 1px solid rgba(17,24,39,0.06);
    backdrop-filter: blur(10px);
  }
  .btns{
    display:flex;
    flex-direction:column;
    gap: 10px;
    width: min(340px, 92vw);
    margin: 14px auto 0;
  }
  .btn-outline{
    background: transparent;
    border: 1px solid rgba(59,130,246,0.7);
    color: rgba(30,64,175,0.95);
    border-radius: 16px;
    padding: 14px 14px;
    font-weight: 700;
  }
  .btn-primary{
    background: #3b82f6;
    color: white;
    border-radius: 16px;
    padding: 14px 14px;
    font-weight: 800;
  }

  /* INTRO */
  .intro{
    height: 100%;
    display:flex;
    flex-direction:column;
    gap: 12px;
  }
  .introArt{
    flex: 1;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.05));
    position: relative;
    overflow:hidden;
  }
  .circle{
    position:absolute;
    right: 46px;
    top: 52%;
    width: 54px; height: 54px;
    border-radius: 999px;
    border: 3px solid rgba(59,130,246,0.55);
    transform: translateY(-50%);
  }
  .introCard{
    width: min(360px, 92vw);
    margin: 0 auto;
  }
  .introText{
    text-align:center;
    font-size: 13.5px;
    line-height: 1.25;
    color: rgba(17,24,39,0.75);
    padding: 8px 10px;
  }

  /* DETAIL */
  .detail{
    position: relative;
    height: 100%;
    display:flex;
    flex-direction:column;
    gap: 12px;
  }
  .top{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap: 12px;
    padding-top: 4px;
  }
  .name{
    font-weight: 800;
    font-size: 20px;
    color: rgba(17,24,39,0.92);
  }
  .role{
    margin-top: 4px;
    font-size: 12px;
    color: rgba(17,24,39,0.6);
  }
  .sound-btn{
    width: 36px;
    height: 36px;
    padding: 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.55);
    border: 1px solid rgba(17,24,39,0.08);
    color: rgba(17,24,39,0.65);
    display:flex;
    align-items:center;
    justify-content:center;
    flex: 0 0 auto;
    box-shadow: none;
    backdrop-filter: blur(8px);
  }

  .portraitCard{
    padding: 10px;
    border-radius: 22px;
    background: rgba(207, 232, 255, 0.55);
  }
  .portrait{
    width: 100%;
    height: auto;
    display:block;
    border-radius: 18px;
    background: rgba(255,255,255,0.6);
  }

  .excerpt{
    text-align:center;
    color: rgba(17,24,39,0.40);
    font-weight: 700;
    font-size: 13px;
    line-height: 1.25;
    padding: 0 10px;
  }

  /* контейнер для субтитров (absolute внутри safe/phone) */
  .audioLayer{
    position: relative;
    height: 0; /* субтитры позиционируются absolute внутри компонента */
  }

  .footerRow{
    margin-top:auto;
    text-align:center;
  }
  .link{
    background: transparent;
    border: 0;
    color: rgba(17,24,39,0.55);
    font-weight: 700;
    padding: 10px 8px;
    cursor:pointer;
  }

  .modalRole{
    margin-top: 2px;
    font-size: 12px;
    color: rgba(17,24,39,0.55);
  }
  .modalText{
    margin-top: 10px;
    white-space: pre-wrap;
  }
</style>
