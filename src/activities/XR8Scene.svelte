<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as THREE from 'three';
  import { loadScriptOnce } from '../lib/loadScript'; // Убедитесь, что путь верный

  const dispatch = createEventDispatcher();
  export let running = false;

  // --- Конфигурация ---
  const XR8_SCRIPT_URL = 'https://8apps.4app.pro/xrweb?appKey=hkQXBRMMG1eNSQY6GopNLwTy4FAVRD0Pkz7RfBrMTOMLvhSkFN8blYIyOgQmLwNWPiZb5Q';
  const EXTRA_SCRIPT_URL = "https://8cdn.4app.pro/web/xrextras/xrextras.js";
  const TARGET_COUNT = 3;

  // --- Состояние ---
  let host;
  let canvasEl;
  let collectedCount = 0;
  let showFinishButton = false;
  let isStarted = false;

  // --- Three.js переменные ---
  let xrScene;
  let scene, camera, renderer;
  let raycaster, pointer, clock;
  
  // Храним объекты листов: { mesh, initialPos, speed, phase, isCollected }
  let papersData = []; 

  // --- Логика инициализации ---

  function assertXR8Ready() {
    if (!window.XR8) throw new Error('XR8 is not available on window.');
  }

function initSceneObjects() {
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    clock = new THREE.Clock();

    // Свет
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 5, 2);
    scene.add(dirLight);

    // Геометрия листа (A4 пропорции)
    const geometry = new THREE.PlaneGeometry(0.21, 0.297);
    
    // Материал
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x111111,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    // --- ИЗМЕНЕНИЯ ЗДЕСЬ ---
    // Координаты: X (влево/вправо), Y (верх/низ), Z (вперед/назад от камеры)
    // 0,0,0 - это позиция камеры при старте.
    const positions = [
      { x: -0.2, y:  0.1, z: -1.5 }, // 1. Почти по центру, чуть дальше
      { x:  1.5, y:  0.3, z: -2.5 }, // 2. Сильно справа и далеко
      { x: -1.8, y: -0.2, z: -2.0 }, // 3. Сильно слева
      { x:  0.5, y:  0.8, z: -1.8 }, // 4. Справа вверху (надо поднять голову)
      { x: -0.8, y: -0.6, z: -1.2 }, // 5. Слева внизу (надо опустить голову)
      { x:  0.0, y:  0.0, z: -3.5 }  // 6. Прямо, но очень далеко в глубине
    ];
    // -----------------------

    papersData = positions.map((pos, i) => {
      const mesh = new THREE.Mesh(geometry, material.clone());
      
      // Линовка
      const linesGeo = new THREE.PlaneGeometry(0.15, 0.24, 1, 8);
      const linesMat = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.1 
      });
      const lines = new THREE.Mesh(linesGeo, linesMat);
      lines.position.z = 0.005;
      mesh.add(lines);

      // Хитбокс
      const hitGeo = new THREE.SphereGeometry(0.35); // Увеличил хитбокс, так как объекты дальше
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { isHitbox: true, parentIndex: i };
      mesh.add(hitMesh);

      mesh.position.set(pos.x, pos.y, pos.z);
      
      mesh.rotation.set(
        Math.random() * 0.5, 
        Math.random() * 0.5, 
        Math.random() * 0.2
      );

      scene.add(mesh);

      return {
        mesh,
        initialPos: { ...pos },
        speed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.3,
          z: (Math.random() - 0.5) * 0.1
        },
        isCollected: false
      };
    });
  }

  function animate(time) {
    papersData.forEach(p => {
      if (p.isCollected) {
        // Анимация сбора: лист уменьшается, поднимается вверх и исчезает
        p.mesh.position.y += 0.02;
        p.mesh.scale.multiplyScalar(0.9); // быстрое уменьшение
        p.mesh.material.opacity *= 0.9;
        if (p.mesh.material.opacity < 0.05) {
          p.mesh.visible = false;
        }
      } else {
        // Анимация парения (Floating)
        // Используем синусы с разными фазами для создания ощущения "воздуха"
        const t = time * p.speed + p.phase;
        
        p.mesh.position.y = p.initialPos.y + Math.sin(t) * 0.08;
        p.mesh.position.x = p.initialPos.x + Math.cos(t * 0.7) * 0.03;
        
        // Легкое вращение
        p.mesh.rotation.x += p.rotSpeed.x * 0.01 + Math.sin(t * 0.5) * 0.002;
        p.mesh.rotation.y += p.rotSpeed.y * 0.01 + Math.cos(t * 0.3) * 0.002;
        p.mesh.rotation.z += Math.sin(t) * 0.001;
      }
    });
  }

  function handleTap(e) {
    if (!camera || !scene || collectedCount >= TARGET_COUNT) return;

    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;

    pointer.set(x, y);
    raycaster.setFromCamera(pointer, camera);

    const targets = [];
    papersData.forEach(p => {
      if (!p.isCollected && p.mesh.visible) targets.push(p.mesh);
    });

    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      // Нашли что-то
      const hit = intersects[0].object;
      
      // Определяем, к какому листу относится хит
      let paperIndex = -1;
      
      if (hit.userData.isHitbox) {
        paperIndex = hit.userData.parentIndex;
      } else {
        // Если попали в саму бумагу, ищем её в массиве
        paperIndex = papersData.findIndex(p => p.mesh === hit || p.mesh === hit.parent);
      }

      if (paperIndex !== -1 && !papersData[paperIndex].isCollected) {
        collectPaper(paperIndex);
      }
    }
  }

  function collectPaper(index) {
    papersData[index].isCollected = true;
    collectedCount += 1;
    
    // Вибрация для тактильного отклика (если поддерживается)
    if (navigator.vibrate) navigator.vibrate(50);

    if (collectedCount >= TARGET_COUNT) {
      setTimeout(() => {
        showFinishButton = true;
      }, 500);
    }
  }

  // --- XR8 Pipeline ---

  const customPipelineModule = {
    name: 'memory-papers',
    onStart: () => {
      const { scene: s, camera: c, renderer: r } = window.XR8.Threejs.xrScene();
      scene = s; camera = c; renderer = r;
      
      initSceneObjects();
      renderer.alpha = true; 
      
      // ВЕШАЕМ НА WINDOW, а не на canvasEl
      window.addEventListener('click', handleTap); 
    },
    onRender: () => {
      if(clock) animate(clock.getElapsedTime());
    },
    onStop: () => {
      window.removeEventListener('click', handleTap); // Удаляем с window
      // Очистка сцены
      papersData.forEach(p => scene.remove(p.mesh));
      papersData = [];
    }
  };

  // --- Запуск / Остановка ---

  async function startXR() {
    if (isStarted) return;
    isStarted = true;

    try {
      await loadScriptOnce(XR8_SCRIPT_URL);
      await loadScriptOnce(EXTRA_SCRIPT_URL);

      if (!window.XR8) {
        await new Promise(resolve => window.addEventListener('xrloaded', resolve, { once: true }));
      }

      const { XR8, XRExtras } = window;

      XR8.addCameraPipelineModules([
        XR8.GlTextureRenderer.pipelineModule(),
        XR8.Threejs.pipelineModule(),
        XR8.XrController.pipelineModule(),
        XRExtras.FullWindowCanvas.pipelineModule(), 
        XRExtras.AlmostThere.pipelineModule(),
        XRExtras.Loading.pipelineModule(),
        XRExtras.RuntimeError.pipelineModule(),
        customPipelineModule
      ]);

      XR8.run({
        canvas: canvasEl,
        allowedDevices: XR8.XrConfig.device().ANY
      });
      
    } catch (e) {
      console.error('XR Start Error:', e);
      isStarted = false;
    }
  }

  function stopXR() {
    if (!isStarted) return;
    isStarted = false;
    window.XR8?.stop();
    window.XR8?.removeCameraPipelineModules([customPipelineModule.name]);
  }

  // --- Реактивность Svelte ---

  $: if (running && host) {
    startXR();
  } else if (!running) {
    stopXR();
  }

  onMount(() => {
    if (running) startXR();
  });

  onDestroy(() => {
    stopXR();
  });

  function handleFinish() {
    dispatch('finish');
  }
