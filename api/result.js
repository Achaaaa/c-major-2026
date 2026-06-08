const {
  buildResultCandidates,
  callChatCompletions,
  deriveResultProfile,
  finalizeResult,
  generateFigureImage,
  normalizeResult,
  requireApiKey,
  requireImageApiKey,
  sendJson
} = require("./_lib");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "method_not_allowed" });
      return;
    }
    if (!requireApiKey(res)) return;
    if (!requireImageApiKey(res)) return;

    const payload = req.body || {};
    const transcript = String(payload.transcript || "");
    const clientFallback = normalizeResult(payload.fallback || {});
    const fallback = ["違和感採集エディター", "未来感覚キュレーター"].includes(clientFallback.type)
      ? normalizeResult({
        ...deriveResultProfile(transcript, clientFallback.keywords, [clientFallback.type]),
        keywords: clientFallback.keywords
      })
      : clientFallback;
    const content = await callChatCompletions([
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
          candidateDirections: buildResultCandidates(transcript, fallback.keywords),
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
    ], {
      maxTokens: 760,
      responseFormat: { type: "json_object" },
      temperature: 1.05
    });

    const parsed = JSON.parse(content || "{}");
    const result = finalizeResult({ ...fallback, ...parsed }, {
      transcript,
      fallback,
      avoidTypes: [fallback.type, clientFallback.type, "違和感採集エディター"]
    });
    result.imageUrl = await generateFigureImage(result);
    result.imageSource = "generated";
    sendJson(res, 200, { result, source: "api" });
  } catch (error) {
    sendJson(res, 502, {
      error: "result_api_failed",
      detail: error.detail || error.message
    });
  }
};
