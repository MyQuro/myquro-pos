import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { requireActiveOrganization } from "@/lib/require-active-organization";

export async function requirePosContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { organizationId } = await requireActiveOrganization(session.user.id);

  return { userId: session.user.id, organizationId };
}
