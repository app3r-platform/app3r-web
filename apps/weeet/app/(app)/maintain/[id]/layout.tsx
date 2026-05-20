import Image from "next/image";

export default function MaintainJobLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-sm border-b border-weeet-dark/30 px-4 py-2 flex items-center gap-2">
        <Image src="/logo/WeeeT.png" alt="WeeeT" width={24} height={24} className="rounded" />
        <span className="text-xs text-weeet-primary font-medium tracking-wide">บำรุงรักษา</span>
      </div>
      {children}
    </div>
  );
}
