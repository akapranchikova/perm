<script>
  import "./styles/app.css";
  
  import { onMount } from "svelte";
  import { artifactsCatalog } from "./data/artifacts";

  import { router, routes } from "./router";

  import Playtests from "./screens/Playtests.svelte";
  import StartLoading from "./screens/StartLoading.svelte";
  import Onboarding from "./screens/Onboarding.svelte";

  import ActivityA from "./activities/ActivityA.svelte";
  import ActivityF from "./activities/ActivityF.svelte";
  import ActivityB from "./activities/ActivityB.svelte";
  import ActivityC from "./activities/ActivityC.svelte";
  import ActivityD from "./activities/ActivityD.svelte";
  import ActivityE from "./activities/ActivityE.svelte";
  import ArtifactReward from "./screens/ArtifactReward.svelte";
  import ArtifactJournal from "./screens/ArtifactJournal.svelte";

  function preloadImages() {
    artifactsCatalog.forEach((artifact) => {
      const img = new Image();
      img.src = artifact.image;
    });
  }

//onMount(() => {
    preloadImages();
//});

</script>

<div class="phone">
  {#if $router.name === routes.SPLASH}
    <StartLoading />
  {:else if $router.name === routes.INTRO}
    <Onboarding />
  {:else if $router.name === routes.PLAYTESTS}
    <Playtests />
  {:else if $router.name === routes.ACTIVITY_A}
    <ActivityA />
  {:else if $router.name === routes.ACTIVITY_F}
    <ActivityF />
  {:else if $router.name === routes.ACTIVITY_B}
    <ActivityB />
  {:else if $router.name === routes.ACTIVITY_C}
    <ActivityC />
  {:else if $router.name === routes.ACTIVITY_D}
    <ActivityD />
  {:else if $router.name === routes.ACTIVITY_E}
    <ActivityE />
  {:else if $router.name === routes.ARTIFACT_REWARD}
    <ArtifactReward />
  {:else if $router.name === routes.ARTIFACT_JOURNAL}
    <ArtifactJournal />
  {:else}
    <div class="safe">
      <p class="h1">Неизвестный экран</p>
    </div>
  {/if}
</div>
