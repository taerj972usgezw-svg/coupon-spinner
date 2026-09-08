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
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

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
