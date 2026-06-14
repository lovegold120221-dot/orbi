"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo-bg"><img src="/icon-eburon.svg" alt="Eburon AI" className="auth-brand-logo" /></div>
            <span>Orbit Meeting</span>
          </div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-desc">
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
          </p>
          <Link href="/auth/login" className="btn btn-dark auth-submit" style={{ textAlign: "center" }}>
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-bg"><img src="/icon-eburon.svg" alt="Eburon AI" className="auth-brand-logo" /></div>
          <span>Orbit Meeting</span>
        </div>
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-desc">Enter your email and we&apos;ll send you a reset link.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-dark auth-submit" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <div className="auth-links">
          <Link href="/auth/login" className="auth-link">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
