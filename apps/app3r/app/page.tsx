export default function App3RHome() {
  return (
    <main className="min-h-screen bg-purple-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl">⚡</div>
        <h1 className="text-3xl font-bold">App3R</h1>
        <p className="text-gray-300">แพลตฟอร์มตัวกลางด้านเครื่องใช้ไฟฟ้าครบวงจร</p>
        <div className="flex gap-3 justify-center mt-4 text-sm">
          <a href="http://localhost:3000" className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Admin</a>
          <a href="http://localhost:3001" className="px-4 py-2 bg-green-700 rounded-lg hover:bg-green-600">WeeeR</a>
          <a href="http://localhost:3002" className="px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600">WeeeU</a>
          <a href="http://localhost:3003" className="px-4 py-2 bg-orange-700 rounded-lg hover:bg-orange-600">WeeeT</a>
        </div>
        <span className="inline-block px-3 py-1 bg-purple-700 rounded-full text-sm">Port 3004</span>
      </div>
    </main>
  );
}
