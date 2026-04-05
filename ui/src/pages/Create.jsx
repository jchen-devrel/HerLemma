import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSparkles } from 'react-icons/hi2'
import { generateExplanations, generateAnimation, generateImage, chatWithAssistant } from '../utils/ai'
import { mockChainSubmit } from '../utils/chain'
import { DERIVATIVE_TREE, TOPICS } from '../data/mockTree'

const FALLBACK = [
  { style: '生活类比', explanation: '导数就像你在山坡上骑车时，脚下这一小段路有多陡。', scene: '🚲⛰️' },
  { style: '视觉画面', explanation: '把函数曲线放大到某一点，弯线变成直线，那条直线的斜率就是导数。', scene: '🔍📐' },
  { style: '日常场景', explanation: '手机电量掉的快慢、奶茶降温的快慢——"此刻变化有多快"就是导数。', scene: '📱☕' },
]

const DEMO_ANIM_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0612;overflow:hidden;font-family:system-ui,sans-serif}canvas{display:block}</style></head><body><canvas id="c"></canvas><script>
const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');let W,H,t=0;
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=420}resize();window.addEventListener('resize',resize);
function f(x){return 0.15*x*x*x-0.5*x}function df(x){return 0.45*x*x-0.5}
const trail=[];
function frame(){ctx.clearRect(0,0,W,H);
const ox=W/2,oy=H*0.6,s=45;
ctx.strokeStyle='rgba(162,155,254,0.08)';ctx.lineWidth=1;
for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
for(let y=0;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=1.5;
ctx.beginPath();ctx.moveTo(40,oy);ctx.lineTo(W-20,oy);ctx.stroke();
ctx.beginPath();ctx.moveTo(ox,H-20);ctx.lineTo(ox,20);ctx.stroke();
ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font='11px system-ui';ctx.textAlign='center';
for(let i=-5;i<=5;i++){if(i===0)continue;const sx=ox+i*s;ctx.beginPath();ctx.moveTo(sx,oy-3);ctx.lineTo(sx,oy+3);ctx.stroke();ctx.fillText(i,sx,oy+15)}
ctx.textAlign='center';ctx.font='bold 16px system-ui';ctx.fillStyle='#a29bfe';ctx.fillText('导数 · f(x) 与 f\\'(x) 可视化',W/2,28);
ctx.font='12px system-ui';ctx.fillStyle='#ff6b6b';ctx.fillText('f(x) = 0.15x³ - 0.5x',W/2,48);
ctx.beginPath();ctx.strokeStyle='#ff6b6b';ctx.lineWidth=2.5;ctx.shadowColor='rgba(255,107,107,0.3)';ctx.shadowBlur=8;
for(let x=-6;x<=6;x+=0.05){const sx=ox+x*s,sy=oy-f(x)*s;x===-6?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy)}ctx.stroke();ctx.shadowBlur=0;
ctx.beginPath();ctx.strokeStyle='rgba(162,155,254,0.5)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
for(let x=-6;x<=6;x+=0.05){const sx=ox+x*s,sy=oy-df(x)*s;x===-6?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy)}ctx.stroke();ctx.setLineDash([]);
ctx.font='12px system-ui';ctx.fillStyle='#a29bfe';ctx.fillText("f'(x) = 0.45x² - 0.5",W-80,oy-df(4)*s-10);
const px=4.5*Math.sin(t*0.6),py=f(px),slope=df(px);
const sx=ox+px*s,sy=oy-py*s;
trail.push({x:sx,y:sy,a:1});if(trail.length>80)trail.shift();
for(const p of trail){ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fillStyle='rgba(249,202,36,'+(p.a*0.4)+')';ctx.fill();p.a*=0.97}
const tdx=70,tdy=slope*70;ctx.beginPath();ctx.moveTo(sx-tdx,sy+tdy);ctx.lineTo(sx+tdx,sy-tdy);ctx.strokeStyle='#00d2d3';ctx.lineWidth=2;ctx.shadowColor='rgba(0,210,211,0.4)';ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0;
ctx.beginPath();ctx.arc(sx,sy,14,0,Math.PI*2);ctx.fillStyle='rgba(249,202,36,0.12)';ctx.fill();
ctx.beginPath();ctx.arc(sx,sy,6,0,Math.PI*2);ctx.fillStyle='#f9ca24';ctx.shadowColor='rgba(249,202,36,0.6)';ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
const sColor=slope>0?'#4ade80':slope<0?'#f87171':'#fbbf24';
ctx.font='bold 13px system-ui';ctx.fillStyle=sColor;ctx.textAlign='center';ctx.fillText("斜率 = "+slope.toFixed(2),sx,sy-25);
ctx.font='11px system-ui';ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillText('x = '+px.toFixed(1),sx,sy+28);
const status=slope>0.1?'📈 递增 (导数>0)':slope<-0.1?'📉 递减 (导数<0)':'⚡ 极值点 (导数≈0)';
ctx.font='13px system-ui';ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillText(status,W/2,H-25);
t+=0.015;requestAnimationFrame(frame)}frame();
</script></body></html>`

const DEMO_PRESET = {
  explanations: [
    { style: '生活类比', explanation: '想象你骑自行车上坡，刚开始坡度很缓，你轻轻蹬就能前进；突然坡度变陡，你得站起来拼命蹬才能往上走。这里的"坡度陡不陡"就是导数，它告诉你"在某个点上，函数值变化得有多快"。', scene: '🚲⛰️' },
    { style: '视觉画面', explanation: '想象一幅图画：你面前有一条弯弯曲曲的山路。在路上的每一个点，你放一把小尺子紧贴着路面——尺子的倾斜方向和角度，就是那个点的导数。尺子越陡，说明路在那里变化越剧烈。', scene: '📏🛤️' },
    { style: '日常场景', explanation: '你泡了一杯热奶茶放在桌上。刚放下时降温很快（导数绝对值大），放久了降得慢（导数绝对值小），和室温一样时就不降了（导数为零）。温度变化的快慢，就是温度函数对时间的导数。', scene: '☕📉' },
  ],
  images: [null, null, null],
  animation: DEMO_ANIM_HTML,
}

const COLORS = [
  { bg: 'from-[#ff6b6b]/25 to-[#ff8e53]/10', border: 'border-[#ff6b6b]/30', accent: '#ff6b6b' },
  { bg: 'from-[#a29bfe]/25 to-[#6c5ce7]/10', border: 'border-[#a29bfe]/30', accent: '#a29bfe' },
  { bg: 'from-[#00d2d3]/25 to-[#0abf96]/10', border: 'border-[#00d2d3]/30', accent: '#00d2d3' },
]

const glass = 'rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-[20px]'

function useChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '嗨！我是你的数学讲解助手 ✨\n有问题随时问我，也可以拍照上传数学题！' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingImage, setPendingImage] = useState(null)

  const sendWithImage = useCallback(async (text, imageDataUrl) => {
    if ((!text.trim() && !imageDataUrl) || loading) return

    const content = []
    if (imageDataUrl) content.push({ type: 'image_url', image_url: { url: imageDataUrl } })
    content.push({ type: 'text', text: text.trim() || '请帮我看看这道题' })

    const userMsg = { role: 'user', content }
    const displayMsg = { role: 'user', content: text.trim() || '📷 [上传了一张图片]', image: imageDataUrl }

    setMessages(prev => [...prev, displayMsg])
    setInput('')
    setPendingImage(null)
    setLoading(true)
    try {
      const history = [...messages.slice(-4).map(m => {
        if (m.image) return { role: m.role, content: [{ type: 'image_url', image_url: { url: m.image } }, { type: 'text', text: m.content }] }
        return { role: m.role, content: m.content }
      }), userMsg]
      const reply = await chatWithAssistant(history)
      setMessages(prev => [...prev, { role: 'assistant', content: reply || '让我再想想～' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '网络出了点问题，请稍后再试 ~' }])
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const send = useCallback((text) => sendWithImage(text, null), [sendWithImage])

  return { messages, input, setInput, send, sendWithImage, loading, pendingImage, setPendingImage }
}

// ── Recording Hook ──
function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    chunksRef.current = []
    mr.ondataavailable = (e) => chunksRef.current.push(e.data)
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setAudioUrl(URL.createObjectURL(blob))
      stream.getTracks().forEach(t => t.stop())
    }
    mr.start()
    mediaRef.current = mr
    setRecording(true)
    setDuration(0)
    setAudioUrl(null)
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
  }, [])

  const stop = useCallback(() => {
    mediaRef.current?.stop()
    setRecording(false)
    clearInterval(timerRef.current)
  }, [])

  const clear = useCallback(() => { setAudioUrl(null); setDuration(0) }, [])

  return { recording, audioUrl, duration, start, stop, clear }
}

export default function Create() {
  // ── State ──
  const [step, setStep] = useState(1)
  const [aiResults, setAiResults] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [genId, setGenId] = useState(0)

  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [editedTexts, setEditedTexts] = useState(['', '', ''])
  const [editingIdx, setEditingIdx] = useState(-1)

  const [generatedImages, setGeneratedImages] = useState([null, null, null])
  const [imageLoading, setImageLoading] = useState(-1)

  const [animHtml, setAnimHtml] = useState('')
  const [animLoading, setAnimLoading] = useState(false)
  const [diagramHtml, setDiagramHtml] = useState('')
  const [diagramLoading, setDiagramLoading] = useState(false)

  const [uploadedNotes, setUploadedNotes] = useState([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txResult, setTxResult] = useState(null)

  const chat = useChat()
  const recorder = useRecorder()
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat.messages])

  const textbook = DERIVATIVE_TREE.textbook
  const selectedText = selectedIdx >= 0 ? editedTexts[selectedIdx] : ''

  // ── Handlers ──
  const handleGenerate = useCallback(async () => {
    setAiResults([])
    setIsGenerating(true)
    setStep(1)
    setSelectedIdx(-1)
    setEditedTexts(['', '', ''])
    setGeneratedImages([null, null, null])
    setAnimHtml('')
    setDiagramHtml('')
    setTxResult(null)
    try {
      const raw = await generateExplanations('导数', textbook.content)
      const normalized = ['生活类比', '视觉画面', '日常场景'].map((label, i) => {
        const found = raw.find(r => r.style === label || r.style?.includes(label.slice(0, 2)))
        return found || raw[i] || FALLBACK[i]
      })
      setAiResults(normalized.filter(Boolean))
      setEditedTexts(normalized.map(n => n.explanation || ''))
      setStep(2)
    } catch {
      setAiResults(FALLBACK)
      setEditedTexts(FALLBACK.map(f => f.explanation))
      setStep(2)
    } finally {
      setIsGenerating(false)
      setGenId(g => g + 1)
    }
  }, [textbook.content])

  const handleGenerateImage = useCallback(async (idx) => {
    setSelectedIdx(idx)
    setImageLoading(idx)
    try {
      const text = editedTexts[idx] || aiResults[idx]?.explanation || ''
      const style = aiResults[idx]?.style || '数学讲解'
      const url = await generateImage(text, style)
      setGeneratedImages(prev => { const next = [...prev]; next[idx] = url; return next })
    } catch {
      setGeneratedImages(prev => { const next = [...prev]; next[idx] = null; return next })
    }
    setImageLoading(-1)
  }, [editedTexts, aiResults])

  const handleGenerateAnim = useCallback(async () => {
    setAnimLoading(true)
    setAnimHtml('')
    try {
      const html = await generateAnimation(selectedText, '导数')
      setAnimHtml(html)
    } catch { setAnimHtml('') }
    finally { setAnimLoading(false) }
  }, [selectedText])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await mockChainSubmit()
      setTxResult(res)
      setStep(5)
    } finally { setIsSubmitting(false) }
  }

  const canFinalize = selectedIdx >= 0 && generatedImages[selectedIdx]

  return (
    <div className="min-h-screen bg-mesh text-[#f0eef5]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 flex gap-4">

        {/* ══════ 左侧：创作流程 ══════ */}
        <div className="flex-1 min-w-0 space-y-6">

          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-coral-400 via-amber-300 to-violet-400 bg-clip-text text-transparent">
                创作讲解
              </span>
            </h1>
            <p className="mt-1 text-xs text-white/40">选知识点 → AI 灵感 → 编辑配图 → 生成动画 → 上链</p>
          </motion.header>

          {/* ── Step 1: 知识点 + AI 生成 ── */}
          <div className={`${glass} p-5`}>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">1 · 知识点</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {TOPICS.map(t => (
                <span key={t.id} className={`rounded-full px-3 py-1.5 text-xs font-medium ${t.active ? 'bg-gradient-to-r from-coral-500/90 to-amber-400/85 text-[#1a0a0a]' : 'border border-white/10 text-white/30 cursor-not-allowed'}`}>
                  {t.emoji} {t.name}
                </span>
              ))}
            </div>
            <div className="rounded-xl bg-black/20 border border-white/[0.06] px-4 py-3 mb-4">
              <p className="text-[11px] text-violet-300/70 font-medium">教材原文 · {textbook.title}</p>
              <p className="text-sm text-white/75 font-mono mt-1">{textbook.content}</p>
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-[#1a0a0a] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #ff6b6b, #a29bfe, #f9ca24)', backgroundSize: '200% auto' }}
                animate={{ backgroundPosition: ['0% center', '100% center', '0% center'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <HiSparkles className="inline mr-1.5" />
                {isGenerating ? '生成中…' : 'AI 提供思路'}
              </motion.button>
              <motion.button
                onClick={() => {
                  setAiResults(DEMO_PRESET.explanations)
                  setEditedTexts(DEMO_PRESET.explanations.map(e => e.explanation))
                  setGeneratedImages(DEMO_PRESET.images)
                  setSelectedIdx(0)
                  setStep(2)
                  setGenId(g => g + 1)
                  setAnimHtml(DEMO_PRESET.animation)
                }}
                className="rounded-xl px-5 py-3 text-sm font-semibold border border-white/20 text-white/70 hover:text-white hover:border-white/30 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                ⚡ Demo
              </motion.button>
            </div>
          </div>

          {/* ── Step 2: 灵感卡片（可编辑 + 生成配图） ── */}
          <AnimatePresence>
            {step >= 2 && aiResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">2 · 选一个灵感，编辑并生成配图</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {aiResults.map((item, i) => {
                    const c = COLORS[i]
                    const isSelected = selectedIdx === i
                    const isEditing = editingIdx === i
                    const img = generatedImages[i]
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setSelectedIdx(i)}
                        className={`${glass} overflow-hidden cursor-pointer transition-all ${isSelected ? `ring-2 ring-[${c.accent}]/60 shadow-[0_0_30px_${c.accent}20]` : 'hover:border-white/15'}`}
                      >
                        <div className="p-4 space-y-2">
                          {/* emoji（无配图时） */}
                          {!img && imageLoading !== i && (
                            <div className={`flex items-center justify-center h-14 rounded-xl bg-gradient-to-br ${c.bg}`}>
                              <span className="text-3xl select-none">{item.scene || ['🚲⛰️','🔍📐','📱☕'][i]}</span>
                            </div>
                          )}
                          {imageLoading === i && (
                            <div className={`flex items-center justify-center h-14 rounded-xl bg-gradient-to-br ${c.bg}`}>
                              <motion.div className="h-6 w-6 rounded-full border-2 border-t-white/60 border-r-transparent border-b-white/20 border-l-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                            </div>
                          )}

                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${c.border} bg-white/[0.03]`} style={{ color: c.accent }}>
                            {item.style}
                          </span>

                          {isEditing ? (
                            <textarea
                              value={editedTexts[i]}
                              onChange={e => setEditedTexts(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
                              onBlur={() => setEditingIdx(-1)}
                              autoFocus
                              rows={4}
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 resize-none focus:outline-none focus:border-violet-400/40"
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <p
                              className="text-sm text-white/75 leading-relaxed cursor-text hover:text-white/90 transition-colors"
                              onClick={e => { e.stopPropagation(); setEditingIdx(i) }}
                              title="点击编辑"
                            >
                              {editedTexts[i]}
                            </p>
                          )}

                          {/* 生成配图按钮 */}
                          {!img && imageLoading !== i && (
                            <button
                              onClick={e => { e.stopPropagation(); handleGenerateImage(i) }}
                              className="w-full rounded-lg border border-dashed border-white/15 py-2 text-xs text-white/40 hover:text-white/70 hover:border-white/30 transition-colors"
                            >
                              🎨 生成配图
                            </button>
                          )}

                          {/* 配图：文字下方，填满宽度 */}
                          {img && (
                            <img src={img} alt="" className="w-full rounded-xl border border-white/[0.08]" />
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 3: 动画 + 录音（配图完成后出现） ── */}
          <AnimatePresence>
            {canFinalize && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">3 · 增强讲解（可选）</p>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* 数学动画 */}
                  <div className={`${glass} p-5`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white/70">✨ 数学动画</p>
                      <motion.button
                        onClick={handleGenerateAnim}
                        disabled={animLoading}
                        className="rounded-lg bg-gradient-to-r from-violet-500/80 to-[#00d2d3]/80 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {animLoading ? '生成中…' : '生成动画'}
                      </motion.button>
                    </div>
                    {animLoading && (
                      <div className="flex items-center justify-center py-10">
                        <motion.div className="h-8 w-8 rounded-full border-2 border-t-violet-400 border-r-transparent border-b-[#00d2d3] border-l-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                      </div>
                    )}
                    {animHtml && !animLoading && (
                      <iframe srcDoc={animHtml} title="动画" sandbox="allow-scripts" className="w-full rounded-lg border border-white/[0.08]" style={{ height: 260 }} />
                    )}
                    {!animHtml && !animLoading && (
                      <p className="text-xs text-white/25 text-center py-8">AI 生成带动态效果的数学可视化</p>
                    )}
                  </div>

                  {/* 录音 */}
                  <div className={`${glass} p-5`}>
                    <p className="text-sm font-semibold text-white/70 mb-3">🎙️ 语音讲解（可选）</p>
                    <div className="flex flex-col items-center gap-3 py-4">
                      {!recorder.recording && !recorder.audioUrl && (
                        <motion.button
                          onClick={recorder.start}
                          className="h-20 w-20 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ee5a24] flex items-center justify-center text-white text-2xl shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          🎤
                        </motion.button>
                      )}
                      {recorder.recording && (
                        <>
                          <motion.div
                            className="h-20 w-20 rounded-full bg-[#ff6b6b] flex items-center justify-center text-white shadow-lg"
                            animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 0 0 rgba(255,107,107,0.4)', '0 0 0 20px rgba(255,107,107,0)', '0 0 0 0 rgba(255,107,107,0.4)'] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            onClick={recorder.stop}
                          >
                            <span className="text-xl">⏹️</span>
                          </motion.div>
                          <p className="text-sm text-[#ff6b6b] font-mono tabular-nums">{Math.floor(recorder.duration / 60)}:{String(recorder.duration % 60).padStart(2, '0')}</p>
                          <p className="text-xs text-white/30">点击停止录音</p>
                        </>
                      )}
                      {recorder.audioUrl && !recorder.recording && (
                        <div className="w-full space-y-2">
                          <audio src={recorder.audioUrl} controls className="w-full h-10 rounded-lg" style={{ filter: 'invert(0.85) hue-rotate(180deg)' }} />
                          <div className="flex gap-2">
                            <button onClick={recorder.clear} className="flex-1 rounded-lg border border-white/10 py-1.5 text-xs text-white/40 hover:text-white/70">重录</button>
                            <button className="flex-1 rounded-lg bg-emerald-500/20 border border-emerald-400/20 py-1.5 text-xs text-emerald-300">✅ 已保存</button>
                          </div>
                        </div>
                      )}
                      {!recorder.recording && !recorder.audioUrl && (
                        <p className="text-xs text-white/25">用你的声音讲解这个知识点</p>
                      )}
                    </div>
                  </div>
                  {/* 手写笔记上传 */}
                  <div className={`${glass} p-5`}>
                    <p className="text-sm font-semibold text-white/70 mb-3">📝 手写笔记（可选）</p>
                    <div className="space-y-3">
                      {uploadedNotes.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {uploadedNotes.map((src, i) => (
                            <div key={i} className="relative group">
                              <img src={src} alt={`笔记 ${i + 1}`} className="w-full h-28 object-cover rounded-lg border border-white/10" />
                              <button
                                onClick={() => setUploadedNotes(prev => prev.filter((_, j) => j !== i))}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white/70 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex flex-col items-center justify-center w-full py-6 rounded-xl border-2 border-dashed border-white/15 cursor-pointer hover:border-white/30 transition-colors">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-xs text-white/40">拍照或上传手写笔记</span>
                        <span className="text-[10px] text-white/20 mt-0.5">支持 JPG / PNG</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            files.forEach(file => {
                              const reader = new FileReader()
                              reader.onload = (ev) => setUploadedNotes(prev => [...prev, ev.target.result])
                              reader.readAsDataURL(file)
                            })
                            e.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 4: 定稿 + 提交 ── */}
          <AnimatePresence>
            {canFinalize && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`${glass} p-5`}>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">4 · 定稿</p>
                <div className="rounded-xl bg-black/20 border border-white/[0.06] overflow-hidden mb-4">
                  {/* 封面图 */}
                  {generatedImages[selectedIdx] && (
                    <img src={generatedImages[selectedIdx]} alt="" className="w-full max-h-64 object-cover" />
                  )}
                  <div className="p-4">
                    <span className="inline-block rounded-full bg-[#f9ca24]/15 border border-[#f9ca24]/30 px-2.5 py-0.5 text-[10px] font-semibold text-[#f9ca24] mb-2">
                      {aiResults[selectedIdx]?.style}
                    </span>
                    <p className="text-sm text-white/85 leading-relaxed">{editedTexts[selectedIdx]}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {animHtml && <span className="text-[10px] bg-violet-500/10 border border-violet-400/20 text-violet-300 rounded-full px-2 py-0.5">✨ 数学动画</span>}
                      {recorder.audioUrl && <span className="text-[10px] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 text-[#ff6b6b] rounded-full px-2 py-0.5">🎙️ 语音讲解</span>}
                      {uploadedNotes.length > 0 && <span className="text-[10px] bg-[#f9ca24]/10 border border-[#f9ca24]/20 text-[#f9ca24] rounded-full px-2 py-0.5">📝 {uploadedNotes.length} 张笔记</span>}
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full rounded-xl py-3 text-sm font-semibold bg-gradient-to-r from-[#ff6b6b] via-[#a29bfe] to-[#f9ca24] text-[#1a0a0a] disabled:opacity-50"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {isSubmitting ? '正在上链…' : '✨ 提交上链'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 上链结果 */}
          {txResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${glass} border-emerald-500/20 bg-emerald-500/[0.06] p-5`}>
              <p className="text-lg font-semibold text-emerald-300">✅ 已上链！</p>
              <p className="mt-2 break-all font-mono text-xs text-white/60">{txResult.txHash}</p>
              <a href={txResult.explorerUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm text-amber-300/80 hover:text-amber-200">
                在 Snowtrace 查看 ↗
              </a>
            </motion.div>
          )}
        </div>

        {/* ══════ 右侧：AI Chatbot ══════ */}
        <div className="hidden lg:flex w-[340px] shrink-0 flex-col">
          <div className={`${glass} flex flex-col h-[calc(100vh-7rem)] sticky top-16`}>
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-white/80">💬 数学问答助手</p>
              <p className="text-[10px] text-white/30">有任何疑问随时问我</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {chat.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-coral-500/30 to-violet-500/20 text-white/90 rounded-br-md'
                      : 'bg-white/[0.06] text-white/75 rounded-bl-md'
                  }`}>
                    {msg.image && <img src={msg.image} alt="" className="max-w-full max-h-32 rounded-lg mb-2" />}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {chat.loading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                    <motion.div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white/40"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-3 py-3 border-t border-white/[0.06] space-y-2">
              {chat.pendingImage && (
                <div className="relative inline-block">
                  <img src={chat.pendingImage} alt="" className="h-16 rounded-lg border border-white/10" />
                  <button onClick={() => chat.setPendingImage(null)} className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center">✕</button>
                </div>
              )}
              <div className="flex gap-2">
                <label className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] cursor-pointer hover:bg-white/[0.08] transition-colors" title="上传图片">
                  <span className="text-sm">📷</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => chat.setPendingImage(ev.target.result)
                    reader.readAsDataURL(file)
                    e.target.value = ''
                  }} />
                </label>
                <input
                  value={chat.input}
                  onChange={e => chat.setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), chat.sendWithImage(chat.input, chat.pendingImage))}
                  onPaste={e => {
                    const items = e.clipboardData?.items
                    if (!items) return
                    for (const item of items) {
                      if (item.type.startsWith('image/')) {
                        e.preventDefault()
                        const file = item.getAsFile()
                        const reader = new FileReader()
                        reader.onload = (ev) => chat.setPendingImage(ev.target.result)
                        reader.readAsDataURL(file)
                        break
                      }
                    }
                  }}
                  placeholder={chat.pendingImage ? '描述图片中的问题…' : '问个问题，或粘贴截图…'}
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-violet-400/40"
                />
                <motion.button
                  onClick={() => chat.sendWithImage(chat.input, chat.pendingImage)}
                  disabled={chat.loading || (!chat.input.trim() && !chat.pendingImage)}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-coral-500/80 to-violet-500/80 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                  whileTap={{ scale: 0.95 }}
                >
                  发送
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
