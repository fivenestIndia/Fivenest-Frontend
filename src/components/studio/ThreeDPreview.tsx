import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ArtDesignConfig } from './designer';
import { Loader2 } from 'lucide-react';
import { defaultSizes } from './sizesDb';

interface ThreeDPreviewProps {
  designConfig: ArtDesignConfig;
  renderPanelToCanvas: (
    panelKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print',
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: number,
    is3DPreview?: boolean
  ) => void;
  previewSleeveType?: 'half' | 'full';
  prefTrigger?: number;
  zoom?: number;
}

export const ThreeDPreview: React.FC<ThreeDPreviewProps> = ({
  designConfig,
  renderPanelToCanvas,
  previewSleeveType = 'half',
  prefTrigger,
  zoom = 1
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Keep references for updating texture without reloading the model
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const poloModelRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Canvas layers for panel composition
  const frontCanvas = useRef(document.createElement('canvas'));
  const backCanvas = useRef(document.createElement('canvas'));
  const leftSleeveCanvas = useRef(document.createElement('canvas'));
  const rightSleeveCanvas = useRef(document.createElement('canvas'));

  // Preloaded/cached images for Collar, Placket, and Sleeve stripe trims
  const [loadedTrimImages, setLoadedTrimImages] = useState<{
    collar?: HTMLImageElement;
    placket?: HTMLImageElement;
    sleeveStripe?: HTMLImageElement;
  }>({});

  // Dynamic image preloader hook for trims
  useEffect(() => {
    const trim = designConfig.trim;
    if (!trim) {
      setLoadedTrimImages({});
      return;
    }

    const urls = {
      collar: trim.collar.uploadedUrl,
      placket: trim.placket.uploadedUrl,
      sleeveStripe: trim.sleeveStripe.uploadedUrl
    };

    let changed = false;
    const newImages = { ...loadedTrimImages };

    const loadPromises = Object.entries(urls).map(([key, url]) => {
      const typedKey = key as 'collar' | 'placket' | 'sleeveStripe';
      if (!url) {
        if (newImages[typedKey]) {
          delete newImages[typedKey];
          changed = true;
        }
        return Promise.resolve();
      }
      if (newImages[typedKey]?.src === url) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          newImages[typedKey] = img;
          changed = true;
          resolve();
        };
        img.onerror = () => {
          console.error(`Failed to load trim image for ${key}: ${url}`);
          resolve();
        };
        img.src = url;
      });
    });

    Promise.all(loadPromises).then(() => {
      if (changed) {
        setLoadedTrimImages(newImages);
      }
    });
  }, [designConfig.trim]);

  // Re-draw panels and compose onto single 4267x4267 texture sheet
  const composeTexture = () => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;
    const mainCtx = mainCanvas.getContext('2d');
    if (!mainCtx) return;

    // Clear background
    mainCtx.fillStyle = '#ffffff';
    mainCtx.fillRect(0, 0, 4267, 4267);

    // 1. Draw Front panel (Component 14: X=[64, 1450], Y=[1962, 3861], Size: 1386x1899)
    const sizeConf = defaultSizes["40"];
    const frontScale = 1386 / sizeConf.front.w;
    const backScale = 1515 / sizeConf.back.w;
    const isFullSleeve = previewSleeveType === 'full';
    const sleeveW = isFullSleeve ? sizeConf.full.w : sizeConf.half.w;
    const sleeveScale = 1344 / sleeveW;

    const frontCtx = frontCanvas.current.getContext('2d');
    if (frontCtx) {
      frontCanvas.current.width = 1386;
      frontCanvas.current.height = 1899;
      renderPanelToCanvas('front', frontCtx, 1386, 1899, frontScale, true);
      mainCtx.drawImage(frontCanvas.current, 64, 1962);
    }

    // 2. Draw Back panel (Component 15: X=[2282, 3797], Y=[1962, 4117], Size: 1515x2155)
    const backCtx = backCanvas.current.getContext('2d');
    if (backCtx) {
      backCanvas.current.width = 1515;
      backCanvas.current.height = 2155;
      renderPanelToCanvas('back', backCtx, 1515, 2155, backScale, true);
      mainCtx.drawImage(backCanvas.current, 2282, 1962);
    }

    // 3. Draw Left Sleeve (Component 8: X=[341, 1685], Y=[576, 1280], Size: 1344x704)
    const leftSleeveCtx = leftSleeveCanvas.current.getContext('2d');
    if (leftSleeveCtx) {
      leftSleeveCanvas.current.width = 1344;
      leftSleeveCanvas.current.height = 704;
      renderPanelToCanvas('sleeveLeft', leftSleeveCtx, 1344, 704, sleeveScale, true);
      mainCtx.drawImage(leftSleeveCanvas.current, 341, 576);
    }

    // 4. Draw Right Sleeve (Component 9: X=[1728, 3072], Y=[576, 1280], Size: 1344x704)
    const rightSleeveCtx = rightSleeveCanvas.current.getContext('2d');
    if (rightSleeveCtx) {
      rightSleeveCanvas.current.width = 1344;
      rightSleeveCanvas.current.height = 704;
      renderPanelToCanvas('sleeveRight', rightSleeveCtx, 1344, 704, sleeveScale, true);
      mainCtx.drawImage(rightSleeveCanvas.current, 1728, 576);
    }

    // Draw collar, button placket, cuffs and other parts with solid matches or custom images
    const c1 = designConfig.front.generatedColor1;
    const trim = designConfig.trim || {
      collar: { color: c1, uploadedUrl: null },
      placket: { color: c1, uploadedUrl: null },
      sleeveStripe: { color: c1, uploadedUrl: null }
    };

    // Component 1: Collar (X=[3157, 4117], Y=[42, 1002])
    if (loadedTrimImages.collar) {
      mainCtx.drawImage(loadedTrimImages.collar, 3157, 42, 960, 960);
    } else {
      mainCtx.fillStyle = trim.collar.color || c1;
      mainCtx.fillRect(3157, 42, 960, 960);
    }

    // Component 10: Collar rib (X=[1813, 2901], Y=[1408, 1514])
    if (loadedTrimImages.collar) {
      mainCtx.drawImage(loadedTrimImages.collar, 1813, 1408, 1088, 106);
    } else {
      mainCtx.fillStyle = trim.collar.color || c1;
      mainCtx.fillRect(1813, 1408, 1088, 106);
    }

    // Component 11: Sleeve cuff (X=[490, 1557], Y=[1429, 1536])
    if (loadedTrimImages.sleeveStripe) {
      mainCtx.drawImage(loadedTrimImages.sleeveStripe, 490, 1429, 1067, 107);
    } else {
      mainCtx.fillStyle = trim.sleeveStripe.color || c1;
      mainCtx.fillRect(490, 1429, 1067, 107);
    }

    // Component 12: Placket (X=[2474, 3050], Y=[1706, 1834])
    if (loadedTrimImages.placket) {
      mainCtx.drawImage(loadedTrimImages.placket, 2474, 1706, 576, 128);
    } else {
      mainCtx.fillStyle = trim.placket.color || c1;
      mainCtx.fillRect(2474, 1706, 576, 128);
    }

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  };

  // Re-run composition and dynamically update solid meshes when trim configuration changes
  useEffect(() => {
    composeTexture();

    // Dynamically update solid color materials on 3D meshes (buttons, sleeve ends) in real-time
    if (poloModelRef.current) {
      const c1 = designConfig.front.generatedColor1;
      const trim = designConfig.trim || {
        collar: { color: c1, uploadedUrl: null },
        placket: { color: c1, uploadedUrl: null },
        sleeveStripe: { color: c1, uploadedUrl: null }
      };

      poloModelRef.current.traverse((child) => {
        if ((child as any).isMesh) {
          const mesh = child as THREE.Mesh;
          const matName = (mesh.material as any).name || '';
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat) {
            if (
              matName.toLowerCase().includes('button') || 
              matName.toLowerCase().includes('material 1')
            ) {
              mat.color.set(trim.placket.color || '#ffffff');
            } else if (
              matName.toLowerCase().includes('sleeve end') || 
              matName.toLowerCase().includes('material 2')
            ) {
              mat.color.set(trim.sleeveStripe.color || '#ffffff');
            }
          }
        }
      });
    }
  }, [designConfig, previewSleeveType, prefTrigger, loadedTrimImages]);

  // Handle external zoom controls dynamically
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.zoom = zoom;
      cameraRef.current.updateProjectionMatrix();
    }
    // Reset camera position and target when zoom is reset to 1
    if (zoom === 1 && cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0.2, 2.2);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [zoom]);

  // Initialize ThreeJS scene, camera, lights, and OrbitControls
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0f');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 2.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.7);
    scene.add(ambientLight);

    // Front Main Directional Light
    const dirLight1 = new THREE.DirectionalLight('#ffffff', 0.95);
    dirLight1.position.set(2, 4, 3);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.bias = -0.0001;
    scene.add(dirLight1);

    // Back Directional Light for fills
    const dirLight2 = new THREE.DirectionalLight('#ffffff', 0.4);
    dirLight2.position.set(-2, 2, -3);
    scene.add(dirLight2);

    // Point Light from bottom
    const pointLight = new THREE.PointLight('#ffffff', 0.2, 10);
    pointLight.position.set(0, -2, 2);
    scene.add(pointLight);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 1.0;
    controls.maxDistance = 5.5;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Spacebar Panning Control Handlers
    let isSpaceDown = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (!isSpaceDown) {
          isSpaceDown = true;
          controls.enablePan = true;
          controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grab';
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        isSpaceDown = false;
        controls.enablePan = false;
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'auto';
        }
      }
    };

    const handleMouseDown = () => {
      if (isSpaceDown && canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = () => {
      if (canvasRef.current) {
        canvasRef.current.style.cursor = isSpaceDown ? 'grab' : 'auto';
      }
    };

    const handleBlur = () => {
      isSpaceDown = false;
      controls.enablePan = false;
      controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'auto';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      canvasEl.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // Create Main Composition Canvas
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = 4267;
    mainCanvas.height = 4267;
    mainCanvasRef.current = mainCanvas;

    const texture = new THREE.CanvasTexture(mainCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;
    textureRef.current = texture;

    // Load Fabric Normal Map
    const textureLoader = new THREE.TextureLoader();
    const normalMap = textureLoader.load('/textures/TShirt_NRM.jpg', (normTex) => {
      normTex.wrapS = THREE.RepeatWrapping;
      normTex.wrapT = THREE.RepeatWrapping;
      normTex.repeat.set(12, 12);
    });

    // Load T-Shirt GLTF model
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    console.log("Starting to load GLTF model from /models/tshirt.glb...");
    loader.load(
      '/models/tshirt.glb',
      (gltf) => {
        console.log("GLTF model loaded successfully! Scene structure:", gltf.scene);
        const model = gltf.scene;
        poloModelRef.current = model;

        // Force update world matrices so child node scales and positions are applied
        model.updateMatrixWorld(true);

        // Center model around origin
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        console.log("DEBUG: GLTF raw bounding box center:", JSON.stringify(center), "size:", JSON.stringify(size));

        // Scale to a standard target height (e.g. 0.95 meters)
        const targetHeight = 0.95;
        const scaleFactor = targetHeight / (size.y || 1);
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        console.log("DEBUG: Applying scale factor:", scaleFactor);

        // Center model at world origin and shift slightly down
        model.position.copy(center).multiplyScalar(-scaleFactor);
        model.position.y -= 0.45;
        console.log("DEBUG: Positioned model group at:", JSON.stringify(model.position), "scale:", JSON.stringify(model.scale));

        // Expose to window for headless debugging
        (window as any).__THREE_DEBUG__ = {
          scene,
          camera,
          renderer,
          controls,
          model,
          box,
          center,
          size,
          scaleFactor
        };
        console.log("DEBUG: Exposed __THREE_DEBUG__ to window.");
        console.log("DEBUG: container dimensions:", containerRef.current?.clientWidth, "x", containerRef.current?.clientHeight);
        console.log("DEBUG: canvas dimensions:", canvasRef.current?.clientWidth, "x", canvasRef.current?.clientHeight);
        console.log("DEBUG: camera aspect:", camera.aspect, "fov:", camera.fov, "position:", JSON.stringify(camera.position));
        console.log("DEBUG: controls target:", JSON.stringify(controls.target));

        // Apply materials to meshes
        let meshCount = 0;
        model.traverse((child) => {
          if ((child as any).isMesh) {
            meshCount++;
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const matName = (mesh.material as any).name || '';
            console.log(`Mesh ${meshCount}: Name="${mesh.name}", MaterialName="${matName}", Geometry has UV:`, !!mesh.geometry?.attributes?.uv);

            const mat = new THREE.MeshStandardMaterial({
              roughness: 0.82,
              metalness: 0.12,
              normalMap: normalMap,
              normalScale: new THREE.Vector2(0.12, 0.12)
            });

            const c1 = designConfig.front.generatedColor1;
            const trim = designConfig.trim || {
              collar: { color: c1, uploadedUrl: null },
              placket: { color: c1, uploadedUrl: null },
              sleeveStripe: { color: c1, uploadedUrl: null }
            };

            if (
              matName.toLowerCase().includes('button') || 
              matName.toLowerCase().includes('material 1')
            ) {
              console.log(`-> Mapping solid color (button) to mesh: "${mesh.name}"`);
              mat.color.set(trim.placket.color || '#ffffff');
              mesh.material = mat;
            } else if (
              matName.toLowerCase().includes('sleeve end') || 
              matName.toLowerCase().includes('material 2')
            ) {
              console.log(`-> Mapping solid color (sleeve end) to mesh: "${mesh.name}"`);
              mat.color.set(trim.sleeveStripe.color || '#ffffff');
              mesh.material = mat;
            } else if (
              matName.toLowerCase().includes('main design') || 
              matName.toLowerCase().includes('material 0') || 
              mesh.name.toLowerCase().includes('cloth')
            ) {
              console.log(`-> Mapping composite canvas texture to mesh: "${mesh.name}"`);
              mat.map = texture;
              mesh.material = mat;
            } else {
              console.log(`-> Mapping default white to mesh: "${mesh.name}"`);
              mat.color.set('#ffffff');
              mesh.material = mat;
            }
          }
        });
        console.log(`Successfully processed ${meshCount} meshes.`);

        scene.add(model);
        console.log("Added model to scene. Running composeTexture...");
        composeTexture(); // Perform initial composition draw
        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          console.log(`GLTF Loading progress: ${percent}%`);
          setProgress(percent);
        }
      },
      (error) => {
        console.error('Failed loading GLTF TShirt:', error);
        setLoading(false);
      }
    );

    // Animation frames loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer for dynamic dimensions and layout adjustments (sidebar collapse, etc.)
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      if (canvasEl) {
        canvasEl.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      }
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      renderer.dispose();
      texture.dispose();
      normalMap.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative" 
      style={{ minHeight: '520px', backgroundColor: '#0a0a0f', borderRadius: '8px' }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block" 
        style={{ touchAction: 'none' }}
      />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/95 text-white z-50 rounded-lg">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
          <p className="text-sm font-semibold tracking-wider">GENERATING 3D MODEL PREVIEW... {progress}%</p>
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] px-2 py-1 rounded select-none pointer-events-none">
        Left-click & drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};
