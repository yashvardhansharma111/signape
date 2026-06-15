"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearFirstTimeLogin, getAccessToken } from "@/lib/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirm, setConfirm]                 = useState("");
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState("");
  const [loading, setLoading]                 = useState(false);

  const isFirstTime = typeof window !== "undefined" &&
    document.cookie.includes("signape_ftl=1");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      clearFirstTimeLogin();
      setSuccess("Password changed successfully. Redirecting...");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "#042B19" }}>
        {isFirstTime ? "Set your password" : "Change password"}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        {isFirstTime
          ? "This is your first login. Please set a new personal password."
          : "Enter your current password to set a new one."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: "#B91C1C" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: "#86EFAC", backgroundColor: "#F0FDF4", color: "#15803d" }}>
            {success}
          </div>
        )}

        {!isFirstTime && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              required={!isFirstTime} autoComplete="current-password"
              className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
              style={{ borderColor: "#E5E7EB", color: "#042B19" }}
              placeholder="Current password" />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            required minLength={6} autoComplete="new-password"
            className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
            style={{ borderColor: "#E5E7EB", color: "#042B19" }}
            placeholder="At least 6 characters" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            required autoComplete="new-password"
            className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
            style={{ borderColor: "#E5E7EB", color: "#042B19" }}
            placeholder="Confirm new password" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#16a34a" }}>
          {loading ? "Saving..." : "Save new password"}
        </button>
      </form>
    </>
  );
}
