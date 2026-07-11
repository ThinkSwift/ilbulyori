# 일불요리 홈페이지 (ilbulyori.com)

가진 재료와 예산으로 완성하는 한식 한 끼 — 브랜드 홈페이지 + 주인장이 "비서"와 대화로 꾸미는 관리 도구.

## 구성

| 파일 | 역할 |
|---|---|
| `index.html` · `app.js` · `styles.css` | 공개 브랜드 홈페이지 (내용을 Worker에서 불러와 렌더) |
| `admin.html` · `admin.js` | 주인장 방 — 로그인 후 비서와 채팅하며 글·사진 편집 |
| `submission.html` | 모두의 창업 제출 Q&A 보존 페이지 |
| `content.default.json` | 백엔드가 비었을 때의 기본 내용 + 초기 시드 |
| `config.js` | 프론트 설정 (Worker 주소) |

> 백엔드 `worker/` (비서 + 저장 + 사진)는 **로컬에만** 두고 wrangler로 배포합니다. 이 저장소는 공개(GitHub Pages)라 계정 정보 노출을 막기 위해 `.gitignore`로 제외했습니다.

## 동작

- 공개 페이지는 `worker`의 `/api/content` 를 불러와 렌더하고, 실패 시 `content.default.json` 으로 폴백합니다.
- 주인장이 `admin.html` 에서 로그인 → 비서(Claude)에게 부탁 → 비서가 도구로 내용을 고쳐 KV에 저장 → 공개 페이지 새로고침 시 반영.
- API 키는 Worker 시크릿에만 있으며 사이트/브라우저에 노출되지 않습니다.

## 배포

- **홈페이지**: 이 저장소를 `ThinkSwift/ilbulyori` 로 push → GitHub Pages → `ilbulyori.com` (CNAME 설정됨).
- **백엔드**: `worker/README.md` 참고 (`npx wrangler deploy`).

주인장 방 주소: `ilbulyori.com/admin.html`
