"use client";
import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { mockJobs } from "@/lib/mock-data";

type PhotoType = "before" | "after";

interface CapturedPhoto {
  type: PhotoType;
  dataUrl: string;
  caption: string;
  timestamp: string;
}

export default function PhotoCapturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const job = mockJobs.find((j) => j.id === id);

  const [activeType, setActiveType] = useState<PhotoType>("before");
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [caption, setCaption] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotos((prev) => [
        ...prev,
        {
          type: activeType,
          dataUrl,
          caption: caption || `${activeType === "before" ? "ก่อน" : "หลัง"}ซ่อม`,
          timestamp: new Date().toLocaleTimeString("th-TH"),
        },
      ]);
      setCaption("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  if (!job) {
    return (
      <div className="px-4 pt-5 text-center">
        <p className="text-gray-400">ไม่พบงาน</p>
        <button onClick={() => router.back()} className="text-orange-400 text-sm mt-2">← กลับ</button>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div className="flex-1">
          <p className="text-xs text-gray-400">{job.jobNo}</p>
          <h1 className="font-bold text-white">ถ่ายรูป / วิดีโอ</h1>
        </div>
        <span className="text-xs text-gray-500">{photos.length} รูป</span>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Type Toggle */}
        <div className="flex gap-2 bg-gray-800 p-1 rounded-xl">
          {(["before", "after"] as PhotoType[]).map((type) => {
            const count = photos.filter((p) => p.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeType === type
                    ? type === "before"
                      ? "bg-blue-600 text-white"
                      : "bg-green-600 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {type === "before" ? "📷 ก่อนซ่อม" : "✅ หลังซ่อม"}
                {count > 0 && (
                  <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Camera / Upload Area */}
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              activeType === "before"
                ? "border-blue-700 hover:border-blue-500 hover:bg-blue-950/20"
                : "border-green-700 hover:border-green-500 hover:bg-green-950/20"
            }`}
          >
            <span className="text-4xl block mb-2">📸</span>
            <p className="text-white font-medium">ถ่ายรูปหรืออัปโหลด</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeType === "before" ? "รูปสภาพก่อนซ่อม" : "รูปสภาพหลังซ่อม"}
            </p>
            <div className="flex gap-2 justify-center mt-3">
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">📷 กล้อง</span>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">🖼️ แกลเลอรี</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Caption */}
          <input
            type="text"
            placeholder="คำอธิบายรูป (ไม่บังคับ)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Before Photos */}
        {beforePhotos.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-blue-300 text-sm flex items-center gap-2">
              <span>📷</span> รูปก่อนซ่อม ({beforePhotos.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {beforePhotos.map((photo, i) => (
                <div key={i} className="relative bg-gray-800 rounded-xl overflow-hidden aspect-square border border-gray-700">
                  <img src={photo.dataUrl} alt={photo.caption} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-2 py-1.5">
                    <p className="text-xs text-white truncate">{photo.caption}</p>
                    <p className="text-xs text-gray-400">{photo.timestamp}</p>
                  </div>
                  <button
                    onClick={() => removePhoto(photos.indexOf(photo))}
                    className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* After Photos */}
        {afterPhotos.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-green-300 text-sm flex items-center gap-2">
              <span>✅</span> รูปหลังซ่อม ({afterPhotos.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {afterPhotos.map((photo, i) => (
                <div key={i} className="relative bg-gray-800 rounded-xl overflow-hidden aspect-square border border-gray-700">
                  <img src={photo.dataUrl} alt={photo.caption} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-2 py-1.5">
                    <p className="text-xs text-white truncate">{photo.caption}</p>
                    <p className="text-xs text-gray-400">{photo.timestamp}</p>
                  </div>
                  <button
                    onClick={() => removePhoto(photos.indexOf(photo))}
                    className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save */}
        {photos.length > 0 && (
          <button
            onClick={() => router.back()}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            💾 บันทึกรูปภาพ ({photos.length} รูป)
          </button>
        )}

        {/* Checklist reminder */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-xs text-gray-400 space-y-1">
          <p className="font-medium text-gray-300">📋 ต้องถ่ายก่อนส่งงาน</p>
          <div className="flex items-center gap-2">
            <span className={beforePhotos.length > 0 ? "text-green-400" : "text-gray-500"}>
              {beforePhotos.length > 0 ? "✅" : "⬜"}
            </span>
            <span>รูปสภาพก่อนซ่อม (อย่างน้อย 1 รูป)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={afterPhotos.length > 0 ? "text-green-400" : "text-gray-500"}>
              {afterPhotos.length > 0 ? "✅" : "⬜"}
            </span>
            <span>รูปสภาพหลังซ่อม (อย่างน้อย 1 รูป)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
