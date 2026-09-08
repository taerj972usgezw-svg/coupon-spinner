# 🎡 쿠폰 돌림판 (Coupon Spinner)

> 공개된 쿠폰 정보를 한눈에 보고, 돌림판으로 오늘의 쿠폰을 추첨하는 정적 웹사이트

---

## 📂 파일 구조

```
coupon-spinner/
├── index.html      ← 메인 페이지 (쿠폰 목록 + 돌림판)
├── style.css       ← 디자인 (토스 스타일 반응형)
├── script.js       ← 쿠폰 로직 + Canvas 돌림판
├── coupons.json    ← 샘플 쿠폰 데이터
└── README.md       ← 이 파일
```

---

## 🚀 실행 방법

### 방법 1: VS Code Live Server (권장)
1. VS Code에서 폴더 열기
2. `index.html` 우클릭 → "Open with Live Server"

### 방법 2: Python 로컬 서버
```bash
# Python 3
python -m http.server 8080
# 브라우저에서: http://localhost:8080
```

### 방법 3: Node.js serve
```bash
npx serve .
```

### 방법 4: 직접 열기
`index.html` 파일을 브라우저로 드래그 앤 드롭  
> ⚠️ `coupons.json` 로드 시 CORS 오류가 날 수 있어 방법 1~3 권장

---

## 🌐 배포 방법

### GitHub Pages
```bash
git init
git add .
git commit -m "🎡 쿠폰 돌림판 초기 배포"
git remote add origin <your-github-repo>
git push -u origin main
# Settings → Pages → Branch: main → Save
```

### Vercel / Netlify
- 폴더를 드래그 앤 드롭으로 업로드하면 즉시 배포

### 도메인 연결 (쿠폰.온라인.한국)
- 배포 후 DNS A레코드를 서버 IP로 연결
- Vercel/Netlify의 경우 CNAME 설정

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📋 쿠폰 목록 | GS25, CU, 스타벅스 등 공개 쿠폰 정보 카드 표시 |
| 🎡 돌림판 | Canvas API 기반 원형 회전 추첨 (easeOut 애니메이션) |
| 🎉 컨페티 | 추첨 결과 시 화려한 파티클 효과 |
| 🔍 필터 | 카테고리별 쿠폰 필터링 + 돌림판 동기화 |
| ➕ 쿠폰 등록 | 사용자 쿠폰 등록 신청 (localStorage 저장) |
| 📱 반응형 | 모바일/태블릿/데스크탑 완벽 지원 |

---

## 🎨 디자인

- **스타일**: 토스(Toss) 영감 모던 UI
- **폰트**: Pretendard / Noto Sans KR
- **색상**: 블루 계열 Primary + 카테고리별 컬러 코딩
- **애니메이션**: 돌림판 easeOutQuart, 카드 호버, 컨페티, 플로팅

---

## 📝 쿠폰 추가 방법

### `coupons.json` 직접 수정
```json
{
  "id": 9,
  "name": "쿠폰명",
  "provider": "제공처",
  "category": "카페",
  "discount": "1,000원 할인",
  "condition": "5,000원 이상 구매 시",
  "expiry": "2026-12-31",
  "color": "#FF6B6B",
  "emoji": "☕",
  "source": "공식 앱",
  "description": "설명",
  "status": "active"
}
```

**카테고리 목록**: `편의점`, `카페`, `배달`, `뷰티`, `엔터테인먼트`, `기타`

---

## ⚠️ 안내사항

- 이 사이트는 **공개된 쿠폰 정보만 안내**하며, 실제 쿠폰을 직접 발행하지 않습니다.
- 돌림판은 **재미 요소**로만 사용되며, 실제 쿠폰 지급과 무관합니다.
- 개인정보를 수집하지 않습니다 (localStorage만 사용).
- 실제 쿠폰은 각 기업의 **공식 앱 또는 웹사이트**에서 수령하세요.

---

## 🛠 기술 스택

- **HTML5** - 시맨틱 마크업
- **CSS3** - Grid, Flexbox, CSS 변수, 애니메이션
- **JavaScript (ES6+)** - Canvas API, localStorage, Fetch API
- **폰트**: Google Fonts (Pretendard, Noto Sans KR)

---

Made with ❤️ | 쿠폰 돌림판
