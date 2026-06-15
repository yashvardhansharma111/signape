"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.requestAccess({ email, displayName: displayName || undefined, phone: phone || undefined });
      router.push("/pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">Full name</label>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name" required
          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
          style={{ borderColor: "#E5E7EB", color: "#042B19" }}
          placeholder="Your full name" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          required autoComplete="email"
          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
          style={{ borderColor: "#E5E7EB", color: "#042B19" }}
          placeholder="you@company.com" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">Phone number</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#042B19]"
          style={{ borderColor: "#E5E7EB", color: "#042B19" }}
          placeholder="+971 50 000 0000" />
      </div>

      <button type="submit" disabled={loading}
        className="w-full rounded-lg px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#16a34a" }}>
        {loading ? "Sending request..." : "Request access"}
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
