import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { projects } from './data/projects.js';
import {
  createSunTexture,
  createCloudTexture,
  createPlanetRingTexture,
  createStarSpriteTexture,
  getPlanetTextureByType
} from './textures.js';

export class SolarSystemScene {
  constructor(container) {
    this.container = container;
    this.projects = projects;
    this.planetMeshes = [];
    this.cloudMeshes = [];
    this.orbitLines = [];
    this.activePlanet = null;
    this.trackingMode = false;
    this.hoveredPlanet = null;
    this.textureLoader = new THREE.TextureLoader();

    // Callbacks
    this.onSelectPlanet = null;
    this.onHoverPlanet = null;

    // Default Camera Pos
    this.defaultCameraPos = new THREE.Vector3(0, 82, 132);
    this.defaultTarget = new THREE.Vector3(0, 0, 0);

    this.init();
    this.createMilkyWayBackground();
    this.createCentralSun();
    this.createPlanets();
    this.setupEvents();
    this.animate();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x040610, 0.0018);

    // 2. Camera
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2500);
    this.camera.position.copy(this.defaultCameraPos);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 320;
    this.controls.minDistance = 8;
    this.controls.target.copy(this.defaultTarget);

    // 5. Lights (Warm Sun Light + Soft Cosmic Fill)
    this.ambientLight = new THREE.AmbientLight(0x3a4668, 1.4);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x9ec5ff, 0x1a1033, 0.9);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.PointLight(0xfff1d6, 3.8, 0, 0);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    // Raycaster for mouse interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
  }

  /**
   * 은하수(Milky Way) 나선팔 + 다채로운 성운 띠 + 영롱한 원형 별빛 배경
   */
  createMilkyWayBackground() {
    const starSprite = createStarSpriteTexture();

    // 1. Deep Space Starfield (4,000 stars)
    const starCount = 4000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const starPalette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#bae6fd'),
      new THREE.Color('#ddd6fe'),
      new THREE.Color('#fef08a'),
      new THREE.Color('#fbcfe8')
    ];

    for (let i = 0; i < starCount; i++) {
      const r = 280 + Math.random() * 650;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);

      const c = starPalette[Math.floor(Math.random() * starPalette.length)];
      const brightness = 0.65 + Math.random() * 0.35;
      starColors[i * 3] = c.r * brightness;
      starColors[i * 3 + 1] = c.g * brightness;
      starColors[i * 3 + 2] = c.b * brightness;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.6,
      map: starSprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);

    // 2. Milky Way Spiral Galaxy Dust & Star Band (8,500 colorful points)
    const milkyCount = 8500;
    const milkyGeo = new THREE.BufferGeometry();
    const milkyPos = new Float32Array(milkyCount * 3);
    const milkyColors = new Float32Array(milkyCount * 3);

    const innerColor = new THREE.Color('#f59e0b');  // Warm golden galactic core tint
    const midCyan = new THREE.Color('#38bdf8');     // Cosmic cyan
    const midPink = new THREE.Color('#ec4899');     // Nebula rose-pink
    const outerPurple = new THREE.Color('#6366f1'); // Deep indigo-violet
    const deepViolet = new THREE.Color('#4c1d95');  // Outer galactic dust

    const branches = 4;
    const maxRadius = 280;

    for (let i = 0; i < milkyCount; i++) {
      const t = Math.pow(Math.random(), 0.72);
      const radius = 30 + t * maxRadius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = radius * 0.014;

      const spread = (1 - t * 0.35) * 28;
      const randX = (Math.random() - 0.5) * spread * (Math.random() < 0.5 ? 1 : 1.8);
      const randY = (Math.random() - 0.5) * (10 + t * 24);
      const randZ = (Math.random() - 0.5) * spread * (Math.random() < 0.5 ? 1 : 1.8);

      const angle = branchAngle + spinAngle;
      milkyPos[i * 3] = Math.cos(angle) * radius + randX;
      milkyPos[i * 3 + 1] = randY;
      milkyPos[i * 3 + 2] = Math.sin(angle) * radius + randZ;

      // Blend rich Milky Way hues based on distance and branch
      const color = new THREE.Color();
      if (t < 0.25) {
        color.lerpColors(innerColor, midPink, t / 0.25);
      } else if (t < 0.6) {
        const sub = (t - 0.25) / 0.35;
        color.lerpColors(i % 2 === 0 ? midCyan : midPink, outerPurple, sub);
      } else {
        color.lerpColors(outerPurple, deepViolet, (t - 0.6) / 0.4);
      }

      // Subtle random sparkle variation
      color.offsetHSL((Math.random() - 0.5) * 0.06, 0.08, (Math.random() - 0.5) * 0.12);

      milkyColors[i * 3] = color.r;
      milkyColors[i * 3 + 1] = color.g;
      milkyColors[i * 3 + 2] = color.b;
    }

    milkyGeo.setAttribute('position', new THREE.BufferAttribute(milkyPos, 3));
    milkyGeo.setAttribute('color', new THREE.BufferAttribute(milkyColors, 3));

    const milkyMat = new THREE.PointsMaterial({
      size: 3.4,
      map: starSprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.nebula = new THREE.Points(milkyGeo, milkyMat);
    // Tilt the Milky Way slightly for cinematic depth
    this.nebula.rotation.x = 0.16;
    this.nebula.rotation.z = -0.12;
    this.scene.add(this.nebula);
  }

  /**
   * DANARI CORE - 실제 불타오르는 태양 (Sun)
   */
  createCentralSun() {
    this.sunGroup = new THREE.Group();

    // Sun Surface Core with procedural plasma texture
    const sunTexture = createSunTexture();
    const sunGeo = new THREE.SphereGeometry(7.2, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture
    });
    this.sunCore = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(this.sunCore);

    // Inner Fiery Corona Glow
    const glowGeo = new THREE.SphereGeometry(8.5, 36, 36);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff8c1a,
      transparent: true,
      opacity: 0.42,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sunGlow = new THREE.Mesh(glowGeo, glowMat);
    this.sunGroup.add(this.sunGlow);

    // Outer Solar Flare Halo
    const haloGeo = new THREE.SphereGeometry(10.6, 36, 36);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sunHalo = new THREE.Mesh(haloGeo, haloMat);
    this.sunGroup.add(this.sunHalo);

    // Sun Label
    const sunLabel = this.createLabelSprite("DANARI CORE", "#fde047", 1.3);
    sunLabel.position.set(0, 11.2, 0);
    this.sunGroup.add(sunLabel);

    this.scene.add(this.sunGroup);
  }

  createLabelSprite(text, color = '#ffffff', scale = 1.0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.font = 'bold 28px "Pretendard", "Orbitron", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 10;
    ctx.fillText(text, 256, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(10 * scale, 1.9 * scale, 1);
    return sprite;
  }

  createOrbitLine(radius, colorHex) {
    const segments = 160;
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
      opacity: 0.2,
    });

    const orbit = new THREE.Line(geometry, material);
    this.scene.add(orbit);
    this.orbitLines.push({ mesh: orbit, radius, colorHex });
    return orbit;
  }

  /**
   * 방사형 UV 매핑이 적용된 사실적인 행성 고리(Saturn / Uranus / Kepler)
   */
  createPlanetRing(innerRadius, outerRadius, innerColor, outerColor, tiltX, tiltZ, hasCassiniGap = true) {
    const geo = new THREE.RingGeometry(innerRadius, outerRadius, 96);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const v3 = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const r = v3.length();
      const u = (r - innerRadius) / (outerRadius - innerRadius);
      uv.setXY(i, u, 0.5);
    }

    const ringTex = createPlanetRingTexture(innerColor, outerColor, hasCassiniGap);
    const mat = new THREE.MeshStandardMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      roughness: 0.8,
      metalness: 0.1
    });

    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = tiltX;
    ring.rotation.z = tiltZ;
    return ring;
  }

  createPlanets() {
    this.projects.forEach((proj, idx) => {
      // Orbit Line
      this.createOrbitLine(proj.orbitRadius, proj.color);

      // Load custom image texture if textureUrl is specified, otherwise use realistic procedural solar planet
      let texture;
      if (proj.textureUrl) {
        texture = this.textureLoader.load(proj.textureUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
      } else {
        texture = getPlanetTextureByType(proj.planetType, proj.color, idx + 1);
      }

      // Planet Mesh
      const geometry = new THREE.SphereGeometry(proj.size, 48, 48);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: proj.planetType === 'earth' ? 0.55 : 0.78,
        metalness: 0.08,
        emissive: new THREE.Color(proj.color),
        emissiveIntensity: 0.06
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { project: proj, type: 'planet' };

      // Earth gets a separate animated Cloud Layer + Blue Atmospheric Scattering
      if (proj.planetType === 'earth') {
        const cloudGeo = new THREE.SphereGeometry(proj.size * 1.025, 40, 40);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: createCloudTexture(),
          transparent: true,
          opacity: 0.85,
          roughness: 0.9,
          depthWrite: false
        });
        const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        mesh.add(cloudMesh);
        this.cloudMeshes.push(cloudMesh);
      }

      // Saturn gets iconic golden Cassini rings
      if (proj.planetType === 'saturn') {
        const saturnRing = this.createPlanetRing(
          proj.size * 1.35,
          proj.size * 2.45,
          'rgba(238, 218, 175, 0.92)',
          'rgba(175, 148, 105, 0.72)',
          Math.PI / 2 - 0.42,
          0.18,
          true
        );
        mesh.add(saturnRing);
      }

      // Uranus gets subtle icy tilted rings
      if (proj.planetType === 'uranus') {
        const uranusRing = this.createPlanetRing(
          proj.size * 1.4,
          proj.size * 1.85,
          'rgba(165, 243, 252, 0.55)',
          'rgba(56, 189, 248, 0.3)',
          Math.PI / 2 - 1.15,
          0.3,
          false
        );
        mesh.add(uranusRing);
      }

      // Kepler (Automation Cluster) gets a glowing nebula ring
      if (proj.planetType === 'kepler') {
        const keplerRing = this.createPlanetRing(
          proj.size * 1.32,
          proj.size * 1.9,
          'rgba(236, 72, 153, 0.6)',
          'rgba(168, 85, 247, 0.35)',
          Math.PI / 2 - 0.3,
          -0.2,
          true
        );
        mesh.add(keplerRing);
      }

      // Subtle Atmosphere Glow Rim
      const atmosGeo = new THREE.SphereGeometry(proj.size * 1.12, 32, 32);
      const atmosMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(proj.color),
        transparent: true,
        opacity: proj.planetType === 'earth' ? 0.24 : 0.14,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
      mesh.add(atmosMesh);

      // Planet Label
      const label = this.createLabelSprite(proj.title, '#ffffff', Math.max(0.75, proj.size / 2.6));
      label.position.set(0, proj.size + 2.0, 0);
      mesh.add(label);

      // Satellites (Moons for clusters like shorts automation)
      const subMoons = [];
      if (proj.satellites && proj.satellites.length > 0) {
        const moonTex = getPlanetTextureByType('mercury', '#cbd5e1', 99);
        proj.satellites.forEach((sat, satIdx) => {
          const moonSize = 0.52;
          const moonRadius = proj.size + 3.2 + (satIdx * 0.95);
          const moonSpeed = 0.015 + (satIdx * 0.004);

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
            opacity: 0.22
          }));
          mesh.add(subOrbitLine);

          // Moon mesh with crater texture
          const moonMesh = new THREE.Mesh(
            new THREE.SphereGeometry(moonSize, 20, 20),
            new THREE.MeshStandardMaterial({
              map: moonTex,
              emissive: 0xd946ef,
              emissiveIntensity: 0.18,
              roughness: 0.75
            })
          );
          moonMesh.userData = {
            satellite: sat,
            parentProject: proj,
            type: 'satellite'
          };

          const moonLabel = this.createLabelSprite(sat.name, '#f9a8d4', 0.48);
          moonLabel.position.set(0, moonSize + 0.9, 0);
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
      const initialAngle = (idx / this.projects.length) * Math.PI * 2 + 0.4;
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
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
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

    const targetPos = new THREE.Vector3();
    found.mesh.getWorldPosition(targetPos);

    const offsetDistance = Math.max(12, found.project.size * 5.2);
    const targetCamPos = new THREE.Vector3(
      targetPos.x + offsetDistance * 0.72,
      targetPos.y + offsetDistance * 0.45,
      targetPos.z + offsetDistance * 0.72
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

    // 1. Sun plasma rotation & solar corona pulse
    if (this.sunGroup) {
      this.sunCore.rotation.y += 0.0025;
      const time = performance.now() * 0.002;
      const pulse = 1 + Math.sin(time) * 0.035;
      this.sunGlow.scale.set(pulse, pulse, pulse);
      const outerPulse = 1 + Math.cos(time * 0.8) * 0.05;
      this.sunHalo.scale.set(outerPulse, outerPulse, outerPulse);
    }

    // 2. Milky Way & Deep Space rotation
    if (this.stars) {
      this.stars.rotation.y += 0.0001;
    }
    if (this.nebula) {
      this.nebula.rotation.y += 0.0002;
    }

    // 3. Earth cloud drift
    this.cloudMeshes.forEach(cloud => {
      cloud.rotation.y += 0.004;
    });

    // 4. Planet revolutions & rotations
    this.planetMeshes.forEach(p => {
      p.angle += p.speed * 0.65;
      p.mesh.position.x = Math.cos(p.angle) * p.radius;
      p.mesh.position.z = Math.sin(p.angle) * p.radius;

      // Self rotation
      p.mesh.rotation.y += 0.008;

      // Update Moons / Satellites
      if (p.satellites && p.satellites.length > 0) {
        p.satellites.forEach(m => {
          m.angle += m.speed;
          m.mesh.position.x = Math.cos(m.angle) * m.radius;
          m.mesh.position.z = Math.sin(m.angle) * m.radius;
          m.mesh.rotation.y += 0.02;
        });
      }
    });

    // 5. Tracking mode
    if (this.trackingMode && this.activePlanet) {
      const currentPos = new THREE.Vector3();
      this.activePlanet.mesh.getWorldPosition(currentPos);
      this.controls.target.lerp(currentPos, 0.06);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
