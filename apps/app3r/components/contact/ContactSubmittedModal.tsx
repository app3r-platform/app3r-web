'use client';

import { topicLabels } from '@/lib/content/contact-routing';
import type { ContactTopic } from '@/lib/types/contact';

interface Props {
  topic: ContactTopic;
  name: string;
  onClose: () => void;
}

export default function ContactSubmittedModal({ topic, name, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900">ส่งข้อความสำเร็จ!</h2>
        <p className="text-gray-600">
          ขอบคุณ <span className="font-semibold">{name}</span> ที่ติดต่อเรา
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-left space-y-1">
          <div className="text-purple-700 font-medium">หัวข้อ:</div>
          <div className="text-gray-700">{topicLabels[topic]}</div>
        </div>
        <p className="text-gray-500 text-sm">
          ทีมงานจะติดต่อกลับภายใน <span className="font-semibold text-purple-700">1-2 วันทำการ</span>
        </p>
        <button
          onClick={onClose}
          className="w-full bg-purple-700 text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
