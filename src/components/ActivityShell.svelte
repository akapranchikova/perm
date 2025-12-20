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
          text:
            "Думаю, что главная черта гениальности – актуальность. Вот и Поленов до сих пор не дает нам...",
        },
      ],
      autoplay: true,
    },
  };

  export let intro = defaultIntro;
  export let guide = defaultGuide;
  export let onBack = () => router.go(routes.PLAYTESTS);

  const stages = {
    INTRO: "INTRO",
    GUIDE: "GUIDE",
    CONTENT: "CONTENT",
  };

  let stage = stages.INTRO;

  $: introData = { ...defaultIntro, ...intro };
  $: guideData = { ...defaultGuide, ...guide };

  function goGuide() {
    stage = stages.GUIDE;
  }

  function startContent() {
    stage = stages.CONTENT;
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
    onBack={onBack}
  />
{:else if stage === stages.GUIDE}
  <ActivityGuideIntro
    audio={guideData.audio}
    buttonText={guideData.buttonText}
    onNext={startContent}
  />
{:else}
  <slot />
{/if}
