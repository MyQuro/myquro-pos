import { TwoLevelSidebar } from "@/components/ui/sidebar-component";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/require-active-organization";

export default async function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // 2. Fetch organization + status
  await requireActiveOrganization(session.user.id);

  // 3. Render POS UI
  return (
    <div className="bg-black min-h-screen flex items-center justify-center p-4">
      <div className="flex h-[800px] w-full max-w-[1700px] gap-4">
        <TwoLevelSidebar />
        <main className="flex-1 bg-[#0a0a0a] rounded-2xl overflow-y-auto border border-neutral-800 shadow-2xl p-8 text-neutral-50 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
