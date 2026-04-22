"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import SkinViewer from "@/components/SkinViewer";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Skin {
  id: string;
  title: string;
  image_url: string;
  user_name: string;
  user_avatar: string;
  user_id: string;
  created_at: string;
  likes_count: number;
}

export default function Gallery() {
  const { data: session } = useSession();
  const router = useRouter();
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSkins();
    window.addEventListener("focus", fetchSkins);
    return () => window.removeEventListener("focus", fetchSkins);
  }, []);

  useEffect(() => {
    if (session?.user?.email) fetchLikes();
  }, [session]);

  async function fetchSkins() {
  const { data, error } = await supabase
    .from("skins")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (!error && data) {
    const userIds = [...new Set(data.map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_name")
      .in("id", userIds);

    const nameMap: Record<string, string> = {};
    profiles?.forEach((p) => { nameMap[p.id] = p.user_name; });

    const merged = data.map((s) => ({
      ...s,
      user_name: nameMap[s.user_id] ?? s.user_name,
    }));

    setSkins(merged);
  }
  setLoading(false);
}

  async function fetchLikes() {
    const { data } = await supabase
      .from("likes")
      .select("skin_id")
      .eq("user_id", session!.user!.email!);
    if (data) setLikedIds(new Set(data.map((l) => l.skin_id)));
  }

  async function toggleLike(skinId: string) {
    if (!session) { router.push("/signin"); return; }
    const userId = session.user!.email!;
    const liked = likedIds.has(skinId);

    if (liked) {
      await supabase.from("likes").delete().eq("user_id", userId).eq("skin_id", skinId);
      await supabase.rpc("decrement_likes", { skin_id: skinId });
      setLikedIds((prev) => { const n = new Set(prev); n.delete(skinId); return n; });
      setSkins((prev) => prev.map((s) => s.id === skinId ? { ...s, likes_count: Math.max(s.likes_count - 1, 0) } : s));
    } else {
      await supabase.from("likes").insert({ user_id: userId, skin_id: skinId });
      await supabase.rpc("increment_likes", { skin_id: skinId });
      setLikedIds((prev) => new Set(prev).add(skinId));
      setSkins((prev) => prev.map((s) => s.id === skinId ? { ...s, likes_count: s.likes_count + 1 } : s));
    }
  }

  const filtered = skins.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.user_name.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <Navbar />
      <div className="gallery-page">
        <div className="gallery-header">
          <div>
            <h2>Community Skins</h2>
            <p>Skins published by the community</p>
          </div>
          <input
            className="gallery-search"
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="gallery-empty"><p>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="gallery-empty">
            <i className="fa-solid fa-box-open" />
            <p>{search ? "No skins match your search." : "No skins published yet — be the first!"}</p>
          </div>
        ) : (
          <div className="skins-grid">
            {filtered.map((skin) => (
              <div key={skin.id} className="skin-card">
                <div className="skin-card-viewer">
                  <SkinViewer skinUrl={skin.image_url} showInner={true} showOuter={true} compact={true} />
                </div>
                <div className="skin-card-info">
                  <p className="skin-card-title">{skin.title}</p>
                  <div
                    className="skin-card-author"
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/profile/${skin.user_id.replace(/[^a-zA-Z0-9]/g, "_")}`)}>
                    {skin.user_avatar && (
                      <Image src={skin.user_avatar} alt={skin.user_name} width={16} height={16} className="skin-author-avatar" />
                    )}
                    <span>{skin.user_name}</span>
                  </div>
                </div>
                <div className="skin-card-actions">
                  <button
                    className={`skin-action-btn ${likedIds.has(skin.id) ? "liked" : ""}`}
                    onClick={() => toggleLike(skin.id)}
                    title="Like"
                  >
                    <i className={`fa-${likedIds.has(skin.id) ? "solid" : "regular"} fa-heart`} />
                    {skin.likes_count > 0 && <span className="like-count">{skin.likes_count}</span>}
                  </button>
                  <button
                    className="skin-action-btn"
                    onClick={() => router.push(`/?skin=${encodeURIComponent(skin.image_url)}`)}
                    title="Load into editor"
                  >
                    <i className="fa-solid fa-pen-to-square" />
                  </button>
                  <a className="skin-action-btn" href={skin.image_url} download="skin.png" title="Download">
                    <i className="fa-solid fa-download" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}