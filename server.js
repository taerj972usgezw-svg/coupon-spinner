/**
 * ╔══════════════════════════════════════════════════════╗
 * ║       쿠폰 돌림판 - 보안 강화 Node.js 서버           ║
 * ║  - DDoS 방지 (Rate Limiting + Slow Down)             ║
 * ║  - 해킹 방지 (Helmet, XSS, SQL Injection, HPP)       ║
 * ║  - 고트래픽 최적화 (Gzip, 캐싱, 정적파일 최적화)     ║
 * ║  - IP 차단, 봇 감지, 요청 로깅                       ║
 * ╚══════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown  = require('express-slow-down');
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
//  차단된 IP 목록 (메모리 + 파일)
// ════════════════════════════════════════
const BLOCKED_IPS_FILE = 'blocked_ips.json';
let blockedIPs = new Set();

function loadBlockedIPs() {
  try {
    if (fs.existsSync(BLOCKED_IPS_FILE)) {
      const data = JSON.parse(fs.readFileSync(BLOCKED_IPS_FILE, 'utf8'));
      blockedIPs = new Set(data);
      logger.info(`차단된 IP ${blockedIPs.size}개 로드됨`);
    }
  } catch (e) { logger.error('차단 IP 로드 실패', e); }
}

function saveBlockedIPs() {
  fs.writeFileSync(BLOCKED_IPS_FILE, JSON.stringify([...blockedIPs]));
}

function blockIP(ip, reason) {
  if (!blockedIPs.has(ip)) {
    blockedIPs.add(ip);
    saveBlockedIPs();
    logger.warn(`🚫 IP 차단: ${ip} | 사유: ${reason}`);
  }
}

loadBlockedIPs();

// ════════════════════════════════════════
//  요청 추적 (IP별 요청 횟수)
// ════════════════════════════════════════
const requestTracker = new Map();
const ATTACK_THRESHOLD  = 500;  // 1분에 500번 이상 → 자동 차단
const CLEANUP_INTERVAL  = 60000; // 1분마다 초기화

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestTracker.entries()) {
    if (now - data.windowStart > 60000) requestTracker.delete(ip);
  }
}, CLEANUP_INTERVAL);

// ════════════════════════════════════════
//  미들웨어 1: 프록시 신뢰 설정 (Cloudflare 등)
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
//  미들웨어 3: IP 차단 체크 (최우선)
// ════════════════════════════════════════
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (blockedIPs.has(ip)) {
    logger.warn(`🚫 차단된 IP 접근 시도: ${ip} → ${req.path}`);
    return res.status(403).json({ error: '접근이 차단되었습니다.' });
  }

  // 요청 수 추적 (자동 차단)
  const now = Date.now();
  if (!requestTracker.has(ip)) {
    requestTracker.set(ip, { count: 0, windowStart: now });
  }
  const tracker = requestTracker.get(ip);
  if (now - tracker.windowStart > 60000) {
    tracker.count = 0;
    tracker.windowStart = now;
  }
  tracker.count++;

  if (tracker.count > ATTACK_THRESHOLD) {
    blockIP(ip, `자동차단: 1분에 ${tracker.count}회 요청`);
    return res.status(429).json({ error: 'Too Many Requests. 잠시 후 다시 시도하세요.' });
  }

  next();
});

// ════════════════════════════════════════
//  미들웨어 4: 악성 User-Agent / 봇 차단
// ════════════════════════════════════════
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /zgrab/i,
  /python-requests/i, /go-http-client/i, /curl\/7\.[0-4]/i,
  /scrapy/i, /wget/i, /libwww-perl/i, /java\//i,
  /httpclient/i, /axios/i, /okhttp/i
];

const SUSPICIOUS_PATHS = [
  /\.php$/i, /\.asp$/i, /\.aspx$/i, /\.cgi$/i,
  /wp-admin/i, /wp-login/i, /phpmyadmin/i, /\.env$/i,
  /\.git\//i, /admin/i, /etc\/passwd/i, /proc\/self/i,
  /\.\.\//,  // Path traversal
  /<script/i, /javascript:/i, /onerror=/i // XSS 시도
];

app.use((req, res, next) => {
  const ua   = req.headers['user-agent'] || '';
  const path = decodeURIComponent(req.path);
  const ip   = req.ip;

  // 악성 User-Agent 차단
  for (const pattern of BLOCKED_UA_PATTERNS) {
    if (pattern.test(ua)) {
      logger.warn(`🤖 악성 봇 차단: IP=${ip} UA=${ua.substring(0,60)}`);
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  // 의심스러운 경로 차단
  for (const pattern of SUSPICIOUS_PATHS) {
    if (pattern.test(path) || pattern.test(req.originalUrl)) {
      blockIP(ip, `의심 경로 접근: ${req.originalUrl.substring(0,100)}`);
      logger.warn(`⚠️  의심 경로: IP=${ip} PATH=${req.originalUrl.substring(0,100)}`);
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  // User-Agent 없는 요청 (대부분 봇/스캐너)
  if (!ua || ua.length < 5) {
    logger.warn(`⚠️  UA 없음 차단: IP=${ip}`);
    return res.status(400).json({ error: 'Bad Request' });
  }

  next();
});

// ════════════════════════════════════════
//  미들웨어 5: Helmet (HTTP 보안 헤더)
// ════════════════════════════════════════
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "'unsafe-eval'", "fonts.googleapis.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "fonts.gstatic.com"],
      fontSrc:    ["'self'", "fonts.googleapis.com", "fonts.gstatic.com", "data:"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "*"],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// ════════════════════════════════════════
//  미들웨어 6: CORS
// ════════════════════════════════════════
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));

// ════════════════════════════════════════
//  미들웨어 7: 요청 크기 제한
// ════════════════════════════════════════
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// ════════════════════════════════════════
//  미들웨어 8: GZip 압축
// ════════════════════════════════════════
app.use(compression({ level: 6, threshold: 1024 }));

// ════════════════════════════════════════
//  미들웨어 9: Slow Down (점진적 지연)
// ════════════════════════════════════════
const speedLimiter = slowDown({
  windowMs: 30 * 1000,
  delayAfter: 80,
  delayMs: (hits) => hits * 100,
  maxDelayMs: 3000,
  skip: (req) => req.path === '/health'
});
app.use(speedLimiter);

// ════════════════════════════════════════
//  미들웨어 10: Rate Limiting (DDoS 방어)
// ════════════════════════════════════════
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

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
app.get('/api/coupons', apiLimiter, (req, res) => {
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
app.post('/api/coupons/submit', apiLimiter, (req, res) => {
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

// 서버 통계 (관리자용 - 실제 배포 시 인증 추가 권장)
app.get('/api/stats', apiLimiter, (req, res) => {
  res.json({
    blockedIPs: blockedIPs.size,
    activeTrackers: requestTracker.size,
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

// 방문자 기록 쿨다운 (동일 IP는 3분 동안 1회만 알림 - 웹훅 도배 방지)
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

    // 동일 IP 3분 쿨다운 체크
    const cooldownKey = `visit_${rawIp}`;
    if (visitAlertCache.has(cooldownKey)) {
      return res.json({ success: true, cached: true });
    }
    visitAlertCache.set(cooldownKey, true);

    // 2. 브라우저/클라이언트에서 전달받은 정보
    const clientData = req.body || {};
    const screenRes = clientData.screen || '알 수 없음';
    const language  = clientData.language || req.headers['accept-language']?.split(',')[0] || 'ko-KR';
    const referrer  = clientData.referrer || req.headers['referer'] || '직접 방문 (주소창 입력/즐겨찾기)';
    const currentUrl = clientData.url || `http://${req.headers.host || 'www.쿠폰.온라인.한국'}${req.originalUrl}`;
    const ua = req.headers['user-agent'] || '알 수 없음';

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

    // 한국 표준시 (KST, UTC+9)
    const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .replace(/\..+/, '') + ' (KST)';

    // 4. 디스코드 임베드 생성
    const embedPayload = {
      username: '쿠폰모아 방문자 알리미',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/879/879757.png',
      embeds: [
        {
          title: '🚨 신규 방문자 접속 알림!',
          description: `방문자가 **쿠폰모아(룰렛 이벤트)** 사이트에 접속했습니다.`,
          color: 0xFF5722, // 주황색
          fields: [
            {
              name: '🌐 접속 IP 주소',
              value: `\`${rawIp}\``,
              inline: true
            },
            {
              name: '📱 기기 분류',
              value: deviceType,
              inline: true
            },
            {
              name: '💻 OS 및 환경',
              value: os,
              inline: true
            },
            {
              name: '🧭 브라우저',
              value: browser,
              inline: true
            },
            {
              name: '🖥️ 화면 해상도',
              value: `\`${screenRes}\``,
              inline: true
            },
            {
              name: '🗣️ 기본 언어',
              value: `\`${language}\``,
              inline: true
            },
            {
              name: '🔗 접속 경로 (Referrer)',
              value: referrer.length > 250 ? referrer.substring(0, 250) + '...' : referrer,
              inline: false
            },
            {
              name: '📍 접속 페이지',
              value: currentUrl.length > 250 ? currentUrl.substring(0, 250) + '...' : currentUrl,
              inline: false
            },
            {
              name: '⏰ 접속 일시',
              value: `\`${nowKST}\``,
              inline: false
            },
            {
              name: '🔍 User-Agent 원본',
              value: '```' + (ua.length > 200 ? ua.substring(0, 200) + '...' : ua) + '```',
              inline: false
            }
          ],
          footer: {
            text: '쿠폰모아 실시간 방문자 트래커 v1.0 • Railway 배포'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    // 비동기 발송
    sendDiscordWebhook(embedPayload);
    logger.info(`🔔 방문자 웹훅 발송: IP=${rawIp} OS=${os} Browser=${browser}`);

    res.json({ success: true });
  } catch (err) {
    logger.error('방문자 추적 실패:', err);
    res.status(500).json({ error: '추적 실패' });
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
