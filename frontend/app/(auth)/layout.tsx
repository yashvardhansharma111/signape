import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#042B19" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white"
              style={{ backgroundColor: "#16a34a" }}
            >
              S
            </div>
            <span className="text-2xl font-bold text-white">Signape</span>
          </Link>
        </div>

        <div
          className="rounded-3xl border bg-white p-8 shadow-sm"
          style={{ borderColor: "#E5E7EB" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
