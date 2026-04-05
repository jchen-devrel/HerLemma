const TEXT_API_KEY = 'sk-940f712454584ce1b906db510223ef61'
const TEXT_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const TEXT_MODEL = 'deepseek-chat'

const IMAGE_API_KEY = '27368a1e-f69c-499e-bf50-a0c2c640fd13'
const IMAGE_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
const IMAGE_MODEL = 'doubao-seedream-4-0-250828'

async function chatCompletion(messages, { temperature = 0.7, max_tokens = 1000 } = {}) {
  const res = await fetch(TEXT_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEXT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: TEXT_MODEL, messages, temperature, max_tokens }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || '让我换个方式帮你想想这个问题～'
}

async function rawChatCompletion(messages, opts = {}) {
  const res = await fetch(TEXT_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEXT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: TEXT_MODEL, messages, temperature: opts.temperature ?? 0.7, max_tokens: opts.max_tokens ?? 1000 }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── 讲解生成 ──
export async function generateExplanations(topic, textbookContent) {
  const prompt = `你的任务是帮高中女生理解一个数学概念。像姐姐跟妹妹聊天一样，用10岁小孩都能听懂的生活例子来讲，但每个例子必须在最后一句话把数学概念点明白。

具体要求：
1. 先用一个生活场景让她"啊，我懂了"
2. 然后用一句话把场景和数学对应起来（比如"这里的'陡峭程度'就是导数的值，走平的地方就是导数等于零"）
3. 不要用公式符号，但要让她读完确实知道这个数学概念是什么意思
4. 每种讲解2-3句话，前半段讲故事，后半段回扣数学

请提供3种不同风格的讲解：
- 生活类比：用日常动作来类比，最后一句点明对应的数学含义
- 视觉画面：用闭眼能想象的画面来讲，最后指出画面里哪部分是数学概念
- 日常场景：用每天都会遇到的真实情境，最后说清楚这和数学课本讲的是同一件事

教材原文：${textbookContent}
知识点：${topic}

每种讲解还需要配一个 "scene" 字段：2-3 个 emoji 组成的场景图。

请严格按以下JSON格式返回（不要添加任何其他内容）：
[
  {"style": "生活类比", "explanation": "...", "scene": "🚲⛰️"},
  {"style": "视觉画面", "explanation": "...", "scene": "🔍📐"},
  {"style": "日常场景", "explanation": "...", "scene": "☕📉"}
]`

  const content = await chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.8 })
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// ── Chatbot（支持图片理解）──
const VISION_API_KEY = 'sk-6b285782ef1b45a9bfcf46cb5482c310'
const VISION_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const VISION_MODEL = 'qwen-vl-max'

export async function chatWithAssistant(history) {
  const hasImage = history.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url'))

  if (hasImage) {
    const messages = [
      { role: 'system', content: '你是帮助高中女生理解数学的助手。用户可能会上传数学题、手写笔记、课本截图。请看图后用10岁小孩能听懂的生活例子来讲解图中的数学内容。直接回答，3-5句话。' },
      ...history,
    ]
    const res = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VISION_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: VISION_MODEL, messages, max_tokens: 500 }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || '让我再看看这张图～'
  }

  const messages = [
    { role: 'system', content: '你是帮助高中女生理解数学的助手。用10岁小孩能听懂的例子解释。不用公式术语。直接回答，2-3句话，不要分析过程。如果问题不清楚就猜她想问什么。' },
    ...history,
  ]
  return chatCompletion(messages, { temperature: 0.7, max_tokens: 400 })
}

// ── 教学图生成（豆包）──
export async function generateImage(explanationText, style) {
  const prompt = `一张教学插图，同时展示生活场景和数学图形。左半边是生活场景：${explanationText}。右半边是对应的数学图形（坐标轴、曲线、关键点标记）。两边用虚线或箭头连接，表示"生活现象=数学概念"。深色背景，配色温暖鲜明（红色曲线、黄色标记点），可爱清晰的插画风格，适合高中女生。不要出现任何文字、字母、数字。`

  const res = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${IMAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size: '1024x1024',
      stream: false,
      watermark: false,
    }),
  })
  const data = await res.json()
  return data.data?.[0]?.url || null
}

// ── 教学图生成（AI 代码绘制）──
export async function generateDiagram(explanationText, topic) {
  const prompt = `你是一个数学教学图绘制专家。请根据以下讲解，生成一段完整的 HTML + Canvas 代码，画一张**静态的数学教学示意图**（不是动画）。

讲解内容："${explanationText}"
知识点：${topic}

要求：
1. 输出完整 HTML（含 <!DOCTYPE html>）
2. 用 Canvas 2D 画一张教学图，包含：
   - 坐标轴（带箭头）
   - 一条相关的函数曲线（#ff6b6b 颜色）
   - 在曲线上标记 2-3 个关键点（用黄色圆点 #f9ca24）
   - 在关键点处画辅助线（切线/垂线等，用 #00d2d3 颜色）
   - 用中文标注每个关键点的含义（如"这里最陡"、"这里走平了"）
3. 背景色 #0a0612，画布宽 100%、高 350px
4. 不要用 requestAnimationFrame，画一次就行
5. 标注文字要清晰可读（白色，14px）
6. 整体像一张精美的教科书彩色插图

只输出 HTML 代码，不要任何解释。不要用 markdown 代码块。`

  const raw = await rawChatCompletion([{ role: 'user', content: prompt }], { temperature: 0.4, max_tokens: 2000 })
  let html = raw.replace(/```html\n?/gi, '').replace(/```\n?/g, '').trim()
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{background:#0a0612;overflow:hidden}</style></head><body><canvas id="c"></canvas><script>${html}</script></body></html>`
  }
  return html
}

