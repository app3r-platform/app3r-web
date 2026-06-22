"use client";
// ── Profile — WeeeR (D-2 Location Picker) ─────────────────────────────────────
// เพิ่ม Location picker + Service area สำหรับ WeeeR shop

import { useState } from "react";
import LocationPicker from "../../../components/location/LocationPicker";
import { MockAnnoOrigin } from "@/components/MockAnno";

const THAI_BANKS = [
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกสิกรไทย (KBank)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารออมสิน",
  "ธนาคารอื่นๆ",
];

export default function ProfilePage() {
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaved, setPwSaved] = useState(false);

  const [bankForm, setBankForm] = useState({
    bank_name: "ธนาคารกสิกรไทย (KBank)",
    bank_account_number: "0123456789",
    bank_account_name: "บริษัท ช่างเย็น จำกัด",
  });
  const [bankEditing, setBankEditing] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const setBank = (k: string, v: string) => setBankForm((f) => ({ ...f, [k]: v }));

  function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    setPwSaved(true);
  }

  function handleBankSave(e: React.FormEvent) {
    e.preventDefault();
    setBankEditing(false);
    setBankSaved(true);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* §5 Origin */}
      <MockAnnoOrigin from="R-01" />
      <h1 className="text-xl font-bold text-gray-900">โปรไฟล์บริษัท</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">ข้อมูลบริษัท</h3>
          <button className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600">
            ✏️ แก้ไข
          </button>
        </div>
        <div className="space-y-4">
          {[
            { label: "ชื่อบริษัท / ร้าน", value: "บริษัท ช่างเย็น จำกัด",  icon: "🏢" },
            { label: "อีเมล",              value: "company@example.com",      icon: "📧" },
            { label: "เบอร์โทรศัพท์",     value: "081-234-5678",              icon: "📱" },
            { label: "สถานะบัญชี",        value: "✅ Active",                 icon: "🔖" },
          ].map((r) => (
            <div key={r.label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm">
                {r.icon}
              </div>
              <div>
                <div className="text-xs text-gray-400">{r.label}</div>
                <div className="text-sm text-gray-800">{r.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location Picker (D-2) */}
      <LocationPicker
        initialLocation={{
          address: "123/45 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
          serviceAreaKm: 20,
        }}
      />

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">เอกสารประกอบการสมัคร</h3>
        {[
          { label: "หนังสือรับรองบริษัท", status: "อนุมัติแล้ว" },
          { label: "สำเนาบัตรประชาชน",    status: "อนุมัติแล้ว" },
        ].map((d) => (
          <div key={d.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
            <span className="text-sm text-gray-700">📄 {d.label}</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {d.status}
            </span>
          </div>
        ))}
      </div>

      {/* Bank account (captured at signup — edit here) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">บัญชีธนาคาร (รับเงินถอน Gold)</h3>
          {!bankEditing && (
            <button
              onClick={() => { setBankEditing(true); setBankSaved(false); }}
              className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              ✏️ แก้ไข
            </button>
          )}
        </div>

        {bankEditing ? (
          <form onSubmit={handleBankSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ธนาคาร</label>
              <select
                value={bankForm.bank_name}
                onChange={(e) => setBank("bank_name", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] bg-white"
              >
                {THAI_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่บัญชี</label>
              <input
                type="text"
                value={bankForm.bank_account_number}
                onChange={(e) => setBank("bank_account_number", e.target.value.replace(/\D/g, ""))}
                maxLength={14}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี</label>
              <input
                type="text"
                value={bankForm.bank_account_name}
                onChange={(e) => setBank("bank_account_name", e.target.value)}
                maxLength={200}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                บันทึก
              </button>
              <button type="button" onClick={() => setBankEditing(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
                ยกเลิก
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {bankSaved && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm text-green-700">
                ✅ บันทึกบัญชีธนาคารแล้ว
              </div>
            )}
            {[
              { label: "ธนาคาร", value: bankForm.bank_name, icon: "🏦" },
              { label: "เลขที่บัญชี", value: bankForm.bank_account_number, icon: "🔢" },
              { label: "ชื่อบัญชี", value: bankForm.bank_account_name, icon: "👤" },
            ].map((r) => (
              <div key={r.label} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm">
                  {r.icon}
                </div>
                <div>
                  <div className="text-xs text-gray-400">{r.label}</div>
                  <div className="text-sm text-gray-800">{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">ความปลอดภัย</h3>
        <button
          onClick={() => { setShowPwModal(true); setPwSaved(false); setPwForm({ current: "", next: "", confirm: "" }); }}
          className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600"
        >
          🔑 เปลี่ยนรหัสผ่าน
        </button>
      </div>

      {/* Change-password modal */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">เปลี่ยนรหัสผ่าน</h3>
              <button onClick={() => setShowPwModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {pwSaved ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                  ✅ เปลี่ยนรหัสผ่านเรียบร้อยแล้ว
                </div>
                <button
                  onClick={() => setShowPwModal(false)}
                  className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  ปิด
                </button>
              </div>
            ) : (
              <form onSubmit={handlePwSave} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านปัจจุบัน</label>
                  <input
                    type="password"
                    value={pwForm.current}
                    onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={pwForm.next}
                    onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
                  />
                </div>
                <button type="submit" className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  บันทึกรหัสผ่านใหม่
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
