"use client";

// ============================================================
// components/listings/OwnerRedirectModal.tsx — Owner detection UI
// Phase C-4.1b — Client Component
// ============================================================
import Link from 'next/link';

interface OwnerRedirectModalProps {
  jobId: string;
  type: 'repair' | 'maintain';
  title: string;
}

export default function OwnerRedirectModal({ jobId, type, title }: OwnerRedirectModalProps) {
  const typeTH = type === 'repair' ? 'ซ่อม' : 'บำรุง';

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="max-w-md mx-auto bg-white border border-purple-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          นี่คือประกาศของคุณ
        </h2>
        <p className="text-sm text-gray-500 mb-2 font-medium line-clamp-2">
          {title}
        </p>
        <p className="text-sm text-gray-400 mb-6">
          ประเภท: {typeTH} | รหัส: {jobId}
        </p>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          คุณเป็นเจ้าของประกาศนี้ ไปที่แอป WeeeU เพื่อดูสถานะ
          จัดการ offer จากช่าง และติดตามงานของคุณ
        </p>

        <div className="space-y-3">
          <Link
            href={`http://localhost:3002/jobs/${jobId}`}
            className="block w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
          >
            ไปจัดการประกาศ (WeeeU)
          </Link>
          <Link
            href={`/listings/${type}`}
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
          >
            กลับหน้าประกาศ{typeTH}
          </Link>
        </div>
      </div>
    </div>
  );
}
