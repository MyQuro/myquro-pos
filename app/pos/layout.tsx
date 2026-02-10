import Link from "next/link";
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
    <div className="min-h-screen flex">
      {/* POS Navbar */}
      <aside className="w-64 border-r">
        <div className="p-4 font-semibold">POS</div>
        <nav className="flex flex-col p-2 space-y-1">
          <Link href="/pos/menu" className="px-3 py-2 rounded hover:bg-gray-100">
            Menu Management
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