// ── 数学动画生成 ──
const ANIM_TEMPLATE = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0612; overflow: hidden; font-family: system-ui, sans-serif; }
canvas { display: block; }
</style>
</head><body>
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H, t = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = 420;
}
resize();
window.addEventListener('resize', resize);

// MATH_FUNCTION_HERE

function drawGrid() {
  ctx.strokeStyle = 'rgba(162,155,254,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawAxes(ox, oy) {
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(40, oy); ctx.lineTo(W - 20, oy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox, H - 20); ctx.lineTo(ox, 20); ctx.stroke();
}

function label(text, x, y, color, size) {
  ctx.font = (size || 14) + 'px system-ui';
  ctx.fillStyle = color || '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

// ANIMATION_CODE_HERE

function frame() {
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  animate(t);
  t += 0.015;
  requestAnimationFrame(frame);
}
frame();
</script></body></html>`

export async function generateAnimation(explanationText, topic) {
  const prompt = `你是一个数学教学动画程序员。请根据知识点"${topic}"创建一个专业的数学可视化动画。

用户的讲解是："${explanationText}"

我给你一个 Canvas 模板，你填充两部分代码。

**要求：动画必须精确展示数学概念本身，不是装饰性动画。** 具体：
- 画出标准的坐标轴，带刻度标记（每隔1个单位一个小刻度线）和 x、y 轴标签
- 画出与知识点相关的函数曲线（比如导数就画 f(x) 和 f'(x) 两条曲线）
- 用移动的点演示核心概念（比如导数：点沿 f(x) 移动，同时在该点画切线，旁边实时显示切线斜率=导数值）
- 在图上用中文标注关键数学概念（比如"f(x)=x²"、"f'(x)=2x"、"切线斜率=导数"、"极值点"）
- 当点经过特殊位置时（极值点、零点、拐点），用不同颜色高亮并标注

**颜色规范：** f(x)曲线=#ff6b6b，f'(x)曲线=#a29bfe，切线=#00d2d3，移动点=#f9ca24，标注文字=白色

**第一段 MATH_FUNCTION：** 定义函数和坐标系，例如：
function f(x) { return x * x; }
function df(x) { return 2 * x; }
const originX = W / 2, originY = H * 0.65;
const scale = 50;
function toScreen(x, y) { return [originX + x * scale, originY - y * scale]; }

**第二段 ANIMATION_CODE：** 定义 animate(t) 函数。必须包含：
1. drawAxes(originX, originY) 画坐标轴
2. 刻度线和数字标注
3. 函数曲线
4. 移动点+切线+动态数值
5. 关键概念的中文标注

请严格按 JSON 返回：
{"mathFunction": "代码...", "animationCode": "代码..."}`

  const content = await rawChatCompletion([{ role: 'user', content: prompt }], { temperature: 0.5, max_tokens: 2000 })
  const cleaned = content.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim()

  try {
    const { mathFunction, animationCode } = JSON.parse(cleaned)
    return ANIM_TEMPLATE
      .replace('// MATH_FUNCTION_HERE', mathFunction)
      .replace('// ANIMATION_CODE_HERE', animationCode)
  } catch {
    return buildFallbackAnimation(topic)
  }
}

function buildFallbackAnimation(topic) {
  const mathFn = `
function f(x) { return 0.15 * x * x * x - 0.5 * x; }
function df(x) { return 0.45 * x * x - 0.5; }
const originX = W / 2, originY = H * 0.6;
function toScreen(x, y) { return [originX + x * 45, originY - y * 45]; }
const trail = [];`

  const animCode = `
function animate(t) {
  drawAxes(originX, originY);
  label('${topic} · 动态可视化', W / 2, 28, '#a29bfe', 16);
  ctx.beginPath();
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(255,107,107,0.3)';
  ctx.shadowBlur = 8;
  for (let x = -6; x <= 6; x += 0.05) {
    const [sx, sy] = toScreen(x, f(x));
    x === -6 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  const px = 4.5 * Math.sin(t * 0.6);
  const py = f(px);
  const slope = df(px);
  const [sx, sy] = toScreen(px, py);
  trail.push({ x: sx, y: sy, a: 1 });
  if (trail.length > 80) trail.shift();
  for (const p of trail) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249,202,36,' + (p.a * 0.4) + ')';
    ctx.fill();
    p.a *= 0.97;
  }
  const tdx = 70, tdy = slope * 70;
  ctx.beginPath();
  ctx.moveTo(sx - tdx, sy + tdy);
  ctx.lineTo(sx + tdx, sy - tdy);
  ctx.strokeStyle = '#00d2d3';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(0,210,211,0.4)';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(sx, sy, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(249,202,36,0.12)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx, sy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f9ca24';
  ctx.shadowColor = 'rgba(249,202,36,0.6)';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  const sColor = slope > 0 ? '#4ade80' : slope < 0 ? '#f87171' : '#fbbf24';
  label('切线斜率 = ' + slope.toFixed(2), sx, sy - 30, sColor, 14);
  const status = slope > 0.1 ? '📈 递增' : slope < -0.1 ? '📉 递减' : '⚡ 极值点';
  label(status, W / 2, H - 30, 'rgba(255,255,255,0.5)', 13);
}`

  return ANIM_TEMPLATE
    .replace('// MATH_FUNCTION_HERE', mathFn)
    .replace('// ANIMATION_CODE_HERE', animCode)
}
