# HerLemma 后端规划

> 当前状态：纯前端 + API 直连（mock 链上交互），黑客松演示用。
> 赛后按以下优先级补充后端。

## 第一步：API 层隐藏 Key（1-2 小时）

在 `ui/api/` 加 Vercel Serverless Functions，代理所有 AI 调用：

```
ui/api/
├── chat.js        # DeepSeek chatbot
├── explain.js     # DeepSeek 讲解生成
├── animation.js   # DeepSeek 动画代码
└── image.js       # 豆包生图
```

Key 放 Vercel 环境变量，前端改调 `/api/xxx`。

## 第二步：合约部署 + 链上交互

1. 获取 Fuji 测试 AVAX
2. 填 `contracts/.env`，运行 `npm run deploy:fuji`
3. 运行 `node tools/sync-frontend-env.mjs` 同步地址到前端
4. 加 `api/chain/submit.js` 和 `api/chain/vote.js`，用平台私钥代付 gas

## 第三步：用户钱包连接（可选）

用 wagmi + RainbowKit，让用户自己签名。更去中心化但门槛更高。

## API Key 列表（当前硬编码在前端，需迁移）

- DeepSeek: `sk-940f...ef61`
- 豆包 Seedream: `27368a1e-...fd13`
