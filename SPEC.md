# AI 爱情塔罗 · 产品规范文档

> 本文档是项目的核心规范，所有开发决策以此为准。

---

## 1. 产品概述

### 1.1 产品定位

**不做工具，做情感陪伴产品。**

AI 爱情塔罗是一个情感陪伴型 AI 塔罗服务，通过 AI + 塔罗牌的垂直场景（暧昧、分手挽回、感情诊断），为 18-30 岁女性用户提供情感困惑解答和陪伴体验。

### 1.2 核心差异化

- **共情型 AI 语气**：不是冷冰冰的牌义解读，是理解用户情感的对话
- **细分情感场景**：暧昧期、分手边缘、挽回、婚姻诊断等垂直场景
- **感情追踪留存**：每日占卜记录，历史记录查看，增强用户粘性

### 1.3 目标指标

- **DAU 目标**：100-500 /天（上线3个月）
- **付费转化**：5-10% Freemium → $4.99/月
- **次留**：40%+（靠情感追踪功能）

---

## 2. 技术方案

### 2.1 技术栈

| 层级 | 技术选型 | 说明 |
|---|---|---|
| 前端框架 | HTML + CSS + Vanilla JS | 无框架，最简技术栈，降低维护成本 |
| AI 能力 | Claude Sonnet 4 API | Cloudflare Workers 代理，Key 不暴露 |
| 后端/用户系统 | Firebase | Authentication + Firestore，免费额度够用 |
| 支付 | PayPal | Freemium 订阅 $4.99/月 |
| 部署 | GitHub Pages | 免费静态托管 |
| 域名 | 可选（后期购买） | 临时用 GitHub Pages 域名 |

### 2.2 API 架构

```
用户浏览器
    ↓ HTTPS
Cloudflare Workers（API 代理）
    ↓ HTTPS（Key 在这里）
Claude Sonnet 4 API
```

**安全原则**：Claude API Key 永远不进入前端代码，只存在于 Cloudflare Workers 环境变量中。

### 2.3 Firebase 数据结构

```
users/
  {uid}/
    email: string
    plan: "free" | "premium"
    createdAt: timestamp
    lastLogin: timestamp

readings/
  {readingId}/
    uid: string
    type: "single_card" | "three_card" | "compatibility"
    cards: string[]          # 卡牌名称列表
    question: string
    readingType: string      # 场景：暧昧/分手/挽回/感情诊断
    response: string         # AI 解读
    createdAt: timestamp

daily_readings/
  {uid}/
    {date}/
      single_card: {...}
      three_card: {...}
```

---

## 3. 页面功能规范

### 3.1 页面列表

| 页面 | 路由 | 优先级 | 说明 |
|---|---|---|---|
| 首页 | `/` | P0 | 落地页 + 核心 CTA |
| 单牌每日占卜 | `/love-draw` | P0 | 每日一次免费，Freemium 解锁 |
| 三牌爱情占卜 | `/three-card-love` | P0 | 核心功能，Freemium 解锁 |
| 博客 | `/blog` | P1 | SEO 内容壁垒，框架先行 |
| 暧昧场景 | `/situations/crush` | P1 | 垂直场景页 |
| 分手挽回场景 | `/situations/ex-back` | P1 | 垂直场景页 |
| Compatibility | `/compatibility` | P2 | 付费功能 |
| 感情追踪器 | `/tracker` | P2 | Freemium 功能 |

### 3.2 首页 (`/`)

**目标**：转化。让人想体验。

**布局**：
1. Hero Section — 大标题 + 情感化文案 + "开始占卜" CTA
2. 功能展示 — 3 个核心功能卡片（单牌 / 三牌 / 追踪）
3. 场景入口 — 暧昧 / 分手 / 挽回等垂直场景
4. AI 差异化说明 — 共情型 vs 工具型
5. Footer — 版权 + 链接

**CTA 按钮文案**：
- 主按钮：「开始今日占卜」
- 次按钮：「了解更多」

### 3.3 单牌每日占卜 (`/love-draw`)

**功能**：每天免费抽 1 张牌，AI 解读今日感情运势。

**流程**：
1. 用户选择想问的问题类型（感情今日运势 / 单恋对象 / 复合可能 / 脱单时机）
2. 用户点击「抽牌」按钮
3. 随机选择一张塔罗牌（78 张）
4. AI 根据牌义 + 用户问题 + 共情语气生成解读
5. 显示牌面图片 + 牌名 + AI 解读
6. 记录到当日历史（Firebase）

**Freemium 限制**：免费用户每天 1 次，Premium 解锁无限次。

### 3.4 三牌爱情占卜 (`/three-card-love`)

**功能**：3 张牌阵解读（过去 / 现在 / 未来）。

**流程**：
1. 用户选择场景（感情走向 / 暧昧关系 / 复合可能性）
2. 用户深呼吸，点击「开始洗牌」（动画效果）
3. 依次翻开 3 张牌
4. AI 综合解读 3 张牌的关系，给出建议
5. 记录到历史

