<script>
    import '../styles/fonts.css';
    import '../styles/constants.css';
    import '../styles/interactive-elements.css';

    import { onMount, onDestroy } from "svelte";

    let {
        containerCssClass = "",
        paintingStartMinPadding = 0,
        src = "",
        alt = "",
        maxScale = 3,
        minScale = 0.5,
        maxWrongTapsCount = 3,        
        onRightBottomTap = () => {},
        onMaxWrongTaps = () => {},
    } = $props();

    let ui = $state({
        wrongTapsCount: 0,
        maxWrongTapsReached: false,

        scale: 1,
        translateX: 0,
        translateY: 0,
        initialScale: 1,

        containerWidth: 0,
        containerHeight: 0,

        imageNaturalWidth: 0,
        imageNaturalHeight: 0,
        imageAspectRatio: 1,

        minTranslateX: 0,
        maxTranslateX: 0,
        minTranslateY: 0,
        maxTranslateY: 0,

        specialAreaX: 0,
        specialAreaY: 0,
        specialAreaWidth: 0,
        specialAreaHeight: 0,

        effectiveContainerWidth: 0,
        effectiveContainerHeight: 0,
    });

    let container;
    let image;

    let lastDistance = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    
    let isMouseDragging = false;
    let mouseStartX = 0;
    let mouseStartY = 0;
    let mouseTranslateStartX = 0;
    let mouseTranslateStartY = 0;

    const TAP_THRESHOLD = 5;
    const TAP_TIME_THRESHOLD = 300;
    const MOUSE_WHEEL_ZOOM_SPEED = 0.001;
    const MOUSE_WHEEL_ZOOM_MIN_DELTA = 0.5;

    let imageLoaded = false;

    function updateSpecialArea() {
        if (!ui.imageNaturalWidth || !ui.imageNaturalHeight) {
            return;
        }

        const centerX = ui.imageNaturalWidth / 2;
        const centerY = ui.imageNaturalHeight / 2;

        ui.specialAreaX = centerX;
        ui.specialAreaY = centerY;
        ui.specialAreaWidth = ui.imageNaturalWidth - centerX;
        ui.specialAreaHeight = ui.imageNaturalHeight - centerY;
    }

    function updateContainerSize() {
        if (!container) {
            return;
        }

        ui.containerWidth = container.clientWidth;
        ui.containerHeight = container.clientHeight;

        ui.effectiveContainerWidth = Math.max(0, ui.containerWidth - paintingStartMinPadding * 2);
        ui.effectiveContainerHeight = Math.max(0, ui.containerHeight - paintingStartMinPadding * 2);
    }

    function calculateInitialScale() {
        if (!ui.effectiveContainerWidth
            || !ui.effectiveContainerHeight
            || !ui.imageNaturalWidth
            || !ui.imageNaturalHeight) {
            return 1;
        }

        const widthRatio = ui.effectiveContainerWidth / ui.imageNaturalWidth;
        const heightRatio = ui.effectiveContainerHeight / ui.imageNaturalHeight;

        return Math.min(widthRatio, heightRatio);
    }

    function updateBoundaries() {
        if (!ui.containerWidth
            || !ui.containerHeight
            || !ui.imageNaturalWidth
            || !ui.imageNaturalHeight) {
            return;
        }

        const scaledWidth = ui.imageNaturalWidth * ui.scale;
        const scaledHeight = ui.imageNaturalHeight * ui.scale;

        if (scaledWidth > ui.containerWidth) {
            ui.minTranslateX = ui.containerWidth - scaledWidth;
            ui.maxTranslateX = 0;
        } else {
            if (ui.scale === ui.initialScale) {
                ui.minTranslateX = paintingStartMinPadding
                    + (ui.effectiveContainerWidth - scaledWidth) / 2;
                ui.maxTranslateX = ui.minTranslateX;
            } else {
                ui.minTranslateX = (ui.containerWidth - scaledWidth) / 2;
                ui.maxTranslateX = ui.minTranslateX;
            }
        }

        if (scaledHeight > ui.containerHeight) {
            ui.minTranslateY = ui.containerHeight - scaledHeight;
            ui.maxTranslateY = 0;
        } else {
            if (ui.scale === ui.initialScale) {
                ui.minTranslateY = paintingStartMinPadding
                    + (ui.effectiveContainerHeight - scaledHeight) / 2;
                ui.maxTranslateY = ui.minTranslateY;
            } else {
                ui.minTranslateY = (ui.containerHeight - scaledHeight) / 2;
                ui.maxTranslateY = ui.minTranslateY;
            }
        }

        ui.translateX = Math.max(ui.minTranslateX, Math.min(ui.maxTranslateX, ui.translateX));
        ui.translateY = Math.max(ui.minTranslateY, Math.min(ui.maxTranslateY, ui.translateY));
    }

    /**
     * @param {TouchEvent} event
     */
    function handleTouchStart(event) {
        if (event.cancelable) {
            event.preventDefault();
        }

        if (ui.maxWrongTapsReached) {
            return;
        }

        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = Date.now();

        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            lastDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
            lastTouchX = (touch1.clientX + touch2.clientX) / 2;
            lastTouchY = (touch1.clientY + touch2.clientY) / 2;
            isDragging = false;
        } else if (event.touches.length === 1 && ui.scale > ui.initialScale) {
            isDragging = true;
        }
    }

    /**
     * @param {TouchEvent} event
     */
    function handleTouchMove(event) {
        if (event.cancelable) {
            event.preventDefault();
        }

        if (ui.maxWrongTapsReached) {
            return;
        }

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
                const newScale = Math.max(minScale * ui.initialScale,
                    Math.min(maxScale * ui.initialScale, ui.scale * deltaScale));

                const containerRect = container.getBoundingClientRect();

                const relativeX = (midX - containerRect.left - ui.translateX) / ui.scale;
                const relativeY = (midY - containerRect.top - ui.translateY) / ui.scale;

                ui.scale = newScale;
                updateBoundaries();

                ui.translateX = midX - containerRect.left - relativeX * ui.scale;
                ui.translateY = midY - containerRect.top - relativeY * ui.scale;
                updateBoundaries();
            }

            lastDistance = distance;
            lastTouchX = midX;
            lastTouchY = midY;
        } else if (event.touches.length === 1
            && isDragging
            && ui.scale > ui.initialScale) {

            const touch = event.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            ui.translateX += deltaX;
            ui.translateY += deltaY;
            updateBoundaries();

            startX = touch.clientX;
            startY = touch.clientY;
        }
    }

    /**
     * @param {TouchEvent} event
     */
    function handleTouchEnd(event) {
        if (event.cancelable) {
            event.preventDefault();
        }

        if (ui.maxWrongTapsReached) {
            if (event.changedTouches.length > 0) {
                onRightBottomTap();
            }
            isDragging = false;
            lastDistance = 0;
            return;
        }

        if (event.changedTouches.length === 1) {
            const touch = event.changedTouches[0];
            const deltaX = Math.abs(touch.clientX - startX);
            const deltaY = Math.abs(touch.clientY - startY);
            const deltaTime = Date.now() - startTime;

            const effectiveTapThreshold = TAP_THRESHOLD * (ui.scale / ui.initialScale);

            if (deltaX < effectiveTapThreshold
                && deltaY < effectiveTapThreshold
                && deltaTime < TAP_TIME_THRESHOLD) {
                handleTap(touch.clientX, touch.clientY);
            }
        }

        isDragging = false;
        lastDistance = 0;
    }

    /**
     * @param {MouseEvent} event
     */
    function handleMouseDown(event) {
        if (ui.maxWrongTapsReached || ui.scale <= ui.initialScale) {
            return;
        }
        
        event.preventDefault();
        
        isMouseDragging = true;
        mouseStartX = event.clientX;
        mouseStartY = event.clientY;
        mouseTranslateStartX = ui.translateX;
        mouseTranslateStartY = ui.translateY;
        
        startX = event.clientX;
        startY = event.clientY;
        startTime = Date.now();
    }
    
    /**
     * @param {MouseEvent} event
     */
    function handleMouseMove(event) {
        if (!isMouseDragging || ui.maxWrongTapsReached) {
            return;
        }
        
        event.preventDefault();
        
        const deltaX = event.clientX - mouseStartX;
        const deltaY = event.clientY - mouseStartY;
        
        ui.translateX = mouseTranslateStartX + deltaX;
        ui.translateY = mouseTranslateStartY + deltaY;
        
        updateBoundaries();
    }
    
    /**
     * @param {MouseEvent} event
     */
    function handleMouseUp(event) {
        if (!isMouseDragging) {
            return;
        }
        
        event.preventDefault();
        
        const deltaX = Math.abs(event.clientX - startX);
        const deltaY = Math.abs(event.clientY - startY);
        const deltaTime = Date.now() - startTime;
        
        const effectiveTapThreshold = TAP_THRESHOLD * (ui.scale / ui.initialScale);
        
        if (deltaX < effectiveTapThreshold
            && deltaY < effectiveTapThreshold
            && deltaTime < TAP_TIME_THRESHOLD) {
            handleTap(event.clientX, event.clientY);
        }
        
        isMouseDragging = false;
    }
    
    /**
     * @param {WheelEvent} event
     */
    function handleWheel(event) {
        if (ui.maxWrongTapsReached) {
            return;
        }
        
        event.preventDefault();
        
        const delta = Math.sign(event.deltaY) > 0
            ? MOUSE_WHEEL_ZOOM_MIN_DELTA
            : -MOUSE_WHEEL_ZOOM_MIN_DELTA;
        const zoomFactor = 1 - event.deltaY * MOUSE_WHEEL_ZOOM_SPEED;
        
        const containerRect = container.getBoundingClientRect();
        
        const mouseX = event.clientX - containerRect.left;
        const mouseY = event.clientY - containerRect.top;
        
        const relativeX = (mouseX - ui.translateX) / ui.scale;
        const relativeY = (mouseY - ui.translateY) / ui.scale;
        
        const newScale = Math.max(minScale * ui.initialScale,
            Math.min(maxScale * ui.initialScale, ui.scale * zoomFactor));
        
        ui.scale = newScale;
        updateBoundaries();
        
        ui.translateX = mouseX - relativeX * ui.scale;
        ui.translateY = mouseY - relativeY * ui.scale;
        updateBoundaries();
    }
    
    /**
     * @param {MouseEvent} event
     */
    function handleMouseClick(event) {
        if (!isMouseDragging) {
            handleTap(event.clientX, event.clientY);
        }
    }

    /**
     * @param {MouseEvent} event
     */
    function handleMouseLeave(event) {
        if (isMouseDragging) {
            isMouseDragging = false;
        }
    }

    /**
     * @param {number} clientX
     * @param {number} clientY
     */
    function handleTap(clientX, clientY) {
        const containerRect = container.getBoundingClientRect();

        const relativeX = clientX - containerRect.left;
        const relativeY = clientY - containerRect.top;

        const imageRelativeX = (relativeX - ui.translateX) / ui.scale;
        const imageRelativeY = (relativeY - ui.translateY) / ui.scale;

        const isWithinImage = imageRelativeX >= 0
            && imageRelativeX <= ui.imageNaturalWidth
            && imageRelativeY >= 0
            && imageRelativeY <= ui.imageNaturalHeight;

        if (!isWithinImage) {
            return;
        }

        const isInSpecialArea = imageRelativeX >= ui.specialAreaX
            && imageRelativeX <= ui.specialAreaX + ui.specialAreaWidth
            && imageRelativeY >= ui.specialAreaY
            && imageRelativeY <= ui.specialAreaY + ui.specialAreaHeight;

        if (isInSpecialArea) {
            onRightBottomTap();
        } else {
            ui.wrongTapsCount++;

            if (ui.wrongTapsCount >= maxWrongTapsCount) {
                ui.maxWrongTapsReached = true;
                onMaxWrongTaps();
                zoomToSpecialArea();
            }
        }
    }

    function zoomToSpecialArea() {
        if (!ui.imageNaturalWidth || !ui.imageNaturalHeight || !imageLoaded) {
            return;
        }

        const areaWidth = ui.specialAreaWidth;
        const areaHeight = ui.specialAreaHeight;
        
        if (areaWidth === 0 || areaHeight === 0) {
            return;
        }

        const scaleX = ui.containerWidth / areaWidth;
        const scaleY = ui.containerHeight / areaHeight;
        const targetScale = Math.min(scaleX, scaleY, maxScale * ui.initialScale);

        ui.scale = targetScale;

        const scaledRightBottomX = (ui.specialAreaX + areaWidth) * targetScale;
        const scaledRightBottomY = (ui.specialAreaY + areaHeight) * targetScale;

        const containerRightBottomX = ui.containerWidth;
        const containerRightBottomY = ui.containerHeight;

        ui.translateX = containerRightBottomX - scaledRightBottomX;
        ui.translateY = containerRightBottomY - scaledRightBottomY;

        updateBoundaries();
    }

    function handleResize() {
        updateContainerSize();

        if (imageLoaded) {
            updateBoundaries();
        }
    }

    function handleImageLoad() {
        imageLoaded = true;

        ui.imageNaturalWidth = image.naturalWidth;
        ui.imageNaturalHeight = image.naturalHeight;
        ui.imageAspectRatio = ui.imageNaturalWidth / ui.imageNaturalHeight;

        updateContainerSize();

        ui.initialScale = calculateInitialScale();
        ui.scale = ui.initialScale;

        const scaledWidth = ui.imageNaturalWidth * ui.scale;
        const scaledHeight = ui.imageNaturalHeight * ui.scale;

        ui.translateX = paintingStartMinPadding + (ui.effectiveContainerWidth - scaledWidth) / 2;
        ui.translateY = paintingStartMinPadding + (ui.effectiveContainerHeight - scaledHeight) / 2;

        updateSpecialArea();
        updateBoundaries();
    }

    function removeEventListeners() {
        window.removeEventListener("resize", handleResize);

        if (container) {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
            container.removeEventListener("touchcancel", handleTouchEnd);
            
            container.removeEventListener("mousedown", handleMouseDown);
            container.removeEventListener("mousemove", handleMouseMove);
            container.removeEventListener("mouseup", handleMouseUp);
            container.removeEventListener("mouseleave", handleMouseLeave);
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("click", handleMouseClick);
        }
    }
    
    onMount(() => {
        updateContainerSize();
        window.addEventListener("resize", handleResize);

        if (container) {
            container.addEventListener("touchstart", handleTouchStart, { passive: false });
            container.addEventListener("touchmove", handleTouchMove, { passive: false });
            container.addEventListener("touchend", handleTouchEnd, { passive: false });
            container.addEventListener("touchcancel", handleTouchEnd, { passive: false });
            
            container.addEventListener("mousedown", handleMouseDown);
            container.addEventListener("mousemove", handleMouseMove);
            container.addEventListener("mouseup", handleMouseUp);
            container.addEventListener("mouseleave", handleMouseLeave);
            container.addEventListener("wheel", handleWheel, { passive: false });
            container.addEventListener("click", handleMouseClick);
        }

        return removeEventListeners;
    });

    onDestroy(removeEventListeners);
</script>

<div class="container {containerCssClass}" bind:this={container}>
    <div class="image-wrapper"
        style="transform: translate({ui.translateX}px, {ui.translateY}px) scale({ui.scale});">
        <img class="image"
            {src}
            {alt}
            bind:this={image}
            onload={handleImageLoad}
            draggable="false"
        />
    </div>
</div>

<style>
    .container {
        margin: 0;
        padding: 0;
        overflow: hidden;
        width: 100%;
        height: 100%;
        position: relative;
        touch-action: none;
        user-select: none;
        background-color: transparent;
        box-sizing: border-box;
        cursor: grab;
    }
    
    .container:active {
        cursor: grabbing;
    }

    .image-wrapper {
        position: absolute;
        transform-origin: 0 0;
        will-change: transform;
    }

    .image {
        display: block;
        max-width: none;
        pointer-events: none;
    }
</style>