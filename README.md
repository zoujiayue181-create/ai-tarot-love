# ✨ AI 爱情塔罗

> 情感陪伴型 AI 塔罗服务 — 不是工具，是陪伴

**技术栈**：HTML + CSS + Vanilla JS · Claude Sonnet 4 · Firebase · Cloudflare Workers

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/ai-tarot-love.git
cd ai-tarot-love
```

### 2. 初始化 Cloudflare Workers（必选）

```bash
cd api/claude-proxy
npm install -g wrangler
wrangler login
wrangler deploy
```

将返回的 Worker URL 填入 `docs/assets/js/api/claude.js` 中的 `CLOUDFLARE_WORKER_URL`。

### 3. 设置 Firebase（必选）

1. 创建 Firebase 项目 → 开启 Authentication + Firestore
2. 复制 Web 配置到 `docs/assets/js/services/firebase.js`
3. 开启 Google 登录提供商

### 4. 打开网站

```bash
# 本地预览（任意静态服务器）
cd docs
python3 -m http.server 8080
# 访问 http://localhost:8080
```

---

## 📁 项目结构

```
ai-tarot-love/
├── docs/                    # GitHub Pages 根目录（所有页面）
├── api/
│   └── claude-proxy/        # Cloudflare Workers（API 代理）
├── SPEC.md                  # 产品规范文档
└── README.md
```

---

## 🗓️ 开发计划

| 阶段 | 内容 | 状态 |
|---|---|---|
| M1 | 首页 + 单牌占卜 + i18n | Week 1 |
| M2 | 三牌占卜 + Firebase Auth | Week 2 |
| M3 | PayPal 订阅 + 历史记录 | Week 2-3 |
| M4 | 博客框架 + 场景页 | Week 3 |
| M5 | Compatibility + 追踪器 | 上线后 |

---

## 🔑 需要准备的账号

| 账号 | 用途 | 链接 |
|---|---|---|
| Anthropic API | Claude Sonnet 4 | [申请](https://www.anthropic.com/api) |
| Cloudflare | API 代理 | [注册](https://dash.cloudflare.com/) |
| Firebase | 认证 + 数据库 | [控制台](https://console.firebase.google.com/) |
| Google Cloud | OAuth 凭证 | [控制台](https://console.cloud.google.com/) |
| PayPal | 支付订阅 | [开发者](https://developer.paypal.com/) |

---

## 📜 规范

- 所有开发决策以 `SPEC.md` 为准
- API Key 绝不进入前端代码
- GitHub Actions 自动部署到 GitHub Pages
