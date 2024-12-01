"use client";
import React from "react";
import { StickyScroll } from "./ui/scroll-reveal";

const content = [
  {
    title: "Easy Web3 Learning",
    description:
      "Learn web3 concepts easily with our AI-powered chatbot. Get real-time answers to your questions and learn by doing with our interactive tutorials.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 rounded-2xl p-8 shadow-xl flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Learn Web3</h3>
          <p className="text-white/70">Interactive tutorials and real-time answers</p>
        </div>
      </div>
    ),
  },
  {
    title: "AI-Powered Token Swaps",
    description:
      "Swap tokens across multiple chains with our AI-powered system. Get the best possible prices and minimize your costs with our automated optimization strategies.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-blue-600 via-cyan-700 to-teal-800 rounded-2xl p-8 shadow-xl flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Swap Tokens</h3>
          <p className="text-white/70">Optimize your token swaps with our AI-powered system</p>
        </div>
      </div>
    ),
  },
  {
    title: "Interoperability Made Easy",
    description:
      "Swap tokens across multiple chains with ease. Our system integrates with multiple chains and protocols to make it easy to move assets between them.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 rounded-2xl p-8 shadow-xl flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m0-3h.375a1.125 1.125 0 01.875.624V3H8a2 2 0 00-2 2v3m0 0 h.375a1.125 1.125 0 01.875.624V6a2 2 0 002 2h8a2 2 0 002-2V4.5a1.125 1.125 0 01.875-.624H19.5a1.125 1.125 0 01.875.624V12a2 2 0 002 2h1.5a2 2 0 002-2V3.5a1.125 1.125 0 01.875-.624H16.5a1.125 1.125 0 01.875.624V6a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Interoperability</h3>
          <p className="text-white/70">Swap tokens across multiple chains with ease</p>
        </div>
      </div>
    ),
  },
  {
    title: "Execute Transactions",
    description:
      "Use our AI-powered chatbot to execute transactions on the blockchain. Simply tell us what you want to do and we'll handle the rest.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-amber-600 via-orange-700 to-red-800 rounded-2xl p-8 shadow-xl flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Execute Transactions</h3>
          <p className="text-white/70">Use our AI-powered chatbot to execute transactions</p>
        </div>
      </div>
    ),
  },
  {
    title: "Step-by-Step Guide",
    description:
      "Get a step-by-step guide into web3 development. Learn how to build decentralized applications and get hands-on experience with our interactive tutorials.",
    content: (
      <div className="h-full w-full bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 rounded-2xl p-8 shadow-xl flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4m-4-4H6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Step-by-Step Guide</h3>
          <p className="text-white/70">Learn web3 development step-by-step</p>
        </div>
      </div>
    ),
  },
];

export function StickyScrollRevealDemo() {
  return (
    <section className="bg-black">
      <StickyScroll content={content} />
    </section>
  );
}
