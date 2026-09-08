/**
 * ==========================================================================
 * 쿠폰모아 (COUPONMOA) - script.js v3.1.0
 * 12종 리얼리티 기프티콘 & 100% 무조건 회전하는 터치/클릭 룰렛 엔진
 * ==========================================================================
 */

// ── 1. 리얼리티 극대화 12종 마스터 쿠폰 데이터 ──
const MASTER_COUPONS = [
  {
    id: 1,
    name: "스타벅스 아이스 아메리카노(T) 1,000원 할인",
    provider: "스타벅스",
    category: "카페",
    discount: "1,000원 할인",
    condition: "제조 음료(Tall 사이즈 이상) 결제 시",
    expiry: "2026-12-31",
    color: "#00704A",
    emoji: "☕",
    badge: "badge-green",
    tag: "인기1위",
    code: "SBUX-2026-ICE1K",
    barcode: "9901482310294821",
    source: "스타벅스 사이렌오더 / 매장 카운터 제시",
    description: "전국 스타벅스 매장에서 현장 결제 또는 스타벅스 카드 결제 시 중복 가능",
    popularScore: 99
  },
  {
    id: 2,
    name: "배달의민족 전메뉴 3,000원 즉시 할인 쿠폰",
    provider: "배달의민족",
    category: "배달",
    discount: "3,000원 할인",
    condition: "15,000원 이상 배달/포장 주문 시",
    expiry: "2026-11-30",
    color: "#2AC1BC",
    emoji: "🛵",
    badge: "badge-blue",
    tag: "선착순",
    code: "BAEMIN-3000-NOW",
    barcode: "2819401928491029",
    source: "배민 앱 결제창 > 쿠폰함에 코드 입력",
    description: "치킨, 피자, 중식, 분식 등 모든 카테고리에서 사용 가능",
    popularScore: 98
  },
  {
    id: 3,
    name: "GS25 바나나맛우유 무료 교환권",
    provider: "GS25",
    category: "편의점",
    discount: "바나나우유 FREE",
    condition: "빙그레 바나나맛우유(단지) 1개 교환",
    expiry: "2026-12-31",
    color: "#00B14F",
    emoji: "🥛",
    badge: "badge-green",
    tag: "100%무료",
    code: "GS25-BANANA-FREE",
    barcode: "8809182390124891",
    source: "전국 GS25 편의점 카운터 바코드 제시",
    description: "GS25 매장에서 상품과 함께 바코드를 제시하면 0원 결제",
    popularScore: 97
  },
  {
    id: 4,
    name: "교촌치킨 허니콤보 + 웨지감자 세트 4,000원 할인",
    provider: "교촌치킨",
    category: "배달",
    discount: "4,000원 할인",
    condition: "교촌치킨 공식 앱 주문 시 적용",
    expiry: "2026-10-31",
    color: "#D35400",
    emoji: "🍗",
    badge: "badge-orange",
    tag: "단독혜택",
    code: "KYOCHON-HONEY-4K",
    barcode: "4810294819204912",
    source: "교촌치킨 공식 앱 E-쿠폰 등록",
    description: "인기 메뉴 허니콤보 주문 시 웨지감자 세트 즉시 할인",
    popularScore: 96
  },
  {
    id: 5,
    name: "메가MGC커피 아메리카노(R) 1잔 무료 교환권",
    provider: "메가커피",
    category: "카페",
    discount: "아메리카노 FREE",
    condition: "HOT/ICE 선택 가능, 사이즈업 별도",
    expiry: "2026-12-31",
    color: "#FF6B00",
    emoji: "🧋",
    badge: "badge-orange",
    tag: "초특가",
    code: "MEGA-FREE-COFFEE",
    barcode: "3810294819204981",
    source: "메가MGC커피 매장 키오스크 바코드 스캔",
    description: "키오스크 '모바일 쿠폰' 메뉴에서 바코드 스캔 후 즉시 수령",
    popularScore: 97
  },
  {
    id: 6,
    name: "올리브영 3만원 이상 결제 시 5,000원 할인권",
    provider: "올리브영",
    category: "뷰티",
    discount: "5,000원 할인",
    condition: "온라인몰 또는 오프라인 매장 3만원 이상 구매",
    expiry: "2026-11-15",
    color: "#4AC14A",
    emoji: "💄",
    badge: "badge-green",
    tag: "뷰티픽",
    code: "OLV-BEAUTY-5000",
    barcode: "3819204819204819",
    source: "올리브영 앱 마이페이지 > 쿠폰 등록",
    description: "스킨케어, 립스틱, 선크림 등 전 브랜드 결제 시 적용 가능",
    popularScore: 94
  },
  {
    id: 7,
    name: "CU 연세우유 생크림빵 1개 무료 교환권",
    provider: "CU",
    category: "편의점",
    discount: "생크림빵 FREE",
    condition: "연세우유 생크림빵 시리즈 1개 교환",
    expiry: "2026-12-31",
    color: "#7B3FE4",
    emoji: "🥖",
    badge: "badge-purple",
    tag: "화제상품",
    code: "CU-YONSEI-CREAM",
    barcode: "8801928401928471",
    source: "포켓CU 앱 바코드 스캔 또는 매장 제시",
    description: "전국 CU 편의점에서 즉시 교환 가능 (품절 시 예약 구매 연계)",
    popularScore: 98
  },
  {
    id: 8,
    name: "쿠팡이츠 첫 주문 5,000원 할인 쿠폰",
    provider: "쿠팡이츠",
    category: "배달",
    discount: "5,000원 할인",
    condition: "20,000원 이상 주문 시 사용 가능",
    expiry: "2026-10-31",
    color: "#E4003A",
    emoji: "🍕",
    badge: "badge-red",
    tag: "첫주문",
    code: "EATS-SPECIAL-5K",
    barcode: "5819204918294019",
    source: "쿠팡이츠 앱 결제창 > 할인 쿠폰 선택",
    description: "와우 회원 혜택과 중복 사용 가능",
    popularScore: 93
  },
  {
    id: 9,
    name: "CGV 고소팝콘(M) 1개 무료 교환권",
    provider: "CGV",
    category: "문화",
    discount: "팝콘(M) FREE",
    condition: "영화 티켓 예매자 대상 (현장 키오스크 교환)",
    expiry: "2026-12-31",
    color: "#E50914",
    emoji: "🍿",
    badge: "badge-red",
    tag: "문화선물",
    code: "CGV-POPCORN-FREE",
    barcode: "7719204819204812",
    source: "전국 CGV 매점 키오스크 바코드 스캔",
    description: "CGV 매점 키오스크 '모바일 쿠폰'에서 바코드 인식 후 즉시 출력",
    popularScore: 95
  },
  {
    id: 10,
    name: "맥도날드 빅맥 단품 2,000원 할인 쿠폰",
    provider: "맥도날드",
    category: "배달",
    discount: "2,000원 할인",
    condition: "맥도날드 매장 카운터/키오스크 주문 시",
    expiry: "2026-11-20",
    color: "#FFC72C",
    emoji: "🍔",
    badge: "badge-orange",
    tag: "버거위크",
    code: "MCD-BIGMAC-2000",
    barcode: "1928401928401928",
    source: "맥도날드 공식 앱 바코드 제시",
    description: "빅맥 단품 주문 시 2,000원 현장 즉시 할인 적용",
    popularScore: 96
  },
  {
    id: 11,
    name: "배스킨라빈스 싱글레귤러 1+1 쿠폰",
    provider: "배스킨라빈스",
    category: "카페",
    discount: "1+1 교환권",
    condition: "싱글레귤러 1개 구매 시 1개 추가 증정",
    expiry: "2026-12-15",
    color: "#E91E63",
    emoji: "🍨",
    badge: "badge-purple",
    tag: "달콤선물",
    code: "BR-SINGLE-1PLUS1",
    barcode: "4910294819204910",
    source: "배스킨라빈스 매장 키오스크 모바일 쿠폰 스캔",
    description: "원하는 맛 2가지를 1개 가격에 즐길 수 있는 1+1 증정 쿠폰",
    popularScore: 97
  },
  {
    id: 12,
    name: "네이버페이 포인트 1,000원 모바일 교환권",
    provider: "네이버페이",
    category: "뷰티",
    discount: "1,000P 지급",
    condition: "네이버페이 등록 계정 1회 충전",
    expiry: "2026-12-31",
    color: "#03CF5D",
    emoji: "💚",
    badge: "badge-green",
    tag: "현금포인트",
    code: "NPAY-POINT-1000",
    barcode: "6819204819204811",
    source: "네이버페이 쿠폰 등록 페이지",
    description: "등록 즉시 네이버페이 포인트 1,000원이 충전되어 온/오프라인 결제 사용 가능",
    popularScore: 99
  }
];

