import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ArtDesignConfig } from './designer';
import { Loader2 } from 'lucide-react';

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
}

export const ThreeDPreview: React.FC<ThreeDPreviewProps> = ({
  designConfig,
  renderPanelToCanvas,
  previewSleeveType = 'half'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Keep references for updating texture without reloading the model
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const poloModelRef = useRef<THREE.Group | null>(null);

  // Canvas layers for panel composition
  const frontCanvas = useRef(document.createElement('canvas'));
  const backCanvas = useRef(document.createElement('canvas'));
  const leftSleeveCanvas = useRef(document.createElement('canvas'));
  const rightSleeveCanvas = useRef(document.createElement('canvas'));

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
    const frontCtx = frontCanvas.current.getContext('2d');
    if (frontCtx) {
      frontCanvas.current.width = 1386;
      frontCanvas.current.height = 1899;
      // Front physical width is 15 inches. scale = 1386 / 15
      renderPanelToCanvas('front', frontCtx, 1386, 1899, 1386 / 15, true);
      mainCtx.drawImage(frontCanvas.current, 64, 1962);
    }

    // 2. Draw Back panel (Component 15: X=[2282, 3797], Y=[1962, 4117], Size: 1515x2155)
    const backCtx = backCanvas.current.getContext('2d');
    if (backCtx) {
      backCanvas.current.width = 1515;
      backCanvas.current.height = 2155;
      // Back physical width is 15 inches. scale = 1515 / 15
      renderPanelToCanvas('back', backCtx, 1515, 2155, 1515 / 15, true);
      mainCtx.drawImage(backCanvas.current, 2282, 1962);
    }

    // 3. Draw Left Sleeve (Component 8: X=[341, 1685], Y=[576, 1280], Size: 1344x704)
    const leftSleeveCtx = leftSleeveCanvas.current.getContext('2d');
    if (leftSleeveCtx) {
      leftSleeveCanvas.current.width = 1344;
      leftSleeveCanvas.current.height = 704;
      // Sleeve physical width is 10 inches. scale = 1344 / 10
      renderPanelToCanvas('sleeveLeft', leftSleeveCtx, 1344, 704, 1344 / 10, true);
      mainCtx.drawImage(leftSleeveCanvas.current, 341, 576);
    }

    // 4. Draw Right Sleeve (Component 9: X=[1728, 3072], Y=[576, 1280], Size: 1344x704)
    const rightSleeveCtx = rightSleeveCanvas.current.getContext('2d');
    if (rightSleeveCtx) {
      rightSleeveCanvas.current.width = 1344;
      rightSleeveCanvas.current.height = 704;
      // Sleeve physical width is 10 inches. scale = 1344 / 10
      renderPanelToCanvas('sleeveRight', rightSleeveCtx, 1344, 704, 1344 / 10, true);
      mainCtx.drawImage(rightSleeveCanvas.current, 1728, 576);
    }

    // Draw collar, button placket, cuffs and other parts with solid matches
    const c1 = designConfig.front.generatedColor1;
    mainCtx.fillStyle = c1;
    // Component 1: Collar (X=[3157, 4117], Y=[42, 1002])
    mainCtx.fillRect(3157, 42, 960, 960);
    // Component 10: Collar rib (X=[1813, 2901], Y=[1408, 1514])
    mainCtx.fillRect(1813, 1408, 1088, 106);
    // Component 11: Sleeve cuff (X=[490, 1557], Y=[1429, 1536])
    mainCtx.fillRect(490, 1429, 1067, 107);
    // Component 12: Placket (X=[2474, 3050], Y=[1706, 1834])
    mainCtx.fillRect(2474, 1706, 576, 128);

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  };

  // Re-run composition when designConfig or sleeve settings change
  useEffect(() => {
    composeTexture();
  }, [designConfig, previewSleeveType]);

  // Initialize ThreeJS scene, camera, lights, and OrbitControls
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0f');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 3.8);

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
    controls.minDistance = 1.2;
    controls.maxDistance = 5.5;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.target.set(0, 0, 0);

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
    loader.load(
      '/models/tshirt.glb',
      (gltf) => {
        const model = gltf.scene;
        poloModelRef.current = model;

        // Center model around origin
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());

        // Scale from millimeters to meters
        model.scale.set(0.0014, 0.0014, 0.0014);

        // Center model at world origin and shift slightly down
        model.position.copy(center).multiplyScalar(-0.0014);
        model.position.y -= 0.45;

        // Apply materials to meshes
        model.traverse((child) => {
          if ((child as any).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const matName = (mesh.material as any).name || '';
            const mat = new THREE.MeshStandardMaterial({
              roughness: 0.82,
              metalness: 0.12,
              normalMap: normalMap,
              normalScale: new THREE.Vector2(0.12, 0.12)
            });

            if (
              matName.toLowerCase().includes('main design') || 
              matName.toLowerCase().includes('material 0') || 
              mesh.name.toLowerCase().includes('cloth')
            ) {
              mat.map = texture;
              mesh.material = mat;
            } else if (
              matName.toLowerCase().includes('button') || 
              matName.toLowerCase().includes('material 1')
            ) {
              mat.color.set(designConfig.front?.generatedColor1 || '#ffffff');
              mesh.material = mat;
            } else if (
              matName.toLowerCase().includes('sleeve end') || 
              matName.toLowerCase().includes('material 2')
            ) {
              mat.color.set(designConfig.front?.generatedColor1 || '#ffffff');
              mesh.material = mat;
            } else {
              mat.color.set('#ffffff');
              mesh.material = mat;
            }
          }
        });

        scene.add(model);
        composeTexture(); // Perform initial composition draw
        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setProgress(Math.round((xhr.loaded / xhr.total) * 100));
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
