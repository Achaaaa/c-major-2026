const LLM_API_URL = process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions";
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(status).json(body);
    return;
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(payload);
}

function requireApiKey(res) {
  if (LLM_API_KEY) return true;
  sendJson(res, 503, { error: "api_key_missing" });
  return false;
}

async function callChatCompletions(messages, options = {}) {
  const response = await fetch(LLM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LLM_API_KEY}`
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: options.temperature ?? 0.9,
      max_tokens: options.maxTokens ?? 80,
      response_format: options.responseFormat,
      messages
    })
  });

  if (!response.ok) {
    const detail = await readApiError(response);
    throw Object.assign(new Error("llm_api_failed"), {
      status: response.status,
      detail
    });
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function sanitizeMessage(message) {
  if (!message) return "";
  return message.replace(/^["「]|["」]$/g, "").replace(/\s+/g, " ").slice(0, 46);
}

function normalizeResult(result) {
  return {
    type: sanitizeText(result.type || "未来感覚キュレーター", 32),
    summary: sanitizeText(result.summary || "まだ名前のない興味やこだわりを集め、次の体験に変えていくタイプです。", 160),
    keywords: normalizeList(result.keywords, ["没頭", "こだわり", "発見", "整理"], 7),
    jobs: normalizeList(result.jobs, ["企画", "編集", "リサーチ"], 4),
    figure: sanitizeText(result.figure || "丸みのある3Dフィギュア、手に小さな発見のケース", 120)
  };
}

function normalizeList(value, fallback, max) {
  const list = Array.isArray(value) ? value : fallback;
  return list.map((item) => sanitizeText(item, 18)).filter(Boolean).slice(0, max);
}

function sanitizeText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").replace(/[<>]/g, "").trim().slice(0, maxLength);
}

function buildFigureImage(title, keywords, figure) {
  const palette = ["#20b7bd", "#ff6f61", "#ffd166", "#7d6bff", "#a8d94f"];
  const seed = `${title}${keywords.join("")}${figure}`.length;
  const color = palette[seed % palette.length];
  const accent = palette[(seed + keywords.length + 2) % palette.length];
  const label = escapeSvg(title).slice(0, 18);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#f8fbff"/><stop offset=".52" stop-color="#eef6f2"/><stop offset="1" stop-color="#fff8ee"/>
        </linearGradient>
        <radialGradient id="shine" cx=".35" cy=".18" r=".78">
          <stop stop-color="#fff" stop-opacity=".98"/><stop offset=".55" stop-color="${color}" stop-opacity=".34"/><stop offset="1" stop-color="${accent}" stop-opacity=".22"/>
        </radialGradient>
        <filter id="soft"><feDropShadow dx="0" dy="22" stdDeviation="23" flood-color="#18212f" flood-opacity=".22"/></filter>
      </defs>
      <rect width="720" height="720" fill="url(#bg)"/>
      <circle cx="360" cy="340" r="255" fill="url(#shine)"/>
      <ellipse cx="360" cy="608" rx="188" ry="34" fill="#18212f" opacity=".14"/>
      <g filter="url(#soft)">
        <path d="M238 382c0-74 54-133 122-133s122 59 122 133v110c0 35-28 63-63 63H301c-35 0-63-28-63-63V382z" fill="${color}"/>
        <path d="M270 390c0-54 40-98 90-98s90 44 90 98v86c0 20-16 36-36 36H306c-20 0-36-16-36-36v-86z" fill="#fff" opacity=".28"/>
        <circle cx="360" cy="218" r="98" fill="#f6d7c8"/>
        <path d="M267 205c14-62 56-93 111-86 51 7 86 42 91 96-48-25-116-28-202-10z" fill="#18212f"/>
        <circle cx="328" cy="224" r="10" fill="#18212f"/>
        <circle cx="392" cy="224" r="10" fill="#18212f"/>
        <path d="M331 265c19 16 40 16 59 0" fill="none" stroke="#18212f" stroke-width="9" stroke-linecap="round"/>
        <path d="M236 426c-46 18-76 55-86 109" fill="none" stroke="${accent}" stroke-width="36" stroke-linecap="round"/>
        <path d="M484 426c46 18 76 55 86 109" fill="none" stroke="${accent}" stroke-width="36" stroke-linecap="round"/>
        <rect x="292" y="552" width="48" height="86" rx="24" fill="#2a3445"/>
        <rect x="380" y="552" width="48" height="86" rx="24" fill="#2a3445"/>
        <rect x="132" y="485" width="86" height="58" rx="14" fill="#fff" stroke="${accent}" stroke-width="8"/>
        <circle cx="560" cy="500" r="34" fill="#fff" stroke="${accent}" stroke-width="8"/>
      </g>
      <g font-family="Noto Sans JP, sans-serif" text-anchor="middle">
        <text x="360" y="670" fill="#18212f" font-size="24" font-weight="900">${label}</text>
      </g>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function readApiError(response) {
  try {
    const text = await response.text();
    return text.replace(/sk-[A-Za-z0-9_-]+/g, "sk-***").slice(0, 500);
  } catch {
    return "";
  }
}

function escapeSvg(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;"
  }[char]));
}

module.exports = {
  LLM_API_URL,
  LLM_MODEL,
  buildFigureImage,
  callChatCompletions,
  normalizeResult,
  requireApiKey,
  sanitizeMessage,
  sendJson
};
