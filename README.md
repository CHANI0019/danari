# DANARI UNIVERSE 🌌

Three.js 기반의 3D 우주 성계(Solar System) 인터랙티브 프로젝트 허브 & 포트폴리오 웹사이트입니다.  
GitHub Pages에서 무료로 자동 빌드 및 호스팅되도록 구성되어 있습니다.

---

## 🌟 주요 특징

1. **3D 우주 성계 (Solar System) 렌더링**:
   - 중심 항성(DANARI CORE)을 축으로 회전하는 프로젝트 행성 및 서브 에이전트 위성들.
   - 절차적 텍스처(Procedural Texture), 별무리(Starfield), 성운(Nebula Dust), 네온 궤도선.
2. **부드러운 인터랙션 (GSAP & Three.js Raycaster)**:
   - 마우스 드래그 3D 궤도 회전 / 줌 / 팬.
   - 행성 클릭 시 카메라 부드러운 줌인(Fly-to) 및 행성 궤도 추적(Tracking Mode).
   - 호버 시 글로우 효과 및 정보 툴팁.
3. **사이버 글래스모피즘 HUD UI**:
   - 상단 카테고리 필터 (AI OS, Web Platform, Quant/Web3, Automation, Commerce).
   - 실시간 검색이 가능한 좌측 프로젝트 탐색기 (Explorer).
   - 우측 프로젝트 상세 카드 (웹 링크, 로컬 경로 클립보드 복사, 서브 파이프라인 목록 등).
4. **쉬운 프로젝트 확장성 (11번 요구사항)**:
   - 3D 코드를 건드릴 필요 없이 `src/data/projects.js` 배열에 항목만 추가하면 3D 행성이 자동으로 스폰됩니다.

---

## 📁 새 프로젝트 추가 방법 (`src/data/projects.js`)

`src/data/projects.js` 파일의 `projects` 배열에 아래 형식으로 객체를 추가하면 3D 우주에 자동으로 새 행성이 생성됩니다:

```javascript
{
  id: "my-new-service",
  title: "신규 프로젝트명",
  category: "web", // 'os', 'web', 'finance', 'automation', 'commerce' 중 선택
  localPath: "D:\\MyProject", // 로컬 폴더 경로 (없으면 null)
  url: "https://example.com", // 웹사이트 주소 (없으면 null)
  summary: "한 줄 요약 설명",
  description: "상세 시스템 및 기능 설명...",
  tags: ["AI", "Automation", "SaaS"],
  color: "#38bdf8", // 행성 테마 색상 (Hex)
  size: 2.0,        // 행성 크기 (1.5 ~ 2.8 권장)
  orbitRadius: 98,  // 공전 궤도 반경 (기존 행성들과 겹치지 않게 7~10 단위 증가)
  speed: 0.0015     // 공전 속도
}
```

---

## 🚀 로컬 실행 방법

```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

---

## 🌐 GitHub Pages 배포 방법

1. GitHub에 새 저장소(예: `danari_net` 또는 `danari.github.io`)를 생성합니다.
2. 로컬 저장소를 원격 저장소에 연결하고 푸시합니다:
   ```bash
   git init
   git add .
   git commit -m "feat: DANARI UNIVERSE 3D Solar System Hub"
   git branch -M main
   git remote add origin https://github.com/사용자계정/저장소이름.git
   git push -u origin main
   ```
3. GitHub 저장소의 **Settings** -> **Pages** 로 이동:
   - **Source** 항목을 `GitHub Actions`로 선택합니다.
4. 푸시 즉시 `.github/workflows/deploy.yml` 액션이 자동으로 실행되어 정적 빌드 및 배포가 완료됩니다!

