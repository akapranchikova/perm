<script>
  import { onMount, onDestroy } from "svelte";
  import { router, routes } from "../router";

  // Статичный контент
  const title = "Поленов\nи ученики";
  const desc = "Цифровое AI‑путешествие\nпо выставке";

  // Ассеты
  const IMAGE_SRC = "/StartLoading/start-bg.jpg";
  const VIDEO_SRC = "/StartLoading/6944fe39e6e2ba74169403b6_result.mp4";

  let showText = true;
  let showVideo = false;

  let videoEl; // Сюда забиндится элемент
  let t1, t2;

  const t = setTimeout(() => {
    console.log("[Splash] timeout -> INTRO");
    clearTimeout(t);
    router.go(routes.INTRO);
  }, 1300);

  async function startVideoPhase() {
    console.log("Phase: Start Video");

    // 1. Меняем стейт
    showText = false;
    showVideo = true;

    // 2. Ждем, пока Svelte обновит DOM (важно, если видео было скрыто через if)
    //await tick();

    // 3. Теперь videoEl точно должен быть доступен
    console.log("Video Element:", videoEl);

    if (videoEl) {
      try {
        videoEl.currentTime = 0;
        // play() возвращает Promise, его лучше дождаться
        await videoEl.play();
      } catch (e) {
        console.warn("Autoplay blocked or failed:", e);
        // Здесь можно показать кнопку Play, если автоплей заблокирован браузером
      }
    }

    // через 3 секунды возвращаем фон
    t2 = setTimeout(() => {
      if (videoEl) {
        videoEl.pause();
        videoEl.currentTime = 0;
      }
      showVideo = false;
      showText = true;
    }, 3000);
  }

  function setupVideo(node) {
    console.log("Video element created!", node);
    videoEl = node;

    // Сразу запускаем логику через 1 сек
    const timer = setTimeout(startVideoPhase, 1000);

    return {
      destroy() {
        clearTimeout(timer);
        // Очистка при удалении элемента
      },
    };
  }

  onMount(() => {
    console.log("MOUNTED: Компонент вмонтирован в DOM");
    t1 = setTimeout(startVideoPhase, 1000);
  });

  onDestroy(() => {
    clearTimeout(t1);
    clearTimeout(t2);
    // Останавливаем видео при уничтожении компонента, чтобы не висело в памяти
    if (videoEl) {
      videoEl.pause();
      videoEl.src = "";
    }
  });
</script>

<section class="screen" aria-label="Стартовая загрузка">
  <div class="bg" style={`background-image:url('${IMAGE_SRC}')`}></div>

  <video
    use:setupVideo
    class="bgVideo"
    class:isVisible={showVideo}
    bind:this={videoEl}
    src={VIDEO_SRC}
    muted
    playsinline
    preload="auto"
  ></video>

  <div class="content">
    <div class:hideText={!showText}>
      <h1 class="title">Поленов{"\n"}и ученики</h1>
      <p class="desc">Цифровое AI‑путешествие{"\n"}по выставке</p>
    </div>
  </div>

  <footer class="footer" aria-label="Логотипы партнёров">
    <div class="logos">
      <span class="logo logo-arch" aria-hidden="true"></span>
      <span class="sep" aria-hidden="true">×</span>
      <span class="logo logo-sber" aria-label="Сбер"></span>
      <span class="sep" aria-hidden="true">×</span>
      <span class="logo logo-giga" aria-label="ГигаЧат"></span>
    </div>
  </footer>
</section>

<style>
  .screen {
    position: relative;
    min-height: 100svh;
    overflow: hidden;
  }

  .bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
  }

  .bgVideo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;

    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;
  }
  .bgVideo.isVisible {
    opacity: 1;
    pointer-events: auto;
  }

  .content {
    position: relative;
    z-index: 1;
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: clamp(16px, 4vw, 32px);
    text-align: center;
  }

  .hideText {
    opacity: 0;
    transform: translateY(4px);
    transition:
      opacity 160ms ease,
      transform 160ms ease;
    pointer-events: none;
  }
  /* Если showText=true, класс hideText убирается, и элемент виден (по дефолту opacity: 1 у div) */
  /* Но в вашем CSS .hideText перебивает дефолт. Чтобы текст был виден изначально, 
     нужно убедиться, что у div без класса hideText есть opacity: 1. 
     В данном случае div по умолчанию visible, так что все ок. */

  .title {
    margin: 0;
    font-family: "Prata", serif;
    font-weight: 400;
    color: #18160f;
    font-size: clamp(40px, 7vw, 56px);
    line-height: 1.05;
    white-space: pre-line;
  }

  .desc {
    margin: clamp(10px, 2.2vw, 16px) 0 0;
    font-family:
      "Inter",
      system-ui,
      -apple-system,
      Segoe UI,
      Roboto,
      Arial,
      sans-serif;
    font-weight: 400;
    color: #18160f;
    font-size: clamp(14px, 2.6vw, 16px);
    line-height: 1.2;
    white-space: pre-line;
  }

  .footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: env(safe-area-inset-bottom, 0);
    z-index: 2;
    padding: 18px 16px 22px;
    display: flex;
    justify-content: center;
  }

  .logos {
    display: flex;
    align-items: center;
    gap: 12px;
    color: rgba(255, 255, 255, 0.92);
  }

  .sep {
    opacity: 0.7;
    font-size: 18px;
    line-height: 1;
  }

  .logo {
    display: inline-block;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
  }
  .logo-arch {
    width: 44px;
    height: 44px;
    background-image: url("/assets/logo-arch.png");
  }
  .logo-sber {
    width: 74px;
    height: 20px;
    background-image: url("/assets/logo-sber.png");
  }
  .logo-giga {
    width: 92px;
    height: 28px;
    background-image: url("/assets/logo-giga.png");
  }
</style>
