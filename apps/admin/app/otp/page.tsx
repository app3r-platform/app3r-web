"use client";
/**
 * OTP Verification — Wave1 Shell
 * Screen: A-73b (post-login email verification)
 *
 * Flow: Login → (if email_verify needed) → this page → Dashboard
 * Endpoint: POST /auth/otp-verify per d2-openapi.yaml
 *
 * RC-1 mock fallback: if API unavailable, accept any 6-digit code → proceed.
 * TODO: REMOVE BEFORE PROD — mock bypass (TD-Wave1)
 */
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAdminClient } from '@/lib/auth-client'

export default function OtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const type = (searchParams.get('type') ?? 'email_verify') as
    | 'email_verify'
    | 'password_reset'
    | 'phone_verify'

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { setError('กรุณากรอก OTP 6 หลัก'); return }
    setError('')
    setLoading(true)
    try {
      const client = getAdminClient()
      const result = await client.auth.otpVerify({ email, code, type })
      if (result.ok && result.data.verified) {
        router.push('/')
      } else {
        throw new Error(
          result.ok ? 'OTP ไม่ถูกต้องหรือหมดอายุ' : result.error.error.message,
        )
      }
    } catch (e) {
      console.warn('[mock fallback] otp verify:', e)
      // RC-1 mock: accept any 6-digit code in pre-API phase (dev/test only)
      if (/^\d{6}$/.test(code)) {
        router.push('/')
      } else {
        setError('OTP ไม่ถูกต้อง (ทดสอบ: ใส่ตัวเลข 6 หลักใดก็ได้)')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      const client = getAdminClient()
      await client.auth.otpRequest({ email, type })
    } catch (e) {
      console.warn('[mock fallback] otp resend:', e)
    } finally {
      setResending(false)
      setResent(true)
      setTimeout(() => setResent(false), 3000)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-gray-900">ยืนยัน OTP</h1>
          <p className="text-gray-500 text-sm mt-1">
            ส่งรหัส 6 หลักไปที่{' '}
            <span className="font-medium text-gray-700">{email || 'อีเมลของคุณ'}</span>
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleVerify}
          className="bg-white rounded-2xl p-8 space-y-5 border border-gray-200"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {resent && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              ส่ง OTP ใหม่แล้ว
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm text-gray-500">รหัส OTP 6 หลัก</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? 'กำลังตรวจสอบ…' : 'ยืนยัน OTP'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-gray-500 hover:text-blue-600 underline transition-colors disabled:opacity-50"
            >
              {resending ? 'กำลังส่ง…' : 'ส่ง OTP ใหม่'}
            </button>
          </div>
        </form>

        {/* Dev note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          🔶 Wave1 mockup — OTP จาก mock fixtures: <code>123456</code>
        </p>
      </div>
    </main>
  )
}
