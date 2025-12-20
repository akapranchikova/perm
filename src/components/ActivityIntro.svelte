<script>
  export let title = 'Подводка';
  export let imageUrl = './guides.png';
  export let textLines = [];
  export let buttonText = 'Далее';
  export let onNext = () => {};
</script>

<div class="safe intro">
  <div class="topbar">
    <div class="hgroup">
      <div class="title">{title}</div>
    </div>

    <button class="icon" type="button" aria-label="Звук">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M11 5L6.5 9H3v6h3.5L11 19V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 9c1.5 1.5 1.5 4.5 0 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <div class="card mediaCard">
    {#if imageUrl}
      <img class="img" src={imageUrl} alt="" />
    {:else}
      <div class="img placeholder" aria-hidden="true"></div>
    {/if}

    <div class="text">
      {#each textLines as l}
        <div class="line">{l}</div>
      {/each}
    </div>
  </div>

  <button class="btn-primary bottomBtn" type="button" on:click={onNext}>
    {buttonText}
  </button>
</div>

<style>
  .intro{
    height: 100%;
    display:flex;
    flex-direction:column;
    gap: 14px;
  }

  .topbar{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap: 12px;
    padding-top: 2px;
    min-height: 36px;
  }
  .title{
    font-weight: 800;
    font-size: 20px;
    color: rgba(17,24,39,0.92);
    line-height: 1.1;
  }
  .icon{
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: rgba(255,255,255,0.55);
    border: 1px solid rgba(17,24,39,0.08);
    color: rgba(17,24,39,0.65);
    display:flex;
    align-items:center;
    justify-content:center;
    flex: 0 0 auto;
  }

  .card{
    background: rgba(214, 234, 251, 0.55);
    border: 1px solid rgba(17,24,39,0.06);
    border-radius: 18px;
    backdrop-filter: blur(10px);
  }

  .mediaCard{
    padding: 12px;
    flex: 1;
    display:flex;
    flex-direction:column;
    gap: 12px;
    align-items:center;
    justify-content:flex-start;
  }

  .img{
    width: 100%;
    border-radius: 16px;
    display:block;
    background: rgba(255,255,255,0.55);
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }
  .placeholder{
    background: rgba(59,130,246,0.08);
  }

  .text{
    text-align:center;
    padding: 0 8px 6px;
  }
  .line{
    font-size: 13px;
    line-height: 1.25;
    color: rgba(17,24,39,0.60);
    font-weight: 700;
  }

  .bottomBtn{
    width: 100%;
    border-radius: 16px;
    padding: 16px 14px;
    font-size: 15px;
    margin-top: auto;
  }
  .btn-primary{
    background: #3b82f6;
    color: white;
    border: 0;
    font-weight: 900;
  }
</style>
