# Manim 视频生成服务 — 赛后规划

## 目标
AI 生成 Manim 代码 → Docker 容器渲染 → 返回 mp4 视频

## 已完成
- `manim-server/Dockerfile` — 基于 python:3.11-slim，安装 ffmpeg + manim + flask
- `manim-server/server.py` — Flask API，含：
  - `POST /generate` — 接收讲解文本，AI 生成 Manim 代码，渲染 mp4 返回
  - `GET /health` — 健康检查
  - AI 生成失败时有 fallback 代码（导数切线动画）
  - DeepSeek API 生成 Manim Python 代码

## 待完成
1. Docker 镜像构建（Manim 依赖多，需要稳定网络环境）
2. 前端对接：Create 页面加"生成视频"按钮，调 `http://localhost:5050/generate`
3. 视频播放器 UI
4. 如需线上部署，需要一个有 Docker 的云服务器

## 启动命令（待镜像构建成功后）
```bash
cd manim-server
docker build -t herlemma-manim .
docker run -p 5050:5050 herlemma-manim
# 测试：curl -X POST http://localhost:5050/generate -H "Content-Type: application/json" -d '{"explanation":"导数就是变化的速度","topic":"导数"}'
```

## 前端对接代码（预写）
```js
// utils/ai.js 新增
export async function generateManimVideo(explanationText, topic) {
  const res = await fetch('http://localhost:5050/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ explanation: explanationText, topic }),
  })
  if (!res.ok) throw new Error('Video generation failed')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
```
