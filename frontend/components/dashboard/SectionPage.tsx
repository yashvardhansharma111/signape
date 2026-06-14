import type { ReactNode } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface SectionPageProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export default function SectionPage({ title, subtitle, children }: SectionPageProps) {
  return (
    <div>
      <DashboardHeader title={title} subtitle={subtitle} />
      <main className="p-6">
        {children ?? (
          <div
            className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
          >
            <p className="text-sm text-gray-500">
              {title} content will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
