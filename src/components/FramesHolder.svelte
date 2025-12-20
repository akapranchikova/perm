<script>
    import '../styles/fonts.css';
    import '../styles/constants.css';
    import '../styles/interactive-elements.css';

    import { onMount, onDestroy } from "svelte";

    let {
        minValue = 0,
        maxValue = 365,
        maxScale = 3,
        totalFramesCount = 9,
        frameNameDigitCount = 4,
        frameBasePath = "/activityA/",
        frameNameBase = "frame_",
        frameNameExtension = ".png",
        cssClass = "",
        alt = "",
        value = 0
    } = $props();

    let scale = $state(1);
    let translateX = $state(0);
    let translateY = $state(0);
    let isDragging = $state(false);
    let lastMouseX = $state(0);
    let lastMouseY = $state(0);
    let imageNaturalSize = $state(null);
    let containerElement = $state(null);
    let imageAspectRatio = $state(0);
    let isReady = $state(false);
    let holderHeight = $state(null);
    let loadingStage = $state("loading");
    let framesHolderRef = $state(null);

    let containerWidth = $state(0);
    let containerHeight = $state(0);
    let initialScale = $state(1);

    let lastDistance = $state(0);
    let lastTouchX = $state(0);
    let lastTouchY = $state(0);
    let isTouchDragging = $state(false);

    let isMouseDragging = $state(false);

    let normalizedValue = $derived((value - minValue) / (maxValue - minValue));
    let frameFloatIndex = $derived(normalizedValue * (totalFramesCount - 1));
    let frameIntIndex = $derived(Math.floor(frameFloatIndex));
    let blendFactor = $derived(frameFloatIndex - frameIntIndex);
    let topImageOpacity = $derived(blendFactor);

    let currentBottomSrc = $derived(
        getFrameFilePath(clampValue(frameIntIndex, 0, totalFramesCount - 1)));
    let currentTopSrc = $derived(
        getFrameFilePath(clampValue(frameIntIndex + 1, 0, totalFramesCount - 1)));

    let displayBottomSrc = $derived(currentBottomSrc);
    let displayTopSrc = $derived(currentTopSrc);
    let displayOpacity = $derived(topImageOpacity);

    let scaledImageWidth = $derived(imageNaturalSize ? imageNaturalSize.width * scale : 0);
    let scaledImageHeight = $derived(imageNaturalSize ? imageNaturalSize.height * scale : 0);

    let minTranslateX = $derived(0);
    let maxTranslateX = $derived(0);
    let minTranslateY = $derived(0);
    let maxTranslateY = $derived(0);

    let resizeObserver = null;
    let handleGlobalMouseMove = null;
    let handleGlobalMouseUp = null;

    function calculateInitialScale() {
        if (!imageNaturalSize || !containerElement) {
            return 1;
        }

        const rect = containerElement.getBoundingClientRect();
        const availableWidth = rect.width || containerElement.clientWidth;
        const availableHeight = rect.height || containerElement.clientHeight;

        if (availableWidth <= 0 || availableHeight <= 0) {
            return 1;
        }

        const scaleX = availableWidth / imageNaturalSize.width;
        const scaleY = availableHeight / imageNaturalSize.height;
        return Math.min(scaleX, scaleY);
    }

    function updateBoundaries() {
        if (!containerElement || !imageNaturalSize || scale <= 0) {
            return;
        }

        const rect = containerElement.getBoundingClientRect();
        containerWidth = rect.width;

        if (!containerHeight || containerHeight <= 0) {
            containerHeight = rect.height || parseInt(holderHeight) || 500;
        }

        if (containerWidth <= 0 || containerHeight <= 0) {
            return;
        }

        const scaledWidth = imageNaturalSize.width * scale;
        const scaledHeight = imageNaturalSize.height * scale;

        let newMinTranslateX,
            newMaxTranslateX,
            newMinTranslateY,
            newMaxTranslateY;

        if (scaledWidth <= containerWidth) {
            newMaxTranslateX = (containerWidth - scaledWidth) / 2;
            newMinTranslateX = newMaxTranslateX;
        } else {
            newMaxTranslateX = 0;
            newMinTranslateX = containerWidth - scaledWidth;
        }

        if (scaledHeight <= containerHeight) {
            newMaxTranslateY = (containerHeight - scaledHeight) / 2;
            newMinTranslateY = newMaxTranslateY;
        } else {
            newMaxTranslateY = 0;
            newMinTranslateY = containerHeight - scaledHeight;
        }

        minTranslateX = newMinTranslateX;
        maxTranslateX = newMaxTranslateX;
        minTranslateY = newMinTranslateY;
        maxTranslateY = newMaxTranslateY;

        const newTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, translateX));
        const newTranslateY = Math.max(minTranslateY, Math.min(maxTranslateY, translateY));

        if (newTranslateX !== translateX) {
            translateX = newTranslateX;
        }
        if (newTranslateY !== translateY) {
            translateY = newTranslateY;
        }
    }

    function applyScaleConstraints() {
        if (!imageNaturalSize) {
            return;
        }

        const minAllowedScale = initialScale;
        const maxAllowedScale = initialScale * maxScale;

        const newScale = Math.max(minAllowedScale, Math.min(maxAllowedScale, scale));
        if (newScale !== scale) {
            scale = newScale;
        }
    }

    function updateContainerDimensions() {
        if (!containerElement || !imageNaturalSize) {
            return;
        }

        try {
            const element = containerElement;
            const rect = element.getBoundingClientRect();

            let width = rect.width;
            if (width <= 0 && element.parentElement) {
                const parentRect = element.parentElement.getBoundingClientRect();
                width = parentRect.width || 800;
            }

            if (width <= 0) {
                width = 800;
            }

            let height = rect.height || element.clientHeight;

            if (!height || height <= 0) {
                height = width / imageAspectRatio;
            }

            containerWidth = width;
            containerHeight = height;
            holderHeight = `${height}px`;

            initialScale = calculateInitialScale();
            scale = initialScale;

            const scaledWidth = imageNaturalSize.width * scale;
            const scaledHeight = imageNaturalSize.height * scale;

            translateX = (containerWidth - scaledWidth) / 2;
            translateY = (containerHeight - scaledHeight) / 2;

            isReady = true;

            updateBoundaries();
        } catch (error) {
            console.error("Ошибка в updateContainerDimensions:", error);
        }
    }

    function loadFirstImage() {
        loadingStage = "loading";

        const firstImagePath = getFrameFilePath(0);
        const img = new Image();

        img.onload = () => {
            imageNaturalSize = {
                width: img.naturalWidth,
                height: img.naturalHeight,
            };
            imageAspectRatio = img.naturalWidth / img.naturalHeight;
            loadingStage = "ready";

            preloadAllFrames();

            if (containerElement) {
                updateContainerDimensions();
            } else {
                setTimeout(() => {
                    if (containerElement) {
                        updateContainerDimensions();
                    }
                }, 50);
            }
        };

        img.onerror = (err) => {
            console.error("Ошибка загрузки первого изображения:", err);
            imageNaturalSize = { width: 800, height: 600 };
            imageAspectRatio = 800 / 600;
            loadingStage = "error";
            isReady = true;

            if (containerElement) {
                updateContainerDimensions();
            }
        };

        img.src = firstImagePath;
    }

    function preloadAllFrames() {
        if (loadingStage !== "ready" && loadingStage !== "error") {
            return;
        }

        for (let i = 0; i < totalFramesCount; i++) {
            const preloadImg = new Image();
            preloadImg.src = getFrameFilePath(i);
        }
    }

    function handleMouseDown(event) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (scale > initialScale) {
            isMouseDragging = true;
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
        }
    }

    function handleMouseMove(event) {
        if (!isMouseDragging) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const deltaX = event.clientX - lastMouseX;
        const deltaY = event.clientY - lastMouseY;

        translateX += deltaX;
        translateY += deltaY;

        updateBoundaries();

        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }

    function handleMouseUp(event) {
        if (!isMouseDragging) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        isMouseDragging = false;
    }

    function handleWheel(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!containerElement || !imageNaturalSize) {
            return;
        }

        try {
            const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
            const oldScale = scale;

            scale = scale * zoomFactor;

            applyScaleConstraints();

            if (scale !== oldScale) {
                const rect = containerElement.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;

                const imageX = (mouseX - translateX) / oldScale;
                const imageY = (mouseY - translateY) / oldScale;

                translateX = mouseX - imageX * scale;
                translateY = mouseY - imageY * scale;

                updateBoundaries();
            }
        } catch (error) {
            console.error("Ошибка в handleWheel:", error);
        }
    }

    function handleMouseLeave() {
        if (isMouseDragging) {
            isMouseDragging = false;
        }
    }

    function handleTouchStart(event) {
        event.preventDefault();
        event.stopPropagation();

        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            lastDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY,
            );
            lastTouchX = (touch1.clientX + touch2.clientX) / 2;
            lastTouchY = (touch1.clientY + touch2.clientY) / 2;

            isTouchDragging = false;
        } else if (event.touches.length === 1 && scale > initialScale) {
            const touch = event.touches[0];

            isTouchDragging = true;
            lastMouseX = touch.clientX;
            lastMouseY = touch.clientY;
        }
    }

    function handleTouchMove(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!containerElement || !imageNaturalSize) {
            return;
        }

        try {
            if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];

                const distance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY,
                );
                const midX = (touch1.clientX + touch2.clientX) / 2;
                const midY = (touch1.clientY + touch2.clientY) / 2;

                if (lastDistance > 0) {
                    const deltaScale = distance / lastDistance;
                    const oldScale = scale;

                    scale = scale * deltaScale;

                    applyScaleConstraints();

                    if (scale !== oldScale) {
                        const rect = containerElement.getBoundingClientRect();

                        const containerX = midX - rect.left;
                        const containerY = midY - rect.top;

                        const imageX = (containerX - translateX) / oldScale;
                        const imageY = (containerY - translateY) / oldScale;

                        translateX = containerX - imageX * scale;
                        translateY = containerY - imageY * scale;

                        updateBoundaries();
                    }
                }

                lastDistance = distance;
                lastTouchX = midX;
                lastTouchY = midY;
            } else if (
                event.touches.length === 1 &&
                isTouchDragging &&
                scale > initialScale
            ) {
                const touch = event.touches[0];
                const deltaX = touch.clientX - lastMouseX;
                const deltaY = touch.clientY - lastMouseY;

                translateX += deltaX;
                translateY += deltaY;

                updateBoundaries();

                lastMouseX = touch.clientX;
                lastMouseY = touch.clientY;
            }
        } catch (error) {
            console.error("Ошибка в handleTouchMove:", error);
        }
    }

    function handleTouchEnd(event) {
        event.preventDefault();
        event.stopPropagation();

        isTouchDragging = false;
        lastDistance = 0;
    }

    function handleResize() {
        if (imageNaturalSize) {
            updateContainerDimensions();
        }
    }

    function clampValue(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function getFrameFilePath(frameIndex) {
        const paddedFrameIndex = String(frameIndex + 1).padStart(frameNameDigitCount, "0");
        return `${frameBasePath}${frameNameBase}${paddedFrameIndex}${frameNameExtension}`;
    }

    function removeEventListeners() {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);

        if (containerElement) {
            containerElement.removeEventListener("touchstart", handleTouchStart);
            containerElement.removeEventListener("touchmove", handleTouchMove);
            containerElement.removeEventListener("touchend", handleTouchEnd);
            containerElement.removeEventListener("touchcancel", handleTouchEnd);

            containerElement.removeEventListener("mousedown", handleMouseDown);
            containerElement.removeEventListener("wheel", handleWheel);
            containerElement.removeEventListener("mouseleave", handleMouseLeave);
        }

        if (resizeObserver) {
            resizeObserver.disconnect();
        }
    }

    onMount(() => {
        loadFirstImage();

        setTimeout(() => {
            if (framesHolderRef) {
                containerElement = framesHolderRef;

                if (containerElement) {
                    containerElement.addEventListener("touchstart", handleTouchStart,
                        { passive: false });
                    containerElement.addEventListener("touchmove", handleTouchMove,
                        { passive: false });
                    containerElement.addEventListener("touchend", handleTouchEnd,
                        { passive: false });
                    containerElement.addEventListener("touchcancel", handleTouchEnd,
                        { passive: false });

                    containerElement.addEventListener("mousedown", handleMouseDown);
                    containerElement.addEventListener("wheel", handleWheel,
                        { passive: false });
                    containerElement.addEventListener("mouseleave", handleMouseLeave);
                }

                if (imageNaturalSize) {
                    updateContainerDimensions();
                }
            }

            if (containerElement) {
                resizeObserver = new ResizeObserver(handleResize);
                resizeObserver.observe(containerElement);
            }
        }, 100);

        handleGlobalMouseMove = (e) => handleMouseMove(e);
        handleGlobalMouseUp = (e) => handleMouseUp(e);

        document.addEventListener("mousemove", handleGlobalMouseMove);
        document.addEventListener("mouseup", handleGlobalMouseUp);

        return removeEventListeners;
    });

    onDestroy(removeEventListeners);    
