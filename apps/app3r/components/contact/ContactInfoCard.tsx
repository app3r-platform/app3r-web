import type { ContactInfo } from '@/lib/types/contact';

interface Props {
  info: ContactInfo;
}

export default function ContactInfoCard({ info }: Props) {
  return (
    <div className="bg-purple-900 text-white rounded-2xl p-8 space-y-6 h-fit">
      <div>
        <h2 className="text-xl font-bold mb-1">ข้อมูลติดต่อ</h2>
        <p className="text-purple-300 text-sm">{info.companyName}</p>
      </div>

      {/* Address */}
      <div className="flex gap-3">
        <span className="text-2xl">📍</span>
        <div>
          <div className="font-semibold text-sm mb-0.5">ที่อยู่</div>
          <div className="text-purple-200 text-sm">{info.address}</div>
        </div>
      </div>

      {/* Phone */}
      <div className="flex gap-3">
        <span className="text-2xl">📞</span>
        <div>
          <div className="font-semibold text-sm mb-0.5">โทรศัพท์</div>
          {info.phones.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/-/g, '')}`}
              className="block text-purple-200 text-sm hover:text-white transition"
            >
              {phone}
            </a>
          ))}
        </div>
      </div>

      {/* Business Hours */}
      <div className="flex gap-3">
        <span className="text-2xl">🕐</span>
        <div>
          <div className="font-semibold text-sm mb-0.5">เวลาทำการ</div>
          <div className="text-purple-200 text-sm">{info.businessHours}</div>
        </div>
      </div>

      {/* LINE */}
      <div className="flex gap-3">
        <span className="text-2xl">💬</span>
        <div>
          <div className="font-semibold text-sm mb-0.5">LINE Official</div>
          <a
            href={`https://line.me/R/ti/p/${info.lineId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-200 text-sm hover:text-white transition"
          >
            {info.lineId}
          </a>
        </div>
      </div>

      {/* Emails */}
      <div className="border-t border-purple-700 pt-5">
        <div className="font-semibold text-sm mb-3">อีเมล</div>
        <div className="space-y-2">
          {info.emails.map((e) => (
            <div key={e.email}>
              <div className="text-xs text-purple-400">{e.label}</div>
              <a
                href={`mailto:${e.email}`}
                className="text-purple-200 text-sm hover:text-white transition break-all"
              >
                {e.email}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
