const TARGET_CHARS = 50;

const topics = [
  {
    title: "人生で一番時間を溶かしたものは？",
    hint: "きっかけ、ハマった理由、誰にも伝わらないこだわりまで、思いついた順で話してみてください。",
    prompts: ["それっていつから？", "徹夜したことある？", "誰に話したくなる？", "やめ時を失った瞬間は？", "一番うまくなったことは？"]
  },
  {
    title: "頼まれていないのに、つい整えてしまうものは？",
    hint: "ノート、予定、空気、作業手順、友だちの相談など、小さなクセをそのまま話してください。",
    prompts: ["気づくと直してる？", "人にも勧めるタイプ？", "整うと何が気持ちいい？", "逆に苦手な乱れは？", "それで助かった人いる？"]
  },
  {
    title: "最近ちょっと誇らしかった瞬間は？",
    hint: "大きな成功でなくて大丈夫。自分だけが知っている小さな達成を拾ってみましょう。",
    prompts: ["どこが自分らしい？", "誰かに見てほしかった？", "もう一回やりたい？", "前より成長した点は？", "その時の気分は？"]
  },
  {
    title: "未来の仕事で、絶対に失いたくない感覚は？",
    hint: "自由、安定、チーム感、没頭、成長、感謝される感じなど、まだ曖昧なまま話して大丈夫です。",
    prompts: ["それがないとしんどい？", "逆に許せる不便は？", "どんな人と働きたい？", "朝起きる理由になる？", "理想の一日は？"]
  }
];

const idleChats = [
  "ゆっくりで大丈夫",
  "思い出してる時間も素材です",
  "最初に浮かんだやつからいこう",
  "言葉になる前の感じ、あり",
  "短くてもいいよ",
  "そこから話してみる？",
  "まだまとまってなくてOK",
  "うんうん、待ってる"
];

const contentQuestionRules = [
  { words: ["ゲーム", "攻略", "遊び", "プレイ"], questions: ["どの瞬間に一番燃えた？", "攻略するとき何を見てる？", "人に勧めるならどこ？"] },
  { words: ["友だち", "人", "チーム", "相談"], questions: ["その人とはどんな関係？", "相手の反応で覚えてることある？", "一人より誰かとやる方が好き？"] },
  { words: ["整理", "計画", "メモ", "効率"], questions: ["整理すると何が楽になる？", "自分なりの型ってある？", "どこまで細かく決めたい？"] },
  { words: ["作る", "制作", "デザイン", "開発", "コード"], questions: ["作ってる途中のどこが好き？", "完成より試作が楽しいタイプ？", "こだわって直す場所は？"] },
  { words: ["自由", "安定", "成長", "没頭"], questions: ["それがあると何が変わる？", "逆に失うときついのは？", "理想の一日はどんな感じ？"] },
  { words: ["好き", "楽しい", "夢中", "ハマ"], questions: ["何がそんなに刺さった？", "気づいたら続けてた感じ？", "誰かに語るなら最初に何を言う？"] }
];

const fallbackQuestions = [
  "そこ、もう少し聞きたい",
  "その時の気持ちは？",
  "いつからそう思ってた？",
  "他の人と違うこだわりある？",
  "それを続けた理由は？",
  "一番覚えてる場面は？"
];

const reactions = [
  { at: 30, text: "今ので30文字！いい滑り出し" },
  { at: 50, text: "50文字突破。それでそれで？" },
  { at: 75, text: "あと少し。今の温度のまま話して" },
  { at: 100, text: "100文字到達。送信します" }
];

const state = {
  topicIndex: 0,
  currentText: "",
  allTexts: [],
  started: false,
  acceptingInput: false,
  transitioning: false,
  ignoreSpeechUntil: 0,
  chatTimer: null,
  recognition: null,
  shouldListen: false,
  speechSession: 0,
  speechRestartTimer: null,
  lastSpeechAt: 0,
  lastQuestionAt: 0,
  lastQuestion: "",
  chatPending: false,
  chatGeneration: 0,
  promptedChatTimer: null,
  apiFailed: false,
  chatHistory: [],
  chatFingerprints: new Set(),
  milestones: new Set()
};

