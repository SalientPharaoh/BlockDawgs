"use client";
import React, { useRef, useState, useEffect } from "react";
import { useScroll, motion, useTransform, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyScroll = ({
  content,
  contentClassName,
}: {
  content: {
    title: string;
    description: string;
    content?: React.ReactNode;
  }[];
  contentClassName?: string;
}) => {
  const [activeCard, setActiveCard] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  const cardLength = content.length;
  const contentScrollProgress = useTransform(scrollYProgress, [0, 1], [0, cardLength - 1]);

  useMotionValueEvent(contentScrollProgress, "change", (latest) => {
    const rounded = Math.round(latest);
    setActiveCard(rounded);
  });

  return (
    <motion.div
      ref={ref}
      className="relative h-[300vh]"
    >
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <motion.h2
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                key={content[activeCard].title}
                className="text-4xl font-bold text-white"
              >
                {content[activeCard].title}
              </motion.h2>
              <motion.p
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                key={content[activeCard].description}
                className="text-lg text-white/70"
              >
                {content[activeCard].description}
              </motion.p>
            </div>
            <motion.div
              className={cn("h-[30rem] relative rounded-lg scroll-content z-20", contentClassName)}
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              key={activeCard}
              transition={{ duration: 0.5 }}
            >
              {content[activeCard].content}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
