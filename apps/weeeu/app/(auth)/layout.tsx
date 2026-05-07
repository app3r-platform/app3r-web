import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-400 rounded-full opacity-10 blur-3xl" />
      </div>

      {/* Auth card */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Image src="/logo/WeeeU.png" alt="WeeeU" width={48} height={48} className="rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">WeeeU</h1>
          <p className="text-blue-200 text-sm mt-1">แพลตฟอร์มจัดการเครื่องใช้ไฟฟ้า</p>
        </div>

        {/* Card content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
