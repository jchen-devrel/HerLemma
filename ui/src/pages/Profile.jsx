import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const glass = 'rounded-2xl border border-white/[0.08] bg-white/[0.07] backdrop-blur-[20px]'

const BADGES = [
  { id: 'first-voice', title: 'First Voice', emoji: '🎤', desc: '首条讲解被验证', unlocked: true },
  { id: 'first-earning', title: 'First Earning', emoji: '💰', desc: '首次赚到 AVAX', unlocked: true },
  { id: 'translator', title: 'Math Translator', emoji: '📐', desc: '10条讲解被验证', unlocked: true },
  { id: 'reviewer', title: 'Trusted Reviewer', emoji: '👁️', desc: '验证他人50次', unlocked: true },
  { id: 'viral', title: 'Viral Explainer', emoji: '🔥', desc: '单条100+听懂', unlocked: false },
  { id: 'brand', title: 'Brand Pick', emoji: '⭐', desc: '被品牌选中', unlocked: false },
]

const AVAX_RECORDS = [
  { id: 1, type: 'earn', amount: 0.05, desc: '小鱼 打赏了你的导数讲解', time: '2 小时前' },
  { id: 2, type: 'earn', amount: 0.05, desc: '悠悠 投票"听懂了"你的导数讲解', time: '3 小时前' },
  { id: 3, type: 'pay', amount: 0.02, desc: '发布讲解：骑车上坡理解导数', time: '5 小时前' },
  { id: 4, type: 'earn', amount: 0.01, desc: '思思 查看了你的讲解', time: '6 小时前' },
  { id: 5, type: 'pay', amount: 0.05, desc: '打赏 小雨 的函数讲解', time: '8 小时前' },
  { id: 6, type: 'pay', amount: 0.01, desc: '查看 小月 的概率讲解', time: '1 天前' },
  { id: 7, type: 'earn', amount: 0.05, desc: '圆圆 打赏了你的数列讲解', time: '1 天前' },
  { id: 8, type: 'earn', amount: 0.02, desc: '发布奖励：首条讲解上链', time: '2 天前' },
]

const MY_EXPLANATIONS = [
  { id: 1, topic: '导数的定义', style: '生活类比', text: '骑车上坡，导数就是脚下的陡峭程度', votes: 312, earned: 0.8, time: '2 天前' },
  { id: 2, topic: '等差数列', style: '日常场景', text: '每月存钱，每次多存100块', votes: 89, earned: 0.15, time: '3 天前' },
  { id: 3, topic: '条件概率', style: '视觉画面', text: '下雨天带伞的人里，有多少真的淋湿了', votes: 145, earned: 0.3, time: '5 天前' },
]

const LISTENED = [
  { id: 101, author: '小雨', avatar: '🦊', topic: '函数单调性', text: '追剧时间线就是函数图像', cost: 0.01, time: '1 小时前' },
  { id: 102, author: '小鹿', avatar: '🐚', topic: '导数几何意义', text: '画眉毛就是在画切线', cost: 0.01, time: '4 小时前' },
  { id: 103, author: '悠悠', avatar: '🦢', topic: '等比数列', text: '压岁钱每年翻倍', cost: 0.01, time: '1 天前' },
  { id: 104, author: '圆圆', avatar: '💫', topic: '古典概型', text: '抽奖机的中奖率怎么算', cost: 0.01, time: '2 天前' },
]

const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

