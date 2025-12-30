<script>
  import { router, routes } from "../router";
  import ActivityIntro from "./ActivityIntro.svelte";
  import ActivityGuideIntro from "./ActivityGuideIntro.svelte";

  const defaultIntro = {
    title: "Подводка",
    subtitle: "",
    description: "",
    imageUrl: "",
    imageAlt: "",
    floorLabel: "",
    mapSvg: undefined,
    footerText: "Подойдите к экспонату и нажмите кнопку",
    buttonText: "Начать",
  };

  const defaultGuide = {
    buttonText: "Далее",
    audio: {
      src: "/audio/onboarding-welcome.wav",
      captions: [
        {
          t: 0,
          text: "Думаю, что главная черта гениальности – актуальность. Вот и Поленов до сих пор не дает нам...",
        },
      ],
      autoplay: true,
    },
    video: null,
  };

  // 1. Дефолтные данные для Outro
  const defaultOutro = {
    buttonText: "Завершить",
    audio: null,
    video: null,
  };

  export let intro = defaultIntro;
  export let guide = defaultGuide;
  // 2. Новый параметр outro
  export let outro = defaultOutro; 
  export let onBack = () => router.go(routes.PLAYTESTS);

  const stages = {
    INTRO: "INTRO",
    GUIDE: "GUIDE",
    CONTENT: "CONTENT",
    OUTRO: "OUTRO",
  };

  let stage = stages.INTRO;

  $: introData = { ...defaultIntro, ...intro };
  $: guideData = { ...defaultGuide, ...guide };
  $: outroData = { ...defaultOutro, ...outro };

  function goGuide() {
    stage = stages.GUIDE;
  }

  function startContent() {
    stage = stages.CONTENT;
  }

  let finshHandler = null;

  function goOutro(finsh) {
    finshHandler = finsh;
    stage = stages.OUTRO;
  }

  function goFinish() {
    if(finshHandler){
      finshHandler()
    } else {
      onBack()
    }
  }

</script>

{#if stage === stages.INTRO}
  <ActivityIntro
    title={introData.title}
    subtitle={introData.subtitle}
    description={introData.description}
    imageUrl={introData.imageUrl}
    imageAlt={introData.imageAlt}
    floorLabel={introData.floorLabel}
    mapSvg={introData.mapSvg}
    footerText={introData.footerText}
    buttonText={introData.buttonText}
    onNext={goGuide}
    {onBack}
  />
{:else if stage === stages.GUIDE}
  <ActivityGuideIntro
    audio={guideData.audio}
    video={guideData.video}
    buttonText={guideData.buttonText}
    onNext={startContent}
  />
{:else if stage === stages.OUTRO}
  <ActivityGuideIntro
    audio={outroData.audio}
    video={outroData.video}
    buttonText={outroData.buttonText}
    onNext={goFinish}
  />
{:else}
  <slot next={goOutro} />
{/if}