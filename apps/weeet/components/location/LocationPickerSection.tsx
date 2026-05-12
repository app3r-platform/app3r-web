"use client";
/**
 * components/location/LocationPickerSection.tsx
 * Phase D-2 — ตั้งค่าตำแหน่งฐาน (Home Base) + รัศมีให้บริการ
 */
import { useState, useEffect } from "react";
import { getAdapter } from "@/lib/dal";

export function LocationPickerSection({ technicianId }: { technicianId: string }) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("20");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdapter().technician.getProfile(technicianId).then((res) => {
      if (res.ok && res.data) {
        if (res.data.homeBaseLat != null) setLat(String(res.data.homeBaseLat));
        if (res.data.homeBaseLng != null) setLng(String(res.data.homeBaseLng));
        if (res.data.serviceRadiusKm != null) setRadius(String(res.data.serviceRadiusKm));
      }
      setLoading(false);
    });
  }, [technicianId]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setError("เบราว์เซอร์ไม่รองรับ Geolocation"); return; }
    setLocating(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); setLocating(false); },
      (e) => { setError(`ไม่สามารถรับตำแหน่งได้: ${e.message}`); setLocating(false); },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    const pLat = parseFloat(lat), pLng = parseFloat(lng), pR = parseInt(radius, 10);
    if (isNaN(pLat) || isNaN(pLng)) { setError("กรุณากรอกละติจูดและลองจิจูดให้ถูกต้อง"); return; }
    setSaving(true); setError(null);
    const res = await getAdapter().technician.updateProfile(technicianId, { homeBaseLat: pLat, homeBaseLng: pLng, serviceRadiusKm: isNaN(pR) ? 20 : pR });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); } else { setError(res.error); }
  };

  if (loading) return <div className="h-24 bg-gray-700 rounded-lg animate-pulse" />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">ตำแหน่งใช้สำหรับคำนวณระยะทางรับงาน</p>
      <button type="button" onClick={useCurrentLocation} disabled={locating} className="w-full flex items-center justify-center gap-2 bg-indigo-950/50 border border-indigo-800 hover:border-indigo-600 text-indigo-300 text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50">
        {locating ? <><span className="animate-spin">⏳</span> กำลังระบุตำแหน่ง...</> : <>📍 ใช้ตำแหน่งปัจจุบัน</>}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-gray-500 mb-1 block">ละติจูด (Lat)</label><input type="number" step="0.000001" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="13.756331" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">ลองจิจูด (Lng)</label><input type="number" step="0.000001" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="100.501765" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" /></div>
      </div>
      <div><label className="text-xs text-gray-500 mb-1 block">รัศมีให้บริการ (กม.)</label><div className="flex items-center gap-3"><input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(e.target.value)} className="flex-1 accent-orange-500" /><span className="text-sm text-white w-16 text-right">{radius} กม.</span></div></div>
      {error && <p className="text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
      {saved && <p className="text-xs text-green-400 bg-green-950/30 border border-green-800 rounded-lg px-3 py-2">✅ บันทึกตำแหน่งสำเร็จ</p>}
      <button type="button" onClick={handleSave} disabled={saving || !lat || !lng} className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
        {saving ? "กำลังบันทึก..." : "💾 บันทึกตำแหน่ง"}
      </button>
    </div>
  );
}
