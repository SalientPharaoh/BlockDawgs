"use client";
import React from "react";
import { ContainerScroll } from "./ui/container-scroll-animation";
import Image from "next/image";
import ss from "@/public/assets/ss.png";

export function HeroScroll() {
  return (
    <div className="h-[45rem] md:h-[70rem] w-full bg-black relative flex items-center justify-center px-8">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-purple-950/20 pointer-events-none" />
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      <div className="flex flex-col overflow-hidden">
        <ContainerScroll
          titleComponent={
            <>
              <div className="bg-gradient-to-b from-[#ffeee9] to-[#f5ae99] text-transparent bg-clip-text   md:pb-20 font-bold text-3xl md:text-5xl">
                Capture the Web3, Unlock Its Power with BlockMate
              </div>
            </>
          }
        >
          <Image
            src={ss}
            alt="hero"
            height={720}
            width={1400}
            className="mx-auto rounded-2xl object-cover h-full object-left-top"
            draggable={false}
          />
        </ContainerScroll>
      </div>
    </div>
  );
}
