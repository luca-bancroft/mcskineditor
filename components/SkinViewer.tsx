"use client";

import { useEffect, useRef } from "react";

export default function SkinViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let viewer: any;

    import("skinview3d").then((skinview3d) => {
      if (!canvasRef.current) return;

      viewer = new skinview3d.SkinViewer({
        canvas: canvasRef.current,
        width: 300,
        height: 400,
        skin: "https://minotar.net/skin/Steve",
      });

      viewer.animation = new skinview3d.IdleAnimation();

      viewer.controls.enableRotate = true;
      viewer.controls.enableZoom = false;
      viewer.controls.enablePan = false;
    });

    return () => {
      if (viewer) viewer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} width={300} height={400} />;
}