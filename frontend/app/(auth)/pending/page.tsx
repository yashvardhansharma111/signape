import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: "#F0FDF4" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "#042B19" }}>Request submitted</h1>
      <p className="mb-6 text-sm text-gray-500 leading-relaxed">
        Your access request has been received. The administrator will review it and send your login credentials to your email once approved.
      </p>
      <div className="rounded-xl border p-4 text-left text-sm" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
        <p className="font-medium text-gray-700 mb-1">What happens next?</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-500">
          <li>Admin reviews your request</li>
          <li>You receive a welcome email with your temporary password</li>
          <li>Login and set a new personal password</li>
        </ol>
      </div>
      <p className="mt-6 text-sm text-gray-500">
        Already received your credentials?{" "}
        <Link href="/login" className="font-medium hover:underline" style={{ color: "#16a34a" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
