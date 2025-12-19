<script>
  import './styles/app.css';

  import { router, routes } from './router';

  import Playtests from './screens/Playtests.svelte';
  import StartLoading from './screens/StartLoading.svelte';
  import Onboarding from './screens/Onboarding.svelte'

  import ActivityA from './activities/ActivityA.svelte';
  import ActivityB from './activities/ActivityB.svelte';
  import ActivityC from './activities/ActivityC.svelte';
  import ActivityD from './activities/ActivityD.svelte';
  import ActivityE from './activities/ActivityE.svelte';

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
  {:else if $router.name === routes.ACTIVITY_B}
    <ActivityB />
  {:else if $router.name === routes.ACTIVITY_C}
    <ActivityC />
  {:else if $router.name === routes.ACTIVITY_D}
    <ActivityD />
  {:else if $router.name === routes.ACTIVITY_E}
    <ActivityE />
  {:else}
    <div class="safe">
      <p class="h1">Неизвестный экран</p>
    </div>
  {/if}
</div>