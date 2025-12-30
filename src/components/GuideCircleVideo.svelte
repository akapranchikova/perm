<script>
    import { createEventDispatcher } from "svelte";
    import "../styles/constants.css";

    let {
        src,
        subtitlesSrc = "",
        isMuted = true,
        autoplay = true,
        isLooped = true,
        cssClass = "",
        onLoad = () => {},
    } = $props();

    const dispatch = createEventDispatcher();

    let videoElement;
    let containerElement;
    let subtitles = [];
    let activeSubtitleIndex = -1;

    function dispatchSubtitle(text = "", index = -1) {
        console.log("dispatchSubtitle")
        dispatch("subtitlechange", { text, index });
    }

    async function loadSubtitles(url) {
        if (!url) {
            subtitles = [];
            activeSubtitleIndex = -1;
            dispatchSubtitle("");
            console.log("no loadSubtitles")
            return;
        }

        try {
            console.log("loadSubtitles")
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const file = await response.text();
            subtitles = parseSrt(file);
            activeSubtitleIndex = -1;
            dispatchSubtitle("");
        } catch (error) {
            console.error("Не удалось загрузить субтитры:", error);
            subtitles = [];
            dispatchSubtitle("");
        }
    }

    function parseSrt(data) {
        return data
            .trim()
            .split(/\r?\n\r?\n/g)
            .map((block) => {
                const lines = block.split(/\r?\n/);
                const timeLine = lines[1];
                if (!timeLine) return null;
                const [startRaw, endRaw] = timeLine.split(" --> ");
                const text = lines.slice(2).join("\n").trim();
                return {
                    start: toSeconds(startRaw),
                    end: toSeconds(endRaw),
                    text,
                };
            })
            .filter(Boolean);
    }

    function toSeconds(timeString = "") {
        const [h = "0", m = "0", rest = "0"] = timeString.replace(",", ".").split(":");
        return Number(h) * 3600 + Number(m) * 60 + Number(rest);
    }

    function handleTimeUpdate() {
        if (!videoElement || !subtitles.length) return;

        const { currentTime } = videoElement;
        const current =
            activeSubtitleIndex >= 0 ? subtitles[activeSubtitleIndex] : null;

        if (current && currentTime >= current.start && currentTime <= current.end) {
            return;
        }

        const nextIndex = subtitles.findIndex(
            (item) => currentTime >= item.start && currentTime <= item.end,
        );

        activeSubtitleIndex = nextIndex;
        dispatchSubtitle(nextIndex === -1 ? "" : subtitles[nextIndex].text, nextIndex);
    }

    $effect(() => {
        if (videoElement) {
            const wasPlaying = !videoElement.paused;
            const currentTime = videoElement.currentTime;

            videoElement.muted = isMuted;
            videoElement.loop = isLooped;

            if (!isLooped && wasPlaying) {
                videoElement.currentTime = currentTime;
                videoElement.play().catch(() => {});
            }
        }
    });

    $effect(() => {
        loadSubtitles(subtitlesSrc);
    });

    $effect(() => {
        if (!videoElement) return;
        const handler = () => handleTimeUpdate();

        videoElement.addEventListener("timeupdate", handler);
        videoElement.addEventListener("seeked", handler);
        videoElement.addEventListener("playing", handler);
        videoElement.addEventListener("loadedmetadata", handler);

        return () => {
            videoElement.removeEventListener("timeupdate", handler);
            videoElement.removeEventListener("seeked", handler);
            videoElement.removeEventListener("playing", handler);
            videoElement.removeEventListener("loadedmetadata", handler);

            videoElement.pause();
            videoElement.removeAttribute('src'); 
            videoElement.load();
        };
    });

    function handleVideoLoad() {
        if (videoElement) {
            onLoad();
        }
    }

    function handleError(e) {
        console.error("Ошибка загрузки видео:", e);
    }
</script>

<div class="video-container {cssClass}" bind:this={containerElement}>
    <div class="outer-circle">
        <div class="inner-circle">
            <video
                bind:this={videoElement}
                class="video-element"
                {autoplay}
                playsinline
                preload="metadata"
                onloadeddata={handleVideoLoad}
                oncanplay={handleVideoLoad}
                onerror={handleError}
            >
                <source {src} type="video/webm" />
                Нет видео
            </video>
        </div>
    </div>
</div>

<style>
    .video-container {
        display: inline-block;
        position: relative;
    }

    .outer-circle {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 1px solid var(--txt-white);
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    }

    .inner-circle {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid var(--accent);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .video-element {
        width: 120%;
        height: 120%;
        object-fit: cover;
        background-color: var(--accent);
        border-radius: 50%;
    }
</style>