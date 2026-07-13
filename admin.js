// 주인장 방 — 로그인 + 비서 채팅 + 사진 첨부.
const API_BASE = (window.ILBUL_CONFIG && window.ILBUL_CONFIG.API_BASE) || "";
const TOKEN_KEY = "ilbul_token";

const $ = (id) => document.getElementById(id);
let token = localStorage.getItem(TOKEN_KEY) || "";
let messages = []; // {role, content} — 비서에 보내는 히스토리
let pending = []; // 첨부된 사진: {id, dataUrl}

// ── 화면 전환 ──────────────────────────────────────────────
function showApp() {
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
  if (!$("chat").childElementCount) greet();
  $("input").focus();
}
function showLogin() {
  $("app").classList.add("hidden");
  $("login").classList.remove("hidden");
}

// ── 로그인 ────────────────────────────────────────────────
$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = $("password").value;
  $("login-err").textContent = "";
  try {
    const r = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await r.json();
    if (data.ok) {
      token = data.token;
      localStorage.setItem(TOKEN_KEY, token);
      $("password").value = "";
      showApp();
    } else {
      $("login-err").textContent = data.error === "wrong_password" ? "비밀번호가 달라요." : "로그인에 실패했어요.";
    }
  } catch {
    $("login-err").textContent = "연결에 실패했어요. 잠시 후 다시 시도해 주세요.";
  }
});

$("logout").addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  token = "";
  messages = [];
  pending = [];
  $("chat").innerHTML = "";
  showLogin();
});

// ── 채팅 UI ───────────────────────────────────────────────
function greet() {
  addBubble(
    "jarvis",
    "안녕하세요 사장님! 저는 사장님 대신 이 홈페이지를 멋지게 만들어 드리는 비서예요.\n\n우리 이렇게 해봐요 — 사장님이 만드신 요리를 사진으로 하나씩 올려주시면, 제가 예쁜 글로 채워서 이 홈페이지를 함께 완성해 갈게요. 그리고 이 완성돼 가는 홈페이지를 보여드리면서 멘토링을 받는 거예요. 멘토링이 네 번 있으니 그때마다 채워진 모습을 보여드리면 딱이고, 사람들 반응이랑 피드백도 받아서 점점 더 멋진 — 나중엔 앱까지 되는 — 홈페이지로 키워 가요.\n\n멘토님이 대면을 원하셔도 너무 걱정 마세요. 우리는 우리 방식대로 멋지게 만들어 보여드리면 되고, 어떻게 되든 이 홈페이지가 그대로 남으니 손해 볼 게 하나도 없어요. 멋지게 만드는 건 제가 다 책임질게요 😊\n\n제일 쉬운 첫걸음 — 오늘 만드신 요리 사진 한 장을 아래 📷 로 올려주세요. 나머지는 제가 다 할게요!"
  );
  addChips([
    "좋아, 요리 사진 올릴게 (📷)",
    "멘토가 대면만 원하는데 괜찮아?",
    "이 홈페이지로 뭘 보여주는 거야?",
  ]);
}

function addBubble(who, text, imgUrls) {
  const wrap = document.createElement("div");
  wrap.className = "msg " + (who === "me" ? "me" : "jarvis");
  const imgs = (imgUrls || []).map((u) => `<img src="${u}" alt="첨부 사진" />`).join("");
  wrap.innerHTML = `<div class="who">${who === "me" ? "나" : "🤖"}</div><div class="bubble">${escapeHtml(text)}${imgs}</div>`;
  $("chat").appendChild(wrap);
  scrollDown();
  return wrap;
}
function addChips(labels) {
  const box = document.createElement("div");
  box.className = "chips admin-wrap";
  box.style.padding = "0";
  labels.forEach((l) => {
    const c = document.createElement("button");
    c.className = "chip";
    c.textContent = l;
    c.onclick = () => {
      $("input").value = l;
      autoGrow();
      $("input").focus();
    };
    box.appendChild(c);
  });
  $("chat").appendChild(box);
  scrollDown();
}
function scrollDown() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}
function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// ── 사진 첨부 (브라우저에서 리사이즈 후 업로드) ────────────────
$("photo-btn").addEventListener("click", () => $("file-input").click());
$("file-input").addEventListener("change", async (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const placeholder = addThumbPlaceholder();
    try {
      const dataUrl = await resizeImage(file, 1280, 0.82);
      const r = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + token },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await r.json();
      if (data.ok) {
        pending.push({ id: data.id, dataUrl });
        placeholder.replaceWith(makeThumb(data.id, dataUrl));
      } else {
        placeholder.remove();
        if (data.error === "unauthorized") return relogin();
        alert("사진 업로드에 실패했어요: " + (data.error || ""));
      }
    } catch (err) {
      placeholder.remove();
      alert("사진을 준비하는 중 문제가 생겼어요.");
    }
  }
});

function addThumbPlaceholder() {
  const t = document.createElement("div");
  t.className = "thumb loading";
  t.textContent = "…";
  $("attachments").appendChild(t);
  return t;
}
function makeThumb(id, dataUrl) {
  const t = document.createElement("div");
  t.className = "thumb";
  t.innerHTML = `<img src="${dataUrl}" alt="" /><button title="빼기">×</button>`;
  t.querySelector("button").onclick = () => {
    pending = pending.filter((p) => p.id !== id);
    t.remove();
  };
  return t;
}
function clearAttachments() {
  pending = [];
  $("attachments").innerHTML = "";
}

// canvas로 최대변 max 픽셀, JPEG 품질 q 로 축소.
function resizeImage(file, max, q) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > max || height > max) {
        const scale = max / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", q));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── 전송 ──────────────────────────────────────────────────
const inputEl = $("input");
inputEl.addEventListener("input", autoGrow);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});
$("send").addEventListener("click", send);
function autoGrow() {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(140, inputEl.scrollHeight) + "px";
}

let sending = false;
async function send() {
  const text = inputEl.value.trim();
  if (sending || (!text && !pending.length)) return;
  sending = true;
  $("send").disabled = true;

  const attImgs = pending.map((p) => p.dataUrl);
  const imageIds = pending.map((p) => p.id);
  addBubble("me", text || "(사진)", attImgs);
  messages.push({ role: "user", content: text || "이 사진을 올려줘" });
  inputEl.value = "";
  autoGrow();
  clearAttachments();

  const typing = addBubble("jarvis", "…");
  typing.querySelector(".bubble").classList.add("typing");

  try {
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + token },
      body: JSON.stringify({ messages, imageIds }),
    });
    const data = await r.json();
    typing.remove();
    if (data.ok) {
      addBubble("jarvis", data.reply);
      messages.push({ role: "assistant", content: data.reply });
    } else if (data.error === "unauthorized") {
      relogin();
    } else {
      addBubble("jarvis", "죄송해요, 잠깐 문제가 있었어요. 다시 한 번 말씀해 주세요.");
    }
  } catch {
    typing.remove();
    addBubble("jarvis", "연결이 잠깐 끊겼어요. 잠시 후 다시 시도해 주세요.");
  } finally {
    sending = false;
    $("send").disabled = false;
    inputEl.focus();
  }
}

function relogin() {
  localStorage.removeItem(TOKEN_KEY);
  token = "";
  showLogin();
  $("login-err").textContent = "다시 로그인해 주세요.";
}

// ── 시작 ──────────────────────────────────────────────────
if (token) showApp();
else showLogin();
