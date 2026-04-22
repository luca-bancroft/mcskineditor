"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SkinViewer from "@/components/SkinViewer";

interface Skin {
  id: string;
  title: string;
  image_url: string;
  published: boolean;
  created_at: string;
}

interface MySkinsProps {
  userId: string;
  onClose: () => void;
  onLoad: (url: string) => void;
}

export default function MySkins({ userId, onClose, onLoad }: MySkinsProps) {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSkins() {
      const { data, error } = await supabase
        .from("skins")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) setSkins(data);
      setLoading(false);
    }
    fetchSkins();
  }, [userId]);

async function deleteSkin(id: string, imageUrl: string) {
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split("/skins/");
  const storagePath = pathParts[1];
  
  const { error: storageError } = await supabase.storage.from("skins").remove([storagePath]);
  console.log("Storage delete:", storageError ?? "success");
  
  const { error: dbError } = await supabase.from("skins").delete().eq("id", id);
  console.log("DB delete:", dbError ?? "success");
  
  if (!dbError) setSkins((prev) => prev.filter((s) => s.id !== id));
}

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Your Skins</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {loading ? (
          <div className="modal-empty">
            <p>Loading...</p>
          </div>
        ) : skins.length === 0 ? (
          <div className="modal-empty">
            <i className="fa-solid fa-box-open" />
            <p>No skins saved yet — publish one to get started!</p>
          </div>
        ) : (
          <div className="skins-grid">
            {skins.map((skin) => (
              <div key={skin.id} className="skin-card">
                <div className="skin-card-viewer">
                  <SkinViewer
                    skinUrl={skin.image_url}
                    showInner={true}
                    showOuter={true}
                    compact={true}
                  />
                </div>
                <div className="skin-card-info">
                  <p className="skin-card-title">{skin.title}</p>
                  <span className={`skin-card-badge ${skin.published ? "published" : "private"}`}>
                    {skin.published ? "Published" : "Private"}
                  </span>
                </div>
                <div className="skin-card-actions">
                  <button
                    className="skin-action-btn"
                    onClick={() => { onLoad(skin.image_url); onClose(); }}
                    title="Load into editor"
                  >
                    <i className="fa-solid fa-pen-to-square" />
                  </button>
                  <a
                    className="skin-action-btn"
                    href={skin.image_url}
                    download="skin.png"
                    title="Download"
                  >
                    <i className="fa-solid fa-download" />
                  </a>
                  <button
                    className="skin-action-btn danger"
                    onClick={() => deleteSkin(skin.id, skin.image_url)}
                    title="Delete"
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}