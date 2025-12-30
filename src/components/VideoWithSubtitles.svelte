<script>
  import "../styles/constants.css";

  let {
    src = "",
    subtitlesSrc = "",
    poster = "",
    autoplay = true,
    muted = false,
    loop = false,
    controls = false,
    cssClass = "",
    // Callback для передачи текущего субтитра
    onSubtitleUpdate = (text) => {},
    // Callback для передачи полного текста (собранного из SRT)
    onCaptionsLoaded = (fullText) => {}
  } = $props();

  let video = $state();
  let captions = $state([]); 
  let lastEmittedText = $state(""); 
  let subtitlesToken = 0;

  // --- Логика парсинга SRT ---
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [time, ms] = timeStr.split(/[,.]/);
    const [h, m, s] = time.split(':');
    return (parseInt(h) * 3600) + (parseInt(m) * 60) + parseInt(s) + (parseInt(ms || 0) / 1000);
  };

  const parseSRT = (srtData) => {
    const blocks = srtData.trim().replace(/\r\n/g, '\n').split(/\n\s*\n/);
    return blocks.map(block => {
      const lines = block.split('\n');
      const timeLineIndex = lines.findIndex(line => line.includes('-->'));
      if (timeLineIndex === -1) return null;

      const [startStr, endStr] = lines[timeLineIndex].split(' --> ');
      const text = lines.slice(timeLineIndex + 1).join('<br>');

      return {
        start: parseTime(startStr.trim()),
        end: parseTime(endStr.trim()),
        text: text
      };
    }).filter(Boolean);
  };
  // ---------------------------

  async function loadSubtitles(url, token) {
    try {
      if (!url) {
        captions = [];
        updateText("");
        onCaptionsLoaded("");
        return;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch subtitles");
      
      const text = await res.text();
      if (token !== subtitlesToken) return;

      const parsed = parseSRT(text);
      captions = parsed;

      const fullText = parsed
        .map(c => c.text.replace(/<br>/g, ' '))
        .join(' ');

      onCaptionsLoaded(fullText);

    } catch (error) {
      console.error("Error loading subtitles:", error);
      captions = [];
      updateText("");
      onCaptionsLoaded("");
    }
  }

  function updateText(text) {
    if(text == undefined || text === null || text.length == 0)
        return;
    if (text !== lastEmittedText) {
      lastEmittedText = text;
      onSubtitleUpdate(text);
    }
  }

  function handleTimeUpdate() {
    if (!video || captions.length === 0) return;
    const t = video.currentTime;
    
    // Ищем субтитр, попадающий в текущее время
    const active = captions.find(c => t >= c.start && t <= c.end);
    const newText = active ? active.text : "";
    
    updateText(newText);
  }

  $effect(() => {
    if (video) {
      video.muted = muted;
    }
  });

  $effect(() => {
    if (video) {
      video.loop = loop;
    }
  });

  $effect(() => {
    if (video && src) {
      video.src = src;
      video.load();
      if (autoplay) {
        queueMicrotask(() => video.play().catch(() => {}));
      }
    }

    return () => {
      if (video) {
        video.pause();
        video.src = ""; // Очищаем источник
        video.load();   // Сбрасываем загрузку
      }
    };
  });

  $effect(() => {
    const token = ++subtitlesToken;
    // Сбрасываем текст при смене источника
    updateText(""); 
    
    if (subtitlesSrc) {
      loadSubtitles(subtitlesSrc, token);
    } else {
      captions = [];
      onCaptionsLoaded("");
    }
  });
</script>

<div class="video-wrapper-inner {cssClass}">
  <video
    bind:this={video}
    {poster}
    playsinline
    {controls}
    ontimeupdate={handleTimeUpdate}
  ></video>
</div>

<style>
  .video-wrapper-inner {
    width: 100%;
    height: 100%;
    position: relative;
  }
  
  video {
    width: 100%;
    min-width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>