'use client'
// Sub-5a D80 Admin Lists Foundation — shared FilterBar
import { useCallback, useRef } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'

interface FilterBarProps {
  search: string
  status: string | null
  statusOptions: { value: string; label: string }[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: string | null) => void
  onReset: () => void
}

export function FilterBar({
  search,
  status,
  statusOptions,
  onSearchChange,
  onStatusChange,
  onReset,
}: FilterBarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onSearchChange(value), 300)
    },
    [onSearchChange]
  )

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        type="text"
        defaultValue={search}
        onChange={handleSearch}
        placeholder="ค้นหา..."
        className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
      />

      {statusOptions.length > 0 && (
        <ToggleGroup.Root
          type="single"
          value={status ?? ''}
          onValueChange={(val) => onStatusChange(val || null)}
          className="flex flex-wrap gap-1"
        >
          {statusOptions.map((opt) => (
            <ToggleGroup.Item
              key={opt.value}
              value={opt.value}
              className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-300 data-[state=on]:border-indigo-500 data-[state=on]:bg-indigo-600 data-[state=on]:text-white hover:border-gray-400 transition-colors"
            >
              {opt.label}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      )}

      <button
        onClick={onReset}
        className="ml-auto rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
      >
        รีเซ็ต
      </button>
    </div>
  )
}
