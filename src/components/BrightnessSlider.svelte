<script>
    import { onMount, onDestroy } from "svelte";
    import "../styles/fonts.css";
    import "../styles/constants.css";
    import "../styles/interactive-elements.css";

    let {
        minValue = 0,
        maxValue = 100,
        value = minValue,
        cssClass = "",
        onValueChanged = (value) => {},
    } = $props();

    let containerElement = $state(null);
    let sliderElement = $state(null);
    let isDragging = $state(false);
    let sliderRect = $state({ left: 0, width: 0 });

    let fillPercentage = $derived(maxValue !== minValue
        ? ((value - minValue) / (maxValue - minValue)) * 100
        : 0);

    const sunIconPath = `<path d="M18 27C20.3869 27 22.6761 26.0518 24.364 24.364C26.0518 22.6761 27 20.3869 27 18C27 15.6131 26.0518 13.3239 24.364 11.636C22.6761 9.94821 20.3869 9 18 9C15.6131 9 13.3239 9.94821 11.636 11.636C9.94821 13.3239 9 15.6131 9 18C9 20.3869 9.94821 22.6761 11.636 24.364C13.3239 26.0518 15.6131 27 18 27ZM18 0C18.2984 0 18.5845 0.118526 18.7955 0.329505C19.0065 0.540483 19.125 0.826631 19.125 1.125V5.625C19.125 5.92337 19.0065 6.20952 18.7955 6.4205C18.5845 6.63147 18.2984 6.75 18 6.75C17.7016 6.75 17.4155 6.63147 17.2045 6.4205C16.9935 6.20952 16.875 5.92337 16.875 5.625V1.125C16.875 0.826631 16.9935 0.540483 17.2045 0.329505C17.4155 0.118526 17.7016 0 18 0ZM18 29.25C18.2984 29.25 18.5845 29.3685 18.7955 29.5795C19.0065 29.7905 19.125 30.0766 19.125 30.375V34.875C19.125 35.1734 19.0065 35.4595 18.7955 35.6705C18.5845 35.8815 18.2984 36 18 36C17.7016 36 17.4155 35.8815 17.2045 35.6705C16.9935 35.4595 16.875 35.1734 16.875 34.875V30.375C16.875 30.0766 16.9935 29.7905 17.2045 29.5795C17.4155 29.3685 17.7016 29.25 18 29.25ZM36 18C36 18.2984 35.8815 18.5845 35.6705 18.7955C35.4595 19.0065 35.1734 19.125 34.875 19.125H30.375C30.0766 19.125 29.7905 19.0065 29.5795 18.7955C29.3685 18.5845 29.25 18.2984 29.25 18C29.25 17.7016 29.3685 17.4155 29.5795 17.2045C29.7905 16.9935 30.0766 16.875 30.375 16.875H34.875C35.1734 16.875 35.4595 16.9935 35.6705 17.2045C35.8815 17.4155 36 17.7016 36 18ZM6.75 18C6.75 18.2984 6.63147 18.5845 6.4205 18.7955C6.20952 19.0065 5.92337 19.125 5.625 19.125H1.125C0.826631 19.125 0.540483 19.0065 0.329505 18.7955C0.118526 18.5845 0 18.2984 0 18C0 17.7016 0.118526 17.4155 0.329505 17.2045C0.540483 16.9935 0.826631 16.875 1.125 16.875H5.625C5.92337 16.875 6.20952 16.9935 6.4205 17.2045C6.63147 17.4155 6.75 17.7016 6.75 18ZM30.7282 5.27175C30.9392 5.48272 31.0576 5.76882 31.0576 6.06713C31.0576 6.36543 30.9392 6.65153 30.7282 6.8625L27.5467 10.0463C27.4422 10.1507 27.318 10.2335 27.1814 10.29C27.0448 10.3465 26.8984 10.3755 26.7506 10.3754C26.452 10.3752 26.1658 10.2564 25.9549 10.0451C25.8504 9.94053 25.7676 9.81638 25.7111 9.67977C25.6547 9.54317 25.6256 9.39677 25.6257 9.24895C25.626 8.95042 25.7448 8.6642 25.956 8.45325L29.1375 5.27175C29.3485 5.06084 29.6346 4.94237 29.9329 4.94237C30.2312 4.94237 30.5173 5.06084 30.7282 5.27175ZM10.044 25.956C10.2549 26.167 10.3734 26.4531 10.3734 26.7514C10.3734 27.0497 10.2549 27.3358 10.044 27.5467L6.8625 30.7282C6.65032 30.9332 6.36615 31.0466 6.07117 31.044C5.7762 31.0414 5.49404 30.9231 5.28545 30.7145C5.07687 30.506 4.95855 30.2238 4.95599 29.9288C4.95343 29.6339 5.06682 29.3497 5.27175 29.1375L8.45325 25.956C8.66422 25.7451 8.95031 25.6266 9.24862 25.6266C9.54693 25.6266 9.83303 25.7451 10.044 25.956ZM30.7282 30.7282C30.5173 30.9392 30.2312 31.0576 29.9329 31.0576C29.6346 31.0576 29.3485 30.9392 29.1375 30.7282L25.956 27.5467C25.7511 27.3346 25.6377 27.0504 25.6402 26.7554C25.6428 26.4605 25.7611 26.1783 25.9697 25.9697C26.1783 25.7611 26.4605 25.6428 26.7554 25.6402C27.0504 25.6377 27.3346 25.7511 27.5467 25.956L30.7282 29.1375C30.9392 29.3485 31.0576 29.6346 31.0576 29.9329C31.0576 30.2312 30.9392 30.5173 30.7282 30.7282ZM10.044 10.0463C9.83303 10.2572 9.54693 10.3756 9.24862 10.3756C8.95031 10.3756 8.66422 10.2572 8.45325 10.0463L5.27175 6.8625C5.1643 6.75872 5.0786 6.63458 5.01964 6.49733C4.96068 6.36008 4.92964 6.21245 4.92834 6.06308C4.92705 5.9137 4.95551 5.76556 5.01208 5.6273C5.06864 5.48904 5.15218 5.36343 5.25781 5.25781C5.36343 5.15218 5.48904 5.06864 5.6273 5.01208C5.76556 4.95551 5.9137 4.92705 6.06308 4.92834C6.21245 4.92964 6.36008 4.96068 6.49733 5.01964C6.63458 5.0786 6.75872 5.1643 6.8625 5.27175L10.044 8.45325C10.1488 8.55775 10.2319 8.6819 10.2886 8.81857C10.3453 8.95525 10.3745 9.10177 10.3745 9.24975C10.3745 9.39773 10.3453 9.54425 10.2886 9.68093C10.2319 9.8176 10.1488 9.94175 10.044 10.0463Z" />`;

    let resizeObserver = null;

    function updateSliderRect() {
        if (!sliderElement) {
            return;
        }

        const rect = sliderElement.getBoundingClientRect();
        sliderRect = {
            left: rect.left,
            width: rect.width
        };
    }

    function getValueFromPosition(clientX) {
        if (!sliderRect.width) return value;

        const clickX = clientX - sliderRect.left;
        const percentage = Math.max(0, Math.min(1, clickX / sliderRect.width));

        return Math.round(minValue + percentage * (maxValue - minValue));
    }

    function updateValueFromPosition(clientX) {
        updateSliderRect();
        const newValue = getValueFromPosition(clientX);
        updateValue(newValue);
    }

    function updateValue(newValue) {
        const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));

        if (clampedValue !== value) {
            value = clampedValue;
            onValueChanged(value);
        }
    }

    function handlePointerStart(event) {
        event.preventDefault();
        isDragging = true;
        updateSliderRect();

        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerEnd);
        document.addEventListener("pointercancel", handlePointerEnd);
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);
        document.addEventListener("touchcancel", handleTouchEnd);
    }

    function handlePointerMove(event) {
        if (!isDragging || !sliderRect.width) {
            return;
        }

        event.preventDefault();
        const clientX = event.clientX ?? event.touches?.[0]?.clientX;

        if (clientX !== undefined) {
            updateValueFromPosition(clientX);
        }
    }

    function handlePointerEnd(event) {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        removeMouseAndTouchEventListeners();
    }

    function handleTouchMove(event) {
        if (!isDragging || !event.touches.length) {
            return;
        }

        event.preventDefault();
        const touch = event.touches[0];
        updateValueFromPosition(touch.clientX);
    }

    function handleTouchEnd(event) {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        removeMouseAndTouchEventListeners();
    }

    function handleSliderClick(event) {
        event.stopPropagation();
        updateSliderRect();

        const clientX = event.clientX ?? event.changedTouches?.[0]?.clientX;
        if (clientX !== undefined) {
            updateValueFromPosition(clientX);
        }
    }

    function removeMouseAndTouchEventListeners() {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerEnd);
        document.removeEventListener("pointercancel", handlePointerEnd);

        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("touchcancel", handleTouchEnd);
    }

    function removeAllEventListeners() {
        removeMouseAndTouchEventListeners();

        if (resizeObserver) {
            resizeObserver.disconnect();
        }

        window.removeEventListener("resize", updateSliderRect);
    }

    onMount(() => {
        const clampedValue = Math.max(minValue, Math.min(maxValue, value));
        if (clampedValue !== value) {
            value = clampedValue;
        }

        setTimeout(() => updateSliderRect(), 0);

        if (sliderElement) {
            resizeObserver = new ResizeObserver(() => updateSliderRect());
            resizeObserver.observe(sliderElement);
        }

        window.addEventListener("resize", updateSliderRect);

        return removeAllEventListeners;
    });

    onDestroy(removeAllEventListeners);

    $effect(() => {
        const clampedValue = Math.max(minValue, Math.min(maxValue, value));
        if (clampedValue !== value) {
            value = clampedValue;
        }
    });
