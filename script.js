/**
 * ==========================================================================
 * 쿠폰모아 (COUPONMOA) - script.js v4.0.0
 * 완벽한 로컬 보관함(자기가 뽑은 것만 저장), 랜덤 바코드 생성, 꽝 추가,
 * 모달 버튼 100% 터치/클릭 보장
 * ==========================================================================
 */

// ── 1. 럭키드로우 라인업 마스터 데이터 (초호화 혜택 + 꽝 포함) ──
const MASTER_LINEUP = [
  {
    id: 'shinsegae_50k',
    name: "신세계백화점 상품권 50,000원권",
    provider: "신세계",
    category: "백화점",
    discount: "50,000원권",
    condition: "이마트, 신세계백화점, 스타필드 전점 사용 가능",
    expiry: "2026-12-31",
    color: "#B71C1C",
    emoji: "💳",
    badge: "badge-red",
    tag: "잭팟",
    source: "전국 신세계/이마트 고객센터 모바일 교환",
    description: "전국 이마트 및 신세계백화점 상품권샵에서 지류 상품권으로 즉시 교환",
    isBoom: false
  },
  {
    id: 'bhc_bburing',
    name: "BHC 뿌링클 + 콜라 1.25L 세트 무료",
    provider: "BHC치킨",
    category: "배달",
    discount: "치킨세트 FREE",
    condition: "BHC 공식 앱 온라인 주문 또는 매장 전화",
    expiry: "2026-11-30",
    color: "#FF6B00",
    emoji: "🍗",
    badge: "badge-orange",
    tag: "인기폭발",
    source: "BHC 공식 앱 E-쿠폰 등록",
    description: "BHC 앱에서 모바일 상품권 번호를 입력하여 배달/포장 주문",
    isBoom: false
  },
  {
    id: 'sbux_dessert',
    name: "스타벅스 달콤한 디저트 세트 (아메리카노 2잔 + 케이크)",
    provider: "스타벅스",
    category: "카페",
    discount: "세트 교환권",
    condition: "전국 스타벅스 매장 현장 제시 / 사이렌오더",
    expiry: "2026-12-31",
    color: "#00704A",
    emoji: "☕",
    badge: "badge-green",
    tag: "달콤선물",
    source: "스타벅스 카운터 바코드 스캔 또는 사이렌오더 등록",
    description: "스타벅스 매장에서 바코드 스캔 시 디저트 세트 무료 수령",
    isBoom: false
  },
  {
    id: 'baemin_10k',
    name: "배달의민족 모바일 상품권 10,000원권",
    provider: "배달의민족",
    category: "배달",
    discount: "10,000원권",
    condition: "배민 전 카테고리 (배민1, 배달, 포장, B마트)",
    expiry: "2026-12-15",
    color: "#2AC1BC",
    emoji: "🛵",
    badge: "badge-blue",
    tag: "실속혜택",
    source: "배달의민족 앱 선물함 > 쿠폰 등록",
    description: "배민캐시로 자동 전환되어 결제 시 현금처럼 차감 사용",
    isBoom: false
  },
  {
    id: 'olive_20k',
    name: "올리브영 기프트카드 20,000원권",
    provider: "올리브영",
    category: "뷰티",
    discount: "20,000원권",
    condition: "올리브영 온/오프라인 전 매장 결제 시",
    expiry: "2026-12-31",
    color: "#4AC14A",
    emoji: "💄",
    badge: "badge-green",
    tag: "뷰티원픽",
    source: "올리브영 매장 바코드 제시 또는 앱 등록",
    description: "전국 올리브영 매장에서 결제 시 바코드 제시",
    isBoom: false
  },
  {
    id: 'domino_pizza',
    name: "도미노피자 포테이토(L) + 콜라 1.25L 무료",
    provider: "도미노피자",
    category: "배달",
    discount: "피자세트 FREE",
    condition: "도미노피자 공식 웹/앱 E-쿠폰 주문",
    expiry: "2026-11-20",
    color: "#0066A2",
    emoji: "🍕",
    badge: "badge-blue",
    tag: "파티혜택",
    source: "도미노피자 앱 E-쿠폰 입력창",
    description: "도미노피자 공식 주문 페이지에서 E-쿠폰 번호 적용",
    isBoom: false
  },
  {
    id: 'gs25_banana',
    name: "GS25 빙그레 바나나맛우유 1개 무료 교환권",
    provider: "GS25",
    category: "편의점",
    discount: "바나나우유 FREE",
    condition: "GS25 매장 상품 결제 시 바코드 스캔",
    expiry: "2026-12-31",
    color: "#00B14F",
    emoji: "🥛",
    badge: "badge-green",
    tag: "100%증정",
    source: "전국 GS25 편의점 카운터 바코드 제시",
    description: "바나나맛우유를 들고 카운터에서 바코드를 스캔하면 0원 결제",
    isBoom: false
  },
  {
    id: 'cu_cream',
    name: "CU 연세우유 생크림빵 1개 무료 교환권",
    provider: "CU",
    category: "편의점",
    discount: "생크림빵 FREE",
    condition: "연세우유 크림빵 전 시리즈 중 택1 교환",
    expiry: "2026-12-31",
    color: "#7B3FE4",
    emoji: "🥖",
    badge: "badge-purple",
    tag: "품절대란",
    source: "전국 CU 매장 카운터 바코드 제시",
    description: "포켓CU 앱 또는 매장에서 상품 결제 시 제시",
    isBoom: false
  },
  {
    id: 'mcd_bigmac',
    name: "맥도날드 빅맥 세트 1개 무료 교환권",
    provider: "맥도날드",
    category: "배달",
    discount: "빅맥세트 FREE",
    condition: "맥도날드 매장 카운터 / 키오스크 바코드 스캔",
    expiry: "2026-11-30",
    color: "#FFC72C",
    emoji: "🍔",
    badge: "badge-orange",
    tag: "버거매니아",
    source: "전국 맥도날드 매장 키오스크 모바일 쿠폰 스캔",
    description: "키오스크 '모바일 쿠폰'에서 스캔 시 빅맥 세트 무료 주문",
    isBoom: false
  },
  {
    id: 'baskin_pint',
    name: "배스킨라빈스 파인트 아이스크림 무료 교환권",
    provider: "배스킨라빈스",
    category: "카페",
    discount: "파인트 FREE",
    condition: "세 가지 맛 선택 가능한 파인트 1개",
    expiry: "2026-12-31",
    color: "#E91E63",
    emoji: "🍨",
    badge: "badge-purple",
    tag: "달콤선물",
    source: "배스킨라빈스 매장 카운터 / 키오스크 스캔",
    description: "매장에서 원하는 3가지 플레이버 선택 후 바코드 결제",
    isBoom: false
  },
  {
    id: 'npay_5k',
    name: "네이버페이 포인트 5,000원 모바일 쿠폰",
    provider: "네이버페이",
    category: "뷰티",
    discount: "5,000P 충전",
    condition: "네이버페이 등록 계정 1회 즉시 적립",
    expiry: "2026-12-31",
    color: "#03CF5D",
    emoji: "💚",
    badge: "badge-green",
    tag: "현금포인트",
    source: "네이버페이 쿠폰 등록 페이지",
    description: "등록 즉시 네이버페이 5,000P 지급, 배달/쇼핑 현금 차감 가능",
    isBoom: false
  },
  {
    id: 'boom_fail',
    name: "아쉽네요! 꽝 (다음 기회에)",
    provider: "행운의 비타500",
    category: "이벤트",
    discount: "재도전 +1회",
    condition: "실망하지 마세요! 보너스 뽑기 기회가 충전됩니다.",
    expiry: "당일 유효",
    color: "#78909C",
    emoji: "😢",
    badge: "badge-orange",
    tag: "다음기회에",
    source: "행운의 재도전 찬스",
    description: "꽝이어도 걱정 마세요! 바로 한 번 더 돌릴 수 있습니다.",
    isBoom: true
  }
];

