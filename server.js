/**
 * ╔══════════════════════════════════════════════════════╗
 * ║       쿠폰 돌림판 - 보안 강화 Node.js 서버           ║
 * ║  - 웹 해킹 방지 (Helmet, XSS 방지, 파라미터 검증)    ║
 * ║  - 고트래픽 최적화 (Gzip, In-Memory 캐싱)            ║
 * ║  - 디스코드 웹훅 실시간 방문자 트래커               ║
 * ╚══════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const compression = require('compression');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');
const http    = require('http');
const https   = require('https');
const { URL } = require('url');
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1546893744412950588/E3Tquk7hSu_p9MOKhgg7E6XIl2X7xfKKadTKQEVvDYuz3NFAJEkK47QNqFGE8SjVY4yx';

const app  = express();
const PORT = parseInt(process.env.PORT || '80', 10);
const ALT_PORT = 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ════════════════════════════════════════
//  로거 설정 (Winston)
// ════════════════════════════════════════
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) =>
          `[${timestamp}] ${level}: ${message}`
        )
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log',   level: 'error', maxsize: 5242880, maxFiles: 5 }),
    new winston.transports.File({ filename: 'logs/combined.log',               maxsize: 5242880, maxFiles: 5 }),
    new winston.transports.File({ filename: 'logs/blocked.log',  level: 'warn', maxsize: 5242880, maxFiles: 5 })
  ]
});

// logs 폴더 생성
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

// ════════════════════════════════════════
//  In-memory 캐시 (NodeCache)
// ════════════════════════════════════════
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5분 캐시

// ════════════════════════════════════════
//  미들웨어 1: 프록시 신뢰 설정 (Cloudflare / Railway 등)
// ════════════════════════════════════════
app.set('trust proxy', 1);

// ════════════════════════════════════════
//  미들웨어 2: Request ID (디버깅용)
// ════════════════════════════════════════
app.use((req, res, next) => {
  req.id = uuidv4().substring(0, 8);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ════════════════════════════════════════
//  미들웨어 3: Helmet (HTTP 보안 헤더 - 해킹 방지)
// ════════════════════════════════════════
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ════════════════════════════════════════
//  미들웨어 4: CORS
// ════════════════════════════════════════
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));

// ════════════════════════════════════════
//  미들웨어 5: 요청 크기 제한 (페이로드 폭탄 해킹 방지)
// ════════════════════════════════════════
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ════════════════════════════════════════
//  미들웨어 6: GZip 압축
// ════════════════════════════════════════
app.use(compression({ level: 6, threshold: 1024 }));

// ════════════════════════════════════════
//  미들웨어 11: 요청 로깅
// ════════════════════════════════════════
app.use(morgan('short', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.path === '/health'
}));
app.use(express.static(path.join(__dirname, '.'), {
  etag: true,
  lastModified: true,
  index: 'index.html',
  setHeaders: (res, filePath) => {
    // HTML, JS, CSS, JSON은 항상 최신 버전 즉시 확인
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.json')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// ════════════════════════════════════════
//  API 라우트
// ════════════════════════════════════════

// 헬스체크 (모니터링용)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// 쿠폰 데이터 API (캐싱 포함)
app.get('/api/coupons', (req, res) => {
  const cacheKey = 'coupons_data';
  const cached = cache.get(cacheKey);

  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    const data = JSON.parse(fs.readFileSync('./coupons.json', 'utf8'));
    cache.set(cacheKey, data);
    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  } catch (e) {
    logger.error('쿠폰 데이터 읽기 실패', e);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 쿠폰 등록 신청 API
app.post('/api/coupons/submit', (req, res) => {
  const { name, provider, category, discount, condition, expiry, source } = req.body;

  // 입력 검증
  if (!name || !provider || !category || !discount || !expiry) {
    return res.status(400).json({ error: '필수 항목을 모두 입력해주세요.' });
  }

  // XSS 방지: HTML 태그 제거
  const sanitize = (str) => String(str || '').replace(/<[^>]*>/g, '').substring(0, 200);

  const newCoupon = {
    id: Date.now(),
    name: sanitize(name),
    provider: sanitize(provider),
    category: sanitize(category),
    discount: sanitize(discount),
    condition: sanitize(condition),
    expiry: sanitize(expiry),
    source: sanitize(source),
    status: 'pending',
    submittedAt: new Date().toISOString(),
    submittedIP: req.ip
  };

  // pending_coupons.json에 저장
  const pendingFile = './pending_coupons.json';
  let pending = [];
  if (fs.existsSync(pendingFile)) {
    pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
  }
  pending.push(newCoupon);
  fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2));

  logger.info(`✅ 쿠폰 등록 신청: ${provider} - ${name} (IP: ${req.ip})`);
  res.json({ success: true, message: '등록 신청 완료! 검토 후 반영됩니다.' });
});

// 서버 통계
app.get('/api/stats', (req, res) => {
  res.json({
    cacheKeys: cache.keys().length,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage()
  });
});

// ════════════════════════════════════════
//  디스코드 웹훅 알림 전송 함수
// ════════════════════════════════════════
function sendDiscordWebhook(payload) {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    const parsedUrl = new URL(DISCORD_WEBHOOK_URL);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'CouponMoa-Tracker/1.0'
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        logger.warn(`⚠️ 디스코드 웹훅 전송 상태 코드: ${res.statusCode}`);
      }
    });

    req.on('error', (err) => {
      logger.error('⚠️ 디스코드 웹훅 요청 오류:', err.message);
    });

    req.on('timeout', () => {
      req.destroy();
      logger.warn('⚠️ 디스코드 웹훅 요청 시간 초과');
    });

    req.write(postData);
    req.end();
  } catch (err) {
    logger.error('⚠️ 디스코드 웹훅 전송 실패:', err.message);
  }
}

// ════════════════════════════════════════
//  방문자 빅데이터 분석 & 텔레메트리 시스템
// ════════════════════════════════════════
const VISIT_LOGS_FILE = path.join(__dirname, 'visit_logs.json');

function loadVisitLogs() {
  try {
    if (fs.existsSync(VISIT_LOGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(VISIT_LOGS_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}
  return [];
}

function saveVisitLog(logEntry) {
  try {
    const logs = loadVisitLogs();
    logs.unshift(logEntry);
    if (logs.length > 500) logs.length = 500; // 최신 500건 유지
    fs.writeFileSync(VISIT_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (e) {}
}

// 방문자 기록 쿨다운 (동일 IP는 3분 동안 1회만 디스코드 알림 - 웹훅 도배 방지)
const visitAlertCache = new NodeCache({ stdTTL: 180, checkperiod: 60 });

// 방문자 정보 수집 및 디스코드 웹훅 발송 API
app.post('/api/track-visit', (req, res) => {
  try {
    // 1. 실제 클라이언트 IP 추출 (프록시/Cloudflare/Railway 등)
    const rawIp = (
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
      req.ip ||
      req.connection?.remoteAddress ||
      '알 수 없음'
    ).replace(/^::ffff:/, '');

    // 2. 브라우저/클라이언트에서 전달받은 정보
    const clientData = req.body || {};
    const screenRes = clientData.screen || '알 수 없음';
    const viewportRes = clientData.viewport || '알 수 없음';
    const language  = clientData.language || req.headers['accept-language']?.split(',')[0] || 'ko-KR';
    const referrer  = clientData.referrer || req.headers['referer'] || '직접 방문 (주소창 입력/즐겨찾기)';
    const currentUrl = clientData.url || `http://${req.headers.host || 'www.쿠폰.온라인.한국'}${req.originalUrl}`;
    const ua = req.headers['user-agent'] || '알 수 없음';
    const sessionId = clientData.sessionId || uuidv4().substring(0, 8);
    const refCode = clientData.refCode || null;

    // 3. 간이 기기 / OS / 브라우저 파싱
    let deviceType = '💻 PC / 데스크톱';
    if (/iphone/i.test(ua)) deviceType = '📱 iPhone';
    else if (/ipad/i.test(ua)) deviceType = '📟 iPad';
    else if (/android/i.test(ua)) {
      deviceType = /mobile/i.test(ua) ? '📱 Android 스마트폰' : '📟 Android 태블릿';
    }

    let os = '기타 OS';
    if (/windows/i.test(ua)) os = '🪟 Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = '🍎 macOS';
    else if (/iphone|ipad|ipod/i.test(ua)) os = '🍎 iOS';
    else if (/android/i.test(ua)) os = '🤖 Android';
    else if (/linux/i.test(ua)) os = '🐧 Linux';

    let browser = '기타 브라우저';
    if (/kakaotalk/i.test(ua)) browser = '🟡 카카오톡 인앱 브라우저';
    else if (/naver/i.test(ua)) browser = '🟢 네이버 인앱 브라우저';
    else if (/samsungbrowser/i.test(ua)) browser = '🌌 삼성 인터넷';
    else if (/edg\//i.test(ua)) browser = '🌊 Microsoft Edge';
    else if (/chrome/i.test(ua) && !/edg\//i.test(ua)) browser = '🌐 Google Chrome';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = '🧭 Apple Safari';
    else if (/firefox/i.test(ua)) browser = '🦊 Mozilla Firefox';

    // 4. 유입 채널 분석 (Referrer 및 URL 기반)
    let sourceChannel = '직접 접속 / 북마크';
    const lowerRef = referrer.toLowerCase();
    const lowerUrl = currentUrl.toLowerCase();
    if (lowerRef.includes('kakaotalk') || lowerUrl.includes('ref=kakao')) {
      sourceChannel = '🟡 카카오톡 공유';
    } else if (lowerRef.includes('instagram') || lowerUrl.includes('ref=insta')) {
      sourceChannel = '📸 인스타그램';
    } else if (lowerRef.includes('facebook') || lowerUrl.includes('ref=fb')) {
      sourceChannel = '🔵 페이스북';
    } else if (lowerRef.includes('youtube')) {
      sourceChannel = '🔴 유튜브';
    } else if (lowerRef.includes('naver')) {
      sourceChannel = '🟢 네이버';
    } else if (lowerRef.includes('쿠폰.온라인.한국') || lowerRef.includes('xn--')) {
      sourceChannel = '🌐 유동 웹포워딩 (쿠폰.온라인.한국)';
    } else if (refCode) {
      sourceChannel = `👥 친구초대 (${refCode})`;
    } else if (referrer.startsWith('http')) {
      try {
        sourceChannel = `🔗 ${new URL(referrer).hostname}`;
      } catch (e) {
        sourceChannel = '기타 외부 링크';
      }
    }

    // 한국 표준시 (KST, UTC+9)
    const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .replace(/\..+/, '') + ' (KST)';

    // 5. 방문자 로그 저장 (빅데이터 분석용)
    const logItem = {
      id: uuidv4().substring(0, 8),
      ip: rawIp,
      sessionId,
      deviceType,
      os,
      browser,
      screen: screenRes,
      viewport: viewportRes,
      language,
      referrer,
      sourceChannel,
      url: currentUrl,
      refCode,
      timeKST: nowKST,
      timestamp: new Date().toISOString()
    };
    saveVisitLog(logItem);

    // 6. 동일 IP 3분 쿨다운 체크 후 디스코드 알림
    const cooldownKey = `visit_${rawIp}`;
    if (!visitAlertCache.has(cooldownKey)) {
      visitAlertCache.set(cooldownKey, true);

      const embedPayload = {
        username: '쿠폰모아 방문자 알리미',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/879/879757.png',
        embeds: [
          {
            title: '🚨 신규 방문자 접속 알림!',
            description: `방문자가 **쿠폰모아(룰렛 이벤트)** 사이트에 접속했습니다.`,
            color: 0xFF5722,
            fields: [
              { name: '🌐 접속 IP 주소', value: `\`${rawIp}\``, inline: true },
              { name: '📱 기기 분류', value: deviceType, inline: true },
              { name: '💻 OS 및 환경', value: os, inline: true },
              { name: '🧭 브라우저', value: browser, inline: true },
              { name: '🖥️ 화면 해상도', value: `\`${screenRes}\``, inline: true },
              { name: '🎯 유입 경로', value: sourceChannel, inline: true },
              { name: '🔗 접속 출처 (Referrer)', value: referrer.length > 200 ? referrer.substring(0, 200) + '...' : referrer, inline: false },
              { name: '📍 접속 URL', value: currentUrl.length > 200 ? currentUrl.substring(0, 200) + '...' : currentUrl, inline: false },
              { name: '⏰ 접속 일시', value: `\`${nowKST}\``, inline: false }
            ],
            footer: { text: '쿠폰모아 실시간 방문자 트래커 • 빅데이터 수집 중' },
            timestamp: new Date().toISOString()
          }
        ]
      };

      sendDiscordWebhook(embedPayload);
      logger.info(`🔔 방문자 웹훅 발송: IP=${rawIp} 채널=${sourceChannel} 기기=${deviceType}`);
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('방문자 추적 실패:', err);
    res.status(500).json({ error: '추적 실패' });
  }
});

// ════════════════════════════════════════
//  회원 관리 & 인증 & 스핀 시스템 (DB 및 API)
// ════════════════════════════════════════
const USERS_FILE = path.join(__dirname, 'users.json');

const DEFAULT_INITIAL_USERS = [
  {
    id: 'admin-taeiyoon',
    username: 'taeiyoon',
    password: 'a3253511!',
    name: '최고 관리자',
    role: 'admin',
    createdAt: '2026-09-01T09:00:00.000Z',
    remainingSpins: 999999,
    lastResetAt: Date.now(),
    savedCoupons: []
  },
  {
    id: 'user-001',
    username: 'minji_lee',
    password: 'user1234!',
    name: '이민지',
    role: 'member',
    createdAt: '2026-09-03T11:24:00.000Z',
    remainingSpins: 2,
    lastResetAt: Date.now(),
    savedCoupons: [
      {
        id: 'sbux_dessert',
        name: '스타벅스 달콤한 디저트 세트 (아메리카노 2잔 + 케이크)',
        provider: '스타벅스',
        discount: '세트 교환권',
        couponCode: '8809 3921 4402 1194',
        expiry: '2026-12-31',
        wonAt: '2026-09-08 18:30',
        isUsed: false
      }
    ]
  },
  {
    id: 'user-002',
    username: 'junho_park',
    password: 'user1234!',
    name: '박준호',
    role: 'member',
    createdAt: '2026-09-04T15:10:00.000Z',
    remainingSpins: 1,
    lastResetAt: Date.now(),
    savedCoupons: [
      {
        id: 'bhc_bburing',
        name: 'BHC 뿌링클 + 콜라 1.25L 세트 무료',
        provider: 'BHC치킨',
        discount: '치킨세트 FREE',
        couponCode: '8809 5519 8271 3912',
        expiry: '2026-11-30',
        wonAt: '2026-09-07 20:15',
        isUsed: true
      }
    ]
  },
  {
    id: 'user-003',
    username: 'soyeon_choi',
    password: 'user1234!',
    name: '최소연',
    role: 'member',
    createdAt: '2026-09-05T09:40:00.000Z',
    remainingSpins: 3,
    lastResetAt: Date.now(),
    savedCoupons: [
      {
        id: 'shinsegae_50k',
        name: '신세계백화점 상품권 50,000원권',
        provider: '신세계',
        discount: '50,000원권',
        couponCode: '8809 9901 2283 5519',
        expiry: '2026-12-31',
        wonAt: '2026-09-08 14:02',
        isUsed: false
      }
    ]
  },
  {
    id: 'user-004',
    username: 'dohyun_kim',
    password: 'user1234!',
    name: '김도현',
    role: 'member',
    createdAt: '2026-09-06T14:22:00.000Z',
    remainingSpins: 0,
    lastResetAt: Date.now(),
    savedCoupons: [
      {
        id: 'baemin_10k',
        name: '배달의민족 모바일 상품권 10,000원권',
        provider: '배달의민족',
        discount: '10,000원권',
        couponCode: '8809 1239 8831 4920',
        expiry: '2026-12-15',
        wonAt: '2026-09-08 22:11',
        isUsed: false
      }
    ]
  },
  {
    id: 'user-005',
    username: 'hyeonwoo_jung',
    password: 'user1234!',
    name: '정현우',
    role: 'member',
    createdAt: '2026-09-07T10:15:00.000Z',
    remainingSpins: 2,
    lastResetAt: Date.now(),
    savedCoupons: []
  },
  {
    id: 'user-006',
    username: 'yujin_kang',
    password: 'user1234!',
    name: '강유진',
    role: 'member',
    createdAt: '2026-09-07T16:50:00.000Z',
    remainingSpins: 1,
    lastResetAt: Date.now(),
    savedCoupons: []
  },
  {
    id: 'user-007',
    username: 'seungmin_yoon',
    password: 'user1234!',
    name: '윤승민',
    role: 'member',
    createdAt: '2026-09-08T08:30:00.000Z',
    remainingSpins: 3,
    lastResetAt: Date.now(),
    savedCoupons: []
  }
];

// 사용자 데이터 로드/저장
function loadUsersData() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        // taeiyoon 계정 항상 보장
        const hasAdmin = parsed.users.some(u => u.username.toLowerCase() === 'taeiyoon');
        if (!hasAdmin) {
          parsed.users.unshift(DEFAULT_INITIAL_USERS[0]);
          saveUsersData(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    logger.error('사용자 데이터 읽기 실패:', e);
  }

  // 파일이 없거나 비어있으면 기본 데이터로 초기화
  const initDb = { users: DEFAULT_INITIAL_USERS };
  saveUsersData(initDb);
  return initDb;
}

function saveUsersData(data) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    logger.error('사용자 데이터 저장 실패:', e);
  }
}

// 24시간 쿨타임 및 스핀 3회 계산 헬퍼 함수
function calculateSpins(user) {
  // 관리자 계정은 항상 무제한!
  if (user.role === 'admin' || user.username === 'taeiyoon') {
    return {
      remainingSpins: 999999,
      isUnlimited: true,
      nextResetTime: null,
      cooldownSeconds: 0
    };
  }

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  let lastReset = user.lastResetAt || 0;

  // 마지막 리셋 시점으로부터 24시간이 지났으면 3회로 재충전
  if (now - lastReset >= ONE_DAY_MS) {
    user.remainingSpins = 3;
    user.lastResetAt = now;
    return {
      remainingSpins: 3,
      isUnlimited: false,
      nextResetTime: now + ONE_DAY_MS,
      cooldownSeconds: 24 * 3600
    };
  }

  const cooldownMs = Math.max(0, (lastReset + ONE_DAY_MS) - now);
  return {
    remainingSpins: Math.max(0, user.remainingSpins ?? 0),
    isUnlimited: false,
    nextResetTime: lastReset + ONE_DAY_MS,
    cooldownSeconds: Math.ceil(cooldownMs / 1000)
  };
}

// ════════════════════════════════════════
//  휴대폰 SMS 인증 캐시 (유효시간 3분)
// ════════════════════════════════════════
const smsVerificationCache = new NodeCache({ stdTTL: 180, checkperiod: 30 });

// 0-1) 휴대폰 인증번호 발송 API (1인 1계정 중복 검사)
app.post('/api/auth/send-sms', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: '휴대폰 번호를 입력해주세요.' });
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (!/^01[016789]\d{7,8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: '올바른 휴대폰 번호 형식이 아닙니다. (예: 01012345678)' });
    }

    // 1인 1계정 원칙: 이미 가입된 휴대폰 번호인지 검사
    const db = loadUsersData();
    const isAlreadyRegistered = db.users.some(u => u.phone === cleanPhone);
    if (isAlreadyRegistered) {
      return res.status(400).json({ error: '이미 해당 휴대폰 번호로 등록된 계정이 존재합니다. (1인 1계정 원칙)' });
    }

    // 6자리 난수 인증번호 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    smsVerificationCache.set(cleanPhone, { code, verified: false, expiresAt: Date.now() + 180000 });

    logger.info(`📱 [SMS 발송] 수신: ${cleanPhone} | 인증번호: ${code}`);

    res.json({
      success: true,
      message: `인증번호 [${code}]가 발송되었습니다.`,
      code: code
    });
  } catch (e) {
    logger.error('SMS 발송 실패:', e);
    res.status(500).json({ error: '인증번호 발송 처리 중 오류가 발생했습니다.' });
  }
});

// 0-2) 휴대폰 인증번호 확인 API
app.post('/api/auth/verify-sms', (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: '휴대폰 번호와 인증번호를 입력해주세요.' });
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    const cleanCode = String(code).trim();

    const cached = smsVerificationCache.get(cleanPhone);
    if (!cached) {
      return res.status(400).json({ error: '인증번호가 만료되었거나 발송되지 않았습니다. 다시 발송해주세요.' });
    }

    if (cached.code !== cleanCode) {
      return res.status(400).json({ error: '인증번호 6자리가 일치하지 않습니다.' });
    }

    // 인증 완료 상태로 갱신 (10분 유예)
    smsVerificationCache.set(cleanPhone, { ...cached, verified: true }, 600);

    logger.info(`✅ [SMS 인증완료] 번호: ${cleanPhone}`);
    res.json({ success: true, message: '휴대폰 본인 인증이 성공적으로 완료되었습니다!' });
  } catch (e) {
    logger.error('SMS 인증 실패:', e);
    res.status(500).json({ error: '인증 확인 처리 중 오류가 발생했습니다.' });
  }
});

// 1) 회원가입 API (SMS 대기 없이 즉시 가입 & 1인 1계정 검증 & 합법적 마케팅 프로필 데이터 수집)
app.post('/api/auth/register', (req, res) => {
  try {
    const {
      username,
      password,
      name,
      phone,
      telecom,
      email,
      ageGroup,
      gender,
      region,
      interest,
      referralCode,
      marketingConsent
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해주세요.' });
    }

    const cleanUsername = String(username).trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ error: '아이디는 3자 이상 30자 이하여야 합니다.' });
    }

    if (String(password).length < 4) {
      return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다.' });
    }

    const db = loadUsersData();
    const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
    }

    // 휴대폰 번호 유효성 및 1인 1계정 중복 검사 (문자 인증 대기 없이 즉시 검증)
    let cleanPhone = null;
    if (cleanUsername.toLowerCase() !== 'taeiyoon') {
      if (!phone) {
        return res.status(400).json({ error: '기프티콘 발송을 위해 휴대폰 번호를 입력해주세요.' });
      }
      cleanPhone = String(phone).replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11 || !cleanPhone.startsWith('01')) {
        return res.status(400).json({ error: '올바른 휴대폰 번호(010XXXXXXXX)를 입력해주세요.' });
      }

      // 1인 1계정 중복 검사
      const phoneDuplicate = db.users.find(u => u.phone === cleanPhone);
      if (phoneDuplicate) {
        return res.status(400).json({ error: '이미 해당 휴대폰 번호로 가입된 계정이 존재합니다. (1인 1계정 원칙)' });
      }
    }

    // 신규 회원의 고유 추천인 코드 생성 (예: MOA-7721)
    const myReferralCode = 'MOA-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    // 추천인 코드 입력 시 혜택 처리 (추천인 +1스핀, 가입자 +1스핀)
    let bonusSpin = 0;
    let referredBy = null;
    if (referralCode && String(referralCode).trim()) {
      const targetRefCode = String(referralCode).trim().toUpperCase();
      const inviter = db.users.find(u => (u.referralCode || '').toUpperCase() === targetRefCode);
      if (inviter) {
        inviter.remainingSpins = (inviter.remainingSpins || 0) + 1;
        if (!inviter.referralHistory) inviter.referralHistory = [];
        inviter.referralHistory.unshift({
          friendUsername: cleanUsername,
          joinedAt: new Date().toISOString()
        });
        bonusSpin = 1;
        referredBy = inviter.username;
        logger.info(`🎉 [추천인 혜택] ${inviter.username} & ${cleanUsername} 모두 스핀 +1회 지급 완료!`);
      }
    }

    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '').split(',')[0].trim();
    const now = Date.now();
    const newUser = {
      id: uuidv4().substring(0, 10),
      username: cleanUsername,
      password: String(password),
      name: (name || cleanUsername).substring(0, 20),
      role: (cleanUsername.toLowerCase() === 'taeiyoon') ? 'admin' : 'member',
      phone: cleanPhone,
      telecom: telecom || 'SKT',
      email: email ? String(email).trim() : '',
      ageGroup: ageGroup || '20대',
      gender: gender || '미선택',
      region: region || '서울',
      interest: interest || '백화점 상품권',
      marketingConsent: !!marketingConsent,
      referralCode: myReferralCode,
      referredBy: referredBy,
      referralHistory: [],
      attendance: { streak: 0, lastDate: null, history: [] },
      createdAt: new Date().toISOString(),
      remainingSpins: (cleanUsername.toLowerCase() === 'taeiyoon') ? 999999 : (3 + bonusSpin),
      lastResetAt: now,
      savedCoupons: [],
      registeredIp: clientIp,
      registeredUserAgent: req.headers['user-agent'] || ''
    };

    db.users.push(newUser);
    saveUsersData(db);

    logger.info(`✨ 신규 회원가입 완료: ${newUser.username} (${newUser.phone}, ${newUser.telecom}, ${newUser.region})`);

    res.json({
      success: true,
      message: bonusSpin > 0 
        ? '회원가입이 완료되었습니다! 추천인 보너스로 스핀 4회가 지급되었습니다.'
        : '회원가입이 완료되었습니다! 3회 무료 스핀이 지급되었습니다.',
      user: {
        username: newUser.username,
        role: newUser.role,
        referralCode: newUser.referralCode
      }
    });
  } catch (e) {
    logger.error('회원가입 실패:', e);
    res.status(500).json({ error: '회원가입 처리 중 오류 발생' });
  }
});

// 2) 로그인 API (지정 관리자 계정 taeiyoon / a3253511! 자동 지원)
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password);

    const db = loadUsersData();
    let user = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

    // 특별 배려: taeiyoon 관리자 계정이 아직 DB에 없으면 지정된 비번으로 자동 생성
    if (cleanUsername.toLowerCase() === 'taeiyoon' && cleanPassword === 'a3253511!') {
      if (!user) {
        user = {
          id: 'admin-taeiyoon',
          username: 'taeiyoon',
          password: 'a3253511!',
          name: '최고 관리자',
          role: 'admin',
          createdAt: new Date().toISOString(),
          remainingSpins: 999999,
          lastResetAt: Date.now(),
          savedCoupons: []
        };
        db.users.push(user);
        saveUsersData(db);
        logger.info('👑 최고 관리자(taeiyoon) 계정 자동 활성화 완료');
      } else {
        user.role = 'admin';
        user.password = 'a3253511!';
        saveUsersData(db);
      }
    }

    if (!user || user.password !== cleanPassword) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 스핀 상태 동기화
    const spinState = calculateSpins(user);
    saveUsersData(db);

    logger.info(`🔑 로그인 성공: ${user.username} (역할: ${user.role})`);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        role: user.role,
        remainingSpins: spinState.remainingSpins,
        isUnlimited: spinState.isUnlimited,
        nextResetTime: spinState.nextResetTime,
        cooldownSeconds: spinState.cooldownSeconds,
        savedCoupons: user.savedCoupons || []
      }
    });
  } catch (e) {
    logger.error('로그인 실패:', e);
    res.status(500).json({ error: '로그인 처리 중 오류 발생' });
  }
});

// 3) 스핀 상태 조회 (24시간 주기 3회 체크)
app.get('/api/spin/status', (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const db = loadUsersData();
    const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const spinState = calculateSpins(user);
    saveUsersData(db);

    res.json({
      success: true,
      username: user.username,
      role: user.role,
      ...spinState
    });
  } catch (e) {
    logger.error('스핀 상태 조회 실패:', e);
    res.status(500).json({ error: '상태 조회 실패' });
  }
});

// 4) 스핀 1회 차감 API (서버 검증: 기회 없으면 차단)
app.post('/api/spin/use', (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(401).json({ error: '로그인이 필요합니다. 회원가입 후 이용해주세요.' });
    }

    const db = loadUsersData();
    const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) {
      return res.status(404).json({ error: '유효하지 않은 계정입니다.' });
    }

    const spinState = calculateSpins(user);

    // 일반 회원이고 잔여 횟수가 0인 경우 엄격히 거부
    if (!spinState.isUnlimited && spinState.remainingSpins <= 0) {
      return res.status(403).json({
        error: '오늘의 뽑기 기회(3회)를 모두 소진하셨습니다.',
        cooldownSeconds: spinState.cooldownSeconds,
        nextResetTime: spinState.nextResetTime
      });
    }

    // 스핀 차감 (일반 회원만)
    if (!spinState.isUnlimited) {
      user.remainingSpins = Math.max(0, user.remainingSpins - 1);
      saveUsersData(db);
    }

    res.json({
      success: true,
      remainingSpins: spinState.isUnlimited ? 999999 : user.remainingSpins,
      isUnlimited: spinState.isUnlimited,
      nextResetTime: spinState.nextResetTime,
      cooldownSeconds: spinState.cooldownSeconds
    });
  } catch (e) {
    logger.error('스핀 차감 실패:', e);
    res.status(500).json({ error: '스핀 처리 오류' });
  }
});

// 5) 쿠폰 당첨 저장/보관함 동기화 API (회원 계정별 보관)
app.post('/api/coupons/sync', (req, res) => {
  try {
    const { username, coupon } = req.body;
    if (!username) {
      return res.status(400).json({ error: '로그인 필요' });
    }

    const db = loadUsersData();
    const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) {
      return res.status(404).json({ error: '사용자 없음' });
    }

    if (!user.savedCoupons) user.savedCoupons = [];

    if (coupon) {
      // 꽝이 아닌 정식 쿠폰만 저장
      if (!coupon.isBoom) {
        user.savedCoupons.unshift(coupon);
      }
    }

    saveUsersData(db);

    res.json({
      success: true,
      savedCoupons: user.savedCoupons
    });
  } catch (e) {
    logger.error('쿠폰 동기화 실패:', e);
    res.status(500).json({ error: '동기화 실패' });
  }
});

// 6) 쿠폰 사용 처리 토글 API
app.post('/api/coupons/toggle-use', (req, res) => {
  try {
    const { username, couponCode } = req.body;
    if (!username || !couponCode) return res.status(400).json({ error: '인자 부족' });

    const db = loadUsersData();
    const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user || !user.savedCoupons) return res.status(404).json({ error: '쿠폰 없음' });

    const target = user.savedCoupons.find(c => c.couponCode === couponCode);
    if (target) {
      target.isUsed = !target.isUsed;
      target.usedAt = target.isUsed ? new Date().toISOString() : null;
      saveUsersData(db);
      return res.json({ success: true, isUsed: target.isUsed, coupon: target });
    }
    res.status(404).json({ error: '쿠폰 없음' });
  } catch (e) {
    res.status(500).json({ error: '사용 처리 실패' });
  }
});

// 7) 최고 관리자 전용 회원 목록 (수집된 모든 프로필 데이터 포함)
app.get('/api/admin/users', (req, res) => {
  try {
    const adminUser = req.query.admin;
    if (!adminUser || String(adminUser).toLowerCase() !== 'taeiyoon') {
      return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
    }

    const db = loadUsersData();
    const sanitizedUsers = db.users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      phone: u.phone || '-',
      telecom: u.telecom || '-',
      email: u.email || '-',
      ageGroup: u.ageGroup || '-',
      gender: u.gender || '-',
      region: u.region || '-',
      interest: u.interest || '-',
      marketingConsent: u.marketingConsent ? '✅ 동의' : '미동의',
      referralCode: u.referralCode || '-',
      referredBy: u.referredBy || '-',
      remainingSpins: u.role === 'admin' ? '무제한 (∞)' : u.remainingSpins,
      createdAt: u.createdAt,
      couponCount: (u.savedCoupons || []).length,
      registeredIp: u.registeredIp || '-'
    }));

    res.json({
      success: true,
      totalUsers: sanitizedUsers.length,
      users: sanitizedUsers
    });
  } catch (e) {
    logger.error('관리자 회원 목록 조회 실패:', e);
    res.status(500).json({ error: '조회 실패' });
  }
});

// 7-1) 최고 관리자 전용: 실시간 방문자 빅데이터 & 유입 통계 API
app.get('/api/admin/analytics', (req, res) => {
  try {
    const adminUser = req.query.admin;
    if (!adminUser || String(adminUser).toLowerCase() !== 'taeiyoon') {
      return res.status(403).json({ error: '관리자 권한 필요' });
    }

    const logs = loadVisitLogs();
    const db = loadUsersData();

    // 오늘 날짜 KST 기준
    const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayVisits = logs.filter(l => (l.timeKST || '').startsWith(nowKST) || (l.timestamp || '').startsWith(nowKST)).length;

    // 유입 채널 통계
    const channelCounts = {};
    const deviceCounts = {};
    const osCounts = {};
    const regionUserCounts = {};

    logs.forEach(l => {
      const ch = l.sourceChannel || '기타/직접';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;

      const dev = l.deviceType || 'PC';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

      const osName = l.os || '기타';
      osCounts[osName] = (osCounts[osName] || 0) + 1;
    });

    db.users.forEach(u => {
      if (u.region) {
        regionUserCounts[u.region] = (regionUserCounts[u.region] || 0) + 1;
      }
    });

    res.json({
      success: true,
      totalVisits: logs.length,
      todayVisits: Math.max(todayVisits, 1),
      totalUsers: db.users.length,
      channels: channelCounts,
      devices: deviceCounts,
      os: osCounts,
      regionUsers: regionUserCounts,
      recentLogs: logs.slice(0, 60)
    });
  } catch (e) {
    logger.error('통계 분석 실패:', e);
    res.status(500).json({ error: '통계 분석 실패' });
  }
});

// 7-2) 최고 관리자 전용: 수집된 회원 데이터 Excel(CSV) 원클릭 다운로드 API
app.get('/api/admin/export-users-csv', (req, res) => {
  try {
    const adminUser = req.query.admin;
    if (!adminUser || String(adminUser).toLowerCase() !== 'taeiyoon') {
      return res.status(403).send('관리자 권한이 필요합니다.');
    }

    const db = loadUsersData();
    const rows = [
      ['아이디', '이름', '전화번호', '통신사', '이메일', '연령대', '성별', '거주지역', '관심경품', '마케팅동의', '추천인코드', '스핀잔여', '당첨쿠폰수', '가입일시', '가입IP']
    ];

    db.users.forEach(u => {
      rows.push([
        u.username || '',
        u.name || '',
        u.phone || '',
        u.telecom || '',
        u.email || '',
        u.ageGroup || '',
        u.gender || '',
        u.region || '',
        u.interest || '',
        u.marketingConsent ? '동의' : '미동의',
        u.referralCode || '',
        u.remainingSpins || 0,
        (u.savedCoupons || []).length,
        u.createdAt ? u.createdAt.split('T')[0] : '',
        u.registeredIp || ''
      ]);
    });

    // 엑셀 한글 깨짐 방지 UTF-8 BOM(\uFEFF)
    const csvContent = '\uFEFF' + rows.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="coupon_users_database.csv"');
    res.send(csvContent);
  } catch (e) {
    res.status(500).send('CSV 생성 오류');
  }
});

// 8) 최고 관리자 전용: 특정 회원 스핀 기회 즉시 충전 API
app.post('/api/admin/reset-user-spins', (req, res) => {
  try {
    const { admin, targetUsername, addSpins } = req.body;
    if (!admin || String(admin).toLowerCase() !== 'taeiyoon') {
      return res.status(403).json({ error: '관리자 권한 필요' });
    }

    const db = loadUsersData();
    const target = db.users.find(u => u.username.toLowerCase() === String(targetUsername).toLowerCase());
    if (!target) return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });

    target.remainingSpins = (target.remainingSpins || 0) + (parseInt(addSpins, 10) || 3);
    target.lastResetAt = Date.now();
    saveUsersData(db);

    logger.info(`👑 관리자가 ${target.username}의 스핀을 ${target.remainingSpins}회로 변경함`);
    res.json({ success: true, message: `${target.username}님의 스핀이 ${target.remainingSpins}회로 충전되었습니다!` });
  } catch (e) {
    logger.error('스핀 충전 실패:', e);
    res.status(500).json({ error: '충전 실패' });
  }
});

// 9) 20,000원 스핀 충전 API (모의 간편결제 시스템)
app.post('/api/spin/recharge', (req, res) => {
  try {
    const { username, paymentMethod, amount, spins } = req.body;
    if (!username) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const db = loadUsersData();
    const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 기본 20,000원에 1회 스핀 지급
    const addCount = parseInt(spins, 10) || 1;
    user.remainingSpins = (user.remainingSpins || 0) + addCount;
    user.lastResetAt = Date.now();
    if (!user.rechargeHistory) user.rechargeHistory = [];
    user.rechargeHistory.unshift({
      orderId: 'ORD-' + Date.now().toString(36).toUpperCase(),
      name: '프리미엄 럭키 스핀 1회 충전권',
      amount: amount || '20,000원',
      spinsAdded: addCount,
      paymentMethod: paymentMethod || '간편결제',
      paidAt: new Date().toISOString()
    });

    saveUsersData(db);

    logger.info(`💳 [결제승인] ${user.username} - 20,000원 결제 완료 (+${addCount}스핀, 수단: ${paymentMethod})`);

    res.json({
      success: true,
      message: '20,000원 결제가 정상 승인되었습니다! 럭키 스핀 1회가 충전되었습니다.',
      remainingSpins: user.role === 'admin' ? 999999 : user.remainingSpins,
      spinsAdded: addCount
    });
  } catch (e) {
    logger.error('스핀 충전 처리 실패:', e);
    res.status(500).json({ error: '결제 승인 처리 중 오류가 발생했습니다.' });
  }
});

// 10) 실시간 생생 리뷰 시스템 API
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');
const DEFAULT_REVIEWS = [
  {
    id: 1,
    name: '이지* (서울 강남)',
    badge: '신세계 상품권 50,000원',
    rating: 5,
    date: '방금 전',
    text: '와 신세계 5만원권 진짜 뜸 ㄷㄷ 이마트 가서 장보고 왔습니다 ㅋㅋㅋ 매일 룰렛 돌린 보람이 있네요 최고입니다!',
    likes: 142
  },
  {
    id: 2,
    name: '박준* (경기 수원)',
    badge: 'BHC 뿌링클 + 콜라 세트',
    rating: 5,
    date: '3분 전',
    text: 'BHC 뿌링클 치킨 세트 당첨 실화냐 ㅋㅋㅋ 오늘 저녁은 치킨이다 친구들한테 단톡방에 링크 다 뿌림 꿀맛',
    likes: 98
  },
  {
    id: 3,
    name: '김민* (인천 부평)',
    badge: '스타벅스 디저트 세트',
    rating: 5,
    date: '12분 전',
    text: '출근길에 돌렸는데 스타벅스 디저트 세트 나옴!! 카운터에서 바코드 찍으니까 0원 결제되네요 매일 들어옵니다',
    likes: 85
  },
  {
    id: 4,
    name: '최소* (부산 해운대)',
    badge: '배달의민족 10,000원권',
    rating: 5,
    date: '25분 전',
    text: '배민 1만원권 쿠폰 등록하니까 배민캐시로 바로 들어옴 ㅋㅋㅋ 점심 배달 시킬 때 잘 썼습니다 감사해요!',
    likes: 67
  },
  {
    id: 5,
    name: '정현* (대전 유성)',
    badge: '올리브영 20,000원권',
    rating: 5,
    date: '41분 전',
    text: '올리브영 2만원권 개꿀... 화장품 하나 공짜로 건졌음 바코드도 선명하고 매장에서 1초만에 찍힘 대박',
    likes: 54
  },
  {
    id: 6,
    name: '강유* (대구 수성)',
    badge: 'GS25 바나나우유',
    rating: 5,
    date: '1시간 전',
    text: '소소하게 바나나우유 당첨돼서 편의점 들러서 바꿔먹었어요 ㅋㅋ 꽝도 가끔 나오지만 무료라 넘 재밌음',
    likes: 42
  }
];

function loadReviewsData() {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return DEFAULT_REVIEWS;
}

function saveReviewsData(data) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

app.get('/api/reviews', (req, res) => {
  res.json({ success: true, reviews: loadReviewsData() });
});

app.post('/api/reviews', (req, res) => {
  try {
    const { name, badge, rating, text } = req.body;
    if (!text || !name) return res.status(400).json({ error: '작성자와 리뷰 내용을 입력해주세요.' });

    const sanitize = (str) => String(str || '').replace(/<[^>]*>/g, '').substring(0, 300);
    const reviews = loadReviewsData();
    const newReview = {
      id: Date.now(),
      name: sanitize(name),
      badge: sanitize(badge || '당첨 쿠폰'),
      rating: parseInt(rating, 10) || 5,
      date: '방금 전',
      text: sanitize(text),
      likes: 1
    };
    reviews.unshift(newReview);
    saveReviewsData(reviews);

    res.json({ success: true, review: newReview });
  } catch (e) {
    res.status(500).json({ error: '리뷰 등록 실패' });
  }
});

// 11) 친구 초대 (추천인 통계) API
app.get('/api/referral/stats', (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(401).json({ error: '로그인이 필요합니다.' });

    const db = loadUsersData();
    const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

    if (!user.referralCode) {
      user.referralCode = 'MOA-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      saveUsersData(db);
    }

    const history = user.referralHistory || [];
    res.json({
      success: true,
      referralCode: user.referralCode,
      totalInvited: history.length,
      earnedSpins: history.length,
      history: history.slice(0, 10)
    });
  } catch (e) {
    res.status(500).json({ error: '추천 통계 조회 실패' });
  }
});

// 12) 매일매일 출석체크 현황 조회 API
app.get('/api/attendance/status', (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(401).json({ error: '로그인이 필요합니다.' });

    const db = loadUsersData();
    const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

    if (!user.attendance) {
      user.attendance = { streak: 0, lastDate: null, history: [] };
      saveUsersData(db);
    }

    const todayKST = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
    const isCheckedToday = user.attendance.lastDate === todayKST;

    res.json({
      success: true,
      today: todayKST,
      isCheckedToday,
      streak: user.attendance.streak || 0,
      history: user.attendance.history || []
    });
  } catch (e) {
    res.status(500).json({ error: '출석 현황 조회 실패' });
  }
});

// 13) 매일매일 출석체크 하기 API (3일 연속 +1스핀, 7일 연속 +2스핀)
app.post('/api/attendance/check', (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(401).json({ error: '로그인이 필요합니다.' });

    const db = loadUsersData();
    const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

    if (!user.attendance) user.attendance = { streak: 0, lastDate: null, history: [] };

    const todayKST = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
    if (user.attendance.lastDate === todayKST) {
      return res.status(400).json({ error: '오늘 이미 출석체크를 완료하셨습니다!' });
    }

    const yesterdayDate = new Date(Date.now() + 9 * 3600 * 1000 - 24 * 3600 * 1000).toISOString().split('T')[0];
    let newStreak = (user.attendance.lastDate === yesterdayDate) ? ((user.attendance.streak || 0) + 1) : 1;
    if (newStreak > 7) newStreak = 1;

    let bonusSpins = 0;
    let rewardMessage = '오늘 출석체크가 완료되었습니다!';
    if (newStreak === 3) {
      bonusSpins = 1;
      rewardMessage = '🎉 3일 연속 출석 달성! 보너스 스핀 +1회가 지급되었습니다!';
    } else if (newStreak === 7) {
      bonusSpins = 2;
      rewardMessage = '🏆 7일 연속 출석 완주! 대박 보너스 스핀 +2회가 지급되었습니다!';
    }

    if (bonusSpins > 0 && user.role !== 'admin') {
      user.remainingSpins = (user.remainingSpins || 0) + bonusSpins;
    }

    user.attendance.lastDate = todayKST;
    user.attendance.streak = newStreak;
    if (!user.attendance.history) user.attendance.history = [];
    user.attendance.history.unshift({ date: todayKST, streak: newStreak, bonusSpins });

    saveUsersData(db);

    logger.info(`📅 [출석체크] ${user.username} - 연속 ${newStreak}일차 (보너스: +${bonusSpins}스핀)`);

    res.json({
      success: true,
      message: rewardMessage,
      streak: newStreak,
      bonusSpins,
      remainingSpins: user.remainingSpins,
      isCheckedToday: true
    });
  } catch (e) {
    logger.error('출석체크 실패:', e);
    res.status(500).json({ error: '출석체크 처리 중 오류 발생' });
  }
});

// 14) 실시간 명예의 전당 & 럭키 랭킹 (실제 회원 + 봇 자연스러운 혼합)
const REALISTIC_BOT_WINNERS = [
  { rank: 1, name: '김*진 (인천 송도)', item: '신세계상품권 50,000원권', category: '백화점', value: '50,000원', wonAgo: '3분 전', badge: '👑 잭팟 1위', avatar: '🥇' },
  { rank: 2, name: '박*훈 (경기 수원)', item: 'BHC 뿌링클 + 콜라 세트', category: '치킨', value: '24,500원', wonAgo: '9분 전', badge: '🔥 인기 2위', avatar: '🥈' },
  { rank: 3, name: '이*서 (서울 강남)', item: '올리브영 20,000원권', category: '뷰티', value: '20,000원', wonAgo: '16분 전', badge: '✨ 실속 3위', avatar: '🥉' },
  { rank: 4, name: '최*준 (부산 해운대)', item: '도미노피자 포테이토 세트', category: '피자', value: '27,000원', wonAgo: '27분 전', badge: 'TOP 4', avatar: '🍕' },
  { rank: 5, name: '정*우 (대전 유성)', item: '배달의민족 10,000원 상품권', category: '배달', value: '10,000원', wonAgo: '39분 전', badge: 'TOP 5', avatar: '🛵' },
  { rank: 6, name: '윤*아 (광주 광산)', item: '스타벅스 달콤한 디저트 세트', category: '카페', value: '15,800원', wonAgo: '51분 전', badge: 'TOP 6', avatar: '☕' },
  { rank: 7, name: '송*민 (서울 마포)', item: '맥도날드 빅맥 세트 무료', category: '버거', value: '7,200원', wonAgo: '1시간 전', badge: 'TOP 7', avatar: '🍔' },
  { rank: 8, name: '강*호 (대구 수성)', item: '네이버페이 5,000원 포인트', category: '포인트', value: '5,000원', wonAgo: '1시간 전', badge: 'TOP 8', avatar: '💚' },
  { rank: 9, name: '조*영 (울산 남구)', item: '배스킨라빈스 파인트 세트', category: '아이스크림', value: '9,800원', wonAgo: '2시간 전', badge: 'TOP 9', avatar: '🍨' },
  { rank: 10, name: '한*석 (경기 성남)', item: '신세계상품권 50,000원권', category: '백화점', value: '50,000원', wonAgo: '2시간 전', badge: 'TOP 10', avatar: '💳' }
];

app.get('/api/ranking', (req, res) => {
  try {
    const db = loadUsersData();
    const realWinners = [];

    db.users.forEach(u => {
      if (u.savedCoupons && u.savedCoupons.length > 0) {
        u.savedCoupons.forEach(c => {
          const maskedName = u.name 
            ? (u.name.length > 2 ? u.name[0] + '*' + u.name.slice(2) : u.name[0] + '*')
            : (u.username.substring(0, 3) + '***');
          realWinners.push({
            name: `${maskedName} (회원)`,
            item: c.name || '럭키 쿠폰',
            category: c.category || '기프티콘',
            value: c.discount || '혜택 당첨',
            wonAgo: c.wonAt ? '오늘 당첨' : '방금 전',
            badge: '실제 당첨',
            avatar: c.emoji || '🎁'
          });
        });
      }
    });

    const combined = [...realWinners, ...REALISTIC_BOT_WINNERS];
    const top10 = combined.slice(0, 10).map((w, idx) => ({
      ...w,
      rank: idx + 1,
      badge: idx === 0 ? '👑 잭팟 1위' : (idx === 1 ? '🔥 인기 2위' : (idx === 2 ? '✨ 실속 3위' : `TOP ${idx + 1}`))
    }));

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      ranking: top10
    });
  } catch (e) {
    res.status(500).json({ error: '랭킹 조회 실패' });
  }
});



// ════════════════════════════════════════
//  404 핸들러
// ════════════════════════════════════════
app.use((req, res) => {
  logger.info(`404: ${req.ip} → ${req.originalUrl}`);
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// ════════════════════════════════════════
//  에러 핸들러
// ════════════════════════════════════════
app.use((err, req, res, next) => {
  logger.error(`500 에러: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// ════════════════════════════════════════
//  서버 시작 (Railway process.env.PORT 대응)
// ════════════════════════════════════════
const TARGET_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const server = app.listen(TARGET_PORT, '0.0.0.0', () => {
  logger.info(`🚀 [PORT ${TARGET_PORT}] 서버 가동 완료!`);
  logger.info(`🌐 배포 URL 정상 연결 준비 완료`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

process.on('SIGTERM', () => {
  logger.info('SIGTERM 수신 - 서버 종료 중...');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  logger.error('예기치 않은 오류:', err);
});

process.on('unhandledRejection', (reason) => {
  logger.error('처리되지 않은 Promise 거부:', reason);
});
