const TARGET_CHARS = 50;

const topics = [
  {
    title: "いままで一番時間を溶かしたものは？",
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
    title: "働く時、絶対に失いたくない感覚は？",
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

const resultProfiles = [
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
  milestones: new Set(),
  audioStream: null,
  audioContext: null,
  audioAnalyser: null,
  waveformData: null,
  waveformAnimation: null,
  waveformLevel: 0,
  waveformPhase: 0
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
  waveformCanvas: document.querySelector("#voice-waveform"),
  generatingPanel: document.querySelector("#generating-panel"),
  startButton: document.querySelector("#start-button"),
  skipButton: document.querySelector("#skip-button"),
  manualInput: document.querySelector("#manual-input"),
  reactionPop: document.querySelector("#reaction-pop"),
  resultView: document.querySelector("#result-view"),
  resultTitle: document.querySelector("#result-title"),
  resultSummary: document.querySelector("#result-summary"),
  resultMission: document.querySelector("#result-mission"),
  resultWhy: document.querySelector("#result-why"),
  resultArtifact: document.querySelector("#result-artifact"),
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

async function startExperience() {
  state.apiFailed = false;
  state.started = true;
  state.acceptingInput = true;
  state.chatHistory = [];
  state.chatFingerprints.clear();
  setGenerating(false);
  els.startButton.textContent = "話し続ける";
  els.startButton.disabled = true;
  els.skipButton.disabled = false;
  els.manualInput.disabled = false;
  setChatStatus("待機中");
  addMessage("ガイド", "準備できました。思いついたことからどうぞ。");
  checkApiHealth();
  startChatStream();
  await startAudioWaveform();

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

async function startAudioWaveform() {
  if (!els.waveformCanvas) return;
  drawWaveformFrame();
  if (state.audioAnalyser) {
    startWaveformLoop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    startWaveformLoop();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      state.audioStream = stream;
      startWaveformLoop();
      return;
    }
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;
    source.connect(analyser);
    state.audioStream = stream;
    state.audioContext = audioContext;
    state.audioAnalyser = analyser;
    state.waveformData = new Uint8Array(analyser.fftSize);
  } catch {
    state.audioAnalyser = null;
    state.waveformData = null;
  }

  startWaveformLoop();
}

function startWaveformLoop() {
  if (state.waveformAnimation) return;
  const draw = () => {
    drawWaveformFrame();
    state.waveformAnimation = window.requestAnimationFrame(draw);
  };
  state.waveformAnimation = window.requestAnimationFrame(draw);
}

function stopAudioWaveform() {
  if (state.waveformAnimation) {
    window.cancelAnimationFrame(state.waveformAnimation);
    state.waveformAnimation = null;
  }
  if (state.audioStream) {
    state.audioStream.getTracks().forEach((track) => track.stop());
    state.audioStream = null;
  }
  if (state.audioContext) {
    state.audioContext.close().catch(() => {});
    state.audioContext = null;
  }
  state.audioAnalyser = null;
  state.waveformData = null;
  state.waveformLevel = 0;
  drawWaveformFrame();
}

function drawWaveformFrame() {
  const canvas = els.waveformCanvas;
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.round(width * dpr);
  const targetHeight = Math.round(height * dpr);
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const samples = getWaveformSamples();
  const level = samples.level;
  state.waveformLevel = state.waveformLevel * 0.84 + level * 0.16;
  state.waveformPhase += 0.045 + state.waveformLevel * 0.16;

  const centerY = height / 2;
  const amplitude = Math.max(8, height * (0.12 + state.waveformLevel * 0.48));
  const gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#20b7bd");
  gradient.addColorStop(0.5, "#ffd166");
  gradient.addColorStop(1, "#ff6f61");

  context.lineWidth = 5;
  context.lineCap = "round";
  context.strokeStyle = "rgba(32, 183, 189, 0.12)";
  drawWavePath(context, samples.values, width, centerY, amplitude * 1.25, state.waveformPhase, true);
  context.stroke();

  context.lineWidth = 3;
  context.strokeStyle = gradient;
  drawWavePath(context, samples.values, width, centerY, amplitude, state.waveformPhase, false);
  context.stroke();
}

function getWaveformSamples() {
  if (state.audioAnalyser && state.waveformData) {
    state.audioAnalyser.getByteTimeDomainData(state.waveformData);
    let level = 0;
    const values = Array.from(state.waveformData, (value) => {
      const normalized = (value - 128) / 128;
      level += Math.abs(normalized);
      return normalized;
    });
    return { values, level: Math.min(1, level / values.length * 3.2) };
  }

  const values = Array.from({ length: 96 }, (_, index) => {
    return Math.sin(index * 0.24 + state.waveformPhase) * 0.25;
  });
  return { values, level: state.started ? 0.18 : 0.08 };
}

function drawWavePath(context, values, width, centerY, amplitude, phase, isGlow) {
  context.beginPath();
  values.forEach((value, index) => {
    const progress = values.length <= 1 ? 0 : index / (values.length - 1);
    const idleMotion = Math.sin(progress * Math.PI * 4 + phase) * (isGlow ? 0.14 : 0.08);
    const x = progress * width;
    const y = centerY + (value + idleMotion) * amplitude;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
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

  if (state.currentText.length >= TARGET_CHARS) {
    completeTopic();
  }
}

function renderTranscript() {
  drawWaveformFrame();
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

function setGenerating(isGenerating) {
  if (!els.generatingPanel) return;
  els.generatingPanel.hidden = !isGenerating;
}

function addMessage(name, text, self = false) {
  if (!text) return;
  const shouldAutoScroll = isChatAtBottom();
  const item = document.createElement("div");
  const typeClass = self ? " self" : getMessageClass(name);
  item.className = `message${typeClass}`;
  item.innerHTML = `<span class="name"></span><span class="body"></span>`;
  item.querySelector(".name").textContent = name;
  item.querySelector(".body").textContent = text;
  els.chatFeed.appendChild(item);
  rememberChatMessage(name, text, self);

  if (shouldAutoScroll) {
    els.chatFeed.scrollTop = els.chatFeed.scrollHeight;
  }
}

function getMessageClass(name) {
  if (name === "ガイド") return " guide";
  if (name === "未来診断") return " system";
  return "";
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
  els.chatStatus.textContent = "生成中";
  setMicState("解析中");
  els.skipButton.disabled = true;
  els.manualInput.disabled = true;
  setGenerating(true);
  addMessage("ガイド", "診断結果と3Dフィギュア画像を生成しています");
  showReaction("診断と画像を生成中");

  pauseSpeechRecognition();
  stopAudioWaveform();

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

  const resultKeywords = keywords.length ? keywords : ["没頭", "こだわり", "成長", "チーム"];
  const profile = pickResultProfile(text, resultKeywords);
  return {
    type: profile.type,
    summary: profile.summary,
    mission: profile.mission,
    why: profile.why,
    artifact: profile.artifact,
    figure: profile.figure,
    keywords: resultKeywords,
    jobs: profile.jobs,
    imageUrl: buildLocalFigureImage(profile.type, resultKeywords)
  };
}

function pickResultProfile(text, keywords, avoidTypes = []) {
  const source = `${text} ${keywords.join(" ")}`.toLowerCase();
  const avoid = new Set(avoidTypes);
  const scored = resultProfiles
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

  const start = Math.abs(hashText(source || String(Date.now()))) % resultProfiles.length;
  for (let offset = 0; offset < resultProfiles.length; offset += 1) {
    const profile = resultProfiles[(start + offset) % resultProfiles.length];
    if (!avoid.has(profile.type)) return profile;
  }
  return resultProfiles[0];
}

function profileTieBreak(source, leftIndex, rightIndex) {
  const seed = Math.abs(hashText(source || "future"));
  return ((seed + leftIndex) % resultProfiles.length) - ((seed + rightIndex) % resultProfiles.length);
}

function hashText(text) {
  return String(text).split("").reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }, 0);
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
  setGenerating(false);
  els.resultTitle.textContent = result.type;
  els.resultSummary.textContent = result.summary;
  els.resultMission.textContent = result.mission || "まだ名前のない価値を見つけ、次の体験として形にする。";
  els.resultWhy.textContent = result.why || "発話の中に、観察して意味づける力と、こだわりを人に渡す力が見えます。";
  els.resultArtifact.textContent = result.artifact || "発見を集める小さなケース";
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
  setGenerating(false);
  state.started = false;
  state.chatPending = false;
  pauseSpeechRecognition();
  stopAudioWaveform();
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
  stopAudioWaveform();
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
  setGenerating(false);
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
