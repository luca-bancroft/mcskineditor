"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();
  const pathname = usePathname();
  const isGallery = pathname === "/gallery";
  const isProfile = pathname.startsWith("/profile");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    supabase
      .from("profiles")
      .select("user_name")
      .eq("id", session.user.email)
      .single()
      .then(({ data }) => {
        if (data?.user_name) setDisplayName(data.user_name);
        else setDisplayName(session.user?.name ?? null);
      });
  }, [session?.user?.email]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setEditingName(false);
        setSaveError("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function saveUsername() {
    if (!newName.trim() || !session?.user?.email) return;
    setSaving(true);
    setSaveError("");

    const email = session.user.email;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: email,
        user_name: newName.trim(),
        user_avatar: session.user.image ?? "",
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profile error:", profileError);
      setSaveError("Failed to save. Try again.");
      setSaving(false);
      return;
    }

    await supabase
      .from("skins")
      .update({ user_name: newName.trim() })
      .eq("user_id", email);

    setDisplayName(newName.trim());
    setSaving(false);
    setEditingName(false);
    setDropdownOpen(false);
    router.refresh();
  }

  const shownName = displayName ?? session?.user?.name ?? "";

  return (
    <div className="navbar">
      <p className="navbar-title" style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
        MC Skin Editor
      </p>

      <div className="nav-links">
        {loading ? (
          <span className="nav-loading">...</span>
        ) : session ? (
          <div className="nav-user">
            {!isGallery && !isProfile && (
              <button className="nav-page-btn" onClick={() => router.push("/gallery")}>
                <i className="fa-solid fa-images" /> Gallery
              </button>
            )}
            {(isGallery || isProfile) && (
              <button className="nav-page-btn" onClick={() => router.push("/")}>
                <i className="fa-solid fa-house" /> Home
              </button>
            )}

            <div className="nav-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="nav-user-btn"
                onClick={() => { setDropdownOpen((v) => !v); setEditingName(false); setSaveError(""); }}
              >
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt="avatar"
                    width={28}
                    height={28}
                    className="nav-avatar"
                  />
                )}
                <span className="nav-username">{shownName}</span>
                <i className={`fa-solid fa-chevron-${dropdownOpen ? "up" : "down"} nav-chevron`} />
              </button>

              {dropdownOpen && (
                <div className="nav-dropdown" onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    className="nav-dropdown-item"
                    onClick={() => {
                      router.push(`/profile/${session.user?.email?.replace(/[^a-zA-Z0-9]/g, "_")}`);
                      setDropdownOpen(false);
                    }}
                  >
                    <i className="fa-solid fa-user" /> Profile
                  </button>

                  {editingName ? (
                    <div className="nav-dropdown-edit">
                      <input
                        className="nav-name-input"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="New username"
                        maxLength={30}
                        autoFocus
                      />
                      {saveError && (
                        <p style={{ color: "#ff5555", fontSize: "0.7rem", margin: 0 }}>{saveError}</p>
                      )}
                      <button className="nav-name-save" onClick={saveUsername} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="nav-dropdown-item"
                      onClick={() => { setEditingName(true); setNewName(shownName); }}
                    >
                      <i className="fa-solid fa-pen" /> Change username
                    </button>
                  )}

                  <div className="nav-dropdown-divider" />

                  <button
                    className="nav-dropdown-item danger"
                    onClick={() => signOut()}
                  >
                    <i className="fa-solid fa-right-from-bracket" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button className="nav-auth-btn" onClick={() => router.push("/signin")}>
            <i className="fa-solid fa-right-to-bracket" /> Sign in
          </button>
        )}
      </div>
    </div>
  );
}