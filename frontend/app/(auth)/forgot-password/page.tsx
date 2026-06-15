"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "#F0FDF4" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold" style={{ color: "#042B19" }}>Check your email</h2>
        <p className="mb-6 text-sm text-gray-500">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. Check your inbox.
        </p>
        <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: "#16a34a" }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "#042B19" }}>Forgot password?</h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: "#B91C1C" }}>
            {error}
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email"
            className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
            style={{ borderColor: "#E5E7EB", color: "#042B19" }}
            placeholder="you@company.com" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#16a34a" }}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="font-medium hover:underline" style={{ color: "#16a34a" }}>
            Back to sign in
          </Link>
        </p>
      </form>
    </>
  );
}
