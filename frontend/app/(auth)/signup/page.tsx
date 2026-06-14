import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "#042B19" }}>
        Create your account
      </h1>
      <p className="mb-6 text-sm text-gray-500">Get started with Signape in seconds</p>
      <SignupForm />
    </>
  );
}
