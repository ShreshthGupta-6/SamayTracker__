import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  theme: 'dark' | 'light';
}

export default function ThreeBackground({ theme }: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // 1. Create Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 40;

    // 2. Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Setup Colors based on dark / light theme
    const isDark = theme === 'dark';
    
    // MP025 Nocturnal Forsythia (#FFC801) and Deep Saffron (#FF9932)
    const forsythiaHex = 0xFFC801;
    const saffronHex = 0xFF9932;
    const tealHex = isDark ? 0x114C5A : 0xBCD1C8;

    const colorForsythia = new THREE.Color(forsythiaHex);
    const colorSaffron = new THREE.Color(saffronHex);
    const currentColor = new THREE.Color(forsythiaHex);

    // 4. Create Nodes (Temporal Particles)
    const particleCount = 130;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions: { x: number; y: number; z: number; speedX: number; speedY: number; speedZ: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 85;
      const y = (Math.random() - 0.5) * 55;
      const z = (Math.random() - 0.5) * 45;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions.push({
        x,
        y,
        z,
        speedX: (Math.random() - 0.5) * 0.05,
        speedY: (Math.random() - 0.5) * 0.05,
        speedZ: (Math.random() - 0.5) * 0.03
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create Canvas Texture for premium round glowing particles
    const createCircleTexture = () => {
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const texture = createCircleTexture();

    const material = new THREE.PointsMaterial({
      size: 1.1,
      map: texture,
      transparent: true,
      color: currentColor,
      opacity: isDark ? 0.75 : 0.85,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // 5. Lines representing Connection Timelines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: currentColor,
      transparent: true,
      opacity: isDark ? 0.28 : 0.35,
      linewidth: 1.5
    });

    // Create dynamic lines buffer
    const maxConnections = 200;
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // 6. Track Mouse & Scroll Interactions
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (event: MouseEvent) => {
      mouse.targetX = (event.clientX / window.innerWidth - 0.5) * 12;
      mouse.targetY = -(event.clientY / window.innerHeight - 0.5) * 12;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Scroll capture phase listener to handle any nested scroll container
    let scrollY = 0;
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target) {
        scrollY = target.scrollTop || window.scrollY;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      const positionsAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      
      // Interpolate mouse movement for smooth delay inertia
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      camera.position.x += (mouse.x - camera.position.x) * 0.04;
      camera.position.y += (mouse.y - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      // Interpolate color dynamically from Forsythia (Gold) to Saffron (Orange) based on scroll
      const maxScrollDistance = 450;
      const scrollFraction = Math.min(scrollY / maxScrollDistance, 1);
      
      // Calculate intermediate color
      currentColor.copy(colorForsythia).lerp(colorSaffron, scrollFraction);
      material.color.copy(currentColor);
      lineMaterial.color.copy(currentColor);

      let lineCount = 0;
      const linePosAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute;

      // Update node positions with gentle periodic orbital wave movement
      for (let i = 0; i < particleCount; i++) {
        const orig = originalPositions[i];
        
        // Dynamic time-wave displacement
        const waveX = Math.sin(time * 0.4 + orig.y * 0.1) * 0.4;
        const waveY = Math.cos(time * 0.5 + orig.x * 0.1) * 0.4;

        positionsAttr.setXYZ(
          i,
          orig.x + waveX,
          orig.y + waveY,
          orig.z + Math.sin(time * 0.25 + orig.x * 0.04) * 0.6
        );
      }
      positionsAttr.needsUpdate = true;

      // Connect nodes close to each other
      for (let i = 0; i < particleCount; i++) {
        const x1 = positionsAttr.getX(i);
        const y1 = positionsAttr.getY(i);
        const z1 = positionsAttr.getZ(i);

        for (let j = i + 1; j < particleCount; j++) {
          if (lineCount >= maxConnections) break;

          const x2 = positionsAttr.getX(j);
          const y2 = positionsAttr.getY(j);
          const z2 = positionsAttr.getZ(j);

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dz = z1 - z2;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // If close enough, add a connecting line segment
          if (dist < 12) {
            linePosAttr.setXYZ(lineCount * 2, x1, y1, z1);
            linePosAttr.setXYZ(lineCount * 2 + 1, x2, y2, z2);
            lineCount++;
          }
        }
      }
      
      // Clear remainder indices
      for (let k = lineCount * 2; k < maxConnections * 2; k++) {
        linePosAttr.setXYZ(k, 0, 0, 0);
      }
      linePosAttr.needsUpdate = true;

      // Gently rotate whole particle system for extra depth
      particleSystem.rotation.y = time * 0.012;
      lines.rotation.y = time * 0.012;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = entry.contentRect.width || container.clientWidth;
        height = entry.contentRect.height || container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });

    resizeObserver.observe(container);

    // Cleanup on component unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll, true);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0" 
      style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'multiply' }}
      id="three-3d-temporal-backdrop"
    />
  );
}
