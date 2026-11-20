/**
 * DANARI UNIVERSE - PROJECT DATA
 * 새로운 프로젝트를 추가하려면 이 배열에 객체를 하나 더 추가하기만 하면 됩니다 (요구사항 11번).
 *
 * planetType 옵션:
 * 'mercury' (수성), 'venus' (금성), 'earth' (지구+구름), 'mars' (화성),
 * 'jupiter' (목성), 'saturn' (토성+고리), 'uranus' (천왕성+고리),
 * 'neptune' (해왕성), 'kepler' (성운 가스행성+고리), 'pluto' (명왕성)
 *
 * 커스텀 이미지 사용 시 textureUrl: "/textures/my-planet.jpg" 지정 가능
 */
export const categories = {
  all: { label: "전체 프로젝트", color: "#6366f1" },
  os: { label: "AI Business OS", color: "#38bdf8" },
  web: { label: "Web Platforms", color: "#34d399" },
  finance: { label: "Quant & Web3", color: "#f59e0b" },
  automation: { label: "Automation Agents", color: "#ec4899" },
  commerce: { label: "E-Commerce", color: "#a855f7" }
};

export const projects = [
  {
    id: "solebiz-ai",
    title: "SoleBiz AI (개인사업자 OS)",
    category: "os",
    planetType: "mercury",
    localPath: "D:\\SoleBiz AI (개인사업자 OS)",
    url: null,
    summary: "1인 사업자 및 소상공인을 위한 AI 기반 올인원 비즈니스 운영체제",
    description: "업무 자동화, 고객 관리, 세무/회계 보조, 마케팅 전략 수립 등 개인사업자의 일상 운영 전반을 자율 보조하는 AI 시스템.",
    tags: ["AI OS", "Personal Business", "Automation", "Local"],
    color: "#cbd5e1",
    size: 1.9,
    orbitRadius: 18,
    speed: 0.0075,
    featured: true
  },
  {
    id: "spotreels",
    title: "Spotreels",
    category: "web",
    planetType: "venus",
    localPath: null,
    url: "https://spotreels.co.kr",
    summary: "트렌디한 숏폼/릴스 영상 큐레이션 및 AI 제작 플랫폼",
    description: "트렌드 분석 기반의 숏폼 콘텐츠 기획, 제작 지원 및 성과 분석을 제공하는 웹 서비스.",
    tags: ["Shorts", "Reels", "Web Service", "AI Video"],
    color: "#f59e0b",
    size: 2.1,
    orbitRadius: 26,
    speed: 0.0062,
    featured: true
  },
  {
    id: "danari",
    title: "Danari",
    category: "web",
    planetType: "earth",
    localPath: null,
    url: "https://danari.co.kr",
    summary: "다나리 통합 브랜드 & 비즈니스 포털 허브 (지구)",
    description: "다나리 에코시스템의 핵심 웹 포털. 전 계열 서비스 및 솔루션을 연결하는 메인 관문.",
    tags: ["Main Hub", "Portal", "Brand"],
    color: "#38bdf8",
    size: 2.6,
    orbitRadius: 35,
    speed: 0.005,
    featured: true
  },
  {
    id: "blogfit",
    title: "BlogFit",
    category: "web",
    planetType: "mars",
    localPath: null,
    url: "https://blogfit.co.kr",
    summary: "블로그 수익화 & 맞춤형 SEO 콘텐츠 최적화 솔루션",
    description: "검색엔진 최적화(SEO)와 트래픽 분석을 바탕으로 최적의 블로그 아티클을 자동 생성하고 수익화를 극대화하는 플랫폼.",
    tags: ["SEO", "Blog", "Content AI", "Monetization"],
    color: "#ef4444",
    size: 2.0,
    orbitRadius: 43,
    speed: 0.0044
  },
  {
    id: "gofortuneai",
    title: "GoFortune AI",
    category: "web",
    planetType: "jupiter",
    localPath: null,
    url: "https://gofortuneai.com",
    summary: "글로벌 AI 사주 / 운세 / 점성술 분석 플랫폼",
    description: "동서양 명리학과 생성형 AI를 결합한 글로벌 운세 분석 및 라이프 컨설팅 웹 서비스.",
    tags: ["Fortune AI", "Global", "Horoscope", "SaaS"],
    color: "#d97706",
    size: 3.4,
    orbitRadius: 53,
    speed: 0.0036
  },
  {
    id: "fortuneai-kr",
    title: "Fortune AI Korea",
    category: "web",
    planetType: "saturn",
    localPath: null,
    url: "https://fortuneai.co.kr",
    summary: "국내 맞춤형 AI 사주명리 & 타로 인터랙티브 서비스",
    description: "국내 사용자를 위한 심층 사주풀이, 궁합, 타로 카드 리딩을 제공하는 대화형 AI 서비스.",
    tags: ["사주 AI", "명리학", "타로", "국내서비스"],
    color: "#eab308",
    size: 2.9,
    orbitRadius: 65,
    speed: 0.003
  },
  {
    id: "stock-trading-system",
    title: "주식 자동매매 시스템",
    category: "finance",
    planetType: "uranus",
    localPath: null,
    url: null,
    summary: "실시간 알고리즘 퀀트 트레이딩 & 자동 주문 엔진",
    description: "주가 데이터 실시간 수집, 기술적/정량적 지표 분석, 리스크 관리 룰 기반 자동 분할 매수/매도 집행 시스템.",
    tags: ["Quant", "Stock Trading", "Algorithm", "Finance"],
    color: "#22d3ee",
    size: 2.4,
    orbitRadius: 76,
    speed: 0.0025
  },
  {
    id: "token-economy",
    title: "자체 발행 코인 (Token Economy)",
    category: "finance",
    planetType: "neptune",
    localPath: null,
    url: null,
    summary: "에코시스템 보상 및 거버넌스를 위한 Web3 토큰",
    description: "Danari 생태계 내 다양한 서비스 및 자동화 에이전트 간의 가치 교환과 인센티브 설계를 위한 블록체인 스마트 컨트랙트 및 토큰 이코노미.",
    tags: ["Web3", "Crypto", "Smart Contract", "Tokenomics"],
    color: "#3b82f6",
    size: 2.4,
    orbitRadius: 85,
    speed: 0.0021
  },
  {
    id: "shorts-automation-cluster",
    title: "쇼츠 영상 & 마케팅 자동화 클러스터",
    category: "automation",
    planetType: "kepler",
    localPath: null,
    url: null,
    summary: "다중 채널 유튜브 쇼츠, 스레드, 티스토리 옴니채널 자동 발행 시스템",
    description: "기획부터 스크립트 작성, 음성/영상 합성, 썸네일 생성 및 다채널(유튜브, 스레드, 블로그) 예약 업로드까지 전 과정을 무인화한 에이전트 군집.",
    tags: ["Video Agent", "Multi-Agent", "YouTube", "Threads", "Automation"],
    color: "#d946ef",
    size: 2.8,
    orbitRadius: 96,
    speed: 0.0017,
    featured: true,
    // 행성 주위를 도는 위성(Sub-agents/Moons)
    satellites: [
      { name: "YouTube Agent", path: "D:\\YouTube Agent", desc: "유튜브 쇼츠 자동 생성/업로드" },
      { name: "Scientific Knowledge", path: "D:\\Scientific Knowledge", desc: "과학/지식 쇼츠 특화 채널" },
      { name: "Ars Sapiens", path: "D:\\Ars Sapiens", desc: "인문/철학/예술 지식 에이전트" },
      { name: "Marketing Agent", path: "D:\\marketing", desc: "마케팅 소재 및 카피 자동 생성" },
      { name: "스레드 자동화", path: null, desc: "Threads 텍스트/카드뉴스 자동 발행" },
      { name: "TossShare", path: "D:\\TossShare", desc: "콘텐츠 공유 및 바이럴 엔진" },
      { name: "AI Business OS Local", path: "D:\\AI Business OS Local", desc: "로컬 AI 비즈니스 파이프라인 제어기" },
      { name: "fortuneai-Tstory", path: "D:\\fortuneai-Tstory", desc: "티스토리 운세 블로그 자동 포스팅" }
    ]
  },
  {
    id: "shopping-detail",
    title: "Shopping Detail",
    category: "commerce",
    planetType: "pluto",
    localPath: "D:\\Shopping Detail",
    url: null,
    summary: "이커머스 상세페이지 자동 기획 & 디자인 생성 엔진",
    description: "상품 데이터와 타깃 고객 분석을 기반으로 설득력 있는 구매 전환 상세페이지 카피와 비주얼 레이아웃을 생성하는 커머스 솔루션.",
    tags: ["E-Commerce", "Detail Page", "Design AI", "Conversion"],
    color: "#d6b8a0",
    size: 1.8,
    orbitRadius: 108,
    speed: 0.0013
  }
];
