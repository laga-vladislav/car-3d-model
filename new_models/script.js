<script src="https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/controls/OrbitControls.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/loaders/DRACOLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/libs/draco/draco_decoder.js"></script>

<script>
  const canvas = document.querySelector('#c');
  const container = document.querySelector('.canvas-container');
  const loaderEl = document.querySelector('.loader');
  const colorDesc = document.querySelector('.color-description');
  const buttons = document.querySelectorAll('.color-switcher button');

  let renderer, scene, camera, carMesh;
  let textureCache = {};

  const colorInfo = {
    black: '',
    'light-green': '',
    white: '*Цвет доступен только в модели Adventure RUS',
    grey: '*Цвет доступен только в модели Adventure RUS',
    'dark-green': '*Цвет доступен только в модели Adventure RUS',
    'light-blue': '*Цвет доступен только в модели Long Wind'
  };

  const textures = {
    black: {
      color: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/black_car/Textures/base_color_black.png',
      roughnessMetalness: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/black_car/Textures/Metallic_1-roughness.png'
    },
    'light-green': {
      color: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/green_car/Textures/base_color_green.png',
      roughnessMetalness: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/green_car/Textures/Metallic_08-roughness.png'
    },
    white: {
      color: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/white_car/Textures/base_color_white.png',
      roughnessMetalness: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/white_car/Textures/Metallic_05-roughness.png'
    },
    grey: {
      color: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/grey_car/Textures/base_color_grey.png',
      roughnessMetalness: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/grey_car/Textures/Metallic_06-roughness.png'
    },
    'dark-green': {
      color: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/dark_green_car/Textures/base_color_dark_green.png',
      roughnessMetalness: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/dark_green_car/Textures/base_color_dark_green.png'
    },
    'light-blue': {
      color: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/blue_car/Textures/base color.png',
      roughnessMetalness: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/blue_car/Textures/Metallic_0-roughness_png.png',
      secondColorMeshName: 'blue001',
      secondColor: 'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/blue_car/Textures/base color roof.png'
    }
  };

  preloadTextures();

  function preloadTextures() {
    const textureLoader = new THREE.TextureLoader();
    Object.keys(textures).forEach(colorKey => {
      const tex = textures[colorKey];
      textureCache[colorKey] = {
          colorMap: textureLoader.load(tex.color),
          roughnessMetalnessMap: textureLoader.load(tex.roughnessMetalness)
      };
      textureCache[colorKey].colorMap.encoding = THREE.sRGBEncoding;
      textureCache[colorKey].roughnessMetalnessMap.encoding = THREE.sRGBEncoding;

      if (tex.secondColor) {
        textureCache[colorKey].secondColorMap = textureLoader.load(tex.secondColor);
        textureCache[colorKey].secondColorMap.encoding = THREE.sRGBEncoding;
      }
    });
  }

  function init() {
    renderer = new THREE.WebGLRenderer( { canvas, antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( container.clientWidth, container.clientHeight );
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.set(-4, 2.5, 2);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.2;
    controls.enablePan = false;
    controls.minDistance = 3.5;
    controls.maxDistance = 6;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 1.5, 0);

    controls.update();

    const dirLight1 = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight1.position.set( 20, 20, 20 );
    scene.add( dirLight1 );

    const dirLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight2.position.set( 20, 20, -20 );
    scene.add( dirLight2 );

    const dirLight3 = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight3.position.set( -20, 20, -20 );
    scene.add( dirLight3 );

    loadCarModel();

    window.addEventListener('load', onWindowResize);

    window.addEventListener( 'resize', () => {
      onWindowResize();
      renderOnce();
    });

    controls.addEventListener('change', renderOnce);

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = getColorClassFromButton(btn);
        setActiveButton(btn);
        updateInfoText(color);
        changeCarColor(color);
        renderOnce();
      });
    });
  }
  
  init();
    
  function loadCarModel() {
    loaderEl.style.display = 'flex';
    buttons.forEach(b => b.disabled = true);

    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/libs/draco/');
    
    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader); 

    loader.load(
      'https://raw.githubusercontent.com/laga-vladislav/car-3d-model/refs/heads/main/new_models/blue_car/blue_car.gltf',
      (gltf ) => {
        carMesh = gltf.scene;

        carMesh.scale.set(10, 10, 10);
        carMesh.position.set(0, 1, 0);
        scene.add(carMesh);

        loaderEl.style.display = 'none';
        buttons.forEach(b => b.disabled = false);
        
        renderOnce();
        console.log('Модель загружена успешно');
        changeCarColor('black');
      },
      undefined,
      function (error) {
        if (!loadedSuccessfully) {
          loaderEl.textContent = 'Ошибка загрузки модели';
          console.error('Ошибка GLTFLoader:', error);
        }
      }
    );
  }

  function changeCarColor(colorKey) {
    console.log('Changing car color to:', colorKey, carMesh, textureCache[colorKey]);
    if (!carMesh || !textureCache[colorKey]) return;

    const { colorMap, roughnessMetalnessMap } = textureCache[colorKey];

    carMesh.traverse((child) => {
      if (child.isMesh && child.material) {
        if (child.material.map) child.material.map.dispose();
        if (child.material.roughnessMap) child.material.roughnessMap.dispose();
        if (child.material.metalnessMap) child.material.metalnessMap.dispose();

        child.material.map = colorMap;
        child.material.roughnessMap = roughnessMetalnessMap;
        child.material.metalnessMap = roughnessMetalnessMap;

        if (textures[colorKey].secondColorMeshName && child.name === textures[colorKey].secondColorMeshName) {
          const secondColorMap = textureCache[colorKey].secondColorMap;
          if (child.material.map) child.material.map.dispose();
          child.material.map = secondColorMap;
        }
      }
    });

    renderOnce();
  }

  function setActiveButton(btn) {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  
  function updateInfoText(colorClass) {
    colorDesc.textContent = colorInfo[colorClass] || '';
  }
  
  function getColorClassFromButton(btn) {
    return btn.querySelector('.circle').classList[0].replace('-circle', '');
  }

  function onWindowResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    console.log(w, h)
    camera.aspect = w / h;

    camera.updateProjectionMatrix();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(w, h);
  }

  requestAnimationFrame(() => {
    onWindowResize();
  })

  function renderOnce() {
    renderer.render(scene, camera);
  }

  function animate() {
    renderer.render( scene, camera );
  }

