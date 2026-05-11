"use client";

// ============================================================
// components/listings/ServiceTypeFilter.tsx — Service type tabs
// Phase C-4.1b — Client Component
// ============================================================
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SERVICE_TYPES } from '../../lib/constants/service-types';

interface ServiceTypeFilterProps {
  allowedTypes: readonly number[];
  accentColor?: 'blue' | 'orange';
}

const ALL_SERVICE_TYPES_LIST = Object.values(SERVICE_TYPES);

export default function ServiceTypeFilter({
  allowedTypes,
  accentColor = 'blue',
}: ServiceTypeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('serviceType') ?? 'all';

  function handleSelect(typeId: number | 'all') {
    const params = new URLSearchParams(searchParams.toString());
    if (typeId === 'all') {
      params.delete('serviceType');
    } else {
      params.set('serviceType', String(typeId));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeClass = accentColor === 'blue'
    ? 'bg-blue-600 text-white border-blue-600'
    : 'bg-orange-500 text-white border-orange-500';

  const inactiveClass = 'bg-white text-gray-700 border-gray-300 hover:border-gray-400';
  const disabledClass = 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed opacity-60';

  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-2">ประเภทบริการ</div>
      <div className="flex flex-wrap gap-2">
        {/* "ทั้งหมด" button */}
        <button
          onClick={() => handleSelect('all')}
          className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${
            currentType === 'all' ? activeClass : inactiveClass
          }`}
        >
          ทั้งหมด
        </button>

        {ALL_SERVICE_TYPES_LIST.map((st) => {
          const isAllowed = allowedTypes.includes(st.id);
          const isActive = currentType === String(st.id);

          return (
            <button
              key={st.id}
              onClick={() => isAllowed && handleSelect(st.id)}
              disabled={!isAllowed}
              title={isAllowed ? st.label : `ไม่รองรับสำหรับงานประเภทนี้`}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${
                !isAllowed
                  ? disabledClass
                  : isActive
                    ? activeClass
                    : inactiveClass
              }`}
            >
              {st.label}
              {!isAllowed && (
                <span className="ml-1 text-gray-300">—</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
