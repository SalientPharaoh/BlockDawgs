"use client";
import { useEffect, useRef } from "react";

export const CursorEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const isOverButton = useRef(false);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      isOverButton.current = target.closest('.button-area') !== null || 
                            target.closest('.scroll-content') !== null ||
                            target.closest('.world-map') !== null;
      
      targetPosition.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const render = () => {
      if (!ctx || !canvas || isOverButton.current) {
        ctx?.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0);
        animationFrameId.current = requestAnimationFrame(render);
        return;
      }

      // Smooth cursor movement
      mousePosition.current.x = lerp(mousePosition.current.x, targetPosition.current.x, 0.1);
      mousePosition.current.y = lerp(mousePosition.current.y, targetPosition.current.y, 0.1);

      // Clear the canvas with a very subtle fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create main gradient
      const mainGradient = ctx.createRadialGradient(
        mousePosition.current.x,
        mousePosition.current.y,
        0,
        mousePosition.current.x,
        mousePosition.current.y,
        250
      );

      // Update gradient colors with higher opacity
      mainGradient.addColorStop(0, "rgba(147, 51, 234, 0.08)");
      mainGradient.addColorStop(0.3, "rgba(139, 92, 246, 0.05)");
      mainGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      // Fill canvas with main gradient
      ctx.fillStyle = mainGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add a smaller, brighter core
      const coreGradient = ctx.createRadialGradient(
        mousePosition.current.x,
        mousePosition.current.y,
        0,
        mousePosition.current.x,
        mousePosition.current.y,
        25
      );

      coreGradient.addColorStop(0, "rgba(167, 139, 250, 0.2)");
      coreGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = coreGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId.current = requestAnimationFrame(render);
    };

    // Set up
    updateSize();
    window.addEventListener("resize", updateSize);
    window.addEventListener("mousemove", handleMouseMove);
    render();

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-10"
      style={{ mixBlendMode: "screen" }}
    />
  );
};