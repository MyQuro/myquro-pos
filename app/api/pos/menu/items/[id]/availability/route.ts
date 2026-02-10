import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItem } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { id } = await params; // <-- Add await here

  // Fetch current availability (org-scoped)
  const item = await db
    .select({
      isAvailable: menuItem.isAvailable,
    })
    .from(menuItem)
    .where(
      and(
        eq(menuItem.id, id),
        eq(menuItem.organizationId, ctx.organizationId)
      )
    )
    .limit(1);

  if (item.length === 0) {
    return NextResponse.json(
      { error: "Menu item not found" },
      { status: 404 }
    );
  }

  // Toggle availability
  await db
    .update(menuItem)
    .set({
      isAvailable: !item[0].isAvailable,
    })
    .where(
      and(
        eq(menuItem.id, id),
        eq(menuItem.organizationId, ctx.organizationId)
      )
    );

  return NextResponse.json({
    success: true,
    isAvailable: !item[0].isAvailable,
  });
}
