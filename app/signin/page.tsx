"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <i className="fa-solid fa-cube" />
          <span>MC Skin Editor</span>
        </div>

        <div className="auth-toggle">
          <button
            className={`auth-toggle-btn ${mode === "signin" ? "active" : ""}`}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <div className="auth-heading">
          {mode === "signin" ? (
            <>
              <h1>Welcome back</h1>
              <p>Sign in to continue editing your skins</p>
            </>
          ) : (
            <>
              <h1>Create an account</h1>
              <p>Sign up to save and share your skins</p>
            </>
          )}
        </div>

        <div className="auth-providers">
          <button
            className="auth-provider-btn"
            onClick={() => signIn("github", { callbackUrl })}
          >
            <i className="fa-brands fa-github" />
            {mode === "signin" ? "Sign in" : "Sign up"} with GitHub
          </button>
          <button
            className="auth-provider-btn"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <i className="fa-brands fa-google" />
            {mode === "signin" ? "Sign in" : "Sign up"} with Google
          </button>
        </div>

        <p className="auth-footer">
          {mode === "signin" ? (
            <>Don't have an account?{" "}
              <button className="auth-link" onClick={() => setMode("signup")}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button className="auth-link" onClick={() => setMode("signin")}>Sign in</button>
            </>
          )}
        </p>

      </div>
    </div>
  );
}