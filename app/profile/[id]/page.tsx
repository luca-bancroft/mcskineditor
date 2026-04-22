"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import SkinViewer from "@/components/SkinViewer";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

interface Skin {
  id: string;
  title: string;
  image_url: string;
  likes_count: number;
  created_at: string;
  user_id: string;
}

interface ProfileUser {
  user_name: string;
  user_avatar: string;
  user_id: string;
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [skins, setSkins] = useState<Skin[]>([]);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const sanitizedSessionId = session?.user?.email?.replace(/[^a-zA-Z0-9]/g, "_");
  const isOwnProfile = sanitizedSessionId === id;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  async function fetchProfile() {
    setLoading(true);

    const { data: skinsData } = await supabase
      .from("skins")
      .select("*")
      .eq("published", true)
      .eq("user_id_sanitized", id)
      .order("created_at", { ascending: false });

    let profileRow = null;
    if (skinsData && skinsData.length > 0) {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", skinsData[0].user_id)
        .single();
      profileRow = p;
    }

    if (skinsData && skinsData.length > 0) {
      setProfile({
        user_name: profileRow?.user_name ?? skinsData[0].user_name,
        user_avatar: profileRow?.user_avatar ?? skinsData[0].user_avatar,
        user_id: skinsData[0].user_id,
      });
      setSkins(skinsData);
    } else {
      setProfile(null);
      setSkins([]);
    }
    setLoading(false);
  }

  async function saveUsername() {
    if (!newName.trim() || !profile?.user_id) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .upsert({
        id: profile.user_id,
        user_name: newName.trim(),
        user_avatar: profile.user_avatar,
        updated_at: new Date().toISOString(),
      });

    await supabase
      .from("skins")
      .update({ user_name: newName.trim() })
      .eq("user_id", profile.user_id);

    setProfile((prev) => prev ? { ...prev, user_name: newName.trim() } : prev);
    setSkins((prev) => prev.map((s) => ({ ...s, user_name: newName.trim() })));
    setSaving(false);
    setEditingName(false);
  }

  return (
    <div>
      <Navbar />
      <div className="gallery-page">
        {loading ? (
          <div className="gallery-empty"><p>Loading...</p></div>
        ) : !profile ? (
          <div className="gallery-empty">
            <i className="fa-solid fa-user-slash" />
            <p>Profile not found.</p>
          </div>
        ) : (
          <>
            <div className="profile-header">
              {profile.user_avatar && (
                <Image
                  src={profile.user_avatar}
                  alt={profile.user_name}
                  width={64}
                  height={64}
                  className="profile-avatar"
                />
              )}
              <div className="profile-info">
                {editingName ? (
                  <div className="profile-name-edit">
                    <input
                      className="publish-input"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="New username"
                      maxLength={30}
                      autoFocus
                    />
                    <button className="publish-btn" onClick={saveUsername} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button className="nav-page-btn" onClick={() => setEditingName(false)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="profile-name-row">
                    <h2>{profile.user_name}</h2>
                    {isOwnProfile && (
                      <button
                        className="nav-page-btn"
                        onClick={() => { setEditingName(true); setNewName(profile.user_name); }}
                      >
                        <i className="fa-solid fa-pen" /> Edit
                      </button>
                    )}
                  </div>
                )}
                <p>{skins.length} published skin{skins.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {skins.length === 0 ? (
              <div className="gallery-empty">
                <i className="fa-solid fa-box-open" />
                <p>No published skins yet.</p>
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
                      <div className="skin-card-author">
                        <i className="fa-solid fa-heart" style={{ fontSize: "0.65rem", color: "#888" }} />
                        <span>{skin.likes_count ?? 0}</span>
                      </div>
                    </div>
                    <div className="skin-card-actions">
                      <button
                        className="skin-action-btn"
                        onClick={() => router.push(`/?skin=${encodeURIComponent(skin.image_url)}`)}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}