export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-700 rounded-2xl shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">3R</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">App3R WeeeR</h1>
          <p className="text-gray-500 text-sm mt-1">พอร์ทัลสำหรับร้าน / บริษัท</p>
        </div>
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">{children}</div>
        <p className="text-center text-xs text-gray-400 mt-6">© 2026 App3R Platform</p>
      </div>
    </div>
  );
}
