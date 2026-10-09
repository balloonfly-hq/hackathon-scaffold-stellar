import React, { useRef, useEffect } from "react";

interface AnimatedBackgroundProps {
  progress: number; // 0-1 (baseado no multiplicador)
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  progress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const animationTimeRef = useRef<number>(0);
  const progressRef = useRef<number>(progress);

  // Keep progressRef updated with the latest progress without restarting the canvas loop
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      // Reset transform before scaling so repeated window resizes do not compound
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, width, height);

      // Background gradient (from bottom-left to top-right)
      const gradient = ctx.createLinearGradient(0, height, width, 0);
      gradient.addColorStop(0, "#0a0e1a");
      gradient.addColorStop(0.3, "#1a0d2e");
      gradient.addColorStop(0.6, "#2d1b4e");
      gradient.addColorStop(1, "#0a0e1a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Origin of radial lines (bottom-left corner)
      const centerX = 0;
      const centerY = height;
      const numLines = 80;
      const maxDistance = Math.sqrt(width * width + height * height);
      const currentProgress = progressRef.current;

      // Draw radial lines
      ctx.strokeStyle = "#1a1d29";
      ctx.lineWidth = 1.5;

      for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 0.75; // 135 degrees (from bottom-left)
        const distance = maxDistance * (1.2 + currentProgress * 0.3);

        // Time-based offset to create parallax movement
        const offset = animationTimeRef.current * 30;
        const currentDistance = distance + offset;

        const endX = centerX + Math.cos(angle) * currentDistance;
        const endY = centerY - Math.sin(angle) * currentDistance;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Alternating darker lines (pattern)
      ctx.strokeStyle = "#0f1117";
      ctx.lineWidth = 1;
      for (let i = 0; i < numLines; i += 2) {
        const angle = (i / numLines) * Math.PI * 0.75;
        const distance = maxDistance * (1.2 + currentProgress * 0.3);
        const offset = animationTimeRef.current * 30;
        const currentDistance = distance + offset;

        const endX = centerX + Math.cos(angle) * currentDistance;
        const endY = centerY - Math.sin(angle) * currentDistance;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Increment animation time
      animationTimeRef.current += 0.01;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
    />
  );
};

export default AnimatedBackground;