</script>

{#if running}
  <div class="xr-container" bind:this={host}>
    <!-- Камера и 3D -->
    <canvas bind:this={canvasEl} class="xr-canvas"></canvas>
    
    <!-- Затемнение фона (Overlay) -->
    <div class="dim-layer"></div>

    <!-- UI Слой -->
    <div class="ui-layer">
      
      <!-- Счетчик -->
      <div class="counter-box">
        <span class="label">Воспоминания</span>
        <div class="dots">
          {#each Array(TARGET_COUNT) as _, i}
            <div class="dot" class:active={i < collectedCount}></div>
          {/each}
        </div>
      </div>

      <!-- Подсказка или Кнопка -->
      <div class="bottom-controls">
        {#if showFinishButton}
          <button class="cta-button primary cta-button--compact" on:click={handleFinish} in:fade>
            Изучить
          </button>
        {:else}
          <div class="hint">
            Поймайте летающие письма ({collectedCount}/{TARGET_COUNT})
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
/* Было background: #000; -> Стало transparent */
  .xr-container {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: transparent; /* ВАЖНО: Прозрачный фон */
    overflow: hidden;
    font-family: 'Helvetica Neue', sans-serif;
    pointer-events: none; /* Пропускаем клики сквозь контейнер, если нужно */
  }

  /* Канвас пусть управляется 8th Wall, но мы зададим ему базу */
  .xr-canvas {
    position: fixed !important; /* Фиксируем жестко */
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
    z-index: -1 !important; /* Уводим на самый задний план */
    object-fit: cover;
  }
  
  /* Затемнение реального мира */
  .dim-layer {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55); /* Сила затемнения */
    z-index: 2;
    pointer-events: none; /* Пропускает клики сквозь себя на канвас */
  }

  /* UI поверх всего */
  .ui-layer {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px;
    pointer-events: none; /* Сам слой прозрачен для кликов */
  }

  /* Счетчик сверху */
  .counter-box {
    align-self: center;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 12px 20px;
    border-radius: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    border: 1px solid rgba(255,255,255,0.2);
  }

  .label {
    color: white;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.8;
  }

  .dots {
    display: flex;
    gap: 8px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.4s ease;
  }

  .dot.active {
    background: #fff;
    box-shadow: 0 0 10px rgba(255,255,255,0.8);
    transform: scale(1.2);
  }

  /* Нижняя часть */
  .bottom-controls {
    display: flex;
    justify-content: center;
    padding-bottom: 40px;
    pointer-events: auto; /* Включаем клики для кнопки */
  }

    /* Включаем клики обратно для интерактивных элементов */
  .bottom-controls, .counter-box {
    pointer-events: auto; 
  }

  .hint {
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
</style>