// 화려한 12색 룰렛 팔레트
const WHEEL_PALETTE = [
  '#B71C1C', '#FF6B00', '#00704A', '#2AC1BC',
  '#4AC14A', '#0066A2', '#00B14F', '#7B3FE4',
  '#FFC72C', '#E91E63', '#03CF5D', '#607D8B'
];

// ── 2. 전역 상태 ──
let isSpinning = false;
let currentWheelRotation = 0;
let remainingSpins = 3;
let isUnlimited = false;
let cooldownSeconds = 0;
let nextResetTime = null;
let cooldownTimerInterval = null;
let soundEnabled = true;
let currentWinningCoupon = null;
let mySavedCoupons = [];
let currentUser = null; // { id, username, name, role, ... }

// ── 3. 초기화 (DOM Loaded) ──
document.addEventListener('DOMContentLoaded', () => {
  initLiveTicker();
  initUserSession(); // 사용자 로그인 세션 확인 및 복구
  renderCouponWheel();
  renderLineupTeaser();
  bindAllClickEvents();
});

// ── 4. Web Audio 사운드 신디사이저 ──
let audioCtx = null;
function getAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
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
    const notes = [523.25, 659.25, 783.99, 1046.50];
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

// ── 5. 실시간 라이브 전광판 ──
const LIVE_TEMPLATES = [
  { phone: "010-****-4821", name: "신세계백화점 상품권 50,000원권", time: "방금 전" },
  { phone: "010-****-9104", name: "BHC 뿌링클 + 콜라 세트 교환권", time: "4초 전" },
  { phone: "010-****-3312", name: "스타벅스 달콤한 디저트 세트", time: "11초 전" },
  { phone: "010-****-7589", name: "배달의민족 10,000원 상품권", time: "19초 전" },
  { phone: "010-****-1205", name: "도미노피자 포테이토(L) 무료", time: "28초 전" },
  { phone: "010-****-6842", name: "올리브영 기프트카드 20,000원권", time: "42초 전" },
  { phone: "010-****-2931", name: "맥도날드 빅맥 세트 교환권", time: "55초 전" },
  { phone: "010-****-8819", name: "네이버페이 포인트 5,000원권", time: "1분 전" }
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

// ── 6. 사용자 인증 & 24시간 3회 스핀 관리 ──
function initUserSession() {
  const savedUser = localStorage.getItem('coupon_user_session_v5');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      applyUserUI(currentUser);
      syncSpinStatusFromServer();
      loadUserCoupons();
    } catch (e) {
      currentUser = null;
      applyGuestUI();
    }
  } else {
    currentUser = null;
    applyGuestUI();
  }
}

