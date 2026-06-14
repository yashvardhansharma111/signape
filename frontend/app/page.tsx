import Link from "next/link";

export default function Home() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#042B19" }}
    >
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ backgroundColor: "#16a34a" }}
          >
            S
          </div>
        </div>
        <h1 className="mb-3 text-4xl font-bold text-white">Signape</h1>
        <p className="mb-8 max-w-md text-white/70">
          Digital signage management for screens, media, playlists, and live presentations.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg px-8 py-3 font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#16a34a" }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border px-8 py-3 font-semibold text-white transition hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
