<script>
  import ActivityIntro from './ActivityIntro.svelte';

  export let intro = {
    title: 'Подводка',
    imageUrl: '',
    textLines: [],
    buttonText: 'Далее'
  };

  let showIntro = true;

  function next() {
    showIntro = false;
  }
</script>

{#if showIntro}
  <ActivityIntro
    title={intro.title}
    imageUrl={intro.imageUrl}
    textLines={intro.textLines}
    buttonText={intro.buttonText}
    onNext={next}
  />
{:else}
  <slot />
{/if}