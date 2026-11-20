import * as THREE from 'three';

/**
 * Seeded fast 2D Value Noise & FBM (Fractal Brownian Motion)
 * 외부 이미지 의존성 없이 실제 위성 사진급 행성 텍스처를 100% 로컬에서 생성
 */
function createNoise(seed = 1) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);

  function hash(x, y) {
    return perm[(perm[x & 255] + (y & 255)) & 255] / 255;
  }

  function noise2D(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = fade(xf);
    const v = fade(yf);

    const aa = hash(xi, yi);
    const ba = hash(xi + 1, yi);
    const ab = hash(xi, yi + 1);
    const bb = hash(xi + 1, yi + 1);

    return lerp(lerp(aa, ba, u), lerp(ab, bb, u), v);
  }

  // Seamless horizontally wrapped noise for spheres
  function sphereNoise(u, v, scale = 4, octaves = 5) {
    let val = 0;
    let amp = 0.5;
    let freq = scale;
    let maxVal = 0;
    for (let o = 0; o < octaves; o++) {
      // Wrap horizontally using sin/cos mapping onto a cylinder
      const angle = u * Math.PI * 2;
      const nx = Math.cos(angle) * (freq / (Math.PI * 2)) + 10;
      const ny = Math.sin(angle) * (freq / (Math.PI * 2)) + 10;
      const nz = v * freq + o * 17.3;
      const n1 = noise2D(nx * 2.5 + nz * 0.7, ny * 2.5 - nz * 0.7);
      const n2 = noise2D(nx * 2.5 - nz * 0.5, ny * 2.5 + nz * 1.1);
      val += ((n1 + n2) * 0.5) * amp;
      maxVal += amp;
      amp *= 0.5;
      freq *= 2.05;
    }
    return val / maxVal;
  }

  return { noise2D, sphereNoise };
}

function makeCanvas(w = 512, h = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

function finalizeTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 1. 태양 (DANARI CORE) - 불타오르는 플라즈마 & 흑점 텍스처
 */
export function createSunTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(101);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const n1 = sphereNoise(u, v, 8, 5);
      const n2 = sphereNoise(u + n1 * 0.15, v + n1 * 0.15, 16, 4);
      const heat = Math.min(1, Math.max(0, n1 * 0.55 + n2 * 0.55));

      let r, g, b;
      if (heat < 0.35) {
        // Sunspot / dark fiery orange-red
        const t = heat / 0.35;
        r = 180 + t * 75;
        g = 35 + t * 75;
        b = 5 + t * 15;
      } else if (heat < 0.72) {
        // Bright solar orange-yellow
        const t = (heat - 0.35) / 0.37;
        r = 255;
        g = 110 + t * 115;
        b = 20 + t * 70;
      } else {
        // White-hot plasma core
        const t = (heat - 0.72) / 0.28;
        r = 255;
        g = 225 + t * 30;
        b = 90 + t * 140;
      }

      const idx = (y * 512 + x) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 2. 지구 (Earth) - 대륙, 바다, 사막, 만년설
 */
export function createEarthTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(42);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    const lat = Math.abs(v - 0.5) * 2; // 0 at equator, 1 at poles
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const elev = sphereNoise(u, v, 5, 6);
      const moisture = sphereNoise(u + 0.3, v + 0.2, 7, 4);

      let r, g, b;
      // Polar ice caps
      if (lat > 0.82 + (elev - 0.5) * 0.18) {
        r = 235; g = 244; b = 252;
      } else if (elev < 0.50) {
        // Ocean (deep to shallow cyan-blue)
        const depth = elev / 0.50;
        r = 8 + depth * 24;
        g = 32 + depth * 95;
        b = 95 + depth * 105;
      } else if (elev < 0.53) {
        // Coastal beach / sandy shore
        r = 194; g = 182; b = 134;
      } else if (elev < 0.74) {
        // Land: lush forest to arid desert
        const arid = Math.max(0, 1 - moisture * 1.4) * (1 - lat * 0.7);
        r = 38 + arid * 165;
        g = 115 + arid * 60 - (elev - 0.53) * 80;
        b = 45 + arid * 55;
      } else {
        // Mountains & snowy peaks
        const peak = Math.min(1, (elev - 0.74) / 0.16);
        r = 110 + peak * 135;
        g = 105 + peak * 140;
        b = 100 + peak * 145;
      }

      const idx = (y * 512 + x) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 지구 구름 레이어 (반투명)
 */
export function createCloudTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(777);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const n = sphereNoise(u, v, 6, 5);
      const alpha = n > 0.53 ? Math.min(220, ((n - 0.53) / 0.25) * 230) : 0;
      const idx = (y * 512 + x) * 4;
      img.data[idx] = 255;
      img.data[idx + 1] = 255;
      img.data[idx + 2] = 255;
      img.data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 3. 화성 (Mars) - 붉은 산화철 사막, 어두운 현무암 지대, 극관
 */
export function createMarsTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(303);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    const lat = Math.abs(v - 0.5) * 2;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const n = sphereNoise(u, v, 6, 6);
      const detail = sphereNoise(u, v, 18, 3);

      let r, g, b;
      if (lat > 0.89 + (n - 0.5) * 0.1) {
        r = 235; g = 228; b = 224; // Polar ice cap
      } else {
        const darkPatch = n < 0.44 ? (0.44 - n) * 2.2 : 0;
        r = 198 + (detail - 0.5) * 40 - darkPatch * 95;
        g = 86 + (detail - 0.5) * 30 - darkPatch * 48;
        b = 52 + (detail - 0.5) * 20 - darkPatch * 25;
      }

      const idx = (y * 512 + x) * 4;
      img.data[idx] = Math.max(0, Math.min(255, r));
      img.data[idx + 1] = Math.max(0, Math.min(255, g));
      img.data[idx + 2] = Math.max(0, Math.min(255, b));
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 4. 수성 (Mercury) - 회갈색 암석 & 운석 충돌 크레이터
 */
export function createMercuryTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(12);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const n = sphereNoise(u, v, 8, 5);
      const base = 115 + (n - 0.5) * 85;
      const idx = (y * 512 + x) * 4;
      img.data[idx] = base + 8;
      img.data[idx + 1] = base + 2;
      img.data[idx + 2] = base - 5;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Draw crisp craters
  for (let i = 0; i < 65; i++) {
    const cx = Math.random() * 512;
    const cy = 20 + Math.random() * 216;
    const r = 3 + Math.random() * 14;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(55, 50, 48, 0.35)';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(210, 200, 190, 0.35)';
    ctx.stroke();
  }
  return finalizeTexture(canvas);
}