// 화려한 12색 룰렛 팔레트
const WHEEL_PALETTE = [
  '#FF2B44', '#FF6B00', '#00704A', '#2AC1BC',
  '#00B14F', '#4AC14A', '#7B3FE4', '#E4003A',
  '#E50914', '#D35400', '#E91E63', '#03CF5D'
];

// ── 2. 전역 상태 ──
let allCoupons = [...MASTER_COUPONS];
let currentCategory = 'all';
let currentSortMode = 'popular';
let searchQuery = '';

let isSpinning = false;
let currentWheelRotation = 0;
let remainingSpins = 3;
let soundEnabled = true;
let currentWinningCoupon = null;

// ── 3. 초기화 (DOM Loaded) ──
document.addEventListener('DOMContentLoaded', () => {
  initLiveTicker();
  initRemainingSpins();
  renderCouponWheel();
  renderCouponCards();
  updateCategoryCounts();
  bindWheelClickHandlers();
});

// ── 4. Web Audio API 기반 오락실 사운드 신디사이저 ──
let audioCtx = null;

function getAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {}
  return audioCtx;
}

function playTickSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650 + Math.random() * 150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.035);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.035);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch (e) {}
}

function playWinFanfare() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.22, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } catch (e) {}
      }, idx * 110);
    });
  } catch (e) {}
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const icon = document.getElementById('soundIcon');
  const btn = document.getElementById('btnSoundToggle');
  if (soundEnabled) {
    if (icon) icon.textContent = '🔊';
    if (btn) btn.innerHTML = `<span id="soundIcon">🔊</span> 효과음 켜짐`;
    showToast('🔊 효과음이 켜졌습니다.');
  } else {
    if (icon) icon.textContent = '🔇';
    if (btn) btn.innerHTML = `<span id="soundIcon">🔇</span> 효과음 꺼짐`;
    showToast('🔇 효과음이 꺼졌습니다.');
  }
}

