import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItem, menuCategory } from "@/db/schema";
import { requirePosContext } from "../../_utils";
import { eq } from "drizzle-orm";

export async function GET() {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const rows = await db
    .select({
      categoryId: menuCategory.id,
      categoryName: menuCategory.name,
      itemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      isVeg: menuItem.isVeg,
      isAvailable: menuItem.isAvailable,
      itemCode: menuItem.itemCode,
    })
    .from(menuCategory)
    .leftJoin(
      menuItem,
      eq(menuItem.categoryId, menuCategory.id)
    )
    .where(eq(menuCategory.organizationId, ctx.organizationId));

  // group manually
  const grouped: any[] = [];
  const map = new Map();

  for (const row of rows) {
    if (!map.has(row.categoryId)) {
      const group = {
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        items: [],
      };
      map.set(row.categoryId, group);
      grouped.push(group);
    }

    if (row.itemId) {
      map.get(row.categoryId).items.push({
        id: row.itemId,
        name: row.name,
        price: row.price,
        isVeg: row.isVeg,
        isAvailable: row.isAvailable,
        itemCode: row.itemCode,
      });
    }
  }

  return NextResponse.json(grouped);
}

export async function POST(req: Request) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const body = await req.json();
  const { name, price, categoryId, isVeg = true, itemCode } = body;

  if (!name || !price || !categoryId || !itemCode) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  await db.insert(menuItem).values({
    id: crypto.randomUUID(),
    organizationId: ctx.organizationId,
    categoryId,
    name,
    price,
    isVeg,
    itemCode,
  });

  return NextResponse.json({ success: true });
}