const els = {
  topic: document.querySelector("#current-topic"),
  hint: document.querySelector("#topic-hint"),
  topicCount: document.querySelector("#topic-count"),
  micState: document.querySelector("#mic-state"),
  chatStatus: document.querySelector("#chat-status"),
  chatFeed: document.querySelector("#chat-feed"),
  charCounter: document.querySelector("#char-counter"),
  progressFill: document.querySelector("#progress-fill"),
  charBubbles: document.querySelector("#char-bubbles"),
  liveTranscript: document.querySelector("#live-transcript"),
  startButton: document.querySelector("#start-button"),
  skipButton: document.querySelector("#skip-button"),
  manualInput: document.querySelector("#manual-input"),
  reactionPop: document.querySelector("#reaction-pop"),
  resultView: document.querySelector("#result-view"),
  resultTitle: document.querySelector("#result-title"),
  resultSummary: document.querySelector("#result-summary"),
  resultImage: document.querySelector("#result-image"),
  keywordList: document.querySelector("#keyword-list"),
  jobList: document.querySelector("#job-list"),
  restartButton: document.querySelector("#restart-button")
};

function initSpeechRecognition(forceNew = false) {
  if (state.recognition && !forceNew) return state.recognition;

  if (state.recognition && forceNew) {
    detachSpeechRecognition();
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setMicState("音声非対応");
    return null;
  }

  const recognition = new SpeechRecognition();
  const session = state.speechSession + 1;
  state.speechSession = session;
  recognition.lang = "ja-JP";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    if (session !== state.speechSession) return;
    setMicState("聞き取り中");
  };

  recognition.onerror = () => {
    if (session !== state.speechSession) return;
    setMicState("入力欄も使えます");
  };

  recognition.onend = () => {
    if (session === state.speechSession && state.started && state.shouldListen) {
      try {
        recognition.start();
      } catch {
        setMicState("再接続中");
      }
    }
  };

  recognition.onresult = (event) => {
    if (session !== state.speechSession) return;
    if (!state.started || state.transitioning || Date.now() < state.ignoreSpeechUntil) return;

    let finalText = "";
    let interimText = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += chunk;
      } else {
        interimText += chunk;
      }
    }

    if (finalText) {
      addSpeech(finalText.trim(), true);
    }

    if (interimText) {
      markSpeechActivity();
      renderTranscript(interimText.trim());
    }
  };

  state.recognition = recognition;
  return recognition;
}

function startExperience() {
  state.apiFailed = false;
  state.started = true;
  state.acceptingInput = true;
  state.chatHistory = [];
  state.chatFingerprints.clear();
  els.startButton.textContent = "話し続ける";
  els.startButton.disabled = true;
  els.skipButton.disabled = false;
  els.manualInput.disabled = false;
  setChatStatus("待機中");
  addMessage("ガイド", "準備できました。思いついたことからどうぞ。");
  checkApiHealth();
  startChatStream();

  state.recognition = state.recognition || initSpeechRecognition();
  if (state.recognition) {
    try {
      state.shouldListen = true;
      state.recognition.start();
    } catch {
      setMicState("入力欄も使えます");
    }
  }
}

function startChatStream() {
  stopChatStream();
  state.chatGeneration += 1;
  scheduleNextChat(1800, state.chatGeneration);
}

function stopChatStream() {
  state.chatGeneration += 1;
  if (state.chatTimer) {
    window.clearTimeout(state.chatTimer);
    state.chatTimer = null;
  }
  if (state.promptedChatTimer) {
    window.clearTimeout(state.promptedChatTimer);
    state.promptedChatTimer = null;
  }
}

function detachSpeechRecognition() {
  if (!state.recognition) return;
  const recognition = state.recognition;
  recognition.onstart = null;
  recognition.onerror = null;
  recognition.onend = null;
  recognition.onresult = null;
  try {
    recognition.stop();
  } catch {
    // Recognition may already be stopped.
  }
  state.recognition = null;
}

function pauseSpeechRecognition() {
  state.shouldListen = false;
  state.speechSession += 1;
  if (state.speechRestartTimer) {
    window.clearTimeout(state.speechRestartTimer);
    state.speechRestartTimer = null;
  }
  detachSpeechRecognition();
}

function resumeSpeechRecognition(delay = 700) {
  if (!state.started) return;
  if (state.speechRestartTimer) {
    window.clearTimeout(state.speechRestartTimer);
  }
  setMicState("再接続中");
  state.speechRestartTimer = window.setTimeout(() => {
    state.speechRestartTimer = null;
    if (!state.started) return;
    const recognition = initSpeechRecognition(true);
    if (!recognition) return;
    state.shouldListen = true;
    try {
      recognition.start();
    } catch {
      // Recognition may already be running.
    }
  }, delay);
}

