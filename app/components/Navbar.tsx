import { FiSearch } from 'react-icons/fi';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-center px-6 py-4">
      <div className="w-3/4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            BlockMate
          </div>

          {/* Center Menu */}
          <div className="hidden md:flex space-x-8">
            {['Home', 'Potlets', 'Acults', 'Chings', 'Hoqp', 'CUE'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <button className="px-6 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white font-medium hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-white/20">
              Hsgn
            </button>
            <button className="p-2.5 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-white/20">
              <FiSearch size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
