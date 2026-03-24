/**
 * pages/love-draw.js — 单牌占卜页面逻辑
 */

// ============================================
// 78 张塔罗牌数据（仅名称，不含图片）
// ============================================
const MAJOR_ARCANA = [
  { id: 'fool',      name: '愚人 The Fool',      emoji: '🌱' },
  { id: 'magician',  name: '魔术师 The Magician', emoji: '🎩' },
  { id: 'high_priestess', name: '女祭司 The High Priestess', emoji: '🌙' },
  { id: 'empress',   name: '女皇 The Empress',     emoji: '🌻' },
  { id: 'emperor',   name: '皇帝 The Emperor',     emoji: '👑' },
  { id: 'hierophant', name: '教皇 The Hierophant',  emoji: '📜' },
  { id: 'lovers',    name: '恋人 The Lovers',      emoji: '💕' },
  { id: 'chariot',   name: '战车 The Chariot',     emoji: '🏃' },
  { id: 'strength',  name: '力量 Strength',        emoji: '🦁' },
  { id: 'hermit',    name: '隐士 The Hermit',      emoji: '🔦' },
  { id: 'wheel',     name: '命运之轮 Wheel of Fortune', emoji: '🎡' },
  { id: 'justice',  name: '正义 Justice',         emoji: '⚖️' },
  { id: 'hanged',    name: '倒吊人 The Hanged Man', emoji: '🪡' },
  { id: 'death',     name: '死神 Death',             emoji: '💀' },
  { id: 'temperance',name: '节制 Temperance',        emoji: '🌊' },
  { id: 'devil',     name: '恶魔 The Devil',         emoji: '⛓️' },
  { id: 'tower',     name: '塔 The Tower',           emoji: '⚡' },
  { id: 'star',      name: '星星 The Star',           emoji: '⭐' },
  { id: 'moon',      name: '月亮 The Moon',           emoji: '🌕' },
  { id: 'sun',       name: '太阳 The Sun',             emoji: '☀️' },
  { id: 'judgement', name: '审判 Judgement',         emoji: '📯' },
  { id: 'world',     name: '世界 The World',          emoji: '🌍' },
];

const MINOR_ARCANA = [
  // Wands (权杖) — 行动、热情
  { id: 'wands_ace',    name: '权杖 Ace', emoji: '🔥' },
  { id: 'wands_2',      name: '权杖二', emoji: '🔥' },
  { id: 'wands_3',      name: '权杖三', emoji: '🔥' },
  { id: 'wands_4',      name: '权杖四', emoji: '🔥' },
  { id: 'wands_5',      name: '权杖五', emoji: '🔥' },
  { id: 'wands_6',      name: '权杖六', emoji: '🔥' },
  { id: 'wands_7',      name: '权杖七', emoji: '🔥' },
  { id: 'wands_8',      name: '权杖八', emoji: '🔥' },
  { id: 'wands_9',      name: '权杖九', emoji: '🔥' },
  { id: 'wands_10',     name: '权杖十', emoji: '🔥' },
  { id: 'wands_paige',  name: '权杖侍从', emoji: '🔥' },
  { id: 'wands_knight', name: '权杖骑士', emoji: '🔥' },
  { id: 'wands_queen',  name: '权杖皇后', emoji: '🔥' },
  { id: 'wands_king',   name: '权杖国王', emoji: '🔥' },
  // Cups (圣杯) — 情感、爱
  { id: 'cups_ace',     name: '圣杯 Ace', emoji: '💧' },
  { id: 'cups_2',       name: '圣杯二', emoji: '💧' },
  { id: 'cups_3',       name: '圣杯三', emoji: '💧' },
  { id: 'cups_4',       name: '圣杯四', emoji: '💧' },
  { id: 'cups_5',       name: '圣杯五', emoji: '💧' },
  { id: 'cups_6',       name: '圣杯六', emoji: '💧' },
  { id: 'cups_7',       name: '圣杯七', emoji: '💧' },
  { id: 'cups_8',       name: '圣杯八', emoji: '💧' },
  { id: 'cups_9',       name: '圣杯九', emoji: '💧' },
  { id: 'cups_10',      name: '圣杯十', emoji: '💧' },
  { id: 'cups_paige',   name: '圣杯侍从', emoji: '💧' },
  { id: 'cups_knight',  name: '圣杯骑士', emoji: '💧' },
  { id: 'cups_queen',   name: '圣杯皇后', emoji: '💧' },
  { id: 'cups_king',    name: '圣杯国王', emoji: '💧' },
  // Swords (宝剑) — 思维、冲突
  { id: 'swords_ace',   name: '宝剑 Ace', emoji: '⚔️' },
  { id: 'swords_2',     name: '宝剑二', emoji: '⚔️' },
  { id: 'swords_3',     name: '宝剑三', emoji: '⚔️' },
  { id: 'swords_4',     name: '宝剑四', emoji: '⚔️' },
  { id: 'swords_5',     name: '宝剑五', emoji: '⚔️' },
  { id: 'swords_6',     name: '宝剑六', emoji: '⚔️' },
  { id: 'swords_7',     name: '宝剑七', emoji: '⚔️' },
  { id: 'swords_8',     name: '宝剑八', emoji: '⚔️' },
  { id: 'swords_9',     name: '宝剑九', emoji: '⚔️' },
  { id: 'swords_10',    name: '宝剑十', emoji: '⚔️' },
  { id: 'swords_paige', name: '宝剑侍从', emoji: '⚔️' },
  { id: 'swords_knight',name: '宝剑骑士', emoji: '⚔️' },
  { id: 'swords_queen', name: '宝剑皇后', emoji: '⚔️' },
  { id: 'swords_king',  name: '宝剑国王', emoji: '⚔️' },
  // Pentacles (星币) — 物质、安全感
  { id: 'pentacles_ace',   name: '星币 Ace', emoji: '🌰' },
  { id: 'pentacles_2',     name: '星币二', emoji: '🌰' },
  { id: 'pentacles_3',     name: '星币三', emoji: '🌰' },
  { id: 'pentacles_4',     name: '星币四', emoji: '🌰' },
  { id: 'pentacles_5',     name: '星币五', emoji: '🌰' },
  { id: 'pentacles_6',     name: '星币六', emoji: '🌰' },
  { id: 'pentacles_7',     name: '星币七', emoji: '🌰' },
  { id: 'pentacles_8',     name: '星币八', emoji: '🌰' },
  { id: 'pentacles_9',     name: '星币九', emoji: '🌰' },
  { id: 'pentacles_10',    name: '星币十', emoji: '🌰' },
  { id: 'pentacles_paige', name: '星币侍从', emoji: '🌰' },
  { id: 'pentacles_knight',name: '星币骑士', emoji: '🌰' },
  { id: 'pentacles_queen', name: '星币皇后', emoji: '🌰' },
  { id: 'pentacles_king',  name: '星币国王', emoji: '🌰' },
];