</script>

<div
    class="frames-holder painting {cssClass}"
    bind:this={framesHolderRef}
    role="button"
    tabindex="0"
    aria-label="Картина"
    {alt}
>
    {#if loadingStage === "loading"}
        <div class="loading-indicator">Загрузка...</div>
    {:else if loadingStage === "error"}
        <div class="error-indicator">Ошибка загрузки</div>
    {:else}
        <div class="image-container">
            <div
                class="frames-container"
                style="
                    width: {imageNaturalSize?.width || 0}px;
                    height: {imageNaturalSize?.height || 0}px;
                    position: absolute;
                    transform: translate({translateX}px, {translateY}px) scale({scale});
                    transform-origin: 0 0;"
            >
                <img
                    class="frame bottom"
                    src={displayBottomSrc}
                    alt="Изображение кадра"
                />

                {#if displayTopSrc && displayTopSrc !== displayBottomSrc}
                    <img
                        class="frame top"
                        src={displayTopSrc}
                        alt=""
                        style="opacity: {displayOpacity};"
                        aria-hidden="true"
                    />
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .frames-holder {
        position: relative;
        overflow: hidden;
        display: block;
        width: 100%;
        height: 100%;
        touch-action: none;
        user-select: none;
        cursor: grab;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        background-color: transparent;
    }

    .frames-holder:active,
    .frames-holder.grabbing {
        cursor: grabbing;
    }

    .loading-indicator,
    .error-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--txt-secondary);
        font-family: "Inter", sans-serif;
        font-size: 16px;
        background-color: transparent;
    }

    .image-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
    }

    .frames-container {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
        will-change: transform;
    }

    .frame {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
        -webkit-user-drag: none;
        user-drag: none;
    }

    .frame.bottom {
        opacity: 1;
    }

    .frame.top {
        opacity: 0;
        transition: opacity 0.2s linear;
    }
</style>