function scheduleNextChat(delay = getChatDelay(), generation = state.chatGeneration) {
  if (!state.started) return;
  if (generation !== state.chatGeneration) return;
  state.chatTimer = window.setTimeout(() => runChatTick(generation), delay);
}

async function runChatTick(generation) {
  if (!state.started) return;
  if (generation !== state.chatGeneration) return;
  if (state.chatPending) {
    scheduleNextChat(getChatDelay(), generation);
    return;
  }

  state.chatPending = true;
  try {
    const text = await getNextChatText(generation);
    if (generation !== state.chatGeneration) return;
    if (text && !isDuplicateChat(text)) addMessage(randomName(), text);
  } finally {
    state.chatPending = false;
    scheduleNextChat(getChatDelay(), generation);
  }
}

function getChatDelay() {
  const isSpeaking = isSpeakingNow();
  return isSpeaking ? randomBetween(2800, 5600) : randomBetween(3600, 7600);
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function randomName() {
  const names = ["ユーザーA", "となりの人", "名無しさん", "Bot", "ユーザーB"];
  return names[Math.floor(Math.random() * names.length)];
}

function markSpeechActivity() {
  state.lastSpeechAt = Date.now();
  schedulePromptedChat();
}

async function getNextChatText(generation = state.chatGeneration) {
  if (generation !== state.chatGeneration) return "";
  if (!isSpeakingNow()) {
    setChatStatus("発話待ち");
    return "";
  }

  const topic = topics[state.topicIndex];
  const topicPrompt = topic.prompts[Math.floor(Math.random() * topic.prompts.length)];
  const contentQuestion = buildContentQuestion(state.currentText);
  return getSmartChatText("speaking", Math.random() < 0.7 ? contentQuestion : topicPrompt, generation);
}

function isSpeakingNow() {
  return Date.now() - state.lastSpeechAt < 12000 && state.currentText.trim().length > 0;
}

function schedulePromptedChat() {
  if (!state.started || state.apiFailed || state.chatPending) return;
  if (!state.currentText.trim()) return;
  if (Date.now() - state.lastQuestionAt < 2600) return;

  if (state.promptedChatTimer) {
    window.clearTimeout(state.promptedChatTimer);
  }

  const generation = state.chatGeneration;
  state.promptedChatTimer = window.setTimeout(() => {
    state.promptedChatTimer = null;
    runChatTick(generation);
  }, randomBetween(850, 1500));
}

async function getSmartChatText(mode, fallback, generation = state.chatGeneration) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1800);

  try {
    if (generation !== state.chatGeneration) return "";
    setChatStatus("API接続中");
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        topic: topics[state.topicIndex].title,
        transcript: state.currentText.slice(-180),
        previousQuestion: state.lastQuestion,
        recentComments: state.chatHistory.slice(-8)
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("chat api failed", response.status, detail);
      throw new Error("chat api failed");
    }
    const data = await response.json();
    if (generation !== state.chatGeneration) return "";
    if (data.source !== "api") throw new Error("chat api unavailable");
    if (typeof data.message !== "string" || !data.message.trim()) {
      throw new Error("empty chat api response");
    }

    const message = data.message.trim().slice(0, 46);
    setChatStatus("API応答");
    if (mode === "speaking") {
      state.lastQuestion = message;
      state.lastQuestionAt = Date.now();
    }
    return message;
  } catch {
    handleApiFailure("チャットAPIに接続できません。最初からやり直します。");
    return "";
  } finally {
    window.clearTimeout(timeout);
  }
}

