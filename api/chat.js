const {
  callChatCompletions,
  requireApiKey,
  sanitizeMessage,
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
    const message = await callChatCompletions([
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
          instruction: "発話内容に即して、続きを引き出す短い質問。直前と重複しない。"
        })
      }
    ], { maxTokens: 40, temperature: 0.9 });

    const sanitized = sanitizeMessage(message);
    if (!sanitized) throw new Error("empty_llm_message");
    sendJson(res, 200, { message: sanitized, source: "api" });
  } catch (error) {
    sendJson(res, 502, {
      error: "chat_api_failed",
      detail: error.detail || error.message
    });
  }
};
