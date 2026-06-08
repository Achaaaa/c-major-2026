const LLM_API_URL = process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions";
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";
const IMAGE_API_URL = process.env.IMAGE_API_URL || "https://api.openai.com/v1/images/generations";
const IMAGE_API_KEY = process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || LLM_API_KEY;
const IMAGE_MODEL = process.env.IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const IMAGE_SIZE = process.env.IMAGE_SIZE || "1024x1024";
const IMAGE_QUALITY = process.env.IMAGE_QUALITY || "medium";
const IMAGE_OUTPUT_FORMAT = process.env.IMAGE_OUTPUT_FORMAT || "webp";

const GENERIC_RESULT_TYPES = new Set([
  "違和感採集エディター",
  "未来感覚キュレーター",
  "観察を形にする編集者タイプ",
  "手を動かして未来を試作するクリエイタータイプ",
  "人の温度を読んで動く伴走者タイプ",
  "混沌から筋道を見つけるプランナータイプ"
]);

const RESULT_PROFILES = [
  {
    type: "遊び筋道プロトタイパー",
    summary: "人が夢中になる流れを読み解き、試作品や攻略の道筋に変える未知の仕事です。楽しさの構造を見つけて、体験の入口を作ります。",
    mission: "夢中の構造を、触れる試作品にする。",
    why: "作る、遊ぶ、攻略する感覚を行き来しながら、手を動かして理解する傾向が見えます。",
    artifact: "光る試作品とルートマップ",
    keywords: ["ゲーム", "制作", "攻略", "試作"],
    jobs: ["体験設計", "プロダクト企画", "ゲーム・教材制作", "UXリサーチ"],
    figure: "青緑のジャケットで、片手に光る試作品、片手に小さなルートマップを持つ3Dフィギュア",
    signals: ["ゲーム", "攻略", "遊び", "作る", "制作", "開発", "コード", "デザイン", "描", "プレイ"]
  },
  {
    type: "場の温度翻訳者",
    summary: "人の言葉になる前の違和感や熱量を受け取り、場が動き出す言葉へ翻訳する未知の仕事です。関係性の流れを整えます。",
    mission: "言葉になる前の温度を、場の一歩にする。",
    why: "人の反応や関係性を見ながら、相手に合わせて動く力が発話に出ています。",
    artifact: "会話の温度を測る小さなランプ",
    keywords: ["人", "相談", "チーム", "反応"],
    jobs: ["人材・組織開発", "カスタマーサクセス", "コミュニティ運営", "教育"],
    figure: "胸元に会話ランプをつけ、両手で場を包むポーズの3Dフィギュア",
    signals: ["人", "友", "友だち", "チーム", "相談", "話", "助け", "教", "相手", "仲間"]
  },
  {
    type: "混沌整流アーキテクト",
    summary: "散らばった情報や感情の流れをほどき、次の一手が見える形へ整える未知の仕事です。曖昧な状況に道を作ります。",
    mission: "散らかった情報に、進める流れを作る。",
    why: "整理、計画、改善への意識があり、曖昧なものを筋道に変える傾向が見えます。",
    artifact: "色分けされた透明ボード",
    keywords: ["整理", "分析", "改善", "計画"],
    jobs: ["業務改善", "データ分析", "プロジェクト設計", "編集・企画"],
    figure: "透明ボードと色分けされたパーツを持ち、情報を並べ替える3Dフィギュア",
    signals: ["整理", "計画", "分析", "改善", "効率", "メモ", "数字", "調べ", "管理", "順番"]
  },
  {
    type: "没頭導線デザイナー",
    summary: "人が気づいたら続けてしまう入口や順番を設計する未知の仕事です。好きや夢中の理由を観察し、体験の流れに変えます。",
    mission: "夢中になる入口を、そっと設計する。",
    why: "好きなものに長く潜り、何が面白さを生んでいるかを感じ取る傾向が見えます。",
    artifact: "没頭スイッチつきの小さな扉",
    keywords: ["没頭", "好き", "楽しい", "夢中"],
    jobs: ["サービス企画", "UXデザイン", "イベント企画", "コンテンツ設計"],
    figure: "黄色い小さな扉を開けながら、楽しそうに振り向く3Dフィギュア",
    signals: ["没頭", "好き", "楽しい", "夢中", "ハマ", "時間", "続け", "熱中", "こだわり"]
  },
  {
    type: "安心リズム設計士",
    summary: "人が無理なく続けられるペースや仕組みを作る未知の仕事です。安定と自由のバランスを読み、日常に効く流れを設計します。",
    mission: "続けられる安心を、毎日のリズムにする。",
    why: "働き方や未来の感覚に対して、無理なく続く状態を大事にする傾向が見えます。",
    artifact: "一日のリズムを刻む小型メトロノーム",
    keywords: ["安定", "自由", "継続", "生活"],
    jobs: ["人事制度", "学習設計", "事業運営", "ワークスタイル設計"],
    figure: "白いメトロノームを持ち、落ち着いた表情で立つ3Dフィギュア",
    signals: ["安定", "自由", "朝", "生活", "続け", "働き", "無理", "ペース", "理想", "未来"]
  },
  {
    type: "こだわり翻訳プランナー",
    summary: "本人だけが感じている細かなこだわりを、他の人にも届く企画や言葉へ変換する未知の仕事です。感覚と実行をつなぎます。",
    mission: "小さなこだわりを、人に届く形へ翻訳する。",
    why: "自分なりの基準や好き嫌いを、ただの感想で終わらせず説明しようとする傾向が見えます。",
    artifact: "こだわりを照らす小さな翻訳レンズ",
    keywords: ["こだわり", "言葉", "企画", "伝える"],
    jobs: ["ブランド企画", "編集", "商品企画", "広報"],
    figure: "透明な翻訳レンズをのぞき込み、片手に小さな企画ノートを持つ3Dフィギュア",
    signals: ["こだわり", "伝え", "言葉", "説明", "好き", "違い", "企画", "編集", "発信"]
  },
  {
    type: "日常実験ログメーカー",
    summary: "日々の小さな試行錯誤を記録し、次の改善や発見に変える未知の仕事です。大げさではない変化を積み上げて価値にします。",
    mission: "小さな試行錯誤を、次の発見ログにする。",
    why: "最近の出来事や小さな達成を材料にして、次の工夫へつなげる傾向が見えます。",
    artifact: "実験シールだらけのログブック",
    keywords: ["成長", "記録", "工夫", "達成"],
    jobs: ["リサーチ", "学習支援", "業務改善", "コンテンツ制作"],
    figure: "実験シールの貼られたログブックを抱え、少し得意げに立つ3Dフィギュア",
    signals: ["最近", "誇ら", "成長", "達成", "工夫", "記録", "日記", "ログ", "試し", "変え"]
  }
];

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