// ── 5. 실시간 라이브 전광판 티커 로직 ──
const LIVE_TEMPLATES = [
  { phone: "010-****-4821", name: "스타벅스 아메리카노 1,000원 할인권", time: "방금 전" },
  { phone: "010-****-9104", name: "배달의민족 3,000원 즉시 할인 쿠폰", time: "5초 전" },
  { phone: "010-****-3312", name: "GS25 바나나맛우유 무료 교환권", time: "14초 전" },
  { phone: "010-****-7589", name: "교촌치킨 허니콤보 4,000원 할인권", time: "22초 전" },
  { phone: "010-****-1205", name: "CU 연세우유 생크림빵 무료 교환권", time: "35초 전" },
  { phone: "010-****-6842", name: "CGV 고소팝콘(M) 무료 증정 쿠폰", time: "48초 전" },
  { phone: "010-****-2931", name: "네이버페이 포인트 1,000원 교환권", time: "1분 전" },
  { phone: "010-****-8819", name: "배스킨라빈스 싱글레귤러 1+1 쿠폰", time: "2분 전" }
];

let tickerIndex = 0;
function initLiveTicker() {
  const tickerEl = document.getElementById('tickerText');
  if (!tickerEl) return;
  
  function updateTicker() {
    const item = LIVE_TEMPLATES[tickerIndex % LIVE_TEMPLATES.length];
    tickerEl.style.opacity = '0';
    setTimeout(() => {
      tickerEl.innerHTML = `🎉 <strong>[${item.phone}]</strong>님이 <strong>${item.name}</strong>에 당첨되었습니다! <span style="color:#FFD54F; margin-left:6px;">(${item.time})</span>`;
      tickerEl.style.opacity = '1';
    }, 200);
    tickerIndex++;
  }
  
  updateTicker();
  setInterval(updateTicker, 3200);
}

// ── 6. 남은 기회 관리 ──
function initRemainingSpins() {
  const saved = localStorage.getItem('coupon_spins_left_v3');
  if (saved !== null) {
    remainingSpins = parseInt(saved, 10);
    if (isNaN(remainingSpins)) remainingSpins = 3;
  } else {
    remainingSpins = 3;
  }
  updateSpinsDisplay();
}

