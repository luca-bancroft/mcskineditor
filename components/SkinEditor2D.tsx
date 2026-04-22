"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";

type Tool = "pencil" | "eraser" | "eyedropper" | "fill";

export interface SkinEditor2DHandle {
  undo: () => void;
  redo: () => void;
}

interface SkinEditor2DProps {
  skinUrl: string;
  onSkinChange: (newUrl: string) => void;
  activeTool: Tool;
  color: string;
  brushSize: number;
  showGrid: boolean;
  onColorPick: (color: string) => void;
}

const SkinEditor2D = forwardRef<SkinEditor2DHandle, SkinEditor2DProps>(function SkinEditor2D(
  { skinUrl, onSkinChange, activeTool, color, brushSize, showGrid, onColorPick },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isDrawing = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);
  const SCALE = 8;
  const WIDTH = 64;
  const HEIGHT = 64;

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const commitSkin = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const offscreen = document.createElement("canvas");
    offscreen.width = WIDTH;
    offscreen.height = HEIGHT;
    const ctx2 = offscreen.getContext("2d");
    if (!ctx2) return;
    ctx2.imageSmoothingEnabled = false;
    ctx2.drawImage(canvas, 0, 0, WIDTH, HEIGHT);
    offscreen.toBlob((blob) => {
      if (!blob) return;
      onSkinChange(URL.createObjectURL(blob));
    });
  }, [onSkinChange]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    commitSkin();
  }, [commitSkin]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    commitSkin();
  }, [commitSkin]);

  useImperativeHandle(ref, () => ({ undo, redo }));

  // Load skin onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = skinUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, WIDTH * SCALE, HEIGHT * SCALE);
      if (historyRef.current.length === 0) saveHistory();
    };
  }, [skinUrl]);

  // Draw/clear grid
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showGrid) return;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * SCALE, 0);
      ctx.lineTo(x * SCALE, HEIGHT * SCALE);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * SCALE);
      ctx.lineTo(WIDTH * SCALE, y * SCALE);
      ctx.stroke();
    }
  }, [showGrid]);

  const getPixelPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / SCALE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / SCALE);
    return { x, y };
  };

  const hexToRgba = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b, a: 255 };
  };

  const drawPixel = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (activeTool === "eraser") {
      ctx.clearRect(x * SCALE, y * SCALE, SCALE * brushSize, SCALE * brushSize);
    } else if (activeTool === "pencil") {
      ctx.fillStyle = color;
      ctx.fillRect(x * SCALE, y * SCALE, SCALE * brushSize, SCALE * brushSize);
    }
  }, [activeTool, color, brushSize]);

  const eyedrop = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixel = ctx.getImageData(x * SCALE, y * SCALE, 1, 1).data;
    const hex = "#" + [pixel[0], pixel[1], pixel[2]]
      .map(v => v.toString(16).padStart(2, "0"))
      .join("");
    onColorPick(hex);
  }, [onColorPick]);

  const fill = useCallback((startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const idx = (x: number, y: number) => (y * canvas.width + x) * 4;
    const targetIdx = idx(startX * SCALE, startY * SCALE);
    const targetR = data[targetIdx];
    const targetG = data[targetIdx + 1];
    const targetB = data[targetIdx + 2];
    const targetA = data[targetIdx + 3];
    const { r, g, b, a } = hexToRgba(color);
    if (targetR === r && targetG === g && targetB === b && targetA === a) return;
    const stack = [[startX, startY]];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cy < 0 || cx >= WIDTH || cy >= HEIGHT) continue;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const i = idx(cx * SCALE, cy * SCALE);
      if (
        data[i] !== targetR || data[i + 1] !== targetG ||
        data[i + 2] !== targetB || data[i + 3] !== targetA
      ) continue;
      for (let dy = 0; dy < SCALE; dy++) {
        for (let dx = 0; dx < SCALE; dx++) {
          const pi = idx(cx * SCALE + dx, cy * SCALE + dy);
          data[pi] = r; data[pi + 1] = g;
          data[pi + 2] = b; data[pi + 3] = a;
        }
      }
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(imageData, 0, 0);
  }, [color]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const { x, y } = getPixelPos(e);
    if (activeTool === "eyedropper") { eyedrop(x, y); return; }
    if (activeTool === "fill") { saveHistory(); fill(x, y); commitSkin(); return; }
    drawPixel(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || activeTool === "eyedropper" || activeTool === "fill") return;
    const { x, y } = getPixelPos(e);
    drawPixel(x, y);
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (activeTool !== "eyedropper" && activeTool !== "fill") {
      saveHistory();
      commitSkin();
    }
  };

  return (
    <div className="editor2D" ref={wrapperRef}>
      <div className="editor2D-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={WIDTH * SCALE}
          height={HEIGHT * SCALE}
          style={{
            cursor: activeTool === "eyedropper" ? "crosshair" : "default",
            imageRendering: "pixelated",
            display: "block",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <canvas
          ref={gridCanvasRef}
          width={WIDTH * SCALE}
          height={HEIGHT * SCALE}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            imageRendering: "pixelated",
          }}
        />
        <canvas
          ref={overlayRef}
          width={WIDTH * SCALE}
          height={HEIGHT * SCALE}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  );
});

export default SkinEditor2D;