const http = require("node:http");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

loadEnvFile(".env.local");
loadEnvFile(".env");

const {
  buildResultCandidates: buildSharedResultCandidates,
  deriveResultProfile: deriveSharedResultProfile,
  finalizeResult: finalizeSharedResult
} = require("./api/_lib");

const PORT = Number(process.env.PORT || 8010);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const PUBLIC_ROOT = path.join(__dirname, "public");
const LLM_API_URL = process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions";
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";
const IMAGE_API_URL = process.env.IMAGE_API_URL || "https://api.openai.com/v1/images/generations";
const IMAGE_API_KEY = process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || LLM_API_KEY;
const IMAGE_MODEL = process.env.IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const IMAGE_SIZE = process.env.IMAGE_SIZE || "1024x1024";
const IMAGE_QUALITY = process.env.IMAGE_QUALITY || "medium";
const IMAGE_OUTPUT_FORMAT = process.env.IMAGE_OUTPUT_FORMAT || "webp";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === "POST" && url.pathname === "/api/chat") {
      await handleChat(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/result") {
      await handleResult(request, response);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/health") {
      await handleHealth(response);
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    const filePath = safeFilePath(url.pathname);
    const body = await fs.readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    response.end(body);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, { error: "not_found" });
      return;
    }
    sendJson(response, 500, { error: "server_error" });
  }
});

function loadEnvFile(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fsSync.existsSync(filePath)) return;

  const content = fsSync.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return;
    const key = match[1];
    const rawValue = match[2].trim();
    if (process.env[key]) return;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  });
}

function safeFilePath(pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const resolved = path.resolve(PUBLIC_ROOT, `.${decodeURIComponent(requested)}`);
  if (!resolved.startsWith(PUBLIC_ROOT)) {
    throw Object.assign(new Error("forbidden"), { code: "ENOENT" });
  }
  return resolved;
}

async function handleChat(request, response) {
  const payload = await readJson(request);

  if (!LLM_API_KEY) {
    sendJson(response, 503, { error: "api_key_missing" });
    return;
  }

  try {
    const apiResponse = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0.9,
        max_tokens: 40,
        messages: [
          {
            role: "system",
            content: "あなたは学生の自己分析を助けるライブ配信のコメント欄です。20文字以内の自然な日本語で、説教せず、軽く、話を続けたくなる一言だけ返してください。"
          },
          {
            role: "user",
            content: JSON.stringify({
              mode: payload.mode,
              topic: payload.topic,
              recentTranscript: payload.transcript,
              previousQuestion: payload.previousQuestion,
              recentComments: payload.recentComments || [],
              instruction: payload.mode === "idle"
                ? "無言の間なので相槌っぽく待つコメント。質問しすぎない。"
                : "発話内容に即して、続きを引き出す短い質問。recentCommentsと同じ意味・同じ語尾のコメントは避ける。直前と重複しない。"
            })
          }
        ]
      })
    });

    if (!apiResponse.ok) {
      const detail = await readApiError(apiResponse);
      console.error(`chat API failed: ${apiResponse.status} ${detail}`);
      throw new Error(`llm_status_${apiResponse.status}`);
    }
    const data = await apiResponse.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    const sanitized = sanitizeMessage(message);
    if (!sanitized) throw new Error("empty_llm_message");
    sendJson(response, 200, { message: sanitized, source: "api" });
  } catch {
    sendJson(response, 502, { error: "chat_api_failed" });
  }
}

