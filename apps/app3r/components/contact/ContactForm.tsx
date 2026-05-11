'use client';

import { useState } from 'react';
import { topicLabels } from '@/lib/content/contact-routing';
import type { ContactTopic, ContactFormSubmission } from '@/lib/types/contact';
import ContactSubmittedModal from './ContactSubmittedModal';

const TOPICS: ContactTopic[] = [
  'general', 'register-weeer', 'billing', 'dispute',
  'technical', 'press', 'partnership', 'other',
];

interface FormErrors {
  topic?: string;
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactForm() {
  const [topic, setTopic] = useState<ContactTopic | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!topic) e.topic = 'กรุณาเลือกหัวข้อ';
    if (!name.trim()) e.name = 'กรุณากรอกชื่อ';
    if (!email.trim()) {
      e.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (!message.trim()) {
      e.message = 'กรุณากรอกข้อความ';
    } else if (message.trim().length < 10) {
      e.message = 'ข้อความต้องมีอย่างน้อย 10 ตัวอักษร';
    }
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const submission: ContactFormSubmission = {
      topic: topic as ContactTopic,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      companyName: companyName.trim() || undefined,
      message: message.trim(),
      submittedAt: new Date().toISOString(),
    };

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('app3r-contact-submissions') || '[]');
      existing.push(submission);
      localStorage.setItem('app3r-contact-submissions', JSON.stringify(existing));
    } catch {
      // silently fail
    }

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  }

  function handleClose() {
    setSubmitted(false);
    setTopic('');
    setName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setMessage('');
  }

  return (
    <>
      {submitted && topic && (
        <ContactSubmittedModal
          topic={topic as ContactTopic}
          name={name}
          onClose={handleClose}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">ส่งข้อความหาเรา</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หัวข้อ <span className="text-red-500">*</span>
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as ContactTopic | '')}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.topic ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">เลือกหัวข้อ</option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>{topicLabels[t]}</option>
              ))}
            </select>
            {errors.topic && <p className="text-red-500 text-xs mt-1">{errors.topic}</p>}
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อของคุณ"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.name ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.email ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Phone + Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรศัพท์ <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0XX-XXX-XXXX"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อบริษัท/ร้าน <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ชื่อบริษัทหรือร้านค้า"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ข้อความ <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ระบุรายละเอียดที่ต้องการสอบถาม..."
              rows={5}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                errors.message ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.message
                ? <p className="text-red-500 text-xs">{errors.message}</p>
                : <span />
              }
              <span className="text-xs text-gray-400">{message.length} ตัวอักษร</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                กำลังส่ง...
              </>
            ) : (
              'ส่งข้อความ →'
            )}
          </button>
        </form>
      </div>
    </>
  );
}
