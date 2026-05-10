"use client";

// ============================================================
// Client component: "สนใจ" button + modal
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
        className="w-full bg-purple-700 text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition text-lg"
      >
        สนใจสินค้า
      </button>
      <InterestedModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        listingTitle={listingTitle}
      />
    </>
  );
}