function applyUserUI(user) {
  const guestGroup = document.getElementById('guestActionGroup');
  const userGroup = document.getElementById('userActionGroup');
  const userNameText = document.getElementById('userNameText');
  const userRoleTag = document.getElementById('userRoleTag');
  const btnAdmin = document.getElementById('btnAdminPanel');
  const adminBadge = document.getElementById('adminUnlimitedBadge');

  if (guestGroup) guestGroup.style.display = 'none';
  if (userGroup) userGroup.style.display = 'flex';
  if (userNameText) userNameText.textContent = user.name || user.username;

  // 관리자 여부 확인
  const isAdmin = user.role === 'admin' || user.username === 'taeiyoon';
  if (userRoleTag) {
    userRoleTag.textContent = isAdmin ? '👑 관리자' : '회원';
    userRoleTag.className = 'user-role-tag' + (isAdmin ? ' admin' : '');
  }

  // 관리자 전용 버튼: 일반 회원에게는 절대 보이지 않음!
  if (btnAdmin) {
    btnAdmin.style.display = isAdmin ? 'inline-block' : 'none';
  }
  if (adminBadge) {
    adminBadge.style.display = isAdmin ? 'inline-block' : 'none';
  }

  if (isAdmin) {
    isUnlimited = true;
    remainingSpins = 999999;
  }

  const promptBox = document.getElementById('chanceAuthPrompt');
  if (promptBox) promptBox.style.display = 'none';

  updateSpinsDisplay();
}

function applyGuestUI() {
  const guestGroup = document.getElementById('guestActionGroup');
  const userGroup = document.getElementById('userActionGroup');
  const btnAdmin = document.getElementById('btnAdminPanel');
  const adminBadge = document.getElementById('adminUnlimitedBadge');
  const promptBox = document.getElementById('chanceAuthPrompt');

  if (guestGroup) guestGroup.style.display = 'flex';
  if (userGroup) userGroup.style.display = 'none';
  if (btnAdmin) btnAdmin.style.display = 'none';
  if (adminBadge) adminBadge.style.display = 'none';
  if (promptBox) promptBox.style.display = 'flex';

  isUnlimited = false;
  remainingSpins = 0;
  mySavedCoupons = [];
  updateVaultBadges();
  renderMyVaultGrid();
  updateSpinsDisplay();
}

// 서버와 24시간 스핀 상태 동기화
async function syncSpinStatusFromServer() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/spin/status?username=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();
    if (data.success) {
      isUnlimited = data.isUnlimited;
      remainingSpins = data.remainingSpins;
      cooldownSeconds = data.cooldownSeconds || 0;
      nextResetTime = data.nextResetTime;
      updateSpinsDisplay();
      startCooldownCountdown();
    }
  } catch (e) {
    console.error('스핀 동기화 오류:', e);
  }
}

