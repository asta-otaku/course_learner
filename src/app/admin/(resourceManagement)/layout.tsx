import { TopNavigation } from "@/components/resourceManagemement/navigation/top-nav";

// Force dynamic rendering for all dashboard pages since they require authentication
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background">
      <TopNavigation />
      <main className="max-w-screen-2xl mx-auto w-full px-4">{children}</main>
    </div>
  );
}