const ALL_CARDS = [
  ...MAJOR_ARCANA.map(c => ({ ...c, type: 'major' })),
  ...MINOR_ARCANA.map(c => ({ ...c, type: 'minor' })),
];

// 问题类型 → 翻译 key
function getQuestionLabel(key) {
  return window.I18N.getI18n('question_types.' + key) || key;
}

// ============================================
// 状态
// ============================================
let selectedQuestion = null; // 当前选择的问题类型
let drawnCard = null;         // 抽到的牌
let isReading = false;       // 是否正在解读
let bilingualReading = null;  // 双语解读内容 {zh, en, original}

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initLoveDraw();
});

function initLoveDraw() {
  // 从 URL 参数读取场景
  const scene = getQueryParam('scene');
  if (scene && getQuestionLabel(scene)) {
    // 自动选中对应问题类型（UI 交互）
    const card = document.querySelector(`[data-question="${scene}"]`);
    if (card) {
      handleQuestionSelect(scene, card);
      // 自动进入下一步
      setTimeout(() => goToStep(2), 300);
    }
  }

  // 绑定问题卡片点击
  document.querySelectorAll('.question-card').forEach(card => {
    card.addEventListener('click', () => {
      handleQuestionSelect(card.dataset.question, card);
    });
  });

  // 绑定抽牌按钮
  const drawBtn = document.getElementById('drawBtn');
  if (drawBtn) {
    drawBtn.addEventListener('click', handleDraw);
  }

  // 绑定重新占卜
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', restartReading);
  }

  // 牌堆点击也可以抽牌
  const deck = document.getElementById('tarotDeck');
  if (deck) {
    deck.addEventListener('click', handleDraw);
  }

  // 监听语言切换，更新已生成的解读内容显示
  window.addEventListener('locale-change', (e) => {
    updateReadingDisplay();
  });
}

// ============================================
// Step 1: 选择问题
// ============================================
function handleQuestionSelect(question, cardElement) {
  selectedQuestion = question;

  // 更新选中状态
  document.querySelectorAll('.question-card').forEach(c => c.classList.remove('selected'));
  cardElement.classList.add('selected');

  // 更新 deck hint
  const hint = document.getElementById('deckHint');
  if (hint) {
    const selected = window.I18N.getI18n('tarot.selected') || '已选择';
    const clickToDraw = window.I18N.getI18n('tarot.click_to_draw') || '点击抽牌';
    hint.textContent = `${selected}：${getQuestionLabel(question)}，${clickToDraw}`;
  }

  // 自动进入下一步（抽牌）
  setTimeout(() => goToStep(2), 500);
}

