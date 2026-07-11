// 공개 홈페이지 렌더러.
// 1) Worker의 /api/content 를 시도 → 2) 실패하면 content.default.json 폴백.
// 이미지: imageId 가 있으면 API_BASE + /api/image/<id> 에서 로드.

const API_BASE = (window.ILBUL_CONFIG && window.ILBUL_CONFIG.API_BASE) || "";

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function imgUrl(id) {
  return API_BASE ? `${API_BASE}/api/image/${encodeURIComponent(id)}` : "";
}

async function loadContent() {
  if (API_BASE) {
    try {
      const r = await fetch(`${API_BASE}/api/content`, { cache: "no-store" });
      const data = await r.json();
      if (data && data.ok && data.content) return data.content;
    } catch {}
  }
  try {
    const r = await fetch("content.default.json", { cache: "no-store" });
    return await r.json();
  } catch {
    return null;
  }
}

function render(c) {
  if (!c) {
    document.getElementById("app").innerHTML =
      '<p class="notice wrap">내용을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>';
    return;
  }
  document.title = `${c.brand?.name || "일불요리"} · ${c.brand?.tagline || ""}`;

  const steps = (c.how?.steps || [])
    .map(
      (s, i) => `
      <div class="step">
        <div class="n">${i + 1}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.body)}</p>
      </div>`
    )
    .join("");

  const posts = (c.gallery?.posts || [])
    .map((p) => {
      const photo = p.imageId
        ? `<div class="photo"><img src="${imgUrl(p.imageId)}" alt="${esc(p.title)}" loading="lazy" /></div>`
        : `<div class="photo empty">🍚</div>`;
      const date = p.date ? `<span class="date">${esc(p.date)}</span>` : "";
      return `
      <article class="post">
        ${photo}
        <div class="body">
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.body)}</p>
          ${date}
        </div>
      </article>`;
    })
    .join("");

  document.getElementById("app").innerHTML = `
    <header class="hero">
      <div class="wrap">
        <span class="coin">＄ 일불 = 실제 재료비 기준</span>
        <h1>${esc(c.hero?.headline)}</h1>
        <p>${esc(c.hero?.sub)}</p>
        <a class="btn" href="${esc(c.hero?.ctaHref || "#gallery")}">${esc(c.hero?.ctaLabel || "요리 기록 보기")}</a>
      </div>
    </header>

    <section id="about">
      <div class="wrap">
        <p class="eyebrow">About</p>
        <h2>${esc(c.about?.title)}</h2>
        <p class="lead">${esc(c.about?.body)}</p>
      </div>
    </section>

    <section id="how">
      <div class="wrap">
        <p class="eyebrow">How it works</p>
        <h2>${esc(c.how?.title)}</h2>
        <div class="steps">${steps}</div>
      </div>
    </section>

    <section id="gallery">
      <div class="wrap">
        <p class="eyebrow">Gallery</p>
        <h2>${esc(c.gallery?.title)}</h2>
        ${c.gallery?.intro ? `<p class="lead">${esc(c.gallery.intro)}</p>` : ""}
        <div class="gallery-grid">${posts || '<p class="notice">아직 기록이 없어요.</p>'}</div>
      </div>
    </section>

    <section id="app">
      <div class="wrap">
        <div class="appband">
          <div>
            <h2>${esc(c.app?.title)}</h2>
            <p>${esc(c.app?.body)}</p>
            <span class="status">${esc(c.app?.status || "출시 준비 중")}</span>
          </div>
          <img src="assets/logo_white.png" alt="일불요리 로고" onerror="this.style.display='none'" />
        </div>
      </div>
    </section>

    <footer>
      <div class="wrap">
        <span>${esc(c.footer?.note || "일불요리")}</span>
        <span>${c.footer?.contact ? `<a href="mailto:${esc(c.footer.contact)}">${esc(c.footer.contact)}</a>` : ""}</span>
      </div>
    </footer>
  `;

  // 상단 브랜드명 채우기
  const bn = document.getElementById("brand-name");
  if (bn) bn.textContent = c.brand?.name || "일불요리";
}

loadContent().then(render);
