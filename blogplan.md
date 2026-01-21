# Blog System Plan

## Current Status (2026-01-20)

### Structure
```
posts/
├── index.json              # 포스트 목록 (자동 생성)
├── _template.md            # 포스트 템플릿 (빌드 시 제외)
├── 2024-03-15-golden-hour.md
├── 2024-03-10-lens-guide.md
└── 2024-03-05-kyoto-trip.md

images/
├── gallery/                # 갤러리 사진
└── blog/                   # 블로그 전용 이미지

scripts/
└── build-blog.js           # index.json 자동 생성 스크립트
```

### How It Works
1. `posts/` 폴더에 `.md` 파일 추가
2. `npm run build-blog` 실행 → `index.json` 자동 생성
3. `blog.js`가 `posts/index.json`을 fetch하여 블로그 목록 표시
4. 개별 포스트는 `post.html?slug=파일명`으로 접근
5. 마크다운 파싱: `marked.js` 사용
6. Frontmatter 지원: title, date, category, thumbnail, excerpt

---

## Implementation Progress

### Phase 1: Fix Current System ✅
- [x] 1.1 기존 .md 파일들의 정보로 index.json 업데이트
- [x] 1.2 블로그 페이지 정상 작동 확인
- [x] 1.3 .nojekyll 파일 추가 (GitHub Pages에서 .md 파일 직접 서빙)

### Phase 2: Build Script for Auto-generation ✅
- [x] 2.1 `posts/` 폴더의 .md 파일을 스캔하는 Node.js 스크립트 생성
- [x] 2.2 각 .md 파일의 frontmatter를 파싱하여 index.json 자동 생성
- [x] 2.3 package.json에 빌드 명령어 추가 (`npm run build-blog`)

### Phase 3: Workflow Optimization ✅
- [x] 3.1 새 포스트 작성 템플릿 생성 (`posts/_template.md`)
- [x] 3.2 블로그 그리드 레이아웃 개선 (PC 3열, 모바일 1열)
- [ ] 3.3 (선택) GitHub Actions로 push 시 자동 빌드

### Phase 4: SEO Optimization ✅
- [x] 4.1 Sitemap 자동 생성 스크립트 (`scripts/build-sitemap.js`)
- [x] 4.2 동적 메타 태그 설정 (SEO, OG, Twitter Card)
- [x] 4.3 구조화된 데이터 (JSON-LD BlogPosting)
- [x] 4.4 Canonical URL 설정
- [x] 4.5 한국어 검색 최적화 (lang="ko", 한글 키워드)

---

## How to Write a New Blog Post

### Step 1: Create New Post
```bash
cp posts/_template.md posts/2026-01-20-my-post.md
```

### Step 2: Edit Content
```markdown
---
title: 포스트 제목
date: 2026-01-20
category: Travel
thumbnail: images/gallery/2024-thailand/DSCF3656.webp
excerpt: 블로그 목록에 표시될 요약 문구
---

본문 내용 작성...

![이미지 설명](images/gallery/2024-thailand/DSCF3671.webp)
```

### Step 3: Build & Deploy
```bash
# 블로그 index.json + sitemap.xml 자동 생성
npm run build-all

# 배포
./deploy.sh "Add new blog post: 포스트 제목"
```

### Step 4: Google Search Console 색인 요청 (선택)
새 포스트를 빠르게 구글 검색에 노출시키려면:
1. https://search.google.com/search-console 접속
2. 상단 검색창에 URL 입력: `https://jin40photo.com/post.html?slug=파일명`
3. "색인 생성 요청" 클릭

**예상 노출 시간**: 1-3일 (색인 요청 시), 1-7일 (자동 크롤링)

---

## Markdown Post Format
```markdown
---
title: 포스트 제목
date: YYYY-MM-DD
category: Category Name
thumbnail: images/path/to/thumbnail.webp
excerpt: 포스트 요약 (목록에 표시됨)
---

본문 내용 (마크다운 형식)

## 소제목

일반 텍스트

![이미지 설명](images/path/to/image.webp)

- 리스트 항목
- 리스트 항목

> 인용문

**굵은 글씨**, *기울임*
```

---

## Blog Images Guide

### 이미지 저장 위치

**블로그 전용 이미지**: `images/blog/` 폴더 사용

```bash
images/blog/
├── 2024-03-05/         # 포스트별 폴더
│   ├── photo1.webp
│   └── photo2.webp
├── 2024-03-10/
│   └── camera.jpg
└── shared/             # 여러 포스트에서 재사용하는 이미지
    └── logo.png
```

**갤러리 이미지 재사용**: `images/gallery/` 폴더의 기존 사진 사용 가능

### 이미지 삽입 방법

#### 1. 기본 마크다운 이미지
```markdown
![카페 전경](images/blog/2024-03-05/cafe.webp)
```

#### 2. 이미지 + 캡션 (HTML)
```html
<figure>
  <img src="images/blog/2024-03-05/sunset.webp" alt="석양">
  <figcaption>후지필름 X-T4로 촬영한 석양 - 23mm f/2.0</figcaption>
</figure>
```

