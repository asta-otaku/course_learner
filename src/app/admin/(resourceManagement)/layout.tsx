// Force dynamic rendering for all dashboard pages since they require authentication
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background">
      <main className="max-w-screen-2xl mx-auto w-full font-poppins px-4 md:px-8 lg:px-12">
        {children}
      </main>
    </div>
  );
}