// 24시간 쿨타임 실시간 타이머
function startCooldownCountdown() {
  if (cooldownTimerInterval) clearInterval(cooldownTimerInterval);

  function tick() {
    const timerEl = document.getElementById('cooldownTimerText');
    const noticeEl = document.getElementById('chanceNoticeText');
    if (!timerEl) return;

    if (isUnlimited) {
      timerEl.textContent = '무제한 혜택 적용 중';
      return;
    }

    if (!currentUser) {
      timerEl.textContent = '로그인 필요';
      return;
    }

    if (remainingSpins > 0) {
      if (nextResetTime) {
        const diffSec = Math.max(0, Math.floor((nextResetTime - Date.now()) / 1000));
        timerEl.textContent = `${formatDuration(diffSec)} 후 3회 리셋`;
      } else {
        timerEl.textContent = '지금 뽑기 가능 (3회)';
      }
      return;
    }

    if (nextResetTime) {
      const diffSec = Math.max(0, Math.floor((nextResetTime - Date.now()) / 1000));
      if (diffSec <= 0) {
        timerEl.textContent = '충전 완료! 새로고침';
        syncSpinStatusFromServer();
      } else {
        timerEl.textContent = `${formatDuration(diffSec)} 후 충전`;
      }
    } else {
      timerEl.textContent = '충전 대기 중';
    }
  }

  tick();
  cooldownTimerInterval = setInterval(tick, 1000);
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2, '0')}시간 ${m.toString().padStart(2, '0')}분 ${s.toString().padStart(2, '0')}초`;
}

function updateSpinsDisplay() {
  const spinsEl = document.getElementById('remainingSpins');
  const barEl = document.getElementById('chanceProgressBar');
  const unitEl = document.getElementById('spinUnitText');
  const labelEl = document.getElementById('chanceLabelText');

  if (isUnlimited) {
    if (spinsEl) spinsEl.textContent = '∞';
    if (unitEl) unitEl.textContent = ' (무제한)';
    if (barEl) barEl.style.width = '100%';
    if (labelEl) labelEl.textContent = '👑 관리자 권한 (스핀 무제한)';
    return;
  }

  if (unitEl) unitEl.textContent = '회';
  if (labelEl) labelEl.textContent = '남은 뽑기 기회 (24시간마다 3회 지급)';

  if (!currentUser) {
    if (spinsEl) spinsEl.textContent = '0';
    if (barEl) barEl.style.width = '0%';
    return;
  }

  const currentCount = Math.max(0, remainingSpins);
  if (spinsEl) spinsEl.textContent = currentCount;
  if (barEl) {
    const pct = Math.min(100, Math.max(0, (currentCount / 3) * 100));
    barEl.style.width = pct + '%';
  }
}

// ── 7. 룰렛 캔버스 렌더링 ──
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
  const numSlices = MASTER_LINEUP.length;
  const sliceRad = (Math.PI * 2) / numSlices;
  
  ctx.clearRect(0, 0, size, size);
  
  MASTER_LINEUP.forEach((item, i) => {
    const startAngle = i * sliceRad - Math.PI / 2;
    const endAngle = startAngle + sliceRad;
    const color = WHEEL_PALETTE[i % WHEEL_PALETTE.length];
    
    // 부채꼴
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    
    // 구분선
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // 텍스트 & 이모지
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + sliceRad / 2);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '19px serif';
    ctx.fillText(item.emoji, R - 10, 6);
    
    ctx.font = "bold 11.5px 'Pretendard', sans-serif";
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 3;
    const label = item.provider.length > 5 ? item.provider.substring(0, 5) : item.provider;
    ctx.fillText(label, R - 36, 4);
    
    ctx.restore();
  });
  
  // 중앙 링
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#FFB300';
  ctx.lineWidth = 4;
  ctx.stroke();
}

// ── 8. 모든 터치 & 클릭 이벤트 바인딩 (모달 버튼 안 눌림 완전 방지) ──
function bindAllClickEvents() {
  const btnSpin = document.getElementById('wheelCenterBtn');
  const wheelContainer = document.getElementById('wheelCanvasContainer');
  const outerRing = document.getElementById('wheelOuterRing');

  const onSpin = (e) => {
    if (e) e.preventDefault();
    triggerSpin();
  };

  if (btnSpin) {
    btnSpin.onclick = onSpin;
    btnSpin.addEventListener('touchend', onSpin, { passive: false });
  }
  if (wheelContainer) {
    wheelContainer.onclick = onSpin;
    wheelContainer.addEventListener('touchend', onSpin, { passive: false });
  }
  if (outerRing) {
    outerRing.onclick = (e) => {
      if (e.target.closest('.wheel-pointer-pin')) return;
      onSpin(e);
    };
  }

  // 모달 버튼들 직접 안전 바인딩
  bindElementAction('btnWinClose', () => closeWinModal());
  bindElementAction('btnDownloadImg', () => downloadCouponImage());
  bindElementAction('btnMarkUsed', () => toggleMarkUsed());
  bindElementAction('btnShareWin', () => shareWinningResult());
  bindElementAction('btnSpinAgain', () => closeWinModalAndSpin());
  bindElementAction('btnCopyBarcode', () => copyWinCouponCode());

  // 로그인 / 회원가입 / 관리자 모달 버튼 안전 바인딩
  bindElementAction('btnHeaderLogin', () => openLoginModal());
  bindElementAction('btnHeaderRegister', () => openRegisterModal());
  bindElementAction('btnPromptLogin', () => openLoginModal());
  bindElementAction('btnPromptRegister', () => openRegisterModal());
  bindElementAction('btnAdminPanel', () => openAdminModal());
  bindElementAction('btnLogout', () => logoutUser());
  bindElementAction('btnSubmitLogin', () => submitLogin());
  bindElementAction('btnSubmitRegister', () => submitRegister());
  bindElementAction('btnSwitchToReg', () => switchToRegister());
  bindElementAction('btnSwitchToLog', () => switchToLogin());
  bindElementAction('btnCloseLoginModal', () => closeLoginModal());
  bindElementAction('btnCloseRegisterModal', () => closeRegisterModal());
  bindElementAction('btnCloseAdminModal', () => closeAdminModal());
  bindElementAction('btnAdminCloseBottom', () => closeAdminModal());
  bindElementAction('btnAdminRecharge', () => adminRechargeUserSpins());
  bindElementAction('btnAdminRefresh', () => loadAdminUserList());

  // 모달 바깥 배경 터치/클릭 시 닫기
  ['loginModal', 'registerModal', 'adminModal', 'winModal'].forEach(modalId => {
    const m = document.getElementById(modalId);
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) {
          m.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }
  });

  // 엔터 키로 간편 로그인/가입
  const bindEnter = (id, fn) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') fn();
      });
    }
  };
  bindEnter('loginUsername', submitLogin);
  bindEnter('loginPassword', submitLogin);
  bindEnter('regUsername', submitRegister);
  bindEnter('regName', submitRegister);
  bindEnter('regPassword', submitRegister);
}

function bindElementAction(elemId, handler) {
  const el = document.getElementById(elemId);
  if (!el) return;
  el.onclick = (e) => {
    if (e) e.stopPropagation();
    handler();
  };
}

// ── 9. 스핀 회전 로직 ──
async function triggerSpin() {
  if (isSpinning) return;

  // 1) 로그인 확인 (신규 회원은 반드시 가입 후 로그인해야 함)
  if (!currentUser) {
    showToast('⚠️ 로그인이 필요합니다! 회원가입 또는 로그인 후 이용해주세요.');
    openLoginModal();
    return;
  }

  // 2) 일반 회원의 경우 잔여 기회 체크
  if (!isUnlimited && remainingSpins <= 0) {
    showToast('⏳ 오늘의 뽑기 기회(3회)를 모두 소진하셨습니다. 24시간 후 다시 충전됩니다!');
    return;
  }

  // 3) 서버에 스핀 1회 차감 요청
  try {
    const res = await fetch('/api/spin/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.error || '스핀 기회가 부족합니다.');
      syncSpinStatusFromServer();
      return;
    }

    // 성공 시 잔여 횟수 갱신
    remainingSpins = data.remainingSpins;
    isUnlimited = data.isUnlimited;
    nextResetTime = data.nextResetTime;
    cooldownSeconds = data.cooldownSeconds;
    updateSpinsDisplay();
    startCooldownCountdown();
  } catch (err) {
    console.error('스핀 요청 오류:', err);
  }
  
  getAudioContext();
  isSpinning = true;
  
  const btn = document.getElementById('wheelCenterBtn');
  if (btn) btn.disabled = true;
  
  const wheelContainer = document.getElementById('wheelCanvasContainer');
  const pointerPin = document.getElementById('wheelPointerPin');
  
  // 당첨 슬라이스 결정
  const targetIndex = Math.floor(Math.random() * MASTER_LINEUP.length);
  const targetItem = MASTER_LINEUP[targetIndex];
  
  const totalSlices = MASTER_LINEUP.length;
  const sliceDeg = 360 / totalSlices;
  const targetMidDeg = 360 - (targetIndex * sliceDeg + sliceDeg / 2);
  
  const extraFullTurns = (6 + Math.floor(Math.random() * 2)) * 360;
  const baseRotation = Math.ceil(currentWheelRotation / 360) * 360;
  const finalAngle = baseRotation + extraFullTurns + targetMidDeg;
  
  const spinDuration = 4500;
  if (wheelContainer) {
    wheelContainer.style.transition = `transform ${spinDuration}ms cubic-bezier(0.12, 0.8, 0.2, 1)`;
    wheelContainer.style.transform = `rotate(${finalAngle}deg)`;
  }
  
  let lastPassedSlice = -1;
  const startTime = performance.now();
  
  function checkProgress(now) {
    if (!isSpinning) return;
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / spinDuration);
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
  
  setTimeout(() => {
    isSpinning = false;
    currentWheelRotation = finalAngle % 360;
    if (btn) btn.disabled = false;
    
    handleSpinResult(targetItem);
  }, spinDuration + 100);
}

// ── 10. 당첨 결과 처리 (완전 랜덤 바코드 생성 & 로컬 저장) ──
function handleSpinResult(item) {
  if (item.isBoom) {
    // 꽝 당첨
    remainingSpins += 1;
    updateSpinsDisplay();
    showBoomModal(item);
    return;
  }
  
  playWinFanfare();
  
  // 완전 랜덤 바코드 & 쿠폰 코드 생성 (100% 유니크)
  const randomBarcode = '8809' + Math.floor(100000000000 + Math.random() * 900000000000);
  const randomCode = item.provider.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 4) + 
    '-' + Math.floor(1000 + Math.random() * 9000) + 
    '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  
  const newWonCoupon = {
    vaultId: 'VAULT_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    id: item.id,
    name: item.name,
    provider: item.provider,
    category: item.category,
    discount: item.discount,
    condition: item.condition,
    expiry: item.expiry,
    color: item.color,
    emoji: item.emoji,
    badge: item.badge,
    tag: item.tag,
    barcode: randomBarcode,
    code: randomCode,
    source: item.source,
    wonAt: new Date().toLocaleString('ko-KR'),
    isUsed: false
  };
  
  currentWinningCoupon = newWonCoupon;
  
  // 로컬 보관함에 자동 저장!
  saveToMyVault(newWonCoupon);
  
  // 당첨 모달 열기
  showWinModal(newWonCoupon);
}

// 꽝 모달
function showBoomModal(item) {
  const header = document.getElementById('winModalHeader');
  const title = document.getElementById('winModalCongratsTitle');
  const name = document.getElementById('winModalName');
  const discount = document.getElementById('winModalDiscount');
  const barcodeSec = document.getElementById('winBarcodeSection');
  const logo = document.getElementById('winModalLogo');
  const provider = document.getElementById('winModalProvider');
  const stamp = document.getElementById('winModalStamp');
  const actionRow1 = document.getElementById('winActionRow1');
  
  if (header) header.style.background = '#607D8B';
  if (title) title.textContent = '😢 아쉽네요! 다음 기회에...';
  if (logo) logo.textContent = '😢';
  if (provider) provider.textContent = '비타500 응원 찬스';
  if (name) name.textContent = '이번엔 아쉽지만 꽝입니다!';
  if (discount) {
    discount.textContent = '재도전 +1회 지급';
    discount.style.color = '#FF6B00';
  }
  if (barcodeSec) barcodeSec.style.display = 'none';
  if (stamp) stamp.style.display = 'none';
  if (actionRow1) actionRow1.style.display = 'none';
  
  document.getElementById('winModalCondition').textContent = '기회가 1회 무료 충전되었습니다.';
  document.getElementById('winModalExpiry').textContent = '지금 바로 다시 돌려보세요!';
  document.getElementById('winModalSource').textContent = '쿠폰모아 행운 룰렛';
  
  openModalBackdrop();
  showToast('😢 꽝입니다! 보너스 기회 +1회가 지급되었습니다.');
}

// ── 11. 당첨 모달 렌더링 ──
function showWinModal(coupon) {
  const header = document.getElementById('winModalHeader');
  const title = document.getElementById('winModalCongratsTitle');
  const name = document.getElementById('winModalName');
  const discount = document.getElementById('winModalDiscount');
  const barcodeSec = document.getElementById('winBarcodeSection');
  const logo = document.getElementById('winModalLogo');
  const provider = document.getElementById('winModalProvider');
  const code = document.getElementById('winModalCode');
  const stamp = document.getElementById('winModalStamp');
  const actionRow1 = document.getElementById('winActionRow1');
  const btnMark = document.getElementById('btnMarkUsed');
  
  if (header) header.style.background = 'linear-gradient(135deg, #FF2B44 0%, #FF6536 100%)';
  if (title) title.textContent = '🎉 축하합니다! 당첨되었습니다';
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
  if (barcodeSec) barcodeSec.style.display = 'flex';
  if (actionRow1) actionRow1.style.display = 'grid';
  if (code) code.textContent = formatBarcodeDisplay(coupon.barcode);
  
  document.getElementById('winModalCondition').textContent = coupon.condition;
  document.getElementById('winModalExpiry').textContent = coupon.expiry + ' 까지 (사용가능)';
  document.getElementById('winModalSource').textContent = coupon.source;
  
  // 사용 완료 스탬프 복원
  if (coupon.isUsed) {
    if (stamp) stamp.style.display = 'block';
    if (btnMark) btnMark.textContent = '↩️ 사용 취소';
  } else {
    if (stamp) stamp.style.display = 'none';
    if (btnMark) btnMark.textContent = '✅ 매장 사용 처리';
  }
  
  drawRealBarcode(coupon.barcode);
  openModalBackdrop();
}

function openModalBackdrop() {
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

// ── 12. 사용 완료 도장 토글 ──
function toggleMarkUsed() {
  if (!currentWinningCoupon) return;
  currentWinningCoupon.isUsed = !currentWinningCoupon.isUsed;
  
  const stamp = document.getElementById('winModalStamp');
  const stampDate = document.getElementById('winModalStampDate');
  const btn = document.getElementById('btnMarkUsed');
  
  if (currentWinningCoupon.isUsed) {
    if (stamp) stamp.style.display = 'block';
    if (stampDate) stampDate.textContent = new Date().toLocaleDateString('ko-KR') + ' 결제완료';
    if (btn) btn.textContent = '↩️ 사용 취소';
    showToast('✅ 매장 사용 완료 처리되었습니다! (도장 날인)');
  } else {
    if (stamp) stamp.style.display = 'none';
    if (btn) btn.textContent = '✅ 매장 사용 처리';
    showToast('쿠폰이 미사용 상태로 변경되었습니다.');
  }
  
  // 로컬 저장소 동기화
  updateVaultCouponState(currentWinningCoupon);
  renderMyVaultGrid();
}

// ── 13. 바코드 캔버스 그래픽 렌더링 ──
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
  
  // 가드 바
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

// ── 14. 기프티콘 이미지 저장 (모바일 100% 안전 다운로드) ──
function downloadCouponImage() {
  if (!currentWinningCoupon || currentWinningCoupon.isBoom) return;
  
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
  ctx.fillText(currentWinningCoupon.provider + ' 공식 교환권', 40, 115);
  
  // 쿠폰명
  ctx.fillStyle = '#191F28';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(currentWinningCoupon.name, 40, 210);
  
  // 혜택 금액
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
  
  try {
    const dataUrl = cvs.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `쿠폰모아_${currentWinningCoupon.provider}_교환권.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('💾 기프티콘 이미지가 저장되었습니다!');
  } catch (e) {
    showToast('📋 이미지를 길게 눌러 저장하세요.');
  }
}

