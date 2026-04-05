import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import CatBot from './components/CatBot'
import { AvaxToastProvider, useAvaxToast } from './components/AvaxToast'
import Home from './pages/Home'
import KnowledgeTree from './pages/KnowledgeTree'
import TranslationDetail from './pages/TranslationDetail'
import Create from './pages/Create'
import Profile from './pages/Profile'
import Course from './pages/Course'

const EARN_NOTIFICATIONS = [
  { amount: 0.05, message: '小鱼 打赏了你的「骑车上坡」讲解' },
  { amount: 0.01, message: '悠悠 查看了你的导数讲解' },
  { amount: 0.05, message: '思思 投票"听懂了"你的数列讲解' },
  { amount: 0.01, message: '圆圆 查看了你的条件概率讲解' },
  { amount: 0.05, message: '小夏 打赏了你的函数讲解' },
  { amount: 0.01, message: '阿月 查看了你的等比数列讲解' },
  { amount: 0.05, message: '糖糖 投票"听懂了"你的导数几何意义讲解' },
  { amount: 0.01, message: '小星 查看了你的极值讲解' },
]

function PassiveEarnings() {
  const toast = useAvaxToast()
  useEffect(() => {
    let idx = 0
    const interval = setInterval(() => {
      const n = EARN_NOTIFICATIONS[idx % EARN_NOTIFICATIONS.length]
      toast.earn(n.amount, n.message)
      idx++
    }, 25000 + Math.random() * 20000)
    return () => clearInterval(interval)
  }, [toast])
  return null
}

export default function App() {
  const location = useLocation()

  return (
    <AvaxToastProvider>
    <PassiveEarnings />
    <div className="min-h-screen bg-[#16122a] bg-mesh text-[#f0eef5]">
      <Navbar />
      <CatBot />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
          className="min-h-[calc(100vh-3.5rem)] pt-14"
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/tree" element={<KnowledgeTree />} />
            <Route path="/translation/:id" element={<TranslationDetail />} />
            <Route path="/create" element={<Create />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/course/:id" element={<Course />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
    </AvaxToastProvider>
  )
}
