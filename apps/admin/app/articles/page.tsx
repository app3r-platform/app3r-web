'use client'
// A2 Articles — จัดการบทความ + AI Assist (WP-A 🟡)
// เชื่อมต่อ CMS content type 'article' ผ่าน /content route
// AI Assist = generate draft prompt → copy to clipboard (mock — ไม่ต้องมี AI API key)

import { useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'

// ── Mock articles ─────────────────────────────────────────────────────────────

interface Article {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  author: string
  updatedAt: string
  wordCount: number
}

const MOCK_ARTICLES: Article[] = [
  { id: 'art-001', title: 'วิธีดูแลรักษาเครื่องซักผ้าให้ใช้ทนนาน', slug: 'washer-maintenance-guide', status: 'published', author: 'Admin', updatedAt: '2026-05-28', wordCount: 1240 },
  { id: 'art-002', title: '5 สัญญาณที่บอกว่าตู้เย็นคุณใกล้พัง', slug: 'fridge-warning-signs', status: 'published', author: 'Admin', updatedAt: '2026-05-25', wordCount: 980 },
  { id: 'art-003', title: 'เปรียบเทียบ: ซ่อมแอร์ vs ซื้อใหม่ คุ้มกว่ากัน?', slug: 'repair-vs-buy-new-aircon', status: 'draft', author: 'Admin', updatedAt: '2026-05-30', wordCount: 640 },
  { id: 'art-004', title: 'คู่มือขายเครื่องใช้ไฟฟ้ามือสองบน App3R', slug: 'selling-guide-app3r', status: 'draft', author: 'Admin', updatedAt: '2026-05-29', wordCount: 820 },
]

// AI Assist prompts templates
const AI_TEMPLATES = [
  { label: 'บทความสอนใช้งาน', prompt: 'เขียนบทความแนะนำวิธีใช้งาน [สินค้า] ให้ครบถ้วน ประกอบด้วย: บทนำ, ขั้นตอนการใช้งาน 5-7 ขั้น, เคล็ดลับบำรุงรักษา, และสรุป ความยาว ~800 คำ ภาษาไทย เหมาะสำหรับผู้ใช้ทั่วไป' },
  { label: 'บทความ SEO สินค้า', prompt: 'เขียนบทความ SEO เกี่ยวกับ [หัวข้อ] สำหรับ App3R ประกอบด้วย: H1 keyword หลัก, 3 H2 subtopic, คำถาม FAQ 3 ข้อ, call-to-action ท้ายบทความ ความยาว ~600 คำ ภาษาไทย' },
  { label: 'บทความ How-to แก้ปัญหา', prompt: 'เขียนบทความ How-to แก้ปัญหา [ปัญหาที่พบบ่อย] กับ [สินค้า] ประกอบด้วย: สาเหตุที่พบบ่อย 3 ข้อ, วิธีแก้ไขเบื้องต้น, เมื่อไหร่ควรเรียกช่าง, ความยาว ~700 คำ' },
  { label: 'บทความเปรียบเทียบ', prompt: 'เขียนบทความเปรียบเทียบ [ตัวเลือก A] vs [ตัวเลือก B] สำหรับผู้บริโภคไทย ประกอบด้วย: ตารางเปรียบเทียบ, ข้อดีข้อเสียแต่ละตัว, คำแนะนำตาม budget และการใช้งาน' },
]

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES)
  const [showAI, setShowAI] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [customTopic, setCustomTopic] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function handleCopyPrompt() {
    const tmpl = AI_TEMPLATES[selectedTemplate]
    const prompt = customTopic
      ? tmpl.prompt.replace(/\[.*?\]/g, customTopic)
      : tmpl.prompt
    navigator.clipboard.writeText(prompt).then(() => showToast('✅ คัดลอก AI Prompt แล้ว — วางใน ChatGPT/Claude ได้เลย'))
  }

  function toggleStatus(id: string) {
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, status: a.status === 'published' ? 'draft' : 'published' } : a
    ))
  }

  const filtered = articles.filter(a => filterStatus === 'all' || a.status === filterStatus)

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">✍️ จัดการบทความ (Articles)</h1>
            <p className="text-sm text-gray-500">CMS content type: article · AI Assist สร้าง draft prompt</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAI(s => !s)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors font-medium ${showAI ? 'bg-admin-surface border-admin-primary text-admin-primary' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              🤖 AI Assist
            </button>
            <Link href="/content/new" className="px-4 py-2 text-sm bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors">
              + เขียนบทความ
            </Link>
          </div>
        </div>

        {/* AI Assist panel */}
        {showAI && (
          <div className="bg-admin-surface border border-admin-primary/30 rounded-xl p-5 mb-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🤖</span>
              <h2 className="font-semibold text-admin-dark">AI Assist — สร้าง Prompt สำหรับเขียนบทความ</h2>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">เลือก Template</label>
              <div className="grid grid-cols-2 gap-2">
                {AI_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTemplate(i)}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${selectedTemplate === i ? 'border-admin-primary bg-white text-admin-primary font-medium' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">หัวข้อ / สินค้า (แทนที่ [ตัวแปร])</label>
              <input
                type="text"
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                placeholder="เช่น เครื่องซักผ้า, ตู้เย็น Samsung, ..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary"
              />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs text-gray-600 font-mono">
              {customTopic
                ? AI_TEMPLATES[selectedTemplate].prompt.replace(/\[.*?\]/g, customTopic)
                : AI_TEMPLATES[selectedTemplate].prompt}
            </div>
            <button
              onClick={handleCopyPrompt}
              className="px-4 py-2 text-sm bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors"
            >
              📋 คัดลอก Prompt → วางใน AI
            </button>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(['all', 'published', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filterStatus === s ? 'bg-admin-primary text-white border-admin-primary' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              {s === 'all' ? 'ทั้งหมด' : s === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
              {' '}({s === 'all' ? articles.length : articles.filter(a => a.status === s).length})
            </button>
          ))}
        </div>

        {/* Articles list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3">บทความ</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">คำ</th>
                <th className="px-4 py-3">แก้ล่าสุด</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                    <div className="text-3xl mb-2">✍️</div>
                    <p>ไม่พบบทความ</p>
                  </td>
                </tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.author}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{a.wordCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{a.updatedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {a.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/content/${a.id}`} className="text-xs text-admin-primary hover:underline">แก้ไข</Link>
                      <button
                        onClick={() => toggleStatus(a.id)}
                        className="text-xs text-gray-500 hover:text-gray-800"
                      >
                        {a.status === 'published' ? 'ถอน' : 'เผยแพร่'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* About/FAQ/Social shortcuts */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">🔗 CMS ประเภทอื่น (About / FAQ / Social)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'about', label: 'เกี่ยวกับเรา (About)', icon: 'ℹ️' },
              { type: 'faq', label: 'คำถามที่พบบ่อย (FAQ)', icon: '❓' },
              { type: 'social_links', label: 'ลิงก์โซเชียล (Social)', icon: '🔗' },
            ].map(c => (
              <Link
                key={c.type}
                href={`/content?type=${c.type}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-admin-primary hover:bg-admin-surface transition-colors group"
              >
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-admin-primary">{c.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">จัดการผ่าน CMS →</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-50 border border-green-200 text-green-700 text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