// ============================================
// Step 2: 抽牌
// ============================================
async function handleDraw() {
  if (isReading) return;
  if (!selectedQuestion) {
    showToast('请先选择一个问题类型', 'warning');
    return;
  }

  const deck = document.getElementById('tarotDeck');
  const drawBtn = document.getElementById('drawBtn');

  // 显示洗牌动画
  deck?.classList.add('shuffling');
  if (drawBtn) drawBtn.disabled = true;
  isReading = true;

  // 洗牌 1.5 秒
  await sleep(1500);
  deck?.classList.remove('shuffling');

  // 随机抽一张牌
  drawnCard = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];

  // 显示抽到的牌
  showDrawnCard(drawnCard);

  // 牌面展示 2.5 秒，让用户专注感受
  await sleep(2500);

  // 自动进入解读步骤
  goToStep(3);

  // 请求 AI 解读
  await requestAIReading();
}

// ============================================
// Step 3: AI 解读
// ============================================
/**
 * 根据当前语言获取要显示的解读内容
 */
function getDisplayReading() {
  if (!bilingualReading) return '';
  const locale = (typeof APP_STATE !== 'undefined' && APP_STATE.locale) || 'zh';
  return locale === 'en' ? bilingualReading.en : bilingualReading.zh;
}

/**
 * 更新解读显示（根据当前语言）
 */
function updateReadingDisplay() {
  const contentEl = document.getElementById('readingContent');
  if (contentEl && bilingualReading) {
    contentEl.textContent = getDisplayReading();
  }
}

async function requestAIReading() {
  const loadingEl = document.getElementById('readingLoading');
  const contentEl = document.getElementById('readingContent');
  const subtitleEl = document.getElementById('readingSubtitle');

  if (loadingEl) {
    loadingEl.style.display = 'flex';
    // 延迟添加 visible class 实现缓慢淡入
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadingEl.classList.add('visible');
      });
    });
  }
  if (contentEl) contentEl.textContent = '';

  showLoading(true);

  try {
    const response = await window.TarotAPI.requestTarotReading(
      drawnCard.name,
      drawnCard.type,
      getQuestionLabel(selectedQuestion),
      getQuestionLabel(selectedQuestion)
    );

    // 解析双语内容
    bilingualReading = window.TarotAPI.parseBilingualResponse(response);

    if (loadingEl) {
      loadingEl.classList.remove('visible');
      setTimeout(() => {
        if (loadingEl) loadingEl.style.display = 'none';
      }, 300); // 等待淡出完成
    }
    if (contentEl) contentEl.textContent = getDisplayReading();
    const cardLabel = window.I18N.getI18n('tarot.your_card') || '你抽到的牌';
    if (subtitleEl) subtitleEl.textContent = `${cardLabel}：${drawnCard.name}`;

  } catch (err) {
    console.error('[love-draw] AI reading error:', err);
    if (loadingEl) {
      loadingEl.classList.remove('visible');
      setTimeout(() => {
        if (loadingEl) loadingEl.style.display = 'none';
      }, 300);
    }
    if (contentEl) {
      contentEl.textContent = `解读暂时无法获取，请稍后重试。\n\n错误信息：${err.message}`;
      contentEl.style.color = 'var(--color-error)';
    }
    showToast('解读获取失败，请检查网络或联系支持', 'error');
  } finally {
    showLoading(false);
    isReading = false;
    const drawBtn = document.getElementById('drawBtn');
    if (drawBtn) drawBtn.disabled = false;
  }
}

// ============================================
// 显示抽到的牌
// ============================================
function showDrawnCard(card) {
  const resultArea = document.getElementById('resultArea');
  const cardImage = document.getElementById('cardImage');
  const cardName = document.getElementById('cardName');
  const drawBtn = document.getElementById('drawBtn');

  if (resultArea) resultArea.style.display = 'flex';
  if (cardImage) cardImage.textContent = card.emoji;
  if (cardName) cardName.textContent = card.name;
  if (drawBtn) drawBtn.style.display = 'none';
}

// ============================================
// 步骤切换
// ============================================
function goToStep(step) {
  document.querySelectorAll('.step-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`step-${['question', 'draw', 'reading'][step - 1]}`);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// 重新占卜
// ============================================
function restartReading() {
  selectedQuestion = null;
  drawnCard = null;
  bilingualReading = null; // 重置双语解读

  // 重置 UI
  document.querySelectorAll('.question-card').forEach(c => c.classList.remove('selected'));
  const resultArea = document.getElementById('resultArea');
  const drawBtn = document.getElementById('drawBtn');
  const contentEl = document.getElementById('readingContent');

  if (resultArea) resultArea.style.display = 'none';
  if (drawBtn) drawBtn.style.display = '';
  if (drawBtn) drawBtn.disabled = false;
  if (contentEl) contentEl.textContent = '';

  goToStep(1);
}

// ============================================
// 工具函数
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