function buildContentQuestion(text) {
  const matchedRule = contentQuestionRules.find((rule) => rule.words.some((word) => text.includes(word)));
  const pool = matchedRule ? matchedRule.questions : fallbackQuestions;
  const candidates = pool.filter((question) => question !== state.lastQuestion);
  const question = pick(candidates.length ? candidates : pool);
  state.lastQuestion = question;
  state.lastQuestionAt = Date.now();
  return question;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function addSpeech(text, fromMic = false) {
  if (!state.started || !text) return;
  markSpeechActivity();
  state.currentText = `${state.currentText}${text}`;
  renderTranscript();
  updateProgress();

  if (fromMic) {
    els.manualInput.value = state.currentText;
  }

  if (state.currentText.length >= TARGET_CHARS) {
    completeTopic();
  }
}

function renderTranscript(interim = "") {
  const display = `${state.currentText}${interim ? ` ${interim}` : ""}`.trim();
  els.liveTranscript.textContent = display || "";
}

function updateProgress() {
  const count = Math.min(state.currentText.length, TARGET_CHARS);
  const percent = Math.round((count / TARGET_CHARS) * 100);
  els.charCounter.textContent = `${count} / ${TARGET_CHARS}`;
  els.progressFill.style.width = `${percent}%`;
  renderBubbles(count);

  reactions.forEach((reaction) => {
    if (count >= reaction.at && !state.milestones.has(reaction.at)) {
      state.milestones.add(reaction.at);
      showReaction(reaction.text);
    }
  });
}

function renderBubbles(count) {
  const existing = els.charBubbles.children.length;
  if (existing === count) return;
  els.charBubbles.textContent = "";
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i += 1) {
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    fragment.appendChild(bubble);
  }
  els.charBubbles.appendChild(fragment);
}

function showReaction(text) {
  els.reactionPop.textContent = text;
  els.reactionPop.classList.remove("show");
  void els.reactionPop.offsetWidth;
  els.reactionPop.classList.add("show");
}

function addMessage(name, text, self = false) {
  if (!text) return;
  const shouldAutoScroll = isChatAtBottom();
  const item = document.createElement("div");
  item.className = `message${self ? " self" : ""}`;
  item.innerHTML = `<span class="name"></span><span class="body"></span>`;
  item.querySelector(".name").textContent = name;
  item.querySelector(".body").textContent = text;
  els.chatFeed.appendChild(item);
  rememberChatMessage(name, text, self);

  if (shouldAutoScroll) {
    els.chatFeed.scrollTop = els.chatFeed.scrollHeight;
  }
}

function rememberChatMessage(name, text, self) {
  if (self || name === "ガイド") return;
  const fingerprint = normalizeChatText(text);
  if (!fingerprint) return;
  state.chatFingerprints.add(fingerprint);
  state.chatHistory.push(text);
  if (state.chatHistory.length > 30) {
    const removed = state.chatHistory.shift();
    if (!state.chatHistory.some((item) => normalizeChatText(item) === normalizeChatText(removed))) {
      state.chatFingerprints.delete(normalizeChatText(removed));
    }
  }
}

function isDuplicateChat(text) {
  return state.chatFingerprints.has(normalizeChatText(text));
}

function normalizeChatText(text) {
  return String(text || "").replace(/[、。！？!?「」『』\s]/g, "").trim();
}

function isChatAtBottom() {
  const tolerance = 12;
  const distance = els.chatFeed.scrollHeight - els.chatFeed.scrollTop - els.chatFeed.clientHeight;
  return distance <= tolerance;
}

function setChatStatus(text) {
  els.chatStatus.textContent = text;
}

function setMicState(text) {
  if (els.micState) {
    els.micState.textContent = text;
  }
}

async function checkApiHealth() {
  try {
    setChatStatus("API確認中");
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("health api failed");
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "health api unavailable");
    setChatStatus("API OK");
  } catch {
    handleApiFailure("APIに接続できません。最初からやり直します。");
  }
}

function completeTopic() {
  if (!state.started || state.transitioning) return;
  state.transitioning = true;
  stopChatStream();
  pauseSpeechRecognition();
  state.ignoreSpeechUntil = Date.now() + 2200;
  const finalText = state.currentText.trim();
  if (finalText) {
    state.allTexts.push(finalText);
  }

  state.topicIndex += 1;

  if (state.topicIndex >= topics.length) {
    state.transitioning = false;
    finishDiagnosis();
    return;
  }

  setTopic(state.topicIndex);
  resetCurrentInput();
  clearChatFeed();
  addMessage("ガイド", "次の質問です。思いついたところからどうぞ。");
  enableTopicInput();
  startChatStream();
  window.setTimeout(() => {
    state.transitioning = false;
  }, 350);
}