**Freemium 限制**：免费用户每天 1 次。

---

## 4. 视觉规范

### 4.1 配色方案

| 用途 | 颜色 | Hex |
|---|---|---|
| 主色（神秘紫） | Deep Purple | `#6B4C9A` |
| 次色（玫瑰金） | Rose Gold | `#B76E79` |
| 强调色（星光金） | Gold | `#D4AF37` |
| 背景色 | 深紫黑 | `#1A0F2E` |
| 文字主色 | 奶白 | `#F5F0E8` |
| 文字次色 | 淡紫灰 | `#C9B8D9` |
| 卡片背景 | 深紫 | `#2D1B4E` |

### 4.2 字体

- **标题**：`"Cinzel"`（Google Fonts，塔罗/神秘感衬线体）
- **正文**：`"Noto Sans SC"`（Google Fonts，中文无衬线）
- **英文装饰**：`"Cormorant Garamond"`（优雅衬线）

### 4.3 插图风格

塔罗牌面使用 **Midjourney 生成的插画风牌面**，不要使用 Rider-Waite 版权图片。

---

## 5. AI Prompt 规范

### 5.1 系统提示词（System Prompt）

```
你是「星辰」，一位温柔而充满智慧的女性塔罗师。
你不仅是解读牌义，而是真正理解用户的情感困惑。
你的语气：温暖、共情、专业但不说教。
你不使用冷冰冰的「牌义显示」，而是像朋友聊天一样给出建议。

核心原则：
- 先共情用户的感受，再解读牌义
- 结合用户的具体问题给出实用建议
- 语气温柔但有力量，给用户信心
- 不确定性时诚实告知，不胡乱预测
```

### 5.2 单牌 Prompt 模板

```
用户问题：{question}
用户选择的场景：{readingType}
抽到的牌：{cardName}（{cardType}）

请以「星辰」的身份，结合 {cardName} 的牌义和用户的情感问题「{question}」，给出 150-200 字的温柔解读。

格式：
🌟 今日指引
{共情 + 牌义解读 + 实用建议}

注意：语气要像朋友聊天，不是机器输出。
```

---

## 6. Freemium 模式

### 6.1 权限设计

| 功能 | 免费用户 | Premium ($4.99/月) |
|---|---|---|
| 单牌每日占卜 | 每天 1 次 | 无限次 |
| 三牌爱情占卜 | 每天 1 次 | 无限次 |
| 感情追踪器 | 查看最近 7 天 | 全部历史 |
| 历史记录 | 最近 10 条 | 无限 |
| 博客文章 | ✅ 全部 | ✅ 全部 |

### 6.2 付费流程

1. Freemium 用户触发 Freemium 提示弹窗
2. 点击「升级 Premium」→ PayPal 订阅页面
3. 完成 PayPal 支付
4. Firebase 自定义声明更新 `plan: "premium"`
5. 前端检测权限，解除功能限制

---

## 7. 开发里程碑

| 阶段 | 时间 | 内容 | 完成标志 |
|---|---|---|---|
| M1 | Week 1 | 首页 + 单牌占卜 + i18n | 用户可完成完整一次占卜 |
| M2 | Week 2 | 三牌占卜 + Firebase Auth | 用户可注册登录 |
| M3 | Week 2-3 | PayPal 订阅 + 历史记录 | Freemium 功能完整 |
| M4 | Week 3 | 博客框架 + 场景页 | SEO 基础搭建完成 |
| M5 | 上线后 | Compatibility + 追踪器 | 差异化功能 |

---

## 8. 文件结构

```
ai-tarot-love/
├── docs/                         # GitHub Pages 根目录
│   ├── index.html                # 首页
│   ├── love-draw.html            # 单牌每日占卜
│   ├── three-card-love.html      # 三牌爱情占卜
│   ├── blog.html                 # 博客列表
│   ├── assets/
│   │   ├── css/
│   │   │   ├── 00-reset.css
│   │   │   ├── 01-variables.css
│   │   │   ├── 02-base.css
│   │   │   └── pages/
│   │   │       ├── home.css
│   │   │       ├── love-draw.css
│   │   │       └── three-card-love.css
│   │   ├── js/
│   │   │   ├── api/
│   │   │   │   └── claude.js    # Cloudflare Workers 调用
│   │   │   ├── i18n/
│   │   │   │   ├── i18n.js
│   │   │   │   ├── en.json
│   │   │   │   └── zh.json
│   │   │   ├── services/
│   │   │   │   └── firebase.js
│   │   │   ├── pages/
│   │   │   │   ├── home.js
│   │   │   │   ├── love-draw.js
│   │   │   │   └── three-card-love.js
│   │   │   └── main.js
│   │   └── images/
│   │       └── tarot-cards/      # 78张牌图片
├── api/
│   └── claude-proxy/             # Cloudflare Workers
│       ├── wrangler.toml
│       └── index.js
├── SPEC.md
├── README.md
└── .gitignore
```

---

*本文档版本：v1.0 | 最后更新：2026-03-23*