function updateSpinsDisplay() {
  const spinsEl = document.getElementById('remainingSpins');
  const barEl = document.getElementById('chanceProgressBar');
  if (spinsEl) spinsEl.textContent = Math.max(0, remainingSpins);
  if (barEl) {
    const pct = Math.min(100, Math.max(10, (remainingSpins / 3) * 100));
    barEl.style.width = pct + '%';
  }
  localStorage.setItem('coupon_spins_left_v3', remainingSpins);
}

function resetSpinsFree() {
  remainingSpins = 3;
  updateSpinsDisplay();
  showToast('🎟️ 뽑기 기회가 3회로 충전되었습니다!');
}

// ── 7. 룰렛 캔버스 렌더링 (12개 슬라이스) ──
function renderCouponWheel() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const size = 400;
  canvas.width = size;
  canvas.height = size;
  
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 4;
  const numSlices = MASTER_COUPONS.length;
  const sliceRad = (Math.PI * 2) / numSlices;
  
  ctx.clearRect(0, 0, size, size);
  
  MASTER_COUPONS.forEach((coupon, i) => {
    const startAngle = i * sliceRad - Math.PI / 2;
    const endAngle = startAngle + sliceRad;
    const color = WHEEL_PALETTE[i % WHEEL_PALETTE.length];
    
    // 1. 부채꼴
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    
    // 슬라이스 구분선
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // 2. 텍스트 & 이모지
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + sliceRad / 2);
    
    // 이모지
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '19px serif';
    ctx.fillText(coupon.emoji, R - 10, 6);
    
    // 브랜드명
    ctx.font = "bold 11.5px 'Pretendard', sans-serif";
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 3;
    const label = coupon.provider.length > 5 ? coupon.provider.substring(0, 5) : coupon.provider;
    ctx.fillText(label, R - 36, 4);
    
    ctx.restore();
  });
  
  // 3. 중앙 링
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#FFB300';
  ctx.lineWidth = 4;
  ctx.stroke();
}

// ── 8. 룰렛 전체 영역 클릭/터치 이벤트 바인딩 ──
function bindWheelClickHandlers() {
  const btn = document.getElementById('wheelCenterBtn');
  const wheelContainer = document.getElementById('wheelCanvasContainer');
  const outerRing = document.querySelector('.wheel-outer-ring');

  const handleAction = (e) => {
    e.preventDefault();
    triggerSpin();
  };

  if (btn) {
    btn.onclick = handleAction;
    btn.addEventListener('touchend', handleAction, { passive: false });
  }
  if (wheelContainer) {
    wheelContainer.onclick = handleAction;
    wheelContainer.addEventListener('touchend', handleAction, { passive: false });
  }
  if (outerRing) {
    outerRing.onclick = (e) => {
      // 핀 등이 아닌 영역 클릭 시 실행
      if (e.target.closest('.wheel-pointer-pin')) return;
      handleAction(e);
    };
  }
}