// ── 15. 계정별 쿠폰 보관함 기능 (로그인된 계정에 안전 저장 & 서버 동기화) ──
function loadUserCoupons() {
  if (!currentUser) {
    mySavedCoupons = [];
    updateVaultBadges();
    renderMyVaultGrid();
    return;
  }
  const key = `my_coupon_vault_${currentUser.username}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      mySavedCoupons = JSON.parse(data);
    } catch (e) {
      mySavedCoupons = currentUser.savedCoupons || [];
    }
  } else {
    mySavedCoupons = currentUser.savedCoupons || [];
  }
  updateVaultBadges();
  renderMyVaultGrid();
}

function saveToMyVault(coupon) {
  mySavedCoupons.unshift(coupon);
  if (currentUser) {
    const key = `my_coupon_vault_${currentUser.username}`;
    localStorage.setItem(key, JSON.stringify(mySavedCoupons));
    
    // 서버 DB와도 비동기 동기화
    fetch('/api/coupons/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username, coupon: coupon })
    }).catch(() => {});
  }
  updateVaultBadges();
  renderMyVaultGrid();
}

function updateVaultCouponState(coupon) {
  const idx = mySavedCoupons.findIndex(c => c.vaultId === coupon.vaultId);
  if (idx !== -1) {
    mySavedCoupons[idx] = coupon;
    if (currentUser) {
      const key = `my_coupon_vault_${currentUser.username}`;
      localStorage.setItem(key, JSON.stringify(mySavedCoupons));
    }
  }
}

function updateVaultBadges() {
  const count = mySavedCoupons.length;
  const navCount = document.getElementById('navVaultCount');
  const myCount = document.getElementById('myVaultCount');
  const headerCount = document.getElementById('vaultCountHeader');
  
  if (navCount) navCount.textContent = count;
  if (myCount) myCount.textContent = count;
  if (headerCount) headerCount.textContent = count;
}

function renderMyVaultGrid() {
  const grid = document.getElementById('myCouponsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  if (mySavedCoupons.length === 0) {
    grid.innerHTML = `
      <div class="vault-empty-card">
        <div class="vault-empty-icon">🎁</div>
        <h3 class="vault-empty-title">아직 획득한 쿠폰이 없습니다!</h3>
        <p class="vault-empty-desc">위의 룰렛 돌림판을 돌려 첫 행운의 기프티콘을 획득해보세요.<br />당첨된 쿠폰만 바코드와 함께 이곳에 저장됩니다.</p>
        <button type="button" class="btn-spin-now-pill" onclick="window.scrollTo({top:0, behavior:'smooth'})">🎡 지금 바로 룰렛 돌리기</button>
      </div>
    `;
    return;
  }
  
  mySavedCoupons.forEach(coupon => {
    const card = document.createElement('div');
    card.className = 'coupon-ticket-card';
    card.onclick = () => {
      currentWinningCoupon = coupon;
      showWinModal(coupon);
    };
    
    card.innerHTML = `
      <div class="coupon-card-top">
        <div class="brand-badge-wrap">
          <div class="brand-emoji-icon" style="background: ${coupon.color}18;">${coupon.emoji}</div>
          <div class="brand-info-col">
            <span class="brand-name">${coupon.provider}</span>
            <span class="brand-category-tag">${coupon.category}</span>
          </div>
        </div>
        <span class="coupon-badge ${coupon.isUsed ? 'badge-orange' : 'badge-green'}">
          ${coupon.isUsed ? '사용완료' : '사용가능'}
        </span>
      </div>
      
      <div class="ticket-tear-line"></div>
      
      <div class="coupon-card-body">
        <div class="coupon-discount-headline">${coupon.discount}</div>
        <div class="coupon-title-name">${coupon.name}</div>
        <div class="coupon-cond-snippet">📌 ${coupon.condition}</div>
        
        <div class="mini-barcode-row" onclick="event.stopPropagation(); copyDirectCode('${coupon.barcode}')">
          <span class="mini-code-num">${formatBarcodeDisplay(coupon.barcode)}</span>
          <button type="button" class="btn-mini-copy">복사</button>
        </div>
      </div>
      
      <div class="coupon-card-footer">
        <span class="expiry-text">📅 ${coupon.expiry} 까지</span>
        <span class="source-app">🕒 ${coupon.wonAt.split(' ')[0]} 획득</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function clearAllVaultCoupons() {
  if (mySavedCoupons.length === 0) {
    showToast('보관함이 이미 비어있습니다.');
    return;
  }
  if (confirm('보관함의 모든 쿠폰을 삭제하시겠습니까?')) {
    mySavedCoupons = [];
    localStorage.removeItem('my_coupon_vault_v4');
    updateVaultBadges();
    renderMyVaultGrid();
    showToast('🗑️ 보관함이 모두 비워졌습니다.');
  }
}

function scrollToMyCoupons() {
  const el = document.getElementById('my-coupons-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ── 16. 럭키 라인업 티저 카드 렌더링 ──
function renderLineupTeaser() {
  const grid = document.getElementById('lineupGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  MASTER_LINEUP.forEach(item => {
    const card = document.createElement('div');
    card.className = 'lineup-teaser-card';
    card.innerHTML = `
      <div class="lineup-emoji" style="background:${item.color}15;">${item.emoji}</div>
      <div class="lineup-info">
        <div class="lineup-provider">${item.provider}</div>
        <div class="lineup-name">${item.name}</div>
        <div class="lineup-discount">${item.discount}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ── 17. 공유 및 유틸 ──
function shareWebsite() {
  const url = 'http://www.쿠폰.온라인.한국';
  copyToClipboard(url, '🔗 사이트 주소가 복사되었습니다! 친구들에게 공유해보세요.');
}

function shareWinningResult() {
  if (!currentWinningCoupon) return;
  const text = `[쿠폰모아 당첨!] ${currentWinningCoupon.provider} ${currentWinningCoupon.discount} 쿠폰 당첨! 너도 돌려봐 👉 http://www.쿠폰.온라인.한국`;
  
  if (navigator.share) {
    navigator.share({
      title: '쿠폰모아 당첨!',
      text: text,
      url: 'http://www.쿠폰.온라인.한국'
    }).catch(() => fallbackCopy(text, '🎁 당첨 결과가 복사되었습니다!'));
  } else {
    copyToClipboard(text, '🎁 당첨 결과가 복사되었습니다! 카톡에 붙여넣어보세요.');
  }
}

function copyDirectCode(code) {
  copyToClipboard(code, '✅ 쿠폰 번호가 복사되었습니다!');
}

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
    showToast('복사 기능이 지원되지 않는 환경입니다.');
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

// ── 18. 회원가입 / 로그인 / 최고관리자 모달 & API 연동 ──
function openLoginModal() {
  const m = document.getElementById('loginModal');
  if (m) {
    m.classList.add('active');
    setTimeout(() => {
      const u = document.getElementById('loginUsername');
      if (u) u.focus();
    }, 120);
  }
  document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
  const m = document.getElementById('loginModal');
  if (m) m.classList.remove('active');
  document.body.style.overflow = '';
}

function openRegisterModal() {
  const m = document.getElementById('registerModal');
  if (m) {
    m.classList.add('active');
    setTimeout(() => {
      const u = document.getElementById('regUsername');
      if (u) u.focus();
    }, 120);
  }
  document.body.style.overflow = 'hidden';
}

function closeRegisterModal() {
  const m = document.getElementById('registerModal');
  if (m) m.classList.remove('active');
  document.body.style.overflow = '';
}

function switchToRegister() {
  closeLoginModal();
  setTimeout(openRegisterModal, 150);
}

function switchToLogin() {
  closeRegisterModal();
  setTimeout(openLoginModal, 150);
}

// 로그인 제출
async function submitLogin() {
  const uInput = document.getElementById('loginUsername');
  const pInput = document.getElementById('loginPassword');
  const username = uInput ? uInput.value.trim() : '';
  const password = pInput ? pInput.value.trim() : '';

  if (!username || !password) {
    showToast('아이디와 비밀번호를 모두 입력해주세요.');
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.error || '로그인에 실패했습니다.');
      return;
    }

    currentUser = data.user;
    localStorage.setItem('coupon_user_session_v5', JSON.stringify(currentUser));
    closeLoginModal();
    applyUserUI(currentUser);
    loadUserCoupons();
    syncSpinStatusFromServer();

    const isAdmin = currentUser.role === 'admin' || currentUser.username === 'taeiyoon';
    if (isAdmin) {
      showToast('👑 최고 관리자(taeiyoon)님 환영합니다! 스핀 무제한 활성화됨');
    } else {
      showToast(`🎉 ${currentUser.name || currentUser.username}님, 로그인되었습니다! (24시간마다 3회 스핀)`);
    }
  } catch (e) {
    showToast('서버 통신 오류가 발생했습니다.');
  }
}

// 회원가입 제출
async function submitRegister() {
  const uInput = document.getElementById('regUsername');
  const nInput = document.getElementById('regName');
  const pInput = document.getElementById('regPassword');
  const username = uInput ? uInput.value.trim() : '';
  const name = nInput ? nInput.value.trim() : '';
  const password = pInput ? pInput.value.trim() : '';

  if (!username || !password) {
    showToast('아이디와 비밀번호를 모두 입력해주세요.');
    return;
  }
  if (username.length < 3) {
    showToast('아이디는 3자 이상이어야 합니다.');
    return;
  }
  if (password.length < 4) {
    showToast('비밀번호는 4자 이상이어야 합니다.');
    return;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, name, password })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.error || '회원가입에 실패했습니다.');
      return;
    }

    showToast('✨ 회원가입 성공! 가입하신 아이디로 로그인해주세요.');
    closeRegisterModal();
    setTimeout(() => {
      const loginU = document.getElementById('loginUsername');
      if (loginU) loginU.value = username;
      openLoginModal();
    }, 250);
  } catch (e) {
    showToast('서버 통신 오류가 발생했습니다.');
  }
}

