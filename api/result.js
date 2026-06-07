const {
  buildFigureImage,
  callChatCompletions,
  normalizeResult,
  requireApiKey,
  sendJson
} = require("./_lib");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "method_not_allowed" });
      return;
    }
    if (!requireApiKey(res)) return;

    const payload = req.body || {};
    const fallback = normalizeResult(payload.fallback || {});
    const content = await callChatCompletions([
      {
        role: "system",
        content: "あなたは学生の発話ログから、まだ世の中にないオリジナル職業を作る診断AIです。実在職種名ではなく、未知だけど働き方が想像できる職業名を日本語で作ってください。JSONだけ返してください。"
      },
      {
        role: "user",
        content: JSON.stringify({
          transcript: payload.transcript,
          fallback,
          schema: {
            type: "オリジナル職業名。12〜22文字程度",
            summary: "その職業が何をする人か。120字以内",
            keywords: "発話から拾った短いキーワード配列。4〜7個",
            jobs: "近い既存領域や働き方の方向性配列。3〜4個",
            figure: "3Dフィギュア化する時の見た目。色、持ち物、ポーズ"
          }
        })
      }
    ], {
      maxTokens: 520,
      responseFormat: { type: "json_object" },
      temperature: 1
    });

    const result = normalizeResult({ ...fallback, ...JSON.parse(content || "{}") });
    result.imageUrl = buildFigureImage(result.type, result.keywords, result.figure);
    sendJson(res, 200, { result, source: "api" });
  } catch (error) {
    sendJson(res, 502, {
      error: "result_api_failed",
      detail: error.detail || error.message
    });
  }
};