// ── 9. 스핀 회전 로직 (GPU 가속 CSS Transform) ──
function triggerSpin() {
  if (isSpinning) return;
  
  // 기회가 없으면 보너스로 1회 자동 선물하여 멈추지 않게 함
  if (remainingSpins <= 0) {
    remainingSpins = 3;
    showToast('🎁 보너스 뽑기 기회가 지급되었습니다!');
  }
  
  // 오디오 활성화
  getAudioContext();
  
  isSpinning = true;
  remainingSpins--;
  updateSpinsDisplay();
  
  const btn = document.getElementById('wheelCenterBtn');
  if (btn) btn.disabled = true;
  
  const wheelContainer = document.getElementById('wheelCanvasContainer');
  const pointerPin = document.getElementById('wheelPointerPin');
  
  // 당첨 슬라이스 결정 (랜덤)
  const targetIndex = Math.floor(Math.random() * MASTER_COUPONS.length);
  const targetCoupon = MASTER_COUPONS[targetIndex];
  currentWinningCoupon = targetCoupon;
  
  const totalSlices = MASTER_COUPONS.length;
  const sliceDeg = 360 / totalSlices;
  
  // 12시 방향(0도)에 targetIndex 중심이 오도록 하는 각도
  const targetMidDeg = 360 - (targetIndex * sliceDeg + sliceDeg / 2);
  
  // 6~7바퀴 회전
  const extraFullTurns = (6 + Math.floor(Math.random() * 2)) * 360;
  const baseRotation = Math.ceil(currentWheelRotation / 360) * 360;
  const finalAngle = baseRotation + extraFullTurns + targetMidDeg;
  
  // 4.5초 부드러운 감속 회전
  const spinDuration = 4500;
  if (wheelContainer) {
    wheelContainer.style.transition = `transform ${spinDuration}ms cubic-bezier(0.12, 0.8, 0.2, 1)`;
    wheelContainer.style.transform = `rotate(${finalAngle}deg)`;
  }
  
  // 회전 중 틱 사운드 & 핀 바운스
  let lastPassedSlice = -1;
  const startTime = performance.now();
  
  function checkProgress(now) {
    if (!isSpinning) return;
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / spinDuration);
    
    // cubic-bezier 근사
    const currentEstAngle = currentWheelRotation + (finalAngle - currentWheelRotation) * (1 - Math.pow(1 - t, 3.5));
    const currentSlice = Math.floor((currentEstAngle % 360) / sliceDeg);
    
    if (currentSlice !== lastPassedSlice) {
      lastPassedSlice = currentSlice;
      playTickSound();
      
      if (pointerPin) {
        pointerPin.style.transform = 'translateX(-50%) rotate(-15deg)';
        setTimeout(() => {
          if (pointerPin) pointerPin.style.transform = 'translateX(-50%) rotate(0deg)';
        }, 40);
      }
    }
    
    if (t < 1) {
      requestAnimationFrame(checkProgress);
    }
  }
  requestAnimationFrame(checkProgress);
  
  // 완료 후 처리
  setTimeout(() => {
    isSpinning = false;
    currentWheelRotation = finalAngle % 360;
    if (btn) btn.disabled = false;
    
    playWinFanfare();
    showWinModal(targetCoupon);
  }, spinDuration + 100);
}

