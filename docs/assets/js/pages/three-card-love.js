/**
 * pages/three-card-love.js — 三牌占卜页面逻辑
 *
 * 流程：选择场景 → 依次抽 3 张牌（过去/现在/未来）→ AI 综合解读
 */

document.addEventListener('DOMContentLoaded', () => {
  initThreeCardLove();
});

// ============================================
// 塔罗牌数据
// ============================================
const MAJOR_ARCANA = [
  { id: 'fool',  name: '愚人 The Fool',  emoji: '🌱', type: 'major' },
  { id: 'magician', name: '魔术师 The Magician', emoji: '🎩', type: 'major' },
  { id: 'high_priestess', name: '女祭司 The High Priestess', emoji: '🌙', type: 'major' },
  { id: 'empress', name: '女皇 The Empress', emoji: '🌻', type: 'major' },
  { id: 'emperor', name: '皇帝 The Emperor', emoji: '👑', type: 'major' },
  { id: 'hierophant', name: '教皇 The Hierophant', emoji: '📜', type: 'major' },
  { id: 'lovers', name: '恋人 The Lovers', emoji: '💕', type: 'major' },
  { id: 'chariot', name: '战车 The Chariot', emoji: '🏛️', type: 'major' },
  { id: 'strength', name: '力量 Strength', emoji: '🦁', type: 'major' },
  { id: 'hermit', name: '隐士 The Hermit', emoji: '🔦', type: 'major' },
  { id: 'wheel', name: '命运之轮 Wheel of Fortune', emoji: '🎡', type: 'major' },
  { id: 'justice', name: '正义 Justice', emoji: '⚖️', type: 'major' },
  { id: 'hanged', name: '倒吊人 The Hanged Man', emoji: '🪡', type: 'major' },
  { id: 'death', name: '死神 Death', emoji: '💀', type: 'major' },
  { id: 'temperance', name: '节制 Temperance', emoji: '🌊', type: 'major' },
  { id: 'devil', name: '恶魔 The Devil', emoji: '⛓️', type: 'major' },
  { id: 'tower', name: '塔 The Tower', emoji: '⚡', type: 'major' },
  { id: 'star', name: '星星 The Star', emoji: '⭐', type: 'major' },
  { id: 'moon', name: '月亮 The Moon', emoji: '🌕', type: 'major' },
  { id: 'sun', name: '太阳 The Sun', emoji: '☀️', type: 'major' },
  { id: 'judgement', name: '审判 Judgement', emoji: '📯', type: 'major' },
  { id: 'world', name: '世界 The World', emoji: '🌍', type: 'major' },
];

// 精简小阿尔卡纳（每张都加上）
const MINOR_ARCANA = [
  { id: 'wands_ace', name: '权杖 Ace', emoji: '🔥', type: 'minor' },
  { id: 'cups_ace', name: '圣杯 Ace', emoji: '💧', type: 'minor' },
  { id: 'swords_ace', name: '宝剑 Ace', emoji: '⚔️', type: 'minor' },
  { id: 'pentacles_ace', name: '星币 Ace', emoji: '🌰', type: 'minor' },
  { id: 'wands_4', name: '权杖四', emoji: '🔥', type: 'minor' },
  { id: 'wands_6', name: '权杖六', emoji: '🔥', type: 'minor' },
  { id: 'wands_knight', name: '权杖骑士', emoji: '🔥', type: 'minor' },
  { id: 'wands_queen', name: '权杖皇后', emoji: '🔥', type: 'minor' },
  { id: 'cups_2', name: '圣杯二', emoji: '💧', type: 'minor' },
  { id: 'cups_3', name: '圣杯三', emoji: '💧', type: 'minor' },
  { id: 'cups_6', name: '圣杯六', emoji: '💧', type: 'minor' },
  { id: 'cups_queen', name: '圣杯皇后', emoji: '💧', type: 'minor' },
  { id: 'cups_king', name: '圣杯国王', emoji: '💧', type: 'minor' },
  { id: 'swords_2', name: '宝剑二', emoji: '⚔️', type: 'minor' },
  { id: 'swords_3', name: '宝剑三', emoji: '⚔️', type: 'minor' },
  { id: 'swords_7', name: '宝剑七', emoji: '⚔️', type: 'minor' },
  { id: 'swords_queen', name: '宝剑皇后', emoji: '⚔️', type: 'minor' },
  { id: 'pentacles_3', name: '星币三', emoji: '🌰', type: 'minor' },
  { id: 'pentacles_6', name: '星币六', emoji: '🌰', type: 'minor' },
  { id: 'pentacles_9', name: '星币九', emoji: '🌰', type: 'minor' },
  { id: 'pentacles_queen', name: '星币皇后', emoji: '🌰', type: 'minor' },
];

const ALL_CARDS = [
  ...MAJOR_ARCANA,
  ...MINOR_ARCANA,
];

const SCENE_LABELS = {
  relationship_direction: '感情走向',
  crush_relationship:    '暧昧关系',
  reconciliation:        '复合可能性',
};

// ============================================
// 状态
// ============================================
let selectedScene = null;
let drawnCards = [];      // [{card, position}]
let currentDrawIndex = 0;
let isReading = false;
const DRAW_POSITIONS = ['past', 'present', 'future'];