/**
 * 5. 금성 (Venus) - 황금빛 두꺼운 구름 소용돌이
 */
export function createVenusTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(204);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const warp = sphereNoise(u, v, 4, 4) * 0.25;
      const bands = Math.sin((v + warp) * Math.PI * 8) * 0.5 + 0.5;
      const swirl = sphereNoise(u + warp, v, 7, 4);
      const m = bands * 0.5 + swirl * 0.5;

      const idx = (y * 512 + x) * 4;
      img.data[idx] = 200 + m * 50;
      img.data[idx + 1] = 152 + m * 68;
      img.data[idx + 2] = 72 + m * 62;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 6. 목성 (Jupiter) - 다채로운 가스 띠 & 대적점 (Great Red Spot)
 */
export function createJupiterTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(555);

  const palette = [
    [225, 205, 178],
    [196, 134, 88],
    [238, 222, 198],
    [172, 102, 65],
    [214, 176, 135],
    [150, 92, 66],
    [232, 214, 188]
  ];

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const turb = (sphereNoise(u, v, 10, 5) - 0.5) * 0.08;
      const bandPos = Math.abs((v + turb) * (palette.length - 1)) % (palette.length - 1);
      const i0 = Math.floor(bandPos);
      const i1 = (i0 + 1) % palette.length;
      const f = bandPos - i0;

      let r = palette[i0][0] * (1 - f) + palette[i1][0] * f;
      let g = palette[i0][1] * (1 - f) + palette[i1][1] * f;
      let b = palette[i0][2] * (1 - f) + palette[i1][2] * f;

      // Great Red Spot (around u=0.35, v=0.62)
      const dx = (u - 0.35) / 0.065;
      const dy = (v - 0.62) / 0.048;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.0) {
        const spotMix = Math.pow(1 - dist, 0.7);
        r = r * (1 - spotMix) + 212 * spotMix;
        g = g * (1 - spotMix) + 72 * spotMix;
        b = b * (1 - spotMix) + 46 * spotMix;
      }

      const idx = (y * 512 + x) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 7. 토성 (Saturn) - 우아한 크림/골드 가스 띠
 */
export function createSaturnTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(606);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const turb = (sphereNoise(u, v, 8, 4) - 0.5) * 0.03;
      const band = Math.sin((v + turb) * Math.PI * 14) * 0.5 + 0.5;
      const latDark = 1 - Math.pow(Math.abs(v - 0.5) * 2, 2) * 0.25;

      const idx = (y * 512 + x) * 4;
      img.data[idx] = (205 + band * 35) * latDark;
      img.data[idx + 1] = (182 + band * 35) * latDark;
      img.data[idx + 2] = (132 + band * 30) * latDark;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 토성 / 천왕성용 동심원 행성 고리 텍스처 (카시니 간극 포함)
 */