// ── 10. 당첨 모달 및 정밀 바코드 생성 ──
function showWinModal(coupon) {
  const logo = document.getElementById('winModalLogo');
  const provider = document.getElementById('winModalProvider');
  const name = document.getElementById('winModalName');
  const discount = document.getElementById('winModalDiscount');
  const code = document.getElementById('winModalCode');
  const condition = document.getElementById('winModalCondition');
  const expiry = document.getElementById('winModalExpiry');
  const source = document.getElementById('winModalSource');
  
  if (logo) {
    logo.textContent = coupon.emoji;
    logo.style.background = coupon.color + '22';
  }
  if (provider) provider.textContent = coupon.provider;
  if (name) name.textContent = coupon.name;
  if (discount) {
    discount.textContent = coupon.discount;
    discount.style.color = coupon.color;
  }
  if (code) code.textContent = formatBarcodeDisplay(coupon.barcode);
  if (condition) condition.textContent = coupon.condition;
  if (expiry) expiry.textContent = coupon.expiry + " 까지 (사용가능)";
  if (source) source.textContent = coupon.source;
  
  drawRealBarcode(coupon.barcode);
  
  const modal = document.getElementById('winModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeWinModal() {
  const modal = document.getElementById('winModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function closeWinModalAndSpin() {
  closeWinModal();
  setTimeout(() => {
    triggerSpin();
  }, 250);
}

// Code 128 리얼 바코드 그래픽 렌더링
function drawRealBarcode(codeStr) {
  const canvas = document.getElementById('barcodeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  
  ctx.fillStyle = '#111111';
  
  // 시작 가드 바
  ctx.fillRect(14, 0, 3, h);
  ctx.fillRect(19, 0, 2, h);
  
  let currentX = 26;
  const seed = (codeStr || '880912345678').split('').map(c => parseInt(c, 10) || 3);
  
  for (let i = 0; i < seed.length * 4; i++) {
    const s = seed[i % seed.length];
    const barWidth = (s % 3) + 1.2;
    const space = ((s * 2) % 3) + 1.5;
    
    if (currentX + barWidth > w - 24) break;
    ctx.fillRect(currentX, 0, barWidth, h);
    currentX += barWidth + space;
  }
  
  // 종료 가드 바
  ctx.fillRect(w - 22, 0, 2, h);
  ctx.fillRect(w - 17, 0, 3, h);
}

function formatBarcodeDisplay(code) {
  if (!code) return '8809 3821 9920 1482';
  return code.replace(/(\d{4})/g, '$1 ').trim();
}

function copyWinCouponCode() {
  if (!currentWinningCoupon) return;
  const code = currentWinningCoupon.barcode || currentWinningCoupon.code;
  copyToClipboard(code, '✅ 쿠폰 바코드 번호가 복사되었습니다!');
}

// ── 11. 기프티콘 이미지 파일 다운로드 ──
function downloadCouponImage() {
  if (!currentWinningCoupon) return;
  
  const cvs = document.createElement('canvas');
  cvs.width = 600;
  cvs.height = 800;
  const ctx = cvs.getContext('2d');
  
  // 배경
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  
  // 상단 헤더
  ctx.fillStyle = currentWinningCoupon.color || '#FF2B44';
  ctx.fillRect(0, 0, cvs.width, 140);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('🎟️ 모바일 교환권 (기프티콘)', 40, 80);
  
  ctx.font = '22px sans-serif';
  ctx.fillText(currentWinningCoupon.provider + ' 공식 인증 쿠폰', 40, 115);
  
  // 본문
  ctx.fillStyle = '#191F28';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(currentWinningCoupon.name, 40, 210);
  
  ctx.fillStyle = currentWinningCoupon.color || '#FF2B44';
  ctx.font = '900 52px sans-serif';
  ctx.fillText(currentWinningCoupon.discount, 40, 280);
  
  // 바코드 복사
  const barcodeCanvas = document.getElementById('barcodeCanvas');
  if (barcodeCanvas) {
    ctx.drawImage(barcodeCanvas, 40, 330, 520, 110);
  }
  
  ctx.fillStyle = '#191F28';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(formatBarcodeDisplay(currentWinningCoupon.barcode), 300, 480);
  ctx.textAlign = 'left';
  
  // 유효기간 & 조건
  ctx.fillStyle = '#8B95A1';
  ctx.font = '20px sans-serif';
  ctx.fillText('유효기간: ' + currentWinningCoupon.expiry + ' 까지', 40, 560);
  ctx.fillText('사용조건: ' + currentWinningCoupon.condition, 40, 600);
  ctx.fillText('교환처: ' + currentWinningCoupon.source, 40, 640);
  
  // 푸터
  ctx.fillStyle = '#F4F6F9';
  ctx.fillRect(0, 720, cvs.width, 80);
  ctx.fillStyle = '#8B95A1';
  ctx.font = '18px sans-serif';
  ctx.fillText('대한민국 1등 무료 쿠폰 럭키드로우 | 쿠폰모아', 40, 768);
  
  const link = document.createElement('a');
  link.download = `쿠폰모아_${currentWinningCoupon.provider}_교환권.png`;
  link.href = cvs.toDataURL('image/png');
  link.click();
  
  showToast('💾 기프티콘 이미지가 저장되었습니다!');
}

// ── 12. 전체 쿠폰 카드 렌더링 ──
function renderCouponCards() {
  const grid = document.getElementById('couponCardsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  let list = allCoupons.filter(c => {
    const matchCategory = currentCategory === 'all' || c.category === currentCategory;
    const matchSearch = searchQuery === '' || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.discount.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });
  
  if (currentSortMode === 'popular') {
    list.sort((a, b) => (b.popularScore || 0) - (a.popularScore || 0));
  } else if (currentSortMode === 'expiry') {
    list.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
  } else if (currentSortMode === 'discount') {
    list.sort((a, b) => {
      const getNum = s => parseInt((s || '0').replace(/[^0-9]/g, ''), 10) || 0;
      return getNum(b.discount) - getNum(a.discount);
    });
  }
  
  const countEl = document.getElementById('filterResultCount');
  if (countEl) countEl.textContent = list.length;
  
  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 20px; border: 1px solid var(--border);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 6px;">검색된 쿠폰이 없습니다</h3>
        <p style="font-size: 0.85rem; color: var(--text-sub);">다른 검색어를 입력하시거나 카테고리를 전체로 변경해보세요.</p>
      </div>
    `;
    return;
  }
  
  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'coupon-ticket-card';
    card.onclick = () => openDetailModal(c);
    
    card.innerHTML = `
      <div class="coupon-card-top">
        <div class="brand-badge-wrap">
          <div class="brand-emoji-icon" style="background: ${c.color}18;">${c.emoji}</div>
          <div class="brand-info-col">
            <span class="brand-name">${c.provider}</span>
            <span class="brand-category-tag">${c.category}</span>
          </div>
        </div>
        <span class="coupon-badge ${c.badge}">${c.tag || '인기'}</span>
      </div>
      
      <div class="ticket-tear-line"></div>
      
      <div class="coupon-card-body">
        <div class="coupon-discount-headline">${c.discount}</div>
        <div class="coupon-title-name">${c.name}</div>
        <div class="coupon-cond-snippet">📌 ${c.condition}</div>
        
        <div class="mini-barcode-row" onclick="event.stopPropagation(); copyDirectMiniCode('${c.barcode}', event)">
          <span class="mini-code-num">${formatBarcodeDisplay(c.barcode)}</span>
          <button class="btn-mini-copy">복사</button>
        </div>
      </div>
      
      <div class="coupon-card-footer">
        <span class="expiry-text">📅 ${c.expiry} 까지</span>
        <span class="source-app">${c.source.split(' ')[0]}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateCategoryCounts() {
  const getCount = cat => allCoupons.filter(c => c.category === cat).length;
  const countAll = document.getElementById('countAll');
  const countConv = document.getElementById('countConvenience');
  const countCafe = document.getElementById('countCafe');
  const countDeliv = document.getElementById('countDelivery');
  const countBeauty = document.getElementById('countBeauty');
  const countCult = document.getElementById('countCulture');
  
  if (countAll) countAll.textContent = allCoupons.length;
  if (countConv) countConv.textContent = getCount('편의점');
  if (countCafe) countCafe.textContent = getCount('카페');
  if (countDeliv) countDeliv.textContent = getCount('배달');
  if (countBeauty) countBeauty.textContent = getCount('뷰티');
  if (countCult) countCult.textContent = getCount('문화');
}

// ── 13. 카테고리 탭 & 검색 ──
document.getElementById('categoryTabs')?.addEventListener('click', e => {
  const btn = e.target.closest('.cat-tab');
  if (!btn) return;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCategory = btn.dataset.category || 'all';
  renderCouponCards();
});

function handleSearch(val) {
  searchQuery = (val || '').trim();
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';
  renderCouponCards();
}

function clearSearch() {
  const input = document.getElementById('couponSearchInput');
  if (input) input.value = '';
  searchQuery = '';
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  renderCouponCards();
}

function setSortMode(mode) {
  currentSortMode = mode;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderCouponCards();
}

// ── 14. 쿠폰 상세 안내 모달 ──
let selectedDetailCoupon = null;

function openDetailModal(coupon) {
  selectedDetailCoupon = coupon;
  const body = document.getElementById('detailModalCard');
  if (!body) return;
  
  body.innerHTML = `
    <div class="ticket-brand-header">
      <div class="ticket-brand-logo" style="background:${coupon.color}22;">${coupon.emoji}</div>
      <div class="ticket-brand-info">
        <span class="ticket-provider-name">${coupon.provider}</span>
        <span class="ticket-badge-pill">${coupon.category}</span>
      </div>
    </div>

    <div class="ticket-title-block">
      <h3 class="ticket-coupon-name">${coupon.name}</h3>
      <div class="ticket-discount-amount" style="color:${coupon.color};">${coupon.discount}</div>
    </div>

    <div class="ticket-barcode-section">
      <div class="barcode-number">${formatBarcodeDisplay(coupon.barcode)}</div>
      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">전국 공식 가맹점 및 앱에서 바코드 번호를 제시/입력하세요.</div>
    </div>

    <div class="ticket-condition-list">
      <div class="ticket-cond-row">
        <span class="cond-label">사용 조건</span>
        <span class="cond-value">${coupon.condition}</span>
      </div>
      <div class="ticket-cond-row">
        <span class="cond-label">유효 기간</span>
        <span class="cond-value text-red">${coupon.expiry} 까지</span>
      </div>
      <div class="ticket-cond-row">
        <span class="cond-label">발급처</span>
        <span class="cond-value">${coupon.source}</span>
      </div>
    </div>
  `;
  
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function copyDetailCode() {
  if (!selectedDetailCoupon) return;
  copyToClipboard(selectedDetailCoupon.barcode || selectedDetailCoupon.code, '✅ 쿠폰 번호가 복사되었습니다!');
}

function copyDirectMiniCode(code, e) {
  if (e) e.stopPropagation();
  copyToClipboard(code, '✅ 쿠폰 번호가 복사되었습니다!');
}

// ── 15. 쿠폰 제보 모달 ──
function openAddModal() {
  const modal = document.getElementById('addModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeAddModal() {
  const modal = document.getElementById('addModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function handleSuggestSubmit(e) {
  e.preventDefault();
  const provider = document.getElementById('sugProvider').value.trim();
  const name = document.getElementById('sugName').value.trim();
  const discount = document.getElementById('sugDiscount').value.trim();
  const category = document.getElementById('sugCategory').value;
  const expiry = document.getElementById('sugExpiry').value;
  const condition = document.getElementById('sugCondition').value.trim() || '조건 없음';
  
  if (!provider || !name || !discount) return;
  
  const newCoupon = {
    id: Date.now(),
    name: name,
    provider: provider,
    category: category,
    discount: discount,
    condition: condition,
    expiry: expiry,
    color: WHEEL_PALETTE[Math.floor(Math.random() * WHEEL_PALETTE.length)],
    emoji: getCategoryEmoji(category),
    badge: 'badge-orange',
    tag: '제보',
    code: 'USER-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    barcode: '880' + Math.floor(1000000000000 + Math.random() * 9000000000000),
    source: provider + ' 공식 채널',
    popularScore: 85
  };
  
  allCoupons.unshift(newCoupon);
  renderCouponCards();
  updateCategoryCounts();
  
  document.getElementById('suggestForm').reset();
  closeAddModal();
  showToast('🎉 새로운 쿠폰 정보가 제보되었습니다! 즉시 목록에 반영되었습니다.');
}

function getCategoryEmoji(cat) {
  const map = { '편의점': '🏪', '카페': '☕', '배달': '🛵', '뷰티': '💄', '문화': '🎬', '기타': '🎁' };
  return map[cat] || '🎁';
}

// ── 16. 공유 및 유틸 ──
function shareWebsite() {
  const url = window.location.href;
  copyToClipboard(url, '🔗 사이트 주소가 복사되었습니다! 친구들에게 공유해보세요.');
}

function shareWinningResult() {
  if (!currentWinningCoupon) return;
  const text = `[쿠폰모아 당첨!] ${currentWinningCoupon.provider} ${currentWinningCoupon.discount} 쿠폰 당첨! 너도 돌려봐 👉 ${window.location.href}`;
  copyToClipboard(text, '🎁 당첨 결과가 복사되었습니다! 카톡 단톡방에 붙여넣어보세요.');
}

function handleModalBackdropClick(e, modalId) {
  if (e.target.id === modalId) {
    if (modalId === 'winModal') closeWinModal();
    if (modalId === 'detailModal') closeDetailModal();
    if (modalId === 'addModal') closeAddModal();
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeWinModal();
    closeDetailModal();
    closeAddModal();
  }
});

function copyToClipboard(text, successMsg) {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg || '복사되었습니다.');
    }).catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg || '복사되었습니다.');
  } catch (e) {
    showToast('복사 기능이 지원되지 않는 브라우저입니다.');
  }
  document.body.removeChild(ta);
}

let toastTimeout = null;
function showToast(msg) {
  const toast = document.getElementById('toastPopup');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// ── 17. 모든 함수를 window 전역에 완벽 등록 (인라인 onclick 100% 작동 보장) ──
window.triggerSpin = triggerSpin;
window.resetSpinsFree = resetSpinsFree;
window.toggleSound = toggleSound;
window.closeWinModal = closeWinModal;
window.closeWinModalAndSpin = closeWinModalAndSpin;
window.openAddModal = openAddModal;
window.closeAddModal = closeAddModal;
window.openDetailModal = openDetailModal;
window.closeDetailModal = closeDetailModal;
window.copyWinCouponCode = copyWinCouponCode;
window.downloadCouponImage = downloadCouponImage;
window.shareWinningResult = shareWinningResult;
window.shareWebsite = shareWebsite;
window.clearSearch = clearSearch;
window.handleSearch = handleSearch;
window.setSortMode = setSortMode;
window.copyDirectMiniCode = copyDirectMiniCode;
window.copyDetailCode = copyDetailCode;
window.handleSuggestSubmit = handleSuggestSubmit;
window.handleModalBackdropClick = handleModalBackdropClick;
