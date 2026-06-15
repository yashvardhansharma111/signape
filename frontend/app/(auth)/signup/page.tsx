import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "#042B19" }}>
        Request access
      </h1>
      <p className="mb-6 text-sm text-gray-500">Submit your details and wait for admin approval</p>
      <SignupForm />
    </>
  );
}
