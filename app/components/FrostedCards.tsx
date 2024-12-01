export default function FrostedCards() {
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
      {/* Left Card */}
      <div className="flex-1 group">
        <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-2xl shadow-lg">
          <div className="bg-gradient-to-br from-[#2E073F] to-[#9C27B0] p-3 rounded-xl inline-block mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Begin Journey</h2>
          <p className="text-white/80">White Journey</p>
          <button className="mt-6 px-6 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white font-medium hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-white/20 w-full">
            Get Started
          </button>
        </div>
      </div>

      {/* Glowing Line */}
      <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/50 to-transparent self-stretch mx-4"></div>

      {/* Right Card */}
      <div className="flex-1 group">
        <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-2xl shadow-lg">
          <div className="bg-gradient-to-br from-[#2E073F] to-[#9C27B0] p-3 rounded-xl inline-block mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Advanced Access</h2>
          <p className="text-white/80">Hollow Shimmer</p>
          <button className="mt-6 px-6 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white font-medium hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-white/20 w-full">
            Explore Now
          </button>
        </div>
      </div>
    </div>
  );
}
