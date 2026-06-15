"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const token         = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm]         = useState("");
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await api.resetPassword({ token, newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-500">Invalid reset link.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-medium hover:underline" style={{ color: "#16a34a" }}>
          Request a new one
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold" style={{ color: "#042B19" }}>Password reset!</h2>
        <p className="text-sm text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "#042B19" }}>Set new password</h1>
      <p className="mb-6 text-sm text-gray-500">Enter and confirm your new password.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: "#B91C1C" }}>
            {error}
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            required minLength={6}
            className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
            style={{ borderColor: "#E5E7EB", color: "#042B19" }}
            placeholder="At least 6 characters" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600">Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
            style={{ borderColor: "#E5E7EB", color: "#042B19" }}
            placeholder="Confirm new password" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#16a34a" }}>
          {loading ? "Saving..." : "Reset password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
