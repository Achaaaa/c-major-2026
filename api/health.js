const {
  IMAGE_API_URL,
  IMAGE_MODEL,
  LLM_API_URL,
  LLM_MODEL,
  callChatCompletions,
  requireApiKey,
  sendJson
} = require("./_lib");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      sendJson(res, 405, { error: "method_not_allowed" });
      return;
    }
    if (!requireApiKey(res)) return;

    await callChatCompletions([
      { role: "user", content: "ok" }
    ], { maxTokens: 8, temperature: 0 });
    sendJson(res, 200, {
      ok: true,
      model: LLM_MODEL,
      apiUrl: LLM_API_URL,
      imageModel: IMAGE_MODEL,
      imageApiUrl: IMAGE_API_URL
    });
  } catch (error) {
    sendJson(res, 502, {
      ok: false,
      error: "api_request_failed",
      model: LLM_MODEL,
      apiUrl: LLM_API_URL,
      detail: error.detail || error.message
    });
  }
};
