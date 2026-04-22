"use client";

import { useEffect, useRef } from "react";

interface SkinViewerProps {
  skinUrl: string;
  showInner: boolean;
  showOuter: boolean;
  compact?: boolean;
}

export default function SkinViewer({
  skinUrl,
  showInner,
  showOuter,
  compact = false,
}: SkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<any>(null);
  const width = compact ? 120 : 300;
  const height = compact ? 160 : 400;

  useEffect(() => {
    import("skinview3d").then((skinview3d) => {
      if (!canvasRef.current) return;

      viewerRef.current = new skinview3d.SkinViewer({
        canvas: canvasRef.current,
        width,
        height,
        skin: skinUrl,
      });

      viewerRef.current.animation = new skinview3d.IdleAnimation();
      viewerRef.current.controls.enableRotate = true;
      viewerRef.current.controls.enableZoom = false;
      viewerRef.current.controls.enablePan = false;

      (window as any).__skinViewer = viewerRef.current;
    });

    return () => {
      if (viewerRef.current) viewerRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.loadSkin(skinUrl);
    }
  }, [skinUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const skin = viewer.playerObject?.skin;
    if (!skin) return;
    const parts = ["head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg"];
    parts.forEach((part) => {
      if (skin[part]?.innerLayer) skin[part].innerLayer.visible = showInner;
      if (skin[part]?.outerLayer) skin[part].outerLayer.visible = showOuter;
    });
  }, [showInner, showOuter]);

  return (
    <div className="skinViewerWrapper">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
}