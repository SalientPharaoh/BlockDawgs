"use client";
import { cn } from "@/lib/utils";
import { useMotionValue, motion } from "framer-motion";
import React, { useEffect, useRef, useState, useMemo } from "react";

export const HeroHighlight = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMouseInside, setIsMouseInside] = useState(false);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      mouseX.set(width);
      mouseY.set(height);
      setIsMouseInside(true);
    }
  }, []);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    darkModeMediaQuery.addEventListener('change', handleColorSchemeChange);

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, []);

  const handleMouseMove = useMemo(() => {
    let throttleTimer: number | null = null;

    return ({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) => {
      if (throttleTimer) return;

      throttleTimer = window.setTimeout(() => {
        if (!currentTarget) return;
        const { left, top } = currentTarget.getBoundingClientRect();

        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
        throttleTimer = null;
      }, 16); // Throttle to about 60fps
    };
  }, [mouseX, mouseY]);

  function handleMouseEnter() {
    setIsMouseInside(true);
  }

  function handleMouseLeave() {
    setIsMouseInside(false);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const dotPositions = new Map<string, { x: number; y: number; baseSize: number; baseOpacity: number }>();

    const calculateDotPositions = () => {
      dotPositions.clear();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.max(canvas.width, canvas.height) / 2;

      for (let radius = 30; radius <= maxRadius; radius += 30) {
        const circumference = 2 * Math.PI * radius;
        const dotCount = Math.floor(circumference / 30);
        const angleStep = (2 * Math.PI) / dotCount;

        for (let i = 0; i < dotCount; i++) {
          const angle = i * angleStep;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const key = `${radius}-${i}`;
          dotPositions.set(key, { x, y, baseSize: 4, baseOpacity: 0.2 });
        }
      }
    };

    calculateDotPositions();

    const drawDots = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentMouseX = mouseX.get();
      const currentMouseY = mouseY.get();

      dotPositions.forEach(({ x, y, baseSize, baseOpacity }) => {
        let dotSize = baseSize;
        let opacity = baseOpacity;

        if (isMouseInside) {
          const dx = x - currentMouseX;
          const dy = y - currentMouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            dotSize = baseSize + (150 - distance) / 10;
            opacity = baseOpacity + (100 - distance) / 100;
          }
        }

        let gradient;
        if (isDarkMode) {
          gradient = ctx.createLinearGradient(x - dotSize, y - dotSize, x + dotSize, y + dotSize);
          gradient.addColorStop(0, `rgba(79, 70, 229, ${opacity})`);
          gradient.addColorStop(1, `rgba(147, 51, 234, ${opacity})`);
        } else {
          gradient = ctx.createLinearGradient(x - dotSize, y - dotSize, x + dotSize, y + dotSize);
          gradient.addColorStop(0, `rgba(156, 163, 175, ${opacity})`);
          gradient.addColorStop(1, `rgba(75, 85, 99, ${opacity})`);
        }

        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
    };

    const animate = () => {
      drawDots();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mouseX, mouseY, isDarkMode, isMouseInside]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-screen flex items-center justify-center w-full group",
        isDarkMode ? "bg-black" : "bg-white",
        containerClassName
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
};

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.span
      initial={{
        backgroundSize: "0% 100%",
      }}
      animate={{
        backgroundSize: "100% 100%",
      }}
      transition={{
        duration: 2,
        ease: "linear",
        delay: 0.5,
      }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
      className={cn(
        `relative inline-block pb-1 px-1 rounded-lg bg-gradient-to-r from-indigo-300 to-purple-300 dark:from-indigo-500 dark:to-purple-500`,
        className
      )}
    >
      {children}
    </motion.span>
  );
};