function enableTopicInput() {
  state.acceptingInput = true;
  els.manualInput.disabled = false;
  els.skipButton.disabled = false;
  setMicState(state.recognition ? "再接続中" : "入力欄も使えます");
  resumeSpeechRecognition(750);
}

function setTopic(index) {
  const topic = topics[index];
  els.topic.textContent = topic.title;
  els.hint.textContent = topic.hint;
  if (els.topicCount) {
    els.topicCount.textContent = `${index + 1} / ${topics.length}`;
  }
}

function resetCurrentInput() {
  state.currentText = "";
  state.lastSpeechAt = 0;
  state.lastQuestionAt = 0;
  state.lastQuestion = "";
  state.milestones.clear();
  els.manualInput.value = "";
  renderTranscript();
  updateProgress();
}

function clearChatFeed() {
  els.chatFeed.textContent = "";
}

function finishDiagnosis() {
  stopChatStream();
  state.started = false;
  state.acceptingInput = false;
  state.ignoreSpeechUntil = Date.now() + 1600;
  els.chatStatus.textContent = "complete";
  setMicState("解析中");
  els.skipButton.disabled = true;
  els.manualInput.disabled = true;

  pauseSpeechRecognition();

  window.setTimeout(async () => {
    const transcript = state.allTexts.join("。");
    try {
      const result = await createDiagnosisResult(transcript);
      renderResult(result);
    } catch {
      // Error state is handled in createDiagnosisResult.
    }
  }, 650);
}

async function createDiagnosisResult(transcript) {
  const fallback = analyzeSpeechLogs(transcript);

  try {
    const response = await fetch("/api/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, fallback })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("result api failed", response.status, detail);
      throw new Error("result api failed");
    }
    const data = await response.json();
    if (data.source !== "api") throw new Error("result api unavailable");
    return { ...fallback, ...data.result };
  } catch {
    handleApiFailure("診断APIに接続できません。最初からやり直します。");
    throw new Error("diagnosis api unavailable");
  }
}

function analyzeSpeechLogs(text) {
  const keywordSeeds = [
    "ゲーム", "攻略", "整理", "友だち", "チーム", "相談", "制作", "デザイン", "開発", "コード",
    "計画", "分析", "改善", "効率", "自由", "安定", "没頭", "成長", "こだわり", "発見",
    "人", "話す", "助け", "教える", "作る", "調べる", "メモ", "楽しい", "夢中"
  ];
  const seedHits = keywordSeeds.filter((seed) => text.includes(seed));
  const normalized = text.replace(/[、。！？\s]/g, " ");
  const words = normalized
    .split(" ")
    .flatMap((part) => part.match(/[A-Za-z0-9]{2,}|[ァ-ヶー]{2,}|[一-龠]{2,}/g) || [])
    .filter((word) => word.length <= 8)
    .filter((word) => !["それ", "これ", "ところ", "感じ", "自分", "こと", "もの", "小学生"].includes(word));

  const counts = [...seedHits, ...words].reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const keywords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([word]) => word);

  const lower = text.toLowerCase();
  let type = "観察を形にする編集者タイプ";
  let summary = "話の中に、好きなものを分解して人に伝わる形へ整える力が出ています。曖昧な感覚を拾い、意味づけしながら前へ進める仕事と相性がよさそうです。";
  let jobs = ["企画職", "UXリサーチャー", "編集・ライター", "人事・採用広報"];

  if (/作る|制作|デザイン|描|開発|コード|ゲーム/.test(lower)) {
    type = "手を動かして未来を試作するクリエイタータイプ";
    summary = "考えるだけで終わらせず、実際に作りながら理解を深める傾向が強く出ています。試行錯誤の速さが価値になる環境で力を発揮しやすいです。";
    jobs = ["プロダクトデザイナー", "エンジニア", "映像・ゲーム制作", "商品企画"];
  } else if (/人|友|チーム|相談|話|助け|教/.test(lower)) {
    type = "人の温度を読んで動く伴走者タイプ";
    summary = "相手の状況を見ながら言葉や行動を調整する力が見えます。信頼関係を育て、場の流れをよくする仕事に向いていそうです。";
    jobs = ["キャリアアドバイザー", "カスタマーサクセス", "営業企画", "教育・研修"];
  } else if (/分析|調べ|数字|整理|計画|効率|改善/.test(lower)) {
    type = "混沌から筋道を見つけるプランナータイプ";
    summary = "散らばった情報を集めて、次に何をするべきかを見つける話し方です。課題を整理し、改善の道筋を描く役割と相性がよさそうです。";
    jobs = ["マーケティング", "データアナリスト", "業務改善", "コンサルタント"];
  }

  return {
    type,
    summary,
    keywords: keywords.length ? keywords : ["没頭", "こだわり", "成長", "チーム"],
    jobs,
    imageUrl: buildLocalFigureImage(type, keywords.length ? keywords : ["没頭", "こだわり", "成長"])
  };
}

