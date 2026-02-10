import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { systemAdmin } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const admin = await db
    .select()
    .from(systemAdmin)
    .where(eq(systemAdmin.userId, session.user.id))
    .limit(1);

  if (admin.length === 0) {
    redirect("/login");
  }

  return session.user;
}
