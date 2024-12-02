"use client";
import BackgroundOrbs from './BackgroundOrbs';
import { CursorEffect } from './ui/cursor-effect';
import { useRouter } from 'next/navigation';

export default function Hero() {

  const router = useRouter();
  function handleClick() {
    console.log("Login modal initiated!");
    router.push('/login');
  }

  return (
    <main className="h-screen overflow-hidden bg-black relative flex flex-col justify-center">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-purple-950/20 pointer-events-none" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <BackgroundOrbs />
      </div>

      {/* Cursor effect */}
      <CursorEffect />
      
      <div className="container mx-auto px-4 relative z-20">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-violet-400 to-purple-500">
              BlockMate
            </span>
          </h1>
          <div className="mb-8 space-y-3">
            <p className="text-xl md:text-2xl text-purple-100/90 font-bold">
              Your Intelligent Companion in the Web3 Universe
            </p>
            <p className="text-lg text-purple-200/70 font-medium pb-20">
              Navigate blockchain technology with confidence using AI-powered insights
            </p>
          </div>

          {/* Button Section */}
          <div className="flex items-center justify-center w-full max-w-3xl">
            <button
              onClick={() => {handleClick()}}
              className="px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-white/20 hover:bg-gradient-to-br hover:from-purple-600 hover:via-violet-600 hover:to-purple-500"
            >
              LogIn to Chat
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
