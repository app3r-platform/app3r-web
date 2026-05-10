"use client";

// ============================================================
// Client component: "สนใจ" button + modal (Scrap)
// ============================================================
import { useState } from "react";
import InterestedModal from "../../../../components/modals/InterestedModal";

interface InterestedButtonProps {
  listingTitle: string;
}

export default function InterestedButton({ listingTitle }: InterestedButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gray-700 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition text-lg"
      >
        สนใจซื้อซาก
      </button>
      <InterestedModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        listingTitle={listingTitle}
      />
    </>
  );
}