</script>


<style>
    .viewer button {
        background: none repeat scroll 0 0 transparent;
        border: medium none;
        border-spacing: 0;
        color: #26589F;
        font-weight: normal;
        list-style: none outside none;
        margin: 0;
        padding: 0;
        text-align: left;
        text-decoration: none;
        text-indent: 0;
        cursor: pointer;
    }
    .viewer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-flow: column nowrap;
    }
    .color-switcher {
        position: relative;
        flex-grow: 0;
        display: flex;
        justify-content: center;
        gap: 8px;
        z-index: 100;
    }
    .color-switcher button {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0px;
        gap: 20px;
        
        width: 64px;
        height: auto;
    }
    .color-switcher button p {
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 110%;
        text-align: center;
        letter-spacing: -0.5px;
        color: #FFFFFF;
        opacity: 0.2;
        flex: none;
        order: 1;
        align-self: stretch;
        flex-grow: 0;

    }
    .circle {
        box-sizing: border-box;
        border-radius: 50%;
        width: 64px;
        height: 64px;
        flex: 0 0 auto;
    }
    .white-circle {
        background: linear-gradient(180deg, #EFEFEF 0%, #EFEFEF 30.77%, #FFFFFF 53.85%, #EFEFEF 75%, rgba(255, 254, 254, 0.996078) 100%);
        border: 4px solid #2D2D2D;
    }
    .light-green-circle {
        background: linear-gradient(180deg, #959E77 0%, #959E77 30.77%, #A6AC90 53.85%, #959E77 75%, #959E77 100%);
        opacity: 0.8;
        border: 4px solid #2D2D2D;
    }
    .dark-green-circle {
        background: linear-gradient(180deg, #446E60 0%, #446E60 30.77%, #537C6F 53.85%, #446E60 75%, #446E60 100%);
        border: 4px solid #2D2D2D;
    }
    .black-circle {
        background: linear-gradient(180deg, #1B1B1B 0%, #1B1B1B 30.77%, #2E2E2E 53.85%, #1B1B1B 75%, #1B1B1B 100%);
        border: 4px solid #2D2D2D;
    }
    .grey-circle {
        background: linear-gradient(180deg, #6F6F6F 0%, #6F6F6F 30.77%, #898989 53.85%, #6F6F6F 75%, rgba(111, 111, 111, 0.996078) 100%);
        border: 4px solid #2D2D2D;
    }
    .light-blue-circle {
        background: linear-gradient(180deg, #24A2D6 0%, #24A2D6 30.77%, #36AFE2 53.85%, #24A2D6 75%, #24A2D6 100%);
        border: 4px solid #2D2D2D;
    }
    .color-switcher button.active p {
        opacity: 1;
    }
    .canvas-container {
        flex-grow: 1;
        position: relative;
    }
    canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
        margin: 0;
        padding: 0;
        background: transparent;
    }
    .color-description {
        font-family: "Inter";
        color: #CDCDCD;
        flex-grow: 0;
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 100%;
        min-height: 15px; 
        text-align: center;
        letter-spacing: -0.5px;
        margin-bottom: 1rem;
    }
    @media (max-width: 768px) {
      .color-description {
        font-size: 12px;
        min-height: 13px;
      }
    }
    
    @media (max-width: 480px) {
      .color-description {
        font-size: 11px;
        min-height: 12px;
      }
    }
    .loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 999;
        width: fit-content;
        font-family: "Inter", sans-serif;
        font-weight: bold;
        font-size: 16px;
        color: #CDCDCD;
        padding-bottom: 6px;
    }
    
    .loader:before {
        content: "Загрузка BAW 212...";
    }
    
    .loader:after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 50%;
        height: 3px;
        background: linear-gradient(90deg, transparent, #CDCDCD 50%, transparent);
        box-shadow: 0 0 8px rgba(205, 205, 205, 0.5);
        animation: slide 1.5s ease-in-out infinite;
    }
    
    @keyframes slide {
        0% {
            transform: translateX(0);
        }
        50% {
            transform: translateX(100%);
        }
        100% {
            transform: translateX(0);
        }
    }
        
    .loader-text {
        margin-bottom: 1rem;
    }
    
    .loader-text,
    .loader-bar,
    .loader-fill {
        display: none;
    }
    @media (max-width: 768px) {
        .color-switcher {
            gap: 6px;
        }
        
        .color-switcher button {
            width: 48px;
            gap: 12px;
        }
        
        .circle {
            width: 48px;
            height: 48px;
            border-width: 3px;
        }
        
        .color-switcher button p,
        .loader {
            font-size: 12px;
        }
    }
    
    @media (max-width: 480px) {
        .color-switcher {
            gap: 4px;
        }
        
        .color-switcher button {
            width: 40px;
            gap: 8px;
        }
        
        .circle {
            width: 40px;
            height: 40px;
            border-width: 2px;
        }
        
        .color-switcher button p,
        .loader {
            font-size: 10px;
        }
    }
</style>
