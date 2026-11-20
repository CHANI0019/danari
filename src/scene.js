import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { projects } from './data/projects.js';

export class SolarSystemScene {
  constructor(container) {
    this.container = container;
    this.projects = projects;
    this.planetMeshes = [];
    this.satelliteMeshes = [];
    this.orbitLines = [];
    this.activePlanet = null;
    this.trackingMode = false;
    this.hoveredPlanet = null;

    // Callbacks
    this.onSelectPlanet = null;
    this.onHoverPlanet = null;

    // Default Camera Pos
    this.defaultCameraPos = new THREE.Vector3(0, 75, 115);
    this.defaultTarget = new THREE.Vector3(0, 0, 0);

    this.init();
    this.createStarfield();
    this.createCentralSun();
    this.createPlanets();
    this.setupEvents();
    this.animate();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05070f, 0.0035);

    // 2. Camera
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    this.camera.position.copy(this.defaultCameraPos);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 4. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 250;
    this.controls.minDistance = 8;
    this.controls.target.copy(this.defaultTarget);

    // 5. Lights
    this.ambientLight = new THREE.AmbientLight(0x4a5b8c, 2.2);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x88ccff, 0x1a1033, 1.2);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.PointLight(0xffffff, 3.5, 0, 0);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    // Raycaster for mouse interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
  }

  createStarfield() {
    // Stars
    const starCount = 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 300 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);

      // Star color variation (blueish to goldish white)
      const colorMix = Math.random();
      starColors[i * 3] = 0.8 + colorMix * 0.2;
      starColors[i * 3 + 1] = 0.85 + colorMix * 0.15;
      starColors[i * 3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);

    // Subtle Galactic Dust / Nebula Ring
    const nebulaCount = 1200;
    const nebGeo = new THREE.BufferGeometry();
    const nebPos = new Float32Array(nebCount * 3);
    const nebColors = new Float32Array(nebCount * 3);

    for (let i = 0; i < nebulaCount; i++) {
      const radius = 60 + Math.random() * 90;
      const angle = Math.random() * Math.PI * 2;
      const ySpread = (Math.random() - 0.5) * 16;

      nebPos[i * 3] = Math.cos(angle) * radius;
      nebPos[i * 3 + 1] = ySpread;
      nebPos[i * 3 + 2] = Math.sin(angle) * radius;

      nebColors[i * 3] = 0.35 + Math.random() * 0.3;
      nebColors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
      nebColors[i * 3 + 2] = 0.9;
    }

    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    nebGeo.setAttribute('color', new THREE.BufferAttribute(nebColors, 3));

    const nebMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    this.nebula = new THREE.Points(nebGeo, nebMat);
    this.scene.add(this.nebula);
  }

  createCentralSun() {
    this.sunGroup = new THREE.Group();

    // Core sphere
    const sunGeo = new THREE.SphereGeometry(6, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
    });
    this.sunCore = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(this.sunCore);

    // Inner Glow
    const glowGeo = new THREE.SphereGeometry(7.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    this.sunGlow = new THREE.Mesh(glowGeo, glowMat);
    this.sunGroup.add(this.sunGlow);

    // Corona Outer Halo
    const haloGeo = new THREE.SphereGeometry(8.8, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    this.sunHalo = new THREE.Mesh(haloGeo, haloMat);
    this.sunGroup.add(this.sunHalo);

    // Sun Label
    const sunLabel = this.createLabelSprite("DANARI CORE", "#38bdf8", 1.8);
    sunLabel.position.set(0, 9.5, 0);
    this.sunGroup.add(sunLabel);

    this.scene.add(this.sunGroup);
  }

  // Generate unique procedural surface textures for planets
  generatePlanetTexture(colorHex, typeIndex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const baseColor = new THREE.Color(colorHex);
    ctx.fillStyle = `#${baseColor.getHexString()}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Striped / Cloudy bands
    const bandCount = 12 + (typeIndex % 6);
    for (let i = 0; i < bandCount; i++) {
      const y = (canvas.height / bandCount) * i;
      const h = canvas.height / bandCount;
      const shade = (Math.random() - 0.5) * 0.35;
      const bandColor = baseColor.clone().offsetHSL(0, 0, shade);

      ctx.fillStyle = `#${bandColor.getHexString()}`;
      ctx.globalAlpha = 0.5 + Math.random() * 0.4;
      ctx.fillRect(0, y, canvas.width, h);
    }

    // Swirls and highlights
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 10 + Math.random() * 35, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  createLabelSprite(text, color = '#ffffff', scale = 1.0) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.font = 'bold 24px "Orbitron", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6 * scale, 1.5 * scale, 1);
    return sprite;
  }

  createOrbitLine(radius, colorHex) {
    const segments = 128;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array((segments + 1) * 3);

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity: 0.22,
      linewidth: 1
    });

    const orbit = new THREE.Line(geometry, material);
    this.scene.add(orbit);
    this.orbitLines.push({ mesh: orbit, radius, colorHex });
    return orbit;
  }

  createPlanets() {
    this.projects.forEach((proj, idx) => {
      const planetGroup = new THREE.Group();

      // Orbit Line
      this.createOrbitLine(proj.orbitRadius, proj.color);

      // Planet Mesh
      const geometry = new THREE.SphereGeometry(proj.size, 32, 32);
      const texture = this.generatePlanetTexture(proj.color, idx);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.65,
        metalness: 0.25,
        emissive: new THREE.Color(proj.color),
        emissiveIntensity: 0.18
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { project: proj, type: 'planet' };

      // Atmosphere Glow
      const atmosGeo = new THREE.SphereGeometry(proj.size * 1.18, 24, 24);
      const atmosMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(proj.color),
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
      mesh.add(atmosMesh);

      // Planet Label
      const label = this.createLabelSprite(proj.title, '#ffffff', Math.max(0.7, proj.size / 2.2));
      label.position.set(0, proj.size + 1.6, 0);
      mesh.add(label);

      // Satellites (Moons for clusters like shorts automation)
      const subMoons = [];
      if (proj.satellites && proj.satellites.length > 0) {
        proj.satellites.forEach((sat, satIdx) => {
          const moonGroup = new THREE.Group();
          const moonSize = 0.55;
          const moonRadius = proj.size + 2.5 + (satIdx * 0.9);
          const moonSpeed = 0.02 + (satIdx * 0.005);

          // Sub orbit line
          const subOrbitGeo = new THREE.BufferGeometry();
          const subPts = [];
          for (let s = 0; s <= 64; s++) {
            const th = (s / 64) * Math.PI * 2;
            subPts.push(Math.cos(th) * moonRadius, 0, Math.sin(th) * moonRadius);
          }
          subOrbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(subPts, 3));
          const subOrbitLine = new THREE.Line(subOrbitGeo, new THREE.LineBasicMaterial({
            color: 0xf472b6,
            transparent: true,
            opacity: 0.25
          }));
          mesh.add(subOrbitLine);

          // Moon mesh
          const moonMesh = new THREE.Mesh(
            new THREE.SphereGeometry(moonSize, 16, 16),
            new THREE.MeshStandardMaterial({
              color: 0xf472b6,
              emissive: 0xd946ef,
              emissiveIntensity: 0.35,
              roughness: 0.5
            })
          );
          moonMesh.userData = {
            satellite: sat,
            parentProject: proj,
            type: 'satellite'
          };

          const moonLabel = this.createLabelSprite(sat.name, '#f472b6', 0.55);
          moonLabel.position.set(0, moonSize + 0.8, 0);
          moonMesh.add(moonLabel);

          mesh.add(moonMesh);
          subMoons.push({
            mesh: moonMesh,
            radius: moonRadius,
            speed: moonSpeed,
            angle: (satIdx / proj.satellites.length) * Math.PI * 2
          });
        });
      }

      // Initial angle spread evenly
      const initialAngle = (idx / this.projects.length) * Math.PI * 2;
      mesh.position.set(
        Math.cos(initialAngle) * proj.orbitRadius,
        0,
        Math.sin(initialAngle) * proj.orbitRadius
      );

      this.scene.add(mesh);
      this.planetMeshes.push({
        mesh,
        project: proj,
        angle: initialAngle,
        radius: proj.orbitRadius,
        speed: proj.speed,
        satellites: subMoons
      });
    });
  }

  setupEvents() {
    // Resize handler
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    // Pointer Move
    window.addEventListener('pointermove', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.checkHover(e.clientX, e.clientY);
    });

    // Pointer Click
    window.addEventListener('click', (e) => {
      // Ignore if clicking on UI overlay buttons
      if (e.target.closest('#ui-layer') && !e.target.closest('#webgl-container')) {
        return;
      }
      this.checkClick();
    });
  }

  checkHover(clientX, clientY) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const targetObjects = this.planetMeshes.map(p => p.mesh);
    const intersects = this.raycaster.intersectObjects(targetObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const proj = hit.userData.project;
      document.body.style.cursor = 'pointer';

      if (this.onHoverPlanet) {
        this.onHoverPlanet(proj, clientX, clientY);
      }
      this.hoveredPlanet = hit;
    } else {
      document.body.style.cursor = 'default';
      if (this.onHoverPlanet) {
        this.onHoverPlanet(null);
      }
      this.hoveredPlanet = null;
    }
  }

  checkClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const targetObjects = this.planetMeshes.map(p => p.mesh);
    const intersects = this.raycaster.intersectObjects(targetObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const proj = hit.userData.project;
      this.focusPlanet(proj.id);

      if (this.onSelectPlanet) {
        this.onSelectPlanet(proj);
      }
    }
  }

  focusPlanet(projectId) {
    const found = this.planetMeshes.find(p => p.project.id === projectId);
    if (!found) return;

    this.activePlanet = found;
    this.trackingMode = true;

    // Get current world position of planet
    const targetPos = new THREE.Vector3();
    found.mesh.getWorldPosition(targetPos);

    // Compute camera offset near planet
    const offsetDistance = Math.max(10, found.project.size * 5);
    const targetCamPos = new THREE.Vector3(
      targetPos.x + offsetDistance * 0.7,
      targetPos.y + offsetDistance * 0.5,
      targetPos.z + offsetDistance * 0.7
    );

    gsap.to(this.camera.position, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 1.6,
      ease: 'power2.inOut'
    });

    gsap.to(this.controls.target, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.6,
      ease: 'power2.inOut'
    });
  }

  resetView() {
    this.activePlanet = null;
    this.trackingMode = false;

    gsap.to(this.camera.position, {
      x: this.defaultCameraPos.x,
      y: this.defaultCameraPos.y,
      z: this.defaultCameraPos.z,
      duration: 1.8,
      ease: 'power2.inOut'
    });

    gsap.to(this.controls.target, {
      x: this.defaultTarget.x,
      y: this.defaultTarget.y,
      z: this.defaultTarget.z,
      duration: 1.8,
      ease: 'power2.inOut'
    });
  }

  filterCategory(categoryKey) {
    this.planetMeshes.forEach(p => {
      const match = categoryKey === 'all' || p.project.category === categoryKey;
      gsap.to(p.mesh.scale, {
        x: match ? 1 : 0.45,
        y: match ? 1 : 0.45,
        z: match ? 1 : 0.45,
        duration: 0.6
      });
      p.mesh.material.opacity = match ? 1.0 : 0.25;
      p.mesh.material.transparent = !match;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // 1. Sun pulses and rotations
    if (this.sunGroup) {
      this.sunGroup.rotation.y += 0.003;
      const time = performance.now() * 0.002;
      const pulse = 1 + Math.sin(time) * 0.04;
      this.sunGlow.scale.set(pulse, pulse, pulse);
    }

    // 2. Stars rotation
    if (this.stars) {
      this.stars.rotation.y += 0.00015;
    }
    if (this.nebula) {
      this.nebula.rotation.y -= 0.00025;
    }

    // 3. Planet revolutions & rotations
    this.planetMeshes.forEach(p => {
      // Revolution around sun
      p.angle += p.speed * 0.7;
      p.mesh.position.x = Math.cos(p.angle) * p.radius;
      p.mesh.position.z = Math.sin(p.angle) * p.radius;

      // Self rotation
      p.mesh.rotation.y += 0.015;

      // Update Moons / Satellites
      if (p.satellites && p.satellites.length > 0) {
        p.satellites.forEach(m => {
          m.angle += m.speed;
          m.mesh.position.x = Math.cos(m.angle) * m.radius;
          m.mesh.position.z = Math.sin(m.angle) * m.radius;
          m.mesh.rotation.y += 0.03;
        });
      }
    });

    // 4. Tracking mode: smooth camera chase if active planet is orbiting
    if (this.trackingMode && this.activePlanet) {
      const currentPos = new THREE.Vector3();
      this.activePlanet.mesh.getWorldPosition(currentPos);
      this.controls.target.lerp(currentPos, 0.05);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

