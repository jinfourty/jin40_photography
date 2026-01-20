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
npm run build-blog
git add .
git commit -m "Add new blog post"
git push
```

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

## Progress Log

| Date | Task | Status |
|------|------|--------|
| 2026-01-20 | 현재 구조 분석 | ✅ Done |
| 2026-01-20 | Phase 1 완료 (블로그 정상 작동) | ✅ Done |
| 2026-01-20 | Phase 2 완료 (빌드 스크립트) | ✅ Done |
| 2026-01-20 | Phase 3 완료 (템플릿, 레이아웃) | ✅ Done |

---

## Notes
- `_`로 시작하는 파일은 빌드 시 자동 제외
- 파일명 형식: `YYYY-MM-DD-slug-name.md`
- 이미지는 갤러리 사진 또는 외부 URL 사용 가능
- `.nojekyll` 파일로 GitHub Pages에서 .md 파일 직접 서빙