async function handleResult(request, response) {
  const payload = await readJson(request);
  const transcript = String(payload.transcript || "");
  const clientFallback = normalizeResult(payload.fallback || {});
  const fallback = ["違和感採集エディター", "未来感覚キュレーター"].includes(clientFallback.type)
    ? normalizeResult({
      ...deriveSharedResultProfile(transcript, clientFallback.keywords, [clientFallback.type]),
      keywords: clientFallback.keywords
    })
    : clientFallback;

  if (!LLM_API_KEY) {
    sendJson(response, 503, { error: "api_key_missing" });
    return;
  }
  if (!IMAGE_API_KEY) {
    sendJson(response, 503, { error: "image_api_key_missing" });
    return;
  }

  try {
    const apiResponse = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 1.05,
        max_tokens: 760,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "あなたは学生の発話ログから、まだ世の中にないオリジナル職業を作る診断AIです。",
              "実在職種名や一般的な適職名をそのまま出さず、未知だけど仕事内容が想像できる肩書きを作ってください。",
              "職業名は比喩だけで終わらせず、ユーザーの発話にある具体的な行動・こだわり・対人傾向を反映してください。",
              "figureは画像生成に使うため、1体の3Dフィギュアとして見える服装、色、持ち物、ポーズを具体的にしてください。",
              "fallbackの職業名をそのまま採用しないでください。発話ログから毎回、新しい肩書きを作ってください。",
              "褒めすぎず、でも本人が少し誇らしくなる温度で書いてください。",
              "JSONだけ返してください。"
            ].join("")
          },
          {
            role: "user",
            content: JSON.stringify({
              transcript,
              fallbackHint: fallback,
              candidateDirections: buildSharedResultCandidates(transcript, fallback.keywords),
              avoid: [
                fallback.type,
                clientFallback.type,
                "違和感採集エディター",
                "未来感覚キュレーター",
                "プロトタイパーだけ",
                "ファシリテーターだけ",
                "クリエイターだけ",
                "アーキテクトだけ",
                "キュレーターだけ",
                "既存職種名そのまま"
              ],
              schema: {
                type: "オリジナル職業名。12〜22文字程度",
                summary: "その職業が何をする人か。90〜130字",
                mission: "この職業の一文ミッション。45字以内",
                why: "発話ログのどの傾向からそう診断したか。90字以内",
                artifact: "その職業が持つ象徴的な道具や成果物。30字以内",
                keywords: "発話から拾った短いキーワード配列。4〜7個。抽象語だけにしない",
                jobs: "近い既存領域や働き方の方向性配列。3〜4個",
                figure: "3Dフィギュア化する時の見た目。服の色、持ち物、ポーズ、表情"
              }
            })
          }
        ]
      })
    });

    if (!apiResponse.ok) {
      const detail = await readApiError(apiResponse);
      console.error(`result API failed: ${apiResponse.status} ${detail}`);
      throw new Error(`llm_status_${apiResponse.status}`);
    }
    const data = await apiResponse.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    const result = finalizeSharedResult({ ...fallback, ...parsed }, {
      transcript,
      fallback,
      avoidTypes: [fallback.type, clientFallback.type, "違和感採集エディター"]
    });
    result.imageUrl = await generateFigureImage(result);
    result.imageSource = "generated";
    sendJson(response, 200, { result, source: "api" });
  } catch (error) {
    console.error(`result generation failed: ${error.detail || error.message}`);
    sendJson(response, 502, {
      error: "result_api_failed",
      detail: error.detail || error.message
    });
  }
}

async function handleHealth(response) {
  if (!LLM_API_KEY) {
    sendJson(response, 503, {
      ok: false,
      error: "api_key_missing",
      model: LLM_MODEL,
      apiUrl: LLM_API_URL,
      hint: "Set OPENAI_API_KEY in .env.local or in the server start command."
    });
    return;
  }

  try {
    const apiResponse = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0,
        max_tokens: 8,
        messages: [
          { role: "user", content: "ok" }
        ]
      })
    });

    if (!apiResponse.ok) {
      const detail = await readApiError(apiResponse);
      sendJson(response, 502, {
        ok: false,
        error: "api_request_failed",
        status: apiResponse.status,
        model: LLM_MODEL,
        apiUrl: LLM_API_URL,
        detail
      });
      return;
    }

    sendJson(response, 200, {
      ok: true,
      model: LLM_MODEL,
      apiUrl: LLM_API_URL,
      imageModel: IMAGE_MODEL,
      imageApiUrl: IMAGE_API_URL
    });
  } catch (error) {
    sendJson(response, 502, {
      ok: false,
      error: "network_or_fetch_failed",
      model: LLM_MODEL,
      apiUrl: LLM_API_URL,
      detail: error.message
    });
  }
}

async function readApiError(apiResponse) {
  try {
    const text = await apiResponse.text();
    return text.replace(/sk-[A-Za-z0-9_-]+/g, "sk-***").slice(0, 500);
  } catch {
    return "";
  }
}

function localChat(payload) {
  const transcript = payload.transcript || "";
  if (payload.mode === "idle") {
    return pick(["ゆっくりで大丈夫", "思い出してる時間も素材です", "まとまってなくてOK", "うんうん、待ってる"]);
  }
  if (/ゲーム|攻略|遊び/.test(transcript)) return pick(["どこが一番燃えた？", "攻略中どこを見てた？"]);
  if (/友だち|人|チーム|相談/.test(transcript)) return pick(["相手の反応は？", "誰とやると楽しい？"]);
  if (/整理|計画|メモ|効率/.test(transcript)) return pick(["整理すると何が楽？", "自分なりの型ある？"]);
  if (/作る|制作|デザイン|開発|コード/.test(transcript)) return pick(["作る途中のどこが好き？", "直したくなる所は？"]);
  return pick(["そこ、もう少し聞きたい", "その時の気持ちは？", "一番覚えてる場面は？"]);
}