// ============================================
// 初始化
// ============================================
function initThreeCardLove() {
  // 场景选择
  document.querySelectorAll('.scene-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedScene = card.dataset.scene;
      document.querySelectorAll('.scene-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      setTimeout(() => goToStep(2), 400);
    });
  });

  // 抽牌
  const deck = document.getElementById('tarotDeck');
  if (deck) deck.addEventListener('click', handleDraw);

  // 重新占卜
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) restartBtn.addEventListener('click', restartReading);
}

// ============================================
// 抽牌
// ============================================
async function handleDraw() {
  if (isReading) return;
  if (currentDrawIndex >= 3) return;

  const deck = document.getElementById('tarotDeck');

  // 洗牌动画
  deck?.classList.add('shuffling');
  isReading = true;
  await sleep(1200);
  deck?.classList.remove('shuffling');

  // 随机抽牌
  const card = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
  drawnCards.push(card);

  // 显示到对应卡位
  const position = DRAW_POSITIONS[currentDrawIndex];
  const slotEl = document.getElementById(`card-${position}`);
  if (slotEl) {
    slotEl.textContent = card.emoji;
    slotEl.classList.remove('card-placeholder');
    slotEl.classList.add('flipped');

    setTimeout(() => {
      slotEl.classList.remove('flipped');
      slotEl.classList.add('revealed');
    }, 500);
  }

  // 更新提示
  currentDrawIndex++;
  const indexEl = document.getElementById('drawIndex');
  if (indexEl) {
    indexEl.textContent = currentDrawIndex + 1;
  }

  // 更新 deck hint
  const hint = document.getElementById('deckHint');
  if (hint) {
    if (currentDrawIndex < 3) {
      const clickToDraw = window.I18N.getI18n('three_card.click_to_draw_card') || '点击抽第 {n} 张牌';
      hint.innerHTML = clickToDraw.replace('{n}', `<span id="drawIndex">${currentDrawIndex + 1}</span>`);
    } else {
      hint.textContent = window.I18N.getI18n('three_card.all_cards_drawn') || '三张牌已抽完 ✨';
      if (deck) deck.style.opacity = '0.3';
    }
  }

  isReading = false;

  // 3 张抽完后自动进入解读
  if (drawnCards.length === 3) {
    await sleep(1000);
    goToStep(3);
    await requestAIReading();
  }
}

// ============================================
// AI 解读
// ============================================
async function requestAIReading() {
  const loadingEl = document.getElementById('readingLoading');
  const contentEl = document.getElementById('readingContent');
  const summaryEl = document.getElementById('threeCardsSummary');

  if (loadingEl) loadingEl.style.display = 'flex';

  // 显示三牌摘要
  if (summaryEl) {
    summaryEl.innerHTML = drawnCards.map((card, i) => {
      const labelKeys = ['three_card.past', 'three_card.present', 'three_card.future'];
      const emojis = ['🌿', '🌟', '🌙'];
      const label = (window.I18N.getI18n(labelKeys[i]) || labelKeys[i]) + ' ' + emojis[i];
      return `
        <div class="three-cards-summary__item">
          <span class="three-cards-summary__emoji">${card.emoji}</span>
          <span class="three-cards-summary__name">${label}<br>${card.name}</span>
        </div>`;
    }).join('');
  }

  showLoading(true);

  try {
    const cards = drawnCards.map(c => c.name);
    const response = await window.TarotAPI.requestThreeCardReading(
      cards,
      SCENE_LABELS[selectedScene],
      SCENE_LABELS[selectedScene]
    );

    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.textContent = response;

  } catch (err) {
    console.error('[three-card-love] AI error:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) {
      contentEl.textContent = `解读暂时无法获取，请稍后重试。\n\n错误：${err.message}`;
      contentEl.style.color = 'var(--color-error)';
    }
    showToast('解读获取失败，请检查网络', 'error');
  } finally {
    showLoading(false);
  }
}

// ============================================
// 步骤切换
// ============================================
function goToStep(step) {
  document.querySelectorAll('.step-section').forEach(s => s.classList.remove('active'));
  const targets = ['scene', 'draw', 'reading'];
  const target = document.getElementById(`step-${targets[step - 1]}`);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// 重新占卜
// ============================================
function restartReading() {
  drawnCards = [];
  currentDrawIndex = 0;
  selectedScene = null;

  // 重置卡位
  ['past', 'present', 'future'].forEach(pos => {
    const el = document.getElementById(`card-${pos}`);
    if (el) {
      el.textContent = '？';
      el.classList.add('card-placeholder');
      el.classList.remove('flipped', 'revealed');
    }
  });

  // 重置 deck
  const deck = document.getElementById('tarotDeck');
  if (deck) deck.style.opacity = '1';

  const hint = document.getElementById('deckHint');
  if (hint) {
    const clickToDraw = window.I18N.getI18n('three_card.click_to_draw_card') || '点击抽第 {n} 张牌';
    hint.innerHTML = clickToDraw.replace('{n}', '<span id="drawIndex">1</span>');
  }

  document.querySelectorAll('.scene-card').forEach(c => c.classList.remove('selected'));
  const summaryEl = document.getElementById('threeCardsSummary');
  if (summaryEl) summaryEl.innerHTML = '';
  const contentEl = document.getElementById('readingContent');
  if (contentEl) contentEl.textContent = '';

  goToStep(1);
}

// ============================================
// 工具
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