</script>

<div
    class="brightness-slider {cssClass}"
    bind:this={containerElement}
    style="--fill-percentage: {fillPercentage}%"
    class:dragging={isDragging}
    role="slider"
    tabindex="0"
    aria-valuemin={minValue}
    aria-valuemax={maxValue}
    aria-valuenow={value}
    aria-label="Регулятор яркости"
>
    <div
        class="slider-container"
        bind:this={sliderElement}
        onpointerdown={handlePointerStart}
        onclick={handleSliderClick}
        ontouchstart={handleSliderClick}
        role="presentation"
        aria-hidden="true"
    >
        <div class="dark-sun-icon">
            <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {@html sunIconPath}
            </svg>
        </div>

        <div class="slider-fill" aria-hidden="true">
            <div class="light-sun-icon">
                <svg
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {@html sunIconPath}
                </svg>
            </div>
        </div>
    </div>
</div>

<style>
    .brightness-slider {
        width: 100%;
        height: 68px;
        border-radius: 16px;
        border: 0.4px solid var(--bg);
        background: transparent;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: none;
        outline: none;
        position: relative;
        box-sizing: border-box;
    }

    .brightness-slider:focus {
        outline: none;
    }

    .brightness-slider.dragging {
        cursor: grabbing;
    }

    .slider-container {
        position: relative;
        width: 100%;
        height: 100%;
        background-color: color-mix(in srgb, var(--bg) 50%, transparent);
        border-radius: 15px;
    }

    .dark-sun-icon {
        position: absolute;
        top: 16px;
        left: 16px;
        width: 36px;
        height: 36px;
        z-index: 1;
        pointer-events: none;
    }

    .dark-sun-icon svg {
        width: 100%;
        height: 100%;
        fill: var(--accent);
    }

    .slider-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: var(--fill-percentage, 0%);
        background-color: var(--accent);
        border-radius: 15px 0 0 15px;
        pointer-events: none;
        z-index: 2;
        overflow: hidden;
    }

    .light-sun-icon {
        position: absolute;
        top: 16px;
        left: 16px;
        width: 36px;
        height: 36px;
        pointer-events: none;
    }

    .light-sun-icon svg {
        width: 100%;
        height: 100%;
        fill: var(--bg);
    }

    .brightness-slider:not(.dragging) .slider-fill {
        transition: width 0.1s ease;
    }

    .brightness-slider.dragging .slider-fill {
        transition: none;
    }
</style>