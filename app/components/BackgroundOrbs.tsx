export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Orb 1 */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#9C27B0]/30 rounded-full blur-3xl animate-float"></div>
      
      {/* Orb 2 */}
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#2E073F]/40 rounded-full blur-3xl animate-float-delayed"></div>
      
      {/* Orb 3 */}
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#EBD3F8]/30 rounded-full blur-3xl animate-float-slow"></div>
      
      {/* Small decorative orbs */}
      <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-[#9C27B0]/40 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/3 left-1/2 w-32 h-32 bg-[#2E073F]/30 rounded-full blur-2xl animate-pulse-slow"></div>
    </div>
  );
}
