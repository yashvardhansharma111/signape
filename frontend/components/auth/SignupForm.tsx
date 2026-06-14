"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { persistAuth } from "@/lib/auth";

export default function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.signup({
        email,
        password,
        displayName: displayName || undefined,
        organization: organization || undefined,
      });
      persistAuth(response);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: "#B91C1C" }}
        >
          {error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">Display name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
          style={{ borderColor: "#E5E7EB", color: "#042B19" }}
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
          style={{ borderColor: "#E5E7EB", color: "#042B19" }}
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">Organization</label>
        <input
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          autoComplete="organization"
          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
          style={{ borderColor: "#E5E7EB", color: "#042B19" }}
          placeholder="Company or team name"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
          style={{ borderColor: "#E5E7EB", color: "#042B19" }}
          placeholder="At least 6 characters"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#16a34a" }}
      >
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium hover:underline" style={{ color: "#16a34a" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
