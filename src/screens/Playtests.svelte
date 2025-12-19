<script>
  import { router, routes } from '../router';
  import { settings } from '../stores/settings';

  const items = [
    { id: routes.ACTIVITY_A, title: 'Активность A', desc: 'Выгорание под солнцем' },
    { id: routes.ACTIVITY_B, title: 'Активность B', desc: 'Ловить письма' },
    { id: routes.ACTIVITY_C, title: 'Активность C', desc: 'Мини-квиз/вопрос по экспонату' },
    { id: routes.ACTIVITY_D, title: 'Активность D', desc: 'Зум картины → тап по зоне → квиз' },
    { id: routes.ACTIVITY_E, title: 'Активность E', desc: 'Карта и что-то там' }
  ];
</script>

<div class="safe">
  <div style="display:flex; align-items:flex-start; justify-content:space-between; gap: 12px;">
    <div>
      <p class="h1" style="margin:0;">Плейтесты</p>
      <p class="p" style="margin-top:6px;">Выберите активность для запуска</p>
    </div>

    <div style="text-align:right; font-size:12px; color: rgba(17,24,39,0.65);">
      {#if $settings.audioEnabled}
        Аудио: включено
      {:else}
        Аудио: выкл
      {/if}
    </div>
  </div>

  <div style="margin-top:16px; display:flex; flex-direction:column; gap:12px;">
    {#each items as it}
      <button
        class="card"
        style="text-align:left; border:1px solid rgba(59,130,246,0.15);"
        on:click={() => router.go(it.id)}
      >
        <div style="font-weight:700;">{it.title}</div>
        <div class="p" style="margin-top:6px;">{it.desc}</div>
      </button>
    {/each}
  </div>

  <div class="footer">
    -----------------------
  </div>
</div>