function requireImageApiKey(res) {
  if (IMAGE_API_KEY) return true;
  sendJson(res, 503, { error: "image_api_key_missing" });
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

async function generateFigureImage(result) {
  const response = await fetch(IMAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${IMAGE_API_KEY}`
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: buildFigurePrompt(result),
      size: IMAGE_SIZE,
      quality: IMAGE_QUALITY,
      output_format: IMAGE_OUTPUT_FORMAT,
      n: 1
    })
  });

  if (!response.ok) {
    const detail = await readApiError(response);
    throw Object.assign(new Error("image_api_failed"), {
      status: response.status,
      detail
    });
  }

  const data = await response.json();
  const imageBase64 = data.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error("image_api_empty");
  }

  return `data:${imageMimeType(IMAGE_OUTPUT_FORMAT)};base64,${imageBase64}`;
}

function sanitizeMessage(message) {
  if (!message) return "";
  return message.replace(/^["「]|["」]$/g, "").replace(/\s+/g, " ").slice(0, 46);
}

function deriveResultProfile(text, keywords = [], avoidTypes = []) {
  const source = `${text || ""} ${keywords.join(" ")}`.toLowerCase();
  const avoid = new Set(avoidTypes.filter(Boolean));
  const scored = RESULT_PROFILES
    .map((profile, index) => {
      const signalScore = profile.signals.reduce((score, signal) => (
        source.includes(signal.toLowerCase()) ? score + 3 : score
      ), 0);
      const keywordScore = profile.keywords.reduce((score, keyword) => (
        source.includes(keyword.toLowerCase()) ? score + 2 : score
      ), 0);
      return { profile, index, score: signalScore + keywordScore };
    })
    .sort((a, b) => b.score - a.score || profileTieBreak(source, a.index, b.index));

  if (scored[0]?.score > 0) {
    return (scored.find((item) => !avoid.has(item.profile.type)) || scored[0]).profile;
  }

  const start = Math.abs(hashText(source || String(Date.now()))) % RESULT_PROFILES.length;
  for (let offset = 0; offset < RESULT_PROFILES.length; offset += 1) {
    const profile = RESULT_PROFILES[(start + offset) % RESULT_PROFILES.length];
    if (!avoid.has(profile.type)) return profile;
  }
  return RESULT_PROFILES[0];
}

function buildResultCandidates(text, keywords = [], limit = 4) {
  const source = `${text || ""} ${keywords.join(" ")}`.toLowerCase();
  return RESULT_PROFILES
    .map((profile, index) => {
      const matchedSignals = profile.signals.filter((signal) => source.includes(signal.toLowerCase()));
      const keywordMatches = profile.keywords.filter((keyword) => source.includes(keyword.toLowerCase()));
      return {
        type: profile.type,
        mission: profile.mission,
        artifact: profile.artifact,
        signals: [...matchedSignals, ...keywordMatches].slice(0, 5),
        index,
        score: matchedSignals.length * 3 + keywordMatches.length * 2
      };
    })
    .sort((a, b) => b.score - a.score || profileTieBreak(source, a.index, b.index))
    .slice(0, limit)
    .map(({ index, score, ...candidate }) => candidate);
}

function finalizeResult(result, context = {}) {
  const normalized = normalizeResult(result);
  const avoidTypes = new Set([
    ...GENERIC_RESULT_TYPES,
    ...(context.avoidTypes || []),
    normalizeResult(context.fallback || {}).type
  ].filter(Boolean));

  if (isWeakResultType(normalized.type, avoidTypes)) {
    const profile = deriveResultProfile(context.transcript, normalized.keywords, [...avoidTypes, normalized.type]);
    return normalizeResult({
      ...profile,
      keywords: normalized.keywords.length ? normalized.keywords : profile.keywords
    });
  }

  return normalized;
}

function normalizeResult(result) {
  return {
    type: sanitizeText(result.type || "こだわり翻訳プランナー", 32),
    summary: sanitizeText(result.summary || "本人だけが感じている細かなこだわりを、他の人にも届く企画や言葉へ変換する未知の仕事です。感覚と実行をつなぎます。", 160),
    mission: sanitizeText(result.mission || "小さなこだわりを、人に届く形へ翻訳する。", 90),
    why: sanitizeText(result.why || "発話の中に、観察して意味づける力と、こだわりを人に渡す力が見えます。", 130),
    artifact: sanitizeText(result.artifact || "こだわりを照らす小さな翻訳レンズ", 60),
    keywords: normalizeList(result.keywords, ["没頭", "こだわり", "発見", "整理"], 7),
    jobs: normalizeList(result.jobs, ["企画", "編集", "リサーチ"], 4),
    figure: sanitizeText(result.figure || "透明な翻訳レンズをのぞき込み、片手に小さな企画ノートを持つ3Dフィギュア", 120)
  };
}

function isWeakResultType(type, avoidTypes) {
  return !type || avoidTypes.has(type) || /タイプ$/.test(type) || type.length < 5;
}

function profileTieBreak(source, leftIndex, rightIndex) {
  const seed = Math.abs(hashText(source || "future"));
  return ((seed + leftIndex) % RESULT_PROFILES.length) - ((seed + rightIndex) % RESULT_PROFILES.length);
}

function hashText(text) {
  return String(text).split("").reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }, 0);
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

function buildFigurePrompt(result) {
  return [
    "Create one original 3D collectible figure for a Japanese web career diagnosis result.",
    "Style: polished toy photography, soft studio lighting, friendly premium 3D figure, rounded shapes, clean bright background.",
    "Composition: full-body character centered, one symbolic prop, expressive pose, clear silhouette, no clutter.",
    "Do not include readable text, letters, logos, captions, UI, watermarks, or extra characters.",
    `Fictional occupation name: ${result.type}`,
    `Mission: ${result.mission}`,
    `Why this person fits: ${result.why}`,
    `Symbolic artifact: ${result.artifact}`,
    `Keywords: ${result.keywords.join(", ")}`,
    `Figure details: ${result.figure}`,
    "Make the image feel optimistic, specific, imaginative, and suitable for students."
  ].join("\n");
}

function imageMimeType(format) {
  if (format === "jpeg" || format === "jpg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

module.exports = {
  IMAGE_API_URL,
  IMAGE_MODEL,
  LLM_API_URL,
  LLM_MODEL,
  buildFigureImage,
  buildResultCandidates,
  callChatCompletions,
  deriveResultProfile,
  finalizeResult,
  generateFigureImage,
  normalizeResult,
  requireApiKey,
  requireImageApiKey,
  sanitizeMessage,
  sendJson
};