export default function Profile() {
  const [tab, setTab] = useState('records')

  const totalEarned = AVAX_RECORDS.filter(r => r.type === 'earn').reduce((s, r) => s + r.amount, 0)
  const totalSpent = AVAX_RECORDS.filter(r => r.type === 'pay').reduce((s, r) => s + r.amount, 0)

  return (
    <div className="min-h-screen bg-mesh text-[#f0eef5]">
      <motion.div className="mx-auto max-w-3xl px-4 py-6" variants={container} initial="hidden" animate="show">

        {/* Header */}
        <motion.div variants={item} className={`${glass} p-6 mb-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#ff9f7f] to-[#e84a4a] flex items-center justify-center text-3xl shadow-lg">🌸</div>
            <div>
              <h1 className="text-2xl font-bold text-white">佳佳</h1>
              <p className="font-mono text-xs text-[#a29bfe]/70">0x3f...a2</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-white/40">$PROVE</p>
              <p className="text-2xl font-bold text-[#f9ca24]">956</p>
            </div>
          </div>

          {/* AVAX 余额 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-black/20 border border-white/[0.06] p-3 text-center">
              <p className="text-lg font-bold text-white tabular-nums">{(totalEarned - totalSpent).toFixed(2)}</p>
              <p className="text-[10px] text-white/40">AVAX 余额</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/15 p-3 text-center">
              <p className="text-lg font-bold text-emerald-300 tabular-nums">+{totalEarned.toFixed(2)}</p>
              <p className="text-[10px] text-emerald-300/50">总收入</p>
            </div>
            <div className="rounded-xl bg-[#ff6b6b]/10 border border-[#ff6b6b]/15 p-3 text-center">
              <p className="text-lg font-bold text-[#ff6b6b] tabular-nums">-{totalSpent.toFixed(2)}</p>
              <p className="text-[10px] text-[#ff6b6b]/50">总支出</p>
            </div>
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            {[
              { label: '我的讲解', value: MY_EXPLANATIONS.length },
              { label: '被听懂', value: '546' },
              { label: '听过的', value: LISTENED.length },
              { label: '启发了', value: '8 人' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-base font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-white/35">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SBT 成就 */}
        <motion.div variants={item} className="mb-6">
          <p className="text-sm font-semibold text-white/50 mb-3">🏆 链上成就</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {BADGES.map(b => (
              <div key={b.id} className={`${glass} p-3 text-center ${b.unlocked ? 'glow-coral' : 'opacity-40'}`}>
                <span className="text-2xl">{b.unlocked ? b.emoji : '🔒'}</span>
                <p className="text-[10px] text-white/60 mt-1 leading-tight">{b.title}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={item} className="flex gap-1 mb-4">
          {[
            { id: 'records', label: '💰 AVAX 记录' },
            { id: 'published', label: '📐 我的讲解' },
            { id: 'listened', label: '👂 听过的' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                tab === t.id ? 'bg-white/10 text-white border border-white/15' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div variants={item}>
          {tab === 'records' && (
            <div className="space-y-2">
              {AVAX_RECORDS.map(r => (
                <div key={r.id} className={`${glass} px-4 py-3 flex items-center gap-3`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                    r.type === 'earn' ? 'bg-emerald-500/15' : 'bg-[#ff6b6b]/15'
                  }`}>
                    {r.type === 'earn' ? '💰' : '🔗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{r.desc}</p>
                    <p className="text-[10px] text-white/30">{r.time}</p>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${r.type === 'earn' ? 'text-emerald-300' : 'text-[#ff6b6b]'}`}>
                    {r.type === 'earn' ? '+' : '-'}{r.amount} AVAX
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === 'published' && (
            <div className="space-y-2">
              {MY_EXPLANATIONS.map(e => (
                <Link key={e.id} to={`/translation/${e.id}`}>
                  <div className={`${glass} px-4 py-3 hover:border-white/20 transition-colors`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-[#ff6b6b]/15 text-[#ff6b6b] rounded-full px-2 py-0.5 border border-[#ff6b6b]/20">{e.topic}</span>
                      <span className="text-[10px] text-white/30">{e.style}</span>
                      <span className="text-[10px] text-white/20 ml-auto">{e.time}</span>
                    </div>
                    <p className="text-sm text-white/75">「{e.text}」</p>
                    <div className="flex gap-3 mt-2 text-[10px]">
                      <span className="text-emerald-300/70">✅ {e.votes} 人听懂</span>
                      <span className="text-amber-200/70">💰 已赚 {e.earned} AVAX</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {tab === 'listened' && (
            <div className="space-y-2">
              {LISTENED.map(l => (
                <div key={l.id} className={`${glass} px-4 py-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{l.avatar}</span>
                    <span className="text-xs font-semibold text-white">{l.author}</span>
                    <span className="text-[10px] bg-[#a29bfe]/15 text-[#a29bfe] rounded-full px-2 py-0.5">{l.topic}</span>
                    <span className="text-[10px] text-white/20 ml-auto">{l.time}</span>
                  </div>
                  <p className="text-sm text-white/60">「{l.text}」</p>
                  <p className="text-[10px] text-[#ff6b6b]/50 mt-1">花费 {l.cost} AVAX</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  )
}