export function createPlanetRingTexture(innerColor = '#e6d2a2', outerColor = '#b09872', hasCassiniGap = true) {
  const { canvas, ctx } = makeCanvas(512, 64);
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.08, innerColor);
  grad.addColorStop(0.45, outerColor);
  if (hasCassiniGap) {
    grad.addColorStop(0.56, 'rgba(0,0,0,0.08)'); // Cassini division
    grad.addColorStop(0.62, 'rgba(0,0,0,0.08)');
  }
  grad.addColorStop(0.66, innerColor);
  grad.addColorStop(0.92, outerColor);
  grad.addColorStop(1.0, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 64);

  // Fine ringlets
  for (let i = 0; i < 60; i++) {
    const rx = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.22)';
    ctx.fillRect(rx, 0, 1 + Math.random() * 3, 64);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 8. 천왕성 (Uranus) - 청록빛 얼음 거인
 */
export function createUranusTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(707);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const n = sphereNoise(u, v, 5, 3);
      const band = Math.sin(v * Math.PI * 6) * 0.1 + 0.9;
      const idx = (y * 512 + x) * 4;
      img.data[idx] = (120 + n * 45) * band;
      img.data[idx + 1] = (218 + n * 30) * band;
      img.data[idx + 2] = (228 + n * 24) * band;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 9. 해왕성 (Neptune) - 깊은 코발트 블루 & 메탄 폭풍 줄무늬
 */
export function createNeptuneTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(808);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const turb = (sphereNoise(u, v, 9, 4) - 0.5) * 0.06;
      const band = Math.sin((v + turb) * Math.PI * 12) * 0.5 + 0.5;
      const streak = sphereNoise(u * 2, v, 12, 3);

      let r = 34 + band * 24 + (streak > 0.72 ? 90 : 0);
      let g = 75 + band * 52 + (streak > 0.72 ? 105 : 0);
      let b = 195 + band * 55;

      // Great Dark Spot
      const dx = (u - 0.62) / 0.055;
      const dy = (v - 0.56) / 0.04;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        const m = 1 - dist;
        r *= (1 - m * 0.55);
        g *= (1 - m * 0.55);
        b *= (1 - m * 0.35);
      }

      const idx = (y * 512 + x) * 4;
      img.data[idx] = Math.min(255, r);
      img.data[idx + 1] = Math.min(255, g);
      img.data[idx + 2] = Math.min(255, b);
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 10. 외계 성운 가스행성 (Kepler / Automation Cluster용) - 마젠타/보라/시안 가스 거인
 */
export function createKeplerTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(909);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const turb = (sphereNoise(u, v, 8, 5) - 0.5) * 0.14;
      const band = Math.sin((v + turb) * Math.PI * 10) * 0.5 + 0.5;
      const glow = sphereNoise(u + turb, v, 12, 4);

      const idx = (y * 512 + x) * 4;
      img.data[idx] = 110 + band * 125 + glow * 20;
      img.data[idx + 1] = 40 + (1 - band) * 90 + glow * 45;
      img.data[idx + 2] = 185 + band * 65;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 11. 명왕성 (Pluto) - 얼음 평원과 적갈색 지형
 */
export function createPlutoTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const img = ctx.createImageData(512, 256);
  const { sphereNoise } = createNoise(1010);

  for (let y = 0; y < 256; y++) {
    const v = y / 256;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const n = sphereNoise(u, v, 6, 5);
      let r = 175 + (n - 0.5) * 75;
      let g = 148 + (n - 0.5) * 70;
      let b = 132 + (n - 0.5) * 65;

      // Bright nitrogen ice plain (Tombaugh Regio feel)
      const dx = (u - 0.5) / 0.12;
      const dy = (v - 0.52) / 0.14;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        const ice = Math.pow(1 - dist, 0.8);
        r = r * (1 - ice) + 238 * ice;
        g = g * (1 - ice) + 228 * ice;
        b = b * (1 - ice) + 215 * ice;
      }

      const idx = (y * 512 + x) * 4;
      img.data[idx] = Math.min(255, r);
      img.data[idx + 1] = Math.min(255, g);
      img.data[idx + 2] = Math.min(255, b);
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalizeTexture(canvas);
}

/**
 * 부드러운 원형 별빛/은하수 파티클 스프라이트
 */
export function createStarSpriteTexture() {
  const { canvas, ctx } = makeCanvas(64, 64);
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.55, 'rgba(180, 210, 255, 0.3)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 행성 타입별 텍스처 매핑 팩토리
 */
export function getPlanetTextureByType(planetType, fallbackColor = '#38bdf8', seed = 1) {
  switch (planetType) {
    case 'earth': return createEarthTexture();
    case 'mercury': return createMercuryTexture();
    case 'venus': return createVenusTexture();
    case 'mars': return createMarsTexture();
    case 'jupiter': return createJupiterTexture();
    case 'saturn': return createSaturnTexture();
    case 'uranus': return createUranusTexture();
    case 'neptune': return createNeptuneTexture();
    case 'kepler': return createKeplerTexture();
    case 'pluto': return createPlutoTexture();
    default: {
      // Newly added custom projects automatically get a rich procedural planet
      const types = ['earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'venus', 'mercury'];
      return getPlanetTextureByType(types[seed % types.length], fallbackColor, seed + 1);
    }
  }
}

