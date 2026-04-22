"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SkinViewer from "@/components/SkinViewer";
import SkinEditor2D, { SkinEditor2DHandle } from "@/components/SkinEditor2D";
import Navbar from "@/components/Navbar";
import MySkins from "@/components/MySkins";
import PublishModal from "@/components/PublishModal";
import { useSearchParams } from "next/navigation";

const DEFAULT_SKIN = "/images/steve.png";
type Tool = "pencil" | "eraser" | "eyedropper" | "fill";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const [skinUrl, setSkinUrl] = useState(DEFAULT_SKIN);
  const [activeTool, setActiveTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#ff0000");
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [brushSize, setBrushSize] = useState(1);
  const [showInner, setShowInner] = useState(true);
  const [showOuter, setShowOuter] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showMySkins, setShowMySkins] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<SkinEditor2DHandle>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".png")) {
      alert("Please upload a .png skin file.");
      return;
    }
    setSkinUrl(URL.createObjectURL(file));
  }

  function applyColor(newColor: string) {
    setColor(newColor);
    setColorHistory((prev) => {
      const filtered = prev.filter((c) => c !== newColor);
      return [newColor, ...filtered].slice(0, 10);
    });
  }

  function downloadSkin() {
    const link = document.createElement("a");
    link.href = skinUrl;
    link.download = "skin.png";
    link.click();
  }

  const searchParams = useSearchParams();
  useEffect(() => {
    const skinParam = searchParams.get("skin");
    if (skinParam) setSkinUrl(skinParam);
  }, []);

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: "pencil",     label: "Pencil",      icon: "fa-pencil"      },
    { id: "eraser",     label: "Eraser",       icon: "fa-eraser"      },
    { id: "eyedropper", label: "Eyedropper",   icon: "fa-eye-dropper" },
    { id: "fill",       label: "Fill Bucket",  icon: "fa-fill-drip"   },
  ];

  return (
    <div>
      <Navbar />

      <div className="windows">
        <div className="leftPanel">
          <div className="skinWindow">
            <SkinViewer skinUrl={skinUrl} showInner={showInner} showOuter={showOuter} />
            <div className="layerToggle">
              <button
                className={`layerBtn ${showInner ? "active" : ""}`}
                onClick={() => setShowInner((v) => !v)}
              >
                <i className="fa-solid fa-square" /> Inner
              </button>
              <button
                className={`layerBtn ${showOuter ? "active" : ""}`}
                onClick={() => setShowOuter((v) => !v)}
              >
                <i className="fa-solid fa-layer-group" /> Outer
              </button>
            </div>

            {/* Skin actions */}
            <div className="skinActions">
              <button
                className="skinActionBtn"
                onClick={() => session ? setShowPublish(true) : router.push("/signin")}
              >
                <i className="fa-solid fa-globe" /> Publish
              </button>
              <button
                className="skinActionBtn"
                onClick={() => session ? setShowMySkins(true) : router.push("/signin")}
              >
                <i className="fa-solid fa-layer-group" /> Your Skins
              </button>
            </div>
          </div>
        </div>

        <div className="editorWindow">
          <h3>Editor Tools</h3>

          <div className="toolSection">
            <p className="toolSectionLabel">Tools</p>
            {tools.map((t) => (
              <button
                key={t.id}
                className={`editorBtn ${activeTool === t.id ? "active" : ""}`}
                onClick={() => setActiveTool(t.id)}
              >
                <i className={`fa-solid ${t.icon}`} />
                {t.label}
              </button>
            ))}
            <button
              className={`editorBtn ${showGrid ? "active" : ""}`}
              onClick={() => setShowGrid((v) => !v)}
            >
              <i className="fa-solid fa-border-all" /> Grid
            </button>
          </div>

          <div className="toolSection">
            <p className="toolSectionLabel">History</p>
            <button className="editorBtn" onClick={() => editorRef.current?.undo()}>
              <i className="fa-solid fa-rotate-left" /> Undo
            </button>
            <button className="editorBtn" onClick={() => editorRef.current?.redo()}>
              <i className="fa-solid fa-rotate-right" /> Redo
            </button>
          </div>

          <div className="toolSection">
            <p className="toolSectionLabel">Color</p>
            <label className="colorRow">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                onBlur={(e) => applyColor(e.target.value)}
              />
              <span>{color.toUpperCase()}</span>
            </label>
            {colorHistory.length > 0 && (
              <div className="colorHistory">
                {colorHistory.map((c) => (
                  <button
                    key={c}
                    className={`colorSwatch ${c === color ? "active" : ""}`}
                    style={{ background: c }}
                    onClick={() => applyColor(c)}
                    title={c.toUpperCase()}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="toolSection">
            <p className="toolSectionLabel">Brush Size — {brushSize}px</p>
            <input
              className="brushSlider"
              type="range"
              min={1}
              max={4}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </div>

          <div className="toolSection">
            <p className="toolSectionLabel">Skin</p>
            <button className="editorBtn" onClick={() => fileInputRef.current?.click()}>
              <i className="fa-solid fa-upload" /> Upload Skin
            </button>
            <button className="editorBtn" onClick={downloadSkin}>
              <i className="fa-solid fa-download" /> Download Skin
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          <div className="toolSection">
            <p className="toolSectionLabel">Skin Map</p>
            <div className="skinMapRow">
              <div className="skinMapItem">
                <p className="toolSectionLabel">Canvas</p>
                <SkinEditor2D
                  ref={editorRef}
                  skinUrl={skinUrl}
                  onSkinChange={setSkinUrl}
                  activeTool={activeTool}
                  color={color}
                  brushSize={brushSize}
                  showGrid={showGrid}
                  onColorPick={applyColor}
                />
              </div>
              <div className="skinMapItem">
                <p className="toolSectionLabel">Skin Guide</p>
                <div className="guidePanel">
                  <img
                    src="/images/SkinGuide.png"
                    alt="Minecraft skin UV map guide"
                    className="guideImage"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMySkins && session && (
        <MySkins
          userId={session.user?.email!}
          onClose={() => setShowMySkins(false)}
          onLoad={(url) => setSkinUrl(url)}
        />
      )}

      {showPublish && session && (
        <PublishModal
          skinUrl={skinUrl}
          userId={session.user?.email!}
          userName={session.user?.name!}
          userAvatar={session.user?.image!}
          onClose={() => setShowPublish(false)}
          onPublished={() => {}}
        />
      )}
    </div>
  );
}