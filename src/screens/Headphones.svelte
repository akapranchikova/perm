<script>
  import { router, routes } from '../router';
  import { settings } from '../stores/settings';

  function continueWithout() {
    settings.update(s => ({ ...s, audioEnabled: false }));
    router.go(routes.PLAYTESTS);
  }

  function continueWith() {
    settings.update(s => ({ ...s, audioEnabled: true }));
    router.go(routes.PLAYTESTS);
  }
</script>

<div class="safe">
  <div class="center">
    <div class="card">
      <p class="h1">Подключите наушники</p>
      <p class="p" style="margin-top:10px;">
        Это сделает путешествие по выставке гораздо интереснее.
      </p>
      <p class="p" style="margin-top:10px;">
        Если наушников нет, вы можете продолжить в режиме без аудио
      </p>
    </div>

    <div class="button-row">
      <button class="cta-button outline" on:click={continueWithout}>
        Продолжить без наушников
      </button>
      <button class="cta-button primary" on:click={continueWith}>
        Подключить наушники
      </button>
    </div>
  </div>
</div>