#### 3. 이미지 + 캡션 (마크다운)
```markdown
![석양](images/blog/2024-03-05/sunset.webp)
*후지필름 X-T4로 촬영한 석양 - 23mm f/2.0*
```

#### 4. HTML 태그로 고급 레이아웃
```html
<!-- 구글 지도 삽입 -->
<iframe
  src="https://www.google.com/maps/embed?pb=..."
  width="100%"
  height="450"
  style="border:0;"
  allowfullscreen=""
  loading="lazy">
</iframe>

<!-- 2열 이미지 그리드 -->
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
  <img src="images/blog/2024-03-05/photo1.webp" alt="Photo 1">
  <img src="images/blog/2024-03-05/photo2.webp" alt="Photo 2">
</div>
```

### 이미지 준비 팁

1. **포맷**: WebP 권장 (용량 작고 화질 좋음)
2. **해상도**:
   - 일반 이미지: 1200px 너비
   - 썸네일: 600px 너비
3. **용량**: 가능한 500KB 이하로 최적화
4. **파일명**: 영문 소문자, 하이픈 사용 (예: `cafe-interior.webp`)

---

## Progress Log

| Date | Task | Status |
|------|------|--------|
| 2026-01-20 | 현재 구조 분석 | ✅ Done |
| 2026-01-20 | Phase 1 완료 (블로그 정상 작동) | ✅ Done |
| 2026-01-20 | Phase 2 완료 (빌드 스크립트) | ✅ Done |
| 2026-01-20 | Phase 3 완료 (템플릿, 레이아웃) | ✅ Done |
| 2026-01-21 | HTML 지원 활성화 (marked.js 설정) | ✅ Done |
| 2026-01-21 | 이미지 캡션 CSS 추가 | ✅ Done |
| 2026-01-21 | 블로그 전용 이미지 폴더 생성 (images/blog/) | ✅ Done |
| 2026-01-21 | Phase 4 완료 (SEO 최적화) | ✅ Done |
| 2026-01-21 | Sitemap 자동 생성 스크립트 | ✅ Done |
| 2026-01-21 | 동적 메타 태그 및 구조화된 데이터 | ✅ Done |

---

## Notes
- `_`로 시작하는 파일은 빌드 시 자동 제외
- 파일명 형식: `YYYY-MM-DD-slug-name.md` (영문 권장)
- 이미지는 `images/blog/` 또는 `images/gallery/` 사용
- `.nojekyll` 파일로 GitHub Pages에서 .md 파일 직접 서빙
- **마크다운에 HTML 태그 사용 가능**: `<iframe>`, `<figure>`, `<div>` 등 자유롭게 사용
- **캡션 스타일**: 가운데 정렬, 회색 작은 글씨, 이탤릭체

---

## SEO Optimization (검색 엔진 최적화)

### 자동 적용되는 SEO 기능

#### 1. Sitemap 자동 생성
- `npm run build-sitemap` 실행 시 모든 블로그 포스트가 sitemap.xml에 추가
- Google이 새 콘텐츠를 자동으로 발견

#### 2. 동적 메타 태그
각 포스트마다 자동 생성:
```html
<meta name="description" content="포스트 excerpt">
<meta name="keywords" content="포스트 제목, 사진, photography, 카테고리, 여행, 일본, 고양이">

<!-- Open Graph (소셜 미디어) -->
<meta property="og:title" content="포스트 제목">
<meta property="og:description" content="포스트 excerpt">
<meta property="og:image" content="썸네일 이미지">
<meta property="og:url" content="포스트 URL">

<!-- JSON-LD 구조화된 데이터 -->
<script type="application/ld+json">
{
  "@type": "BlogPosting",
  "headline": "포스트 제목",
  ...
}
</script>
```

#### 3. 검색 키워드 최적화
- 포스트 제목이 keywords에 자동 포함
- 카테고리 키워드 추가
- 한국어 공통 키워드: 사진, photography, 여행
- 특정 키워드는 포스트 내용에서 자연스럽게 사용

#### 4. URL 구조
```
https://jin40photo.com/post.html?slug=2026-01-21-ainoshima-cats
```
- SEO 친화적인 slug 사용
- 날짜와 주제가 포함된 명확한 구조

### Google Search Console 활용

#### 초기 설정 (최초 1회)
1. https://search.google.com/search-console 접속
2. Sitemaps 메뉴에서 `sitemap.xml` 제출

#### 새 포스트 색인 요청
1. 상단 검색창에 포스트 URL 입력
2. "색인 생성 요청" 클릭
3. 1-3일 내 구글 검색 결과에 노출

### 검색어 예시 (자동 최적화)
- "아이노시마" → 포스트 제목에 포함
- "아이노 섬" → 본문 내용에 자연스럽게 사용
- "일본 고양이섬" → 본문 키워드
- "후쿠오카 여행" → 카테고리 + 지역명
- "고양이 사진" → 내용 + 공통 키워드

### SEO 체크리스트
- [x] Sitemap 생성 및 제출
- [x] 메타 태그 자동 생성
- [x] Open Graph 설정
- [x] 구조화된 데이터 (JSON-LD)
- [x] Canonical URL
- [x] 한국어 lang 속성
- [x] 키워드 자동 포함
- [ ] 정기적인 색인 요청 (새 포스트마다)