function localResult(transcript, fallback) {
  const result = normalizeResult(fallback);
  const text = `${transcript} ${result.keywords.join(" ")}`;

  if (/ゲーム|攻略|作る|制作|開発|コード/.test(text)) {
    result.type = "遊び筋道プロトタイパー";
    result.summary = "人が夢中になる流れを読み解き、試作品や攻略の道筋に変える未知の仕事です。楽しさの構造を見つけて、体験の入口を作ります。";
    result.mission = "夢中の構造を、触れる試作品にする。";
    result.why = "作る、攻略する、改善する流れに反応があり、手を動かして理解する傾向が見えます。";
    result.artifact = "光る試作品とルートマップ";
    result.jobs = ["体験設計", "プロダクト企画", "ゲーム・教材制作", "UXリサーチ"];
    result.figure = "片手に小さなルートマップ、片手に光る試作品を持つ、好奇心の強い3Dフィギュア";
  } else if (/友だち|人|チーム|相談|話|助け/.test(text)) {
    result.type = "場の温度翻訳者";
    result.summary = "人の言葉になる前の違和感や熱量を受け取り、場が動き出す言葉へ翻訳する未知の仕事です。関係性の流れを整えます。";
    result.mission = "言葉になる前の温度を、場の一歩にする。";
    result.why = "人の反応や関係性を見ながら、相手に合わせて動く力が発話に出ています。";
    result.artifact = "会話の温度を測る小さなランプ";
    result.jobs = ["人材・組織開発", "カスタマーサクセス", "コミュニティ運営", "教育"];
    result.figure = "胸元に小さな会話ランプをつけ、両手で場を包むポーズの3Dフィギュア";
  } else if (/整理|計画|分析|改善|効率|メモ/.test(text)) {
    result.type = "混沌整流アーキテクト";
    result.summary = "散らばった情報や感情の流れをほどき、次の一手が見える形へ整える未知の仕事です。曖昧な状況に道を作ります。";
    result.mission = "散らかった情報に、進める流れを作る。";
    result.why = "整理、計画、改善への意識があり、曖昧なものを筋道に変える傾向が見えます。";
    result.artifact = "色分けされた透明ボード";
    result.jobs = ["業務改善", "データ分析", "プロジェクト設計", "編集・企画"];
    result.figure = "透明なボードと色分けされたパーツを持ち、情報を並べ替える3Dフィギュア";
  } else {
    result.type = "こだわり翻訳プランナー";
    result.summary = "本人だけが感じている細かなこだわりを、他の人にも届く企画や言葉へ変換する未知の仕事です。感覚と実行をつなぎます。";
    result.mission = "小さなこだわりを、人に届く形へ翻訳する。";
    result.why = "感覚を観察して意味づけ、人に伝わる形へ整える傾向が見えます。";
    result.artifact = "こだわりを照らす小さな翻訳レンズ";
    result.jobs = ["企画職", "編集・ライター", "リサーチ", "ブランド設計"];
    result.figure = "透明な翻訳レンズをのぞき込み、片手に小さな企画ノートを持つ3Dフィギュア";
  }

  result.imageUrl = buildFigureImage(result.type, result.keywords, result.figure);
  return result;
}

async function generateFigureImage(result) {
  const apiResponse = await fetch(IMAGE_API_URL, {
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

  if (!apiResponse.ok) {
    const detail = await readApiError(apiResponse);
    throw Object.assign(new Error("image_api_failed"), {
      status: apiResponse.status,
      detail
    });
  }

  const data = await apiResponse.json();
  const imageBase64 = data.data?.[0]?.b64_json;
  if (!imageBase64) throw new Error("image_api_empty");

  return `data:${imageMimeType(IMAGE_OUTPUT_FORMAT)};base64,${imageBase64}`;
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

function escapeSvg(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;"
  }[char]));
}

function sanitizeMessage(message) {
  if (!message) return "";
  return message.replace(/^["「]|["」]$/g, "").replace(/\s+/g, " ").slice(0, 46);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8000) {
        request.destroy();
        reject(new Error("payload_too_large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

server.listen(PORT, HOST, () => {
  console.log(`未来診断 server: http://${HOST}:${PORT}/`);
  console.log(LLM_API_KEY ? `LLM API: configured (${LLM_MODEL})` : "LLM API: missing OPENAI_API_KEY or LLM_API_KEY");
  console.log(IMAGE_API_KEY ? `Image API: configured (${IMAGE_MODEL})` : "Image API: missing OPENAI_API_KEY or IMAGE_API_KEY");
});