function buildLocalFigureImage(title, keywords) {
  const palette = ["#20b7bd", "#ff6f61", "#ffd166", "#7d6bff", "#a8d94f"];
  const color = palette[(keywords.join("").length + title.length) % palette.length];
  const accent = palette[(keywords.length + 2) % palette.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#f8fbff"/><stop offset=".52" stop-color="#eef6f2"/><stop offset="1" stop-color="#fff8ee"/>
        </linearGradient>
        <radialGradient id="shine" cx=".35" cy=".2" r=".75">
          <stop stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${accent}" stop-opacity=".2"/>
        </radialGradient>
        <filter id="soft"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#18212f" flood-opacity=".22"/></filter>
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
      </g>
      <g font-family="Noto Sans JP, sans-serif" text-anchor="middle">
        <text x="360" y="670" fill="#18212f" font-size="24" font-weight="900">${escapeSvg(title).slice(0, 18)}</text>
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

function renderResult(result) {
  els.resultTitle.textContent = result.type;
  els.resultSummary.textContent = result.summary;
  els.resultImage.src = result.imageUrl || buildLocalFigureImage(result.type, result.keywords);
  els.keywordList.textContent = "";
  result.keywords.forEach((keyword) => {
    const chip = document.createElement("span");
    chip.textContent = keyword;
    els.keywordList.appendChild(chip);
  });

  els.jobList.textContent = "";
  result.jobs.forEach((job) => {
    const li = document.createElement("li");
    li.textContent = job;
    els.jobList.appendChild(li);
  });

  setMicState("完了");
  els.resultView.hidden = false;
}

function handleApiFailure(message) {
  if (state.apiFailed) return;
  state.apiFailed = true;
  stopChatStream();
  state.started = false;
  state.chatPending = false;
  pauseSpeechRecognition();
  setChatStatus("APIエラー");
  setMicState("APIエラー");
  els.skipButton.disabled = true;
  els.manualInput.disabled = true;
  addMessage("未来診断", message);
  showReaction("API接続エラー");
  window.setTimeout(() => {
    restart();
    addMessage("未来診断", message);
    setChatStatus("APIエラー");
  }, 1800);
}

function restart() {
  stopChatStream();
  pauseSpeechRecognition();
  state.topicIndex = 0;
  state.currentText = "";
  state.allTexts = [];
  state.started = false;
  state.acceptingInput = false;
  state.transitioning = false;
  state.ignoreSpeechUntil = 0;
  state.shouldListen = false;
  state.lastSpeechAt = 0;
  state.lastQuestionAt = 0;
  state.lastQuestion = "";
  state.chatPending = false;
  state.apiFailed = false;
  state.chatHistory = [];
  state.chatFingerprints.clear();
  state.milestones.clear();
  els.resultView.hidden = true;
  els.startButton.disabled = false;
  els.startButton.innerHTML = '<span class="button-icon" aria-hidden="true">●</span>会話をはじめる';
  els.skipButton.disabled = true;
  els.manualInput.disabled = true;
  els.manualInput.value = "";
  els.chatFeed.textContent = "";
  els.chatStatus.textContent = "streaming soon";
  setMicState("待機中");
  setTopic(0);
  resetCurrentInput();
}

els.startButton.addEventListener("click", startExperience);
els.skipButton.addEventListener("click", completeTopic);
els.restartButton.addEventListener("click", restart);
els.manualInput.addEventListener("input", (event) => {
  if (!state.started || state.apiFailed) return;
  const nextValue = event.target.value;
  const added = nextValue.slice(state.currentText.length);
  state.currentText = nextValue;
  if (added.trim()) {
    markSpeechActivity();
  }
  renderTranscript();
  updateProgress();
  if (state.currentText.length >= TARGET_CHARS) {
    completeTopic();
  }
});

setTopic(0);
resetCurrentInput();
