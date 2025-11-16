'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🎬 Tailwind Test</h1>
        <p className="text-gray-600 mb-6">If you can see colors and styling, Tailwind is working!</p>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg">
            <p className="font-semibold">Gradient Background</p>
          </div>
          <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg">
            <p className="font-semibold">Green Alert Style</p>
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
            Styled Button
          </button>
        </div>
      </div>
    </div>
  );
}