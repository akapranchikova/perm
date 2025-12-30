<script>
    import "../styles/fonts.css";
    import "../styles/constants.css";
    import "../styles/interactive-elements.css";
    import { derived } from "svelte/store";

    const TITLE_OFFSET = 5;
    const POINT_RADIUS = 16;
    const POINT_ICON_SIZE = 22;
    const CHECK_ICON_SIZE = 16;

    let {
        src = "",
        // Цвет, которым маркерная точка помечена на svg-карте
        pointColor = "#ff0000",
        /*
        Массив информации о точках:
        [
            {
                // id circle-точки-метки на svg-карте
                id: 'Constantinople',
                // Здесь на входе надо просто написать null, так как координаты неизвестны заранее
                poit: null,
                // Подпись а карте
                title: 'Константинополь',
                // 'top'|'left'|'right'|'bottom'
                titlePosition: 'right',
                // Отображать или не отображать подпись
                shouldShowTitle: false,
                // На входе должно быть false, признак замены точки значком посещения/не посещения
                isOnMap: false,
                // Признак посещённости точки (картины)
                isOpened: false,
                // true|false - признак того, что точка будет отображаться, иначе скроется
                shouldDisplay: true,
                // Обработка клика/тапа по точке
                onTap = () => {}
            },
            ...
        ]
        */
        pointsInfo: initialPointsInfo = [],
        alt = "",        
        cssClass = "",
    } = $props();

    let imageLoaded = $state(false);
    let canvasSize = $state({ width: 0, height: 0 });
    let containerSize = $state({ width: 0, height: 0 });
    let scaleFactor = $state(1);
    let offset = $state({ x: 0, y: 0 });
    let svgElement = $state(null);
    let containerRef = $state(null);
    let svgDataUrl = $state(null);
    let isDragging = $state(false);
    let dragPointId = $state(null);

    let pointsInfo = $state([...initialPointsInfo]);

    $effect(() => {
        pointsInfo = [...initialPointsInfo];
    });

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
            console.error("pointsInfo - не массив");
            return;
        }

        const minLength = Math.min(foundPoints.length, pointsInfo.length);

        const updatedPointsInfo = [...pointsInfo];

        for (let i = 0; i < minLength; i++) {
            const foundPoint = foundPoints.find(p => p.id == updatedPointsInfo[i].id);
            if (!foundPoint) {
                continue;
            }

            if (!updatedPointsInfo[i].shouldDisplay) {
                const circle = svgElement.getElementById(updatedPointsInfo[i].id);
                if (circle) {
                    circle.style.display = "none";
                }
                continue;
            }

            updatedPointsInfo[i] = {
                ...updatedPointsInfo[i],
                poit: {
                    x: foundPoint.x,
                    y: foundPoint.y,
                },
                isOnMap: true
            };
        }

        pointsInfo = updatedPointsInfo;

        const svgString = new XMLSerializer().serializeToString(svgElement);
        svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    }

    function calculateScaleAndOffset() {
        if (!containerRef || !canvasSize.width || !canvasSize.height) {
            return;
        }

        const containerWidth = containerRef.clientWidth;
        const containerHeight = containerRef.clientHeight;

        containerSize = {
            width: containerWidth, 
            height: containerHeight
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
        if (!point || !point.isOnMap) {
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
        if (!point || !point.isOnMap) {
            return;
        }

        const pointIndex = pointsInfo.findIndex((p) => p.id === pointId);
        if (pointIndex === -1) {
            return;
        }

        pointsInfo[pointIndex].isOpened = true;

        // "Потрясти" массив для реактивности
        pointsInfo = pointsInfo;

        pointsInfo[pointIndex].onTap();

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
        <div class="map-container">
            <img
                src={svgDataUrl}
                {alt}
                style="
                    position: absolute;
                    width: {canvasSize.width * scaleFactor}px;
                    height: {canvasSize.height * scaleFactor}px;
                    left: {offset.x}px;
                    top: {offset.y}px;
                    z-index: 1;"
            />

            {#each pointsInfo.filter((p) => p.shouldDisplay) as point (point.id)}
                {#if point.poit}
                    <div
                        class="map-point {point.isOpened ? 'point-opened' : ''}"
                        class:point-dragging={isDragging && dragPointId === point.id}
                        role="button"
                        tabindex="0"
                        aria-label={point.title || "Открытая точка на карте"}
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
                            {#if point.isOpened}
                                <svg
                                    width={CHECK_ICON_SIZE}
                                    height={CHECK_ICON_SIZE}
                                    viewBox="0 0 {CHECK_ICON_SIZE} {CHECK_ICON_SIZE}"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M1 8.5L5.65517 13L16 3"
                                        stroke-width="1.5"
                                    />
                                </svg>
                            {:else}
                                <svg
                                    width={POINT_ICON_SIZE}
                                    height={POINT_ICON_SIZE}
                                    viewBox="0 0 {POINT_ICON_SIZE} {POINT_ICON_SIZE}"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M11.3594 3C11.3594 3.49561 11.4548 3.85661 11.6895 4.09961C11.9236 4.34184 12.3578 4.53027 13.1836 4.53027C13.846 4.53021 14.3411 4.35232 14.8809 4.15723C15.4201 3.96232 16.0041 3.75007 16.7822 3.75C17.982 3.75 18.6962 4.70592 18.5957 5.68945C18.9935 5.83925 19.2843 6.06109 19.4805 6.33398C19.7152 6.66061 19.7969 7.03133 19.7969 7.36914C19.7968 7.83563 19.6968 8.17644 19.6084 8.48926C19.5212 8.79798 19.4424 9.08609 19.4424 9.49609C19.4424 10.033 19.5327 10.3159 19.6699 10.4707C19.7983 10.6155 20.0289 10.7139 20.5 10.7139V11.3145C20.016 11.3145 19.79 11.4005 19.666 11.5352C19.5345 11.6781 19.4424 11.9544 19.4424 12.5322C19.4424 12.8995 19.5187 13.1493 19.6074 13.4521C19.6982 13.7623 19.7968 14.1124 19.7969 14.6309C19.7969 15.4293 19.2752 16.0557 18.6162 16.3311C18.6865 16.8016 18.5171 17.2511 18.2305 17.5908C17.8857 17.9993 17.3506 18.2783 16.7822 18.2783C16.0041 18.2783 15.4201 18.066 14.8809 17.8711C14.3411 17.676 13.846 17.4991 13.1836 17.499C12.4155 17.499 11.9737 17.6829 11.7227 17.9297C11.4728 18.1753 11.3594 18.5344 11.3594 19H10.7588C10.7588 18.5243 10.6585 18.1669 10.4248 17.9248C10.1923 17.6841 9.77084 17.4991 8.99414 17.499C8.29517 17.499 7.77022 17.677 7.20312 17.8721C6.63634 18.067 6.02702 18.2783 5.21777 18.2783C4.68247 18.2783 4.16289 18.0629 3.81348 17.6709C3.50888 17.3291 3.34735 16.8676 3.4043 16.3369C2.46585 15.9677 2.20312 15.166 2.20312 14.6309C2.20317 14.1706 2.30308 13.8182 2.3916 13.501C2.48004 13.184 2.55757 12.9021 2.55762 12.5322C2.55762 11.9788 2.46709 11.6979 2.33203 11.5479C2.20542 11.4073 1.97608 11.3145 1.5 11.3145V10.7139L1.66309 10.709C2.02008 10.6868 2.21331 10.5901 2.32812 10.458C2.46879 10.2959 2.55762 10.0087 2.55762 9.49609C2.55757 9.12026 2.47902 8.83384 2.39062 8.5127C2.3021 8.19107 2.20317 7.83429 2.20312 7.36914C2.20313 6.551 2.71975 5.91287 3.39453 5.6748C3.29494 4.7225 4.071 3.75 5.21777 3.75C6.02522 3.75007 6.66743 3.96008 7.25195 4.15527C7.84223 4.35238 8.36446 4.53027 8.99414 4.53027C9.76271 4.53022 10.1844 4.34469 10.4189 4.10059C10.6255 3.88546 10.7307 3.57895 10.7539 3.17773L10.7588 3H11.3594ZM11.0547 4.25098C10.9966 4.34418 10.9308 4.43408 10.8516 4.5166C10.4593 4.92489 9.84784 5.12983 8.99414 5.12988C8.25198 5.12988 7.6393 4.91755 7.06152 4.72461C6.47817 4.52981 5.91835 4.34967 5.21777 4.34961C4.33582 4.34961 3.82667 5.16694 4.02832 5.80273L4.13281 6.13281L3.79199 6.18945C3.2495 6.28017 2.80273 6.74404 2.80273 7.36914C2.80278 7.74498 2.88133 8.03138 2.96973 8.35254C3.05826 8.67416 3.15718 9.03095 3.15723 9.49609C3.15723 10.0473 3.06828 10.5198 2.78125 10.8506C2.73116 10.9083 2.67549 10.9583 2.61719 11.0039C2.6737 11.0464 2.72836 11.0921 2.77734 11.1465C3.07008 11.4716 3.15723 11.9509 3.15723 12.5322C3.15718 12.9925 3.05728 13.3449 2.96875 13.6621C2.88031 13.9791 2.80278 14.261 2.80273 14.6309C2.80273 15.0138 2.9952 15.6204 3.82129 15.8457L4.10156 15.9219L4.03418 16.2051C3.92352 16.6665 4.04113 17.0261 4.26074 17.2725C4.48664 17.5259 4.83849 17.6787 5.21777 17.6787C5.91653 17.6786 6.44084 17.4997 7.00781 17.3047C7.57469 17.1097 8.1847 16.8984 8.99414 16.8984C9.85445 16.8985 10.4657 17.1032 10.8564 17.5078C10.9413 17.5957 11.01 17.6922 11.0703 17.792C11.1358 17.6897 11.2117 17.5914 11.3027 17.502C11.7081 17.1037 12.3294 16.8984 13.1836 16.8984C13.9618 16.8985 14.5457 17.1117 15.085 17.3066C15.6247 17.5017 16.1199 17.6786 16.7822 17.6787C17.1577 17.6787 17.5308 17.4905 17.7725 17.2041C18.0114 16.9209 18.1002 16.5716 17.9766 16.2402L17.8594 15.9258L18.1846 15.8438C18.7545 15.7008 19.1973 15.2184 19.1973 14.6309C19.1972 14.1994 19.1183 13.9152 19.0322 13.6211C18.944 13.3198 18.8428 12.9951 18.8428 12.5322C18.8428 11.933 18.9284 11.4496 19.2246 11.1279C19.2677 11.0811 19.3154 11.0413 19.3643 11.0039C19.3135 10.9636 19.2651 10.9192 19.2207 10.8691C18.9303 10.5417 18.8428 10.0653 18.8428 9.49609C18.8428 8.99867 18.9415 8.6438 19.0312 8.32617C19.1198 8.01266 19.1972 7.74374 19.1973 7.36914C19.1973 7.12544 19.1382 6.8853 18.9932 6.68359C18.8502 6.48487 18.6042 6.2964 18.1807 6.18359L17.8916 6.10645L17.9678 5.81738C18.1563 5.10359 17.6811 4.34961 16.7822 4.34961C16.1199 4.34968 15.6247 4.52661 15.085 4.72168C14.5457 4.91659 13.9618 5.12982 13.1836 5.12988C12.2834 5.12988 11.6543 4.92686 11.2578 4.5166C11.178 4.43397 11.1123 4.34415 11.0547 4.25098ZM16.8408 7C16.8408 6.77916 16.6622 6.59973 16.4414 6.59961H5.5C5.27909 6.59961 5.09961 6.77909 5.09961 7V15C5.09961 15.2209 5.27909 15.4004 5.5 15.4004H16.4414C16.6622 15.4003 16.8408 15.2208 16.8408 15V7ZM17.4414 15L17.4355 15.1025C17.3876 15.5732 17.0137 15.9475 16.543 15.9951L16.4414 16H5.5C4.98232 16 4.55621 15.6067 4.50488 15.1025L4.5 15V7L4.50488 6.89746C4.55622 6.39333 4.98232 6 5.5 6H16.4414L16.543 6.00488C17.0137 6.05246 17.3876 6.42682 17.4355 6.89746L17.4414 7V15Z"
                                    />
                                </svg>
                            {/if}
                        </div>                
                    </div>

                    {#if point.shouldShowTitle && point.title}
                        <div
                            class="point-title"
                            style={getTitlePosition(point)}
                        >
                            {point.title}
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
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
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