// 로그아웃
function logoutUser() {
  if (confirm('로그아웃 하시겠습니까?')) {
    currentUser = null;
    localStorage.removeItem('coupon_user_session_v5');
    applyGuestUI();
    showToast('로그아웃 되었습니다.');
  }
}

// ── 19. 최고 관리자 전용 대시보드 함수들 (taeiyoon) ──
function openAdminModal() {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.username !== 'taeiyoon')) {
    showToast('관리자 권한이 없습니다.');
    return;
  }
  const m = document.getElementById('adminModal');
  if (m) m.classList.add('active');
  document.body.style.overflow = 'hidden';
  loadAdminUserList();
}

function closeAdminModal() {
  const m = document.getElementById('adminModal');
  if (m) m.classList.remove('active');
  document.body.style.overflow = '';
}

async function loadAdminUserList() {
  if (!currentUser) return;
  const tbody = document.getElementById('adminUserTableBody');
  const countEl = document.getElementById('adminTotalUsers');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">회원 목록 조회 중...</td></tr>';

  try {
    const res = await fetch(`/api/admin/users?admin=${encodeURIComponent(currentUser.username)}`);
    const data = await res.json();

    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">${data.error}</td></tr>`;
      return;
    }

    if (countEl) countEl.textContent = `${data.totalUsers}명`;

    if (data.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">등록된 회원이 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = data.users.map(u => `
      <tr>
        <td><strong>${u.username}</strong>${u.name ? ` (${u.name})` : ''}</td>
        <td><span class="user-role-tag ${u.role === 'admin' ? 'admin' : ''}">${u.role === 'admin' ? '👑 관리자' : '일반회원'}</span></td>
        <td><strong style="color: ${u.role === 'admin' ? '#FF9800' : '#00B14F'}">${u.remainingSpins}</strong></td>
        <td>${u.couponCount}개</td>
        <td style="color:#888; font-size:0.75rem;">${u.createdAt ? u.createdAt.split('T')[0] : '-'}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">목록 조회 오류</td></tr>';
  }
}

// 관리자가 특정 회원에게 스핀 지급
async function adminRechargeUserSpins() {
  if (!currentUser) return;
  const targetInput = document.getElementById('adminTargetUser');
  const countSelect = document.getElementById('adminAddCount');
  const targetUsername = targetInput ? targetInput.value.trim() : '';
  const addSpins = countSelect ? countSelect.value : '3';

  if (!targetUsername) {
    showToast('스핀을 지급할 회원 아이디를 입력해주세요.');
    return;
  }

  try {
    const res = await fetch('/api/admin/reset-user-spins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin: currentUser.username,
        targetUsername,
        addSpins
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`✅ ${data.message}`);
      if (targetInput) targetInput.value = '';
      loadAdminUserList();
      // 만약 자기 자신 충전이면 즉시 동기화
      if (targetUsername.toLowerCase() === currentUser.username.toLowerCase()) {
        syncSpinStatusFromServer();
      }
    } else {
      showToast(data.error || '지급 실패');
    }
  } catch (e) {
    showToast('통신 오류 발생');
  }
}

// ── 20. 전역 함수 바인딩 ──
window.triggerSpin = triggerSpin;
window.toggleSound = toggleSound;
window.closeWinModal = closeWinModal;
window.closeWinModalAndSpin = closeWinModalAndSpin;
window.downloadCouponImage = downloadCouponImage;
window.toggleMarkUsed = toggleMarkUsed;
window.shareWinningResult = shareWinningResult;
window.shareWebsite = shareWebsite;
window.copyWinCouponCode = copyWinCouponCode;
window.clearAllVaultCoupons = clearAllVaultCoupons;
window.scrollToMyCoupons = scrollToMyCoupons;
window.copyDirectCode = copyDirectCode;

// 인증 및 관리자 함수 전역 노출
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.submitLogin = submitLogin;
window.submitRegister = submitRegister;
window.logoutUser = logoutUser;
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.loadAdminUserList = loadAdminUserList;
window.adminRechargeUserSpins = adminRechargeUserSpins;

// ── 19. 방문자 통계 및 디스코드 웹훅 연동 ──
(function trackVisitor() {
  try {
    const payload = {
      screen: `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio || 1}x)`,
      language: navigator.language || navigator.userLanguage || 'ko-KR',
      referrer: document.referrer || '직접 방문',
      url: window.location.href
    };

    fetch('/api/track-visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {
    // 무시 (오류 발생해도 사용자 화면에 전혀 영향 없음)
  }
})();
