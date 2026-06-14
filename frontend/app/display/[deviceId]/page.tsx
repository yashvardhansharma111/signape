import TvPlayer from "@/components/display/TvPlayer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface DisplayPageProps {
  params: Promise<{ deviceId: string }>;
  searchParams: Promise<{ token?: string }>;
}

async function getDisplayState(deviceId: string, token: string) {
  const response = await fetch(
    `${API_BASE}/api/display/${deviceId}?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );

  if (!response.ok) return null;
  return response.json();
}

export default async function DisplayPage({ params, searchParams }: DisplayPageProps) {
  const { deviceId } = await params;
  const { token = "" } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Missing device token. Open this page from the Screens dashboard.</p>
      </div>
    );
  }

  const state = await getDisplayState(deviceId, token);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Invalid device link or credentials.</p>
      </div>
    );
  }

  return (
    <TvPlayer
      deviceId={deviceId}
      deviceToken={token}
      deviceName={state.device.name}
      initialPlayback={state.playback}
    />
  );
}
