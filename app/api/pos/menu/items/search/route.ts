import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItem, menuCategory } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { and, eq, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code || code.trim().length < 1) {
    return NextResponse.json([], { status: 200 });
  }

  const items = await db
    .select({
      id: menuItem.id,
      name: menuItem.name,
      itemCode: menuItem.itemCode,
      price: menuItem.price,
      isVeg: menuItem.isVeg,
      gstRate: menuCategory.gstRate,
    })
    .from(menuItem)
    .innerJoin(menuCategory, eq(menuItem.categoryId, menuCategory.id))
    .where(
      and(
        eq(menuItem.organizationId, ctx.organizationId),
        eq(menuItem.isAvailable, true),
        ilike(menuItem.itemCode, `${code}%`)
      )
    )
    .limit(10); // safety cap

  return NextResponse.json(items);
}
