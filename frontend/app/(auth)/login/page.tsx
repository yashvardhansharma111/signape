import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "#042B19" }}>
        Welcome back
      </h1>
      <p className="mb-6 text-sm text-gray-500">Sign in to your AIM4IT account</p>
      <LoginForm />
    </>
  );
}
