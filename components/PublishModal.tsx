"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface PublishModalProps {
  skinUrl: string;
  userId: string;
  userName: string;
  userAvatar: string;
  onClose: () => void;
  onPublished: () => void;
}

export default function PublishModal({
  skinUrl,
  userId,
  userName,
  userAvatar,
  onClose,
  onPublished,
}: PublishModalProps) {
  const [title, setTitle] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  async function handlePublish() {
    if (!title.trim()) { setError("Please enter a title."); return; }
    setPublishing(true);
    setError("");

    try {
      let blob: Blob;

      if (skinUrl.startsWith("blob:") || skinUrl.startsWith("/")) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load skin image"));
          img.src = skinUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, 64, 64);
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to convert canvas to blob"));
          }, "image/png");
        });
      } else {
        const res = await fetch(skinUrl);
        if (!res.ok) throw new Error(`Failed to fetch skin: ${res.status}`);
        blob = await res.blob();
      }

      const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${sanitizedUserId}_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("skins")
        .upload(fileName, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("skins")
        .getPublicUrl(fileName);

      // Fetch current display name from profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_name")
        .eq("id", userId)
        .single();

      const displayName = profileData?.user_name ?? userName;

      const { error: insertError } = await supabase.from("skins").insert({
        user_id: userId,
        user_id_sanitized: sanitizedUserId,
        user_name: displayName,
        user_avatar: userAvatar,
        title: title.trim(),
        image_url: publicUrl,
        published: true,
      });

      if (insertError) throw insertError;

      onPublished();
      onClose();
    } catch (e: any) {
      console.error("Publish error:", e);
      setError(`Error: ${e.message || JSON.stringify(e)}`);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Publish Skin</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="publish-form">
          <label className="publish-label">
            <span>Skin title</span>
            <input
              type="text"
              className="publish-input"
              placeholder="e.g. Cool Steve"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={40}
            />
          </label>
          {error && <p className="publish-error">{error}</p>}
          <button
            className="publish-btn"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Publishing...</>
            ) : (
              <><i className="fa-solid fa-upload" /> Publish</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}