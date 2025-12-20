<script>
    import { onMount, onDestroy } from "svelte";
    import "../styles/fonts.css";
    import "../styles/constants.css";
    import "../styles/interactive-elements.css";

    let {
        value = 0,
        minValue = 0,
        maxValue = 365,
        cssClass = "",
        onValueChanged = (value) => {},
    } = $props();

    let internalValue = $state(0);

    $effect(() => {
        if (value !== internalValue) {
            internalValue = value;
            updateThumbPosition();
        }
    });

    $effect(() => {
        if (internalValue < minValue) {
            internalValue = minValue;
            notifyParent();
        } else if (internalValue > maxValue) {
            internalValue = maxValue;
            notifyParent();
        }
    });

    function notifyParent() {
        if (onValueChanged) {
            onValueChanged(internalValue);
        }
    }

    let containerElement = $state(null);
    let trackElement = $state(null);
    let thumbElement = $state(null);

    let isDragging = $state(false);
    let thumbWidth = $state(40); // 40px
    let thumbHalfWidth = $derived(thumbWidth / 2);
    let trackRect = $state({ left: 0, width: 0 });
    let thumbPosition = $state(0);
    let progressWidth = $state(0);

    let resizeObserver = null;

    function updateElementSizes() {
        if (thumbElement) {
            const rect = thumbElement.getBoundingClientRect();
            thumbWidth = rect.width;
        }

        if (trackElement) {
            const rect = trackElement.getBoundingClientRect();
            trackRect = {
                left: rect.left,
                width: rect.width,
            };
        }

        updateThumbPosition();
    }

    function updateThumbPosition() {
        if (trackRect.width === 0 || maxValue === minValue) {
            return;
        }

        const range = maxValue - minValue;
        const normalizedValue = internalValue - minValue;
        const percentage = normalizedValue / range;

        const usableWidth = trackRect.width - thumbWidth;
        thumbPosition = thumbHalfWidth + percentage * usableWidth;

         updateProgressWidth();
    }

    function getValueFromPosition(clientX) {
        if (!trackElement || trackRect.width === 0) {
            return internalValue;
        }

        const clickX = clientX - trackRect.left;

        const minX = thumbHalfWidth;
        const maxX = trackRect.width - thumbHalfWidth;

        const clampedX = Math.max(minX, Math.min(maxX, clickX));

        const usableWidth = trackRect.width - thumbWidth;
        const relativePosition = clampedX - thumbHalfWidth;
        const percentage = usableWidth > 0 ? relativePosition / usableWidth : 0;

        return Math.round(minValue + percentage * (maxValue - minValue));
    }

    function updateValue(newValue) {
        const correctedValue = Math.max(minValue, Math.min(maxValue, newValue));
        if (correctedValue !== internalValue) {
            internalValue = correctedValue;
            updateThumbPosition();
            notifyParent();
        }
    }

    function updateProgressWidth() {
        if (trackRect.width === 0 || maxValue === minValue) {
            progressWidth = 0;
            return;
        }

        const range = maxValue - minValue;
        const normalizedValue = internalValue - minValue;
        const percentage = normalizedValue / range;

        const usableWidth = trackRect.width - thumbWidth;
        const thumbPos = thumbHalfWidth + percentage * usableWidth;

        progressWidth = thumbPos + thumbHalfWidth;
        progressWidth = Math.max(0, Math.min(trackRect.width, progressWidth));
    }

    function handleTrackClick(event) {
        event.stopPropagation();

        updateElementSizes();

        const clientX = event.clientX || (event.touches && event.touches[0]?.clientX);
        if (clientX) {
            const newValue = getValueFromPosition(clientX);
            updateValue(newValue);
        }
    }

    function handleThumbMouseDown(event) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        isDragging = true;
        updateElementSizes();

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }

    function handleMouseMove(event) {
        if (!isDragging) {
            return;
        }

        event.preventDefault();

        const newValue = getValueFromPosition(event.clientX);
        updateValue(newValue);
    }

    function handleMouseUp(event) {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    }

    function handleThumbTouchStart(event) {
        event.stopPropagation();

        isDragging = true;
        updateElementSizes();

        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);
        document.addEventListener("touchcancel", handleTouchEnd);
    }

    function handleTouchMove(event) {
        if (!isDragging || !event.touches.length) {
            return;
        }

        event.preventDefault();

        const touch = event.touches[0];
        const newValue = getValueFromPosition(touch.clientX);
        updateValue(newValue);
    }

    function handleTouchEnd(event) {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("touchcancel", handleTouchEnd);
    }

    function removeEventListeners() {
        if (resizeObserver) {
            resizeObserver.disconnect();
        }

        window.removeEventListener("resize", updateElementSizes);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("touchcancel", handleTouchEnd);
    }

    onMount(() => {
        internalValue = value;

        setTimeout(() => {
            updateElementSizes();
        }, 100);

        window.addEventListener("resize", updateElementSizes);

        if (trackElement) {
            resizeObserver = new ResizeObserver(updateElementSizes);
            resizeObserver.observe(trackElement);
        }

        return removeEventListeners;
    });

    onDestroy(removeEventListeners);
</script>

<div
    bind:this={containerElement}
    class="slider-container {cssClass}"
    class:dragging={isDragging}
    role="slider"
    tabindex="0"
    aria-valuemin={minValue}
    aria-valuemax={maxValue}
    aria-valuenow={internalValue}
    aria-label="Слайдер"
>
    <div
        class="slider-track"
        bind:this={trackElement}
        onclick={handleTrackClick}
        ontouchstart={handleTrackClick}
        role="presentation"
        aria-hidden="true"
    >
        <div
            class="slider-progress"
            style="width: {progressWidth}px"
            aria-hidden="true"
        ></div>

        <div
            class="slider-thumb"
            bind:this={thumbElement}
            style="left: {thumbPosition}px"
            onmousedown={handleThumbMouseDown}
            ontouchstart={handleThumbTouchStart}
            role="presentation"
            aria-hidden="true"
        >
            <span class="thumb-value">{internalValue}</span>
        </div>

        <input
            type="range"
            class="slider-input"
            min={minValue}
            max={maxValue}
            value={internalValue}
            oninput={(e) => updateValue(parseInt(e.target.value))}
            onchange={(e) => updateValue(parseInt(e.target.value))}
            aria-label="Управление слайдером"
        />
    </div>
</div>

<style>
    .slider-container {
        width: 100%;
        position: relative;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        outline: none;
    }

    .slider-container:focus {
        outline: none;
    }

    .slider-track {
        position: relative;
        width: 100%;
        height: 6px;
        background-color: var(--bg);
        opacity: 0.5;
        border-radius: 3px;
        border: 0.4px solid var(--bg);
        overflow: visible;
        cursor: pointer;
        touch-action: none;
    }

    .slider-progress {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background-color: var(--accent);
        border-radius: 3px;
        pointer-events: none;
    }

    .slider-thumb {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 28px;
        background-color: var(--accent);
        border-radius: 14px;
        border: 0.4px solid var(--bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        transition: left 0.05s ease;
        box-sizing: border-box;
        cursor: grab;
        touch-action: none;
    }

    .slider-thumb:active {
        cursor: grabbing;
    }

    .thumb-value {
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 12px;
        color: var(--txt-white);
        white-space: nowrap;
        pointer-events: none;
    }

    .slider-input {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        z-index: 3;
        margin: 0;
        pointer-events: auto;
    }

    .slider-input::-webkit-slider-thumb {
        appearance: none;
        width: 28px;
        height: 28px;
        cursor: pointer;
        pointer-events: auto;
    }

    .slider-input::-moz-range-thumb {
        width: 28px;
        height: 28px;
        cursor: pointer;
        background: transparent;
        border: none;
        pointer-events: auto;
    }

    .slider-container.dragging {
        cursor: grabbing;
    }

    .slider-container.dragging .slider-thumb {
        transition: none;
        cursor: grabbing;
    }
</style>