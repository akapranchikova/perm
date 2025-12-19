<script>
    import "../styles/fonts.css";
    import "../styles/constants.css";
    import "../styles/interactive-elements.css";

    const TITLE_OFFSET = 5;
    const POINT_RADIUS = 16;
    const POINT_ICON_SIZE = 12;
    const CHECK_ICON_SIZE = 16;

    let {
        src = "",
        pointColor = "#ff0000",
        pointsInfo = [],
        alt = "",
        onTap = () => {},
        cssClass = "",
    } = $props();

    let imageLoaded = $state(false);
    let canvasSize = $state({ width: 0, height: 0 });
    let containerSize = $state({ width: 0, height: 0 });
    let scaleFactor = $state(1);
    let offset = $state({ x: 0, y: 0 });
    let svgElement = $state(null);
    let containerRef = $state(null);
    let isDragging = $state(false);
    let dragPointId = $state(null);

    async function handleImageLoad(event) {
        const img = event.target;
        imageLoaded = true;
        canvasSize = { width: img.naturalWidth, height: img.naturalHeight };

        calculateScaleAndOffset();

        try {
            const response = await fetch(src);
            const svgText = await response.text();
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

            svgElement = svgDoc.documentElement;
            analyzeSVG();
        } catch (error) {
            analyzeImageFallback(img);
        }
    }

    function analyzeSVG() {
        if (!svgElement) { 
            return;
        }

        const targetColor = normalizeColor(pointColor);
        const foundPoints = [];

        const circles = svgElement.querySelectorAll("circle");

        circles.forEach((circle) => {
            const fillColor = circle.getAttribute("fill");
            const strokeColor = circle.getAttribute("stroke");

            if ((fillColor && normalizeColor(fillColor) === targetColor)
                || (strokeColor && normalizeColor(strokeColor) === targetColor)) {
                const cx = parseFloat(circle.getAttribute("cx") || 0);
                const cy = parseFloat(circle.getAttribute("cy") || 0);
                const id = circle.getAttribute("id") || '';

                const isNewPoint = !foundPoints.some((point) =>
                    Math.abs(point.x - cx) < POINT_RADIUS * 2 
                    && Math.abs(point.y - cy) < POINT_RADIUS * 2);

                if (isNewPoint) {
                    foundPoints.push({ x: cx, y: cy, id: id });
                }
            }
        });

        updatePointsInfo(foundPoints);
    }

    function normalizeColor(color) {
        if (!color) {
            return "";
        }

        color = color.trim();
        if (color.startsWith("rgb")) {
            return rgbToHex(color);
        }

        // Если это короткий hex (например, #fff), расширяем его
        if (color.startsWith("#") && color.length === 4) {
            return (`#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`);
        }

        return color.toLowerCase();
    }

    function rgbToHex(rgb) {
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) {
            return "";
        }

        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);

        return (`#${((1 << 24) + (r << 16) + (g << 8) + b)}`
            .toString(16)
            .slice(1)
            .toLowerCase());
    }

    function analyzeImageFallback(img) {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvasSize.width, canvasSize.height);
        const data = imageData.data;
        const foundPoints = [];

        const targetColor = hexToRgb(pointColor);
        if (!targetColor) {
            return;
        }

        const threshold = 30;
        for (let y = 0; y < canvasSize.height; y++) {
            for (let x = 0; x < canvasSize.width; x++) {
                const index = (y * canvasSize.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                if (Math.abs(r - targetColor.r) <= threshold
                    && Math.abs(g - targetColor.g) <= threshold
                    && Math.abs(b - targetColor.b) <= threshold) {

                    const isNewPoint = !foundPoints.some((point) =>
                        Math.abs(point.x - x) < POINT_RADIUS * 2
                        && Math.abs(point.y - y) < POINT_RADIUS * 2);

                    if (isNewPoint) {
                        foundPoints.push({ x, y });
                    }
                }
            }
        }

        updatePointsInfo(foundPoints);
    }

    function hexToRgb(hex) {
        hex = hex.replace(/^#/, "");

        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((char) => char + char)
                .join("");
        }

        if (hex.length !== 6) {
            return null;
        }

        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
        };
    }

    function updatePointsInfo(foundPoints) {
        if (!Array.isArray(pointsInfo)) {
            console.error("pointsInfo не массив");
            return;
        }

        const minLength = Math.min(foundPoints.length, pointsInfo.length);

        for (let i = 0; i < minLength; i++) {
            if (pointsInfo[i].isOpened) {
                continue;
            }

            const foundPoint = foundPoints.find(p => p.id == pointsInfo[i].id);
            if (!foundPoint) {
                continue;
            }

            pointsInfo[i].poit = {
                x: foundPoint.x,
                y: foundPoint.y,
            };
            pointsInfo[i].isOnMap = true;
        }

        // Нужно "потрясти" ссылку для реактивности
        pointsInfo = pointsInfo;
    }

    function calculateScaleAndOffset() {
        if (!containerRef || !canvasSize.width || !canvasSize.height) {
            return;
        }

        const containerWidth = containerRef.clientWidth;
        const containerHeight = containerRef.clientHeight;

        containerSize = {
            width: containerWidth, 
            eight: containerHeight
        };

        const scaleX = containerWidth / canvasSize.width;
        const scaleY = containerHeight / canvasSize.height;
        scaleFactor = Math.min(scaleX, scaleY);

        offset = {
            x: (containerWidth - canvasSize.width * scaleFactor) / 2,
            y: (containerHeight - canvasSize.height * scaleFactor) / 2,
        };
    }

    function scaleCoordinates(coord) {
        return {
            x: coord.x * scaleFactor + offset.x,
            y: coord.y * scaleFactor + offset.y,
        };
    }

    function handlePointMouseDown(event, pointId) {
        if (isDragging) {
            return;
        }

        const point = pointsInfo.find((p) => p.id === pointId);
        if (!point || !point.isOnMap || point.isOpened) {
            return;
        }

        isDragging = true;
        dragPointId = pointId;

        event.stopPropagation();
    }

    function handlePointMouseUp(event, pointId) {
        if (!isDragging || dragPointId !== pointId) {
            return;
        }

        const point = pointsInfo.find((p) => p.id === pointId);
        if (!point || !point.isOnMap || point.isOpened) {
            return;
        }

        const pointIndex = pointsInfo.findIndex((p) => p.id === pointId);
        if (pointIndex === -1) {
            return;
        }

        pointsInfo[pointIndex].isOpened = true;

        // "Потрясти" массив для реактивности
        pointsInfo = pointsInfo;

        onTap({ ...pointsInfo[pointIndex] });

        isDragging = false;
        dragPointId = null;

        event.stopPropagation();
    }

    function handlePointMouseLeave(event, pointId) {
        if (isDragging && dragPointId === pointId) {
            isDragging = false;
            dragPointId = null;
        }
    }

    function handleResize() {
        if (imageLoaded) {
            calculateScaleAndOffset();
        }
    }

    $effect(() => {
        if (typeof window !== "undefined") {
            window.addEventListener("resize", handleResize);

            return () => {
                window.removeEventListener("resize", handleResize);
            };
        }
    });

    function getTitlePosition(point) {
        if (!point.poit || !point.titlePosition) {
            return "";
        }

        const scaledPoint = scaleCoordinates(point.poit);

        switch (point.titlePosition) {
            case "top":
                return `
                top: ${scaledPoint.y - POINT_RADIUS * scaleFactor - TITLE_OFFSET}px;
                left: ${scaledPoint.x}px;
                transform: translateX(-50%);
                text-align: center;`;
            case "bottom":
                return `
                top: ${scaledPoint.y + POINT_RADIUS * scaleFactor + TITLE_OFFSET}px;
                left: ${scaledPoint.x}px;
                transform: translateX(-50%);
                text-align: center;`;
            case "left":
                return `
                left: ${scaledPoint.x - POINT_RADIUS * scaleFactor - TITLE_OFFSET}px;
                top: ${scaledPoint.y}px;
                transform: translateY(-50%) translateX(-100%);
                text-align: right;`;
            case "right":
                return `
                left: ${scaledPoint.x + POINT_RADIUS * scaleFactor + TITLE_OFFSET}px;
                top: ${scaledPoint.y}px;
                transform: translateY(-50%);
                text-align: left;`;
            default:
                return `
                left: ${scaledPoint.x}px;
                top: ${scaledPoint.y}px;
                transform: translateX(-50%) translateY(-50%);
                text-align: center;`;
        }
    }
