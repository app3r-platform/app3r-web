"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { availableSpecialties, educationLevels, postalCodeMap } from "@/lib/mock-data";
import type { Technician } from "@/lib/types";

const MAX_CERT_SIZE_MB = 3;
const MAX_CERT_FILES = 10;

export default function ProfilePage() {
  const { auth, updateTechnician, logout } = useAuth();
  const router = useRouter();
  const tech = auth.technician;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [certError, setCertError] = useState("");

  const [form, setForm] = useState<Partial<Technician>>({
    name: tech?.name ?? "",
    email: tech?.email ?? "",
    birthDate: tech?.birthDate ?? "",
    address: tech?.address ?? "",
    postalCode: tech?.postalCode ?? "",
    subDistrict: tech?.subDistrict ?? "",
    district: tech?.district ?? "",
    province: tech?.province ?? "",
    educationLevel: tech?.educationLevel ?? "",
    specialties: tech?.specialties ?? [],
    certificates: tech?.certificates ?? [],
  });

  const certInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof typeof form, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePostalChange = (code: string) => {
    set("postalCode", code);
    if (code.length === 5 && postalCodeMap[code]) {
      const loc = postalCodeMap[code];
      setForm((prev) => ({
        ...prev,
        postalCode: code,
        subDistrict: loc.subDistrict,
        district: loc.district,
        province: loc.province,
      }));
    }
  };

  const toggleSpecialty = (s: string) => {
    const curr = form.specialties ?? [];
    set("specialties", curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s]);
  };

  const handleCertUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCertError("");
      const files = Array.from(e.target.files ?? []);
      const existing = form.certificates ?? [];

      if (existing.length + files.length > MAX_CERT_FILES) {
        setCertError(`อัปโหลดได้สูงสุด ${MAX_CERT_FILES} ไฟล์`);
        e.target.value = "";
        return;
      }

      for (const f of files) {
        if (f.size > MAX_CERT_SIZE_MB * 1024 * 1024) {
          setCertError(`ไฟล์ "${f.name}" ใหญ่เกิน ${MAX_CERT_SIZE_MB}MB`);
          e.target.value = "";
          return;
        }
      }

      set("certificates", [...existing, ...files.map((f) => f.name)]);
      e.target.value = "";
    },
    [form.certificates]
  );

  const removeCert = (i: number) => {
    set("certificates", (form.certificates ?? []).filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    updateTechnician(form);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!tech) return null;

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">โปรไฟล์</h1>
        {!editing ? (
          <button
            onClick={() => { setEditing(true); setSaved(false); }}
            className="text-sm text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
          >
            ✏️ แก้ไข
          </button>
        ) : (
          <button
            onClick={() => {
              setEditing(false);
              // Reset form
              setForm({
                name: tech.name, email: tech.email, birthDate: tech.birthDate,
                address: tech.address, postalCode: tech.postalCode,
                subDistrict: tech.subDistrict, district: tech.district,
                province: tech.province, educationLevel: tech.educationLevel,
                specialties: tech.specialties, certificates: tech.certificates,
              });
            }}
            className="text-sm text-gray-400 hover:text-gray-200 font-medium"
          >
            ยกเลิก
          </button>
        )}
      </div>

      {saved && (
        <div className="bg-green-950/50 border border-green-700 rounded-xl px-4 py-2.5 text-sm text-green-300 flex items-center gap-2">
          ✅ บันทึกข้อมูลสำเร็จ
        </div>
      )}

      {/* Avatar + name + shop */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center text-3xl font-bold flex-shrink-0">
          {(form.name ?? tech.name)?.[0] ?? "ช"}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          ) : (
            <h2 className="font-bold text-white text-lg truncate">{tech.name}</h2>
          )}
          <p className="text-gray-400 text-sm mt-0.5">{tech.shopName}</p>
          <p className="text-xs text-gray-500">{tech.phone}</p>
        </div>
      </div>

      {/* Basic info */}
      <Section title="ข้อมูลส่วนตัว">
        <Field label="เบอร์โทรศัพท์" icon="📞" value={tech.phone} readOnly />
        <Field
          label="อีเมล"
          icon="📧"
          editing={editing}
          value={form.email ?? ""}
          onChange={(v) => set("email", v)}
          type="email"
          placeholder="email@example.com"
        />
        <Field
          label="วันเกิด"
          icon="🎂"
          editing={editing}
          value={form.birthDate ?? ""}
          onChange={(v) => set("birthDate", v)}
          type="date"
        />
      </Section>

      {/* Address */}
      <Section title="ที่อยู่">
        <Field
          label="ที่อยู่"
          icon="🏠"
          editing={editing}
          value={form.address ?? ""}
          onChange={(v) => set("address", v)}
          placeholder="บ้านเลขที่ / ซอย / ถนน"
        />

        {/* Postal code with auto-fill */}
        <div className="px-4 py-3 space-y-1">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <span>📮</span> รหัสไปรษณีย์
          </p>
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={form.postalCode ?? ""}
                onChange={(e) => handlePostalChange(e.target.value)}
                placeholder="กรอกรหัสไปรษณีย์ (5 หลัก)"
                maxLength={5}
                inputMode="numeric"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
              />
              {form.postalCode && postalCodeMap[form.postalCode ?? ""] && (
                <span className="text-xs text-green-400 self-center">✅ พบที่อยู่</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-white">{tech.postalCode || "—"}</p>
          )}
        </div>

        {/* Auto-filled address fields */}
        <div className="px-4 py-3 grid grid-cols-3 gap-2">
          {[
            { label: "ตำบล/แขวง", field: "subDistrict" as const },
            { label: "อำเภอ/เขต", field: "district" as const },
            { label: "จังหวัด", field: "province" as const },
          ].map(({ label, field }) => (
            <div key={field}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              {editing ? (
                <input
                  type="text"
                  value={form[field] ?? ""}
                  onChange={(e) => set(field, e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              ) : (
                <p className="text-xs text-white">{(tech as unknown as Record<string, unknown>)[field] as string || "—"}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Education */}
      <Section title="วุฒิการศึกษา">
        <div className="px-4 py-3">
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {educationLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => set("educationLevel", level)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.educationLevel === level
                      ? "bg-orange-600 border-orange-500 text-white"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <p className="text-sm text-white">{tech.educationLevel || "ไม่ระบุ"}</p>
            </div>
          )}
        </div>
      </Section>

      {/* Specialties */}
      <Section title="ความเชี่ยวชาญ">
        <div className="px-4 py-3">
          {editing ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">เลือกความเชี่ยวชาญ (ตามบริการของร้าน)</p>
              <div className="flex flex-wrap gap-2">
                {availableSpecialties.map((s) => {
                  const selected = (form.specialties ?? []).includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? "bg-orange-600 border-orange-500 text-white"
                          : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {selected ? "✓ " : ""}{s}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tech.specialties.length > 0 ? (
                tech.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-orange-900/50 text-orange-300 border border-orange-800 px-2 py-0.5 rounded-full"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มีความเชี่ยวชาญ</p>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Certificates / Documents */}
      <Section title="ใบรับรอง / เอกสาร">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              ไฟล์ภาพหรือ PDF ขนาดไม่เกิน {MAX_CERT_SIZE_MB}MB / ไม่เกิน {MAX_CERT_FILES} ไฟล์
            </p>
            {editing && (
              <button
                type="button"
                onClick={() => certInputRef.current?.click()}
                disabled={(form.certificates ?? []).length >= MAX_CERT_FILES}
                className="text-xs text-orange-400 hover:text-orange-300 disabled:text-gray-500 font-medium flex items-center gap-1"
              >
                + อัปโหลด
              </button>
            )}
          </div>

          <input
            ref={certInputRef}
            type="file"
            accept=".pdf,image/*"
            multiple
            className="hidden"
            onChange={handleCertUpload}
          />

          {certError && (
            <p className="text-xs text-red-400">{certError}</p>
          )}

          {(form.certificates ?? []).length > 0 ? (
            <div className="space-y-1.5">
              {(form.certificates ?? []).map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2"
                >
                  <span className="text-sm">
                    {name.endsWith(".pdf") ? "📄" : "🖼️"}
                  </span>
                  <span className="text-xs text-white flex-1 truncate">{name}</span>
                  {editing && (
                    <button
                      type="button"
                      onClick={() => removeCert(i)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-xl p-5 text-center ${
                editing
                  ? "border-gray-600 hover:border-orange-600 cursor-pointer"
                  : "border-gray-700"
              }`}
              onClick={editing ? () => certInputRef.current?.click() : undefined}
            >
              <p className="text-2xl mb-1">📁</p>
              <p className="text-xs text-gray-400">ยังไม่มีเอกสาร</p>
              {editing && <p className="text-xs text-orange-400 mt-0.5">แตะเพื่ออัปโหลด</p>}
            </div>
          )}
        </div>
      </Section>

      {/* Impersonation info */}
      {auth.isImpersonated && (
        <div className="bg-amber-950/50 border border-amber-800 rounded-xl p-4 text-sm text-amber-200">
          <p className="font-semibold flex items-center gap-2">
            <span>👤</span> โหมด Impersonation
          </p>
          <p className="text-xs text-amber-300/70 mt-1">
            บัญชีนี้ถูกเข้าใช้งานโดย {auth.impersonatedByShop ?? "WeeeR"}
          </p>
        </div>
      )}

      {/* Save button */}
      {editing && (
        <button
          onClick={handleSave}
          disabled={saving || !form.name?.trim()}
          className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <><span className="animate-spin">⏳</span> กำลังบันทึก...</>
          ) : (
            "💾 บันทึกข้อมูล"
          )}
        </button>
      )}

      {/* Settings link */}
      {!editing && (
        <button
          onClick={() => router.push("/settings")}
          className="w-full bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          ⚙️ ตั้งค่าแอป
        </button>
      )}

      {/* Logout */}
      {!editing && (
        <button
          onClick={handleLogout}
          className="w-full bg-gray-800 hover:bg-red-950 border border-gray-700 hover:border-red-800 text-gray-300 hover:text-red-300 font-medium py-3 rounded-xl transition-colors"
        >
          🚪 ออกจากระบบ
        </button>
      )}
    </div>
  );
}

// ── Reusable sub-components ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0">
      <h2 className="font-semibold text-white text-sm mb-2">{title}</h2>
      <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700">
        {children}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  icon: string;
  value: string;
  onChange?: (v: string) => void;
  editing?: boolean;
  readOnly?: boolean;
  type?: string;
  placeholder?: string;
}

function Field({ label, icon, value, onChange, editing, readOnly, type = "text", placeholder }: FieldProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {editing && !readOnly ? (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm mt-0.5 focus:outline-none focus:border-orange-500"
          />
        ) : (
          <p className="text-sm text-white">{value || "—"}</p>
        )}
      </div>
      {readOnly && <span className="text-xs text-gray-600">เปลี่ยนไม่ได้</span>}
    </div>
  );
}
