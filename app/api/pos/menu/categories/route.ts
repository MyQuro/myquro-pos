import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuCategory } from "@/db/schema";
import { requirePosContext } from "../../_utils";
import { eq } from "drizzle-orm";

export async function GET() {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const categories = await db
    .select({
      id: menuCategory.id,
      name: menuCategory.name,
      sortOrder: menuCategory.sortOrder,
    })
    .from(menuCategory)
    .where(eq(menuCategory.organizationId, ctx.organizationId))
    .orderBy(menuCategory.sortOrder);

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const body = await req.json();
  const { name, sortOrder = 0 } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Invalid category name" },
      { status: 400 }
    );
  }

  await db.insert(menuCategory).values({
    id: crypto.randomUUID(),
    organizationId: ctx.organizationId,
    name,
    sortOrder,
  });

  return NextResponse.json({ success: true });
}