</script>

<div class="traveler-map-container {cssClass}" bind:this={containerRef}>
    {#if !imageLoaded}
        <img
            {src}
            {alt}
            onload={handleImageLoad}
            style="display: none;"
        />
        <div class="loading">Загрузка карты...</div>
    {:else}
        <div
            class="map-container"
            style="
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;"
        >
            <img
                {src}
                {alt}
                style="
                    position: absolute;
                    width: {canvasSize.width * scaleFactor}px;
                    height: {canvasSize.height * scaleFactor}px;
                    left: {offset.x}px;
                    top: {offset.y}px;
                    z-index: 1;"
            />

            {#each pointsInfo.filter((p) => p.isOnMap) as point (point.id)}
                {#if point.poit}
                    {#if point.isOpened}
                        <div
                            class="map-point point-opened"
                            role="img"
                            aria-label={point.title || "Открытая точка на карте"}
                            style="
                                position: absolute;
                                left: {scaleCoordinates(point.poit).x - POINT_RADIUS * scaleFactor}px;
                                top: {scaleCoordinates(point.poit).y - POINT_RADIUS * scaleFactor}px;
                                width: {POINT_RADIUS * 2 * scaleFactor}px;
                                height: {POINT_RADIUS * 2 * scaleFactor}px;
                                z-index: 10;"
                        >
                            <div class="point-icon">
                                <svg
                                    width={CHECK_ICON_SIZE}
                                    height={CHECK_ICON_SIZE}
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M1 8.5L5.65517 13L16 3"
                                        stroke-width="1.5"
                                    />
                                </svg>
                            </div>
                        </div>

                        {#if point.title}
                            <div
                                class="point-title"
                                style={getTitlePosition(point)}
                            >
                                {point.title}
                            </div>
                        {/if}
                    {:else}
                        <div
                            class="map-point"
                            class:point-dragging={isDragging && dragPointId === point.id}
                            role="button"
                            tabindex="0"
                            aria-label={point.title || "Закрытая точка на карте"}
                            style="
                                position: absolute;
                                left: {scaleCoordinates(point.poit).x - POINT_RADIUS * scaleFactor}px;
                                top: {scaleCoordinates(point.poit).y - POINT_RADIUS * scaleFactor}px;
                                width: {POINT_RADIUS * 2 * scaleFactor}px;
                                height: {POINT_RADIUS * 2 * scaleFactor}px;
                                z-index: 10;"
                            onmousedown={(e) => handlePointMouseDown(e, point.id)}
                            onmouseup={(e) => handlePointMouseUp(e, point.id)}
                            onmouseleave={(e) => handlePointMouseLeave(e, point.id)}
                            ontouchstart={(e) => handlePointMouseDown(e, point.id)}
                            ontouchend={(e) => handlePointMouseUp(e, point.id)}
                            oncontextmenu={(e) => e.preventDefault()}
                        >
                            <div class="point-icon">
                                <svg
                                    width={POINT_ICON_SIZE}
                                    height={POINT_ICON_SIZE + 1}
                                    viewBox="0 0 12 13"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M7.5 0C8.05229 0 8.5 0.447715 8.5 1V2C8.5 2.08638 8.48836 2.17003 8.46777 2.25H11C11.5523 2.25 12 2.69772 12 3.25V10.25C12 10.7677 11.6067 11.1938 11.1025 11.2451L11 11.25H10V12C10 12.2761 9.77614 12.5 9.5 12.5C9.22386 12.5 9 12.2761 9 12V11.25H2.5V12C2.5 12.2761 2.27614 12.5 2 12.5C1.72386 12.5 1.5 12.2761 1.5 12V11.25H1L0.897461 11.2451C0.427034 11.1972 0.0527828 10.823 0.00488281 10.3525L0 10.25V3.25C0 2.69772 0.447715 2.25 1 2.25H3.53223C3.51987 2.20206 3.51002 2.15298 3.50488 2.10254L3.5 2V1C3.5 0.447715 3.94772 8.05319e-09 4.5 0H7.5ZM1 10.25H2.5V3.25H1V10.25ZM3.5 10.25H8.5V3.25H3.5V10.25ZM9.5 10.25H11V3.25H9.5V10.25ZM4.5 2H7.5V1H4.5V2Z"
                                    />
                                </svg>
                            </div>
                        </div>
                    {/if}
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style>
    .traveler-map-container {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 400px;
        position: relative;
    }

    .loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        text-align: center;
        color: var(--txt-secondary);
        font-family: "Inter", sans-serif;
    }

    .map-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .map-point {
        background-color: var(--accent);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        transition:
            transform 0.2s,
            opacity 0.2s,
            background-color 0.3s;
        cursor: pointer;
        z-index: 10;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        touch-action: manipulation;
    }

    .map-point:hover:not(.point-opened) {
        transform: scale(0.98);
        opacity: 0.9;
    }

    .point-dragging {
        transform: scale(0.95);
        opacity: 0.8;
    }

    .point-opened {
        background-color: var(--bg-popup);
        border: 1px solid var(--accent);
        cursor: default;
    }

    .point-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .point-opened .point-icon svg path {
        stroke: var(--accent);
        fill: none;
    }

    .map-point:not(.point-opened) .point-icon svg {
        fill: var(--txt-white);
    }

    .point-title {
        position: absolute;
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 14px;
        color: var(--txt-primary);
        white-space: nowrap;
        pointer-events: none;
        z-index: 20;
    }

    .map-point,
    .map-point * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
        touch-action: manipulation;
    }
</style>