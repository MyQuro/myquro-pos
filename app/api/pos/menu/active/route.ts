import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItem, menuCategory } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

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
      itemCode: menuItem.itemCode,
      gstRate: menuCategory.gstRate,
    })
    .from(menuCategory)
    .innerJoin(
      menuItem,
      and(
        eq(menuItem.categoryId, menuCategory.id),
        eq(menuItem.isAvailable, true)
      )
    )
    .where(eq(menuCategory.organizationId, ctx.organizationId))
    .orderBy(menuCategory.sortOrder);

  // group items by category
  const grouped: {
    categoryId: string;
    categoryName: string;
    items: {
      id: string;
      name: string;
      itemCode: string;
      price: number;
      isVeg: boolean;
      gstRate: number;
    }[];
  }[] = [];

  const map = new Map<string, any>();

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

    map.get(row.categoryId).items.push({
      id: row.itemId,
      name: row.name,
      itemCode: row.itemCode,
      price: row.price,
      isVeg: row.isVeg,
      gstRate: row.gstRate,
    });
  }

  return NextResponse.json(grouped, {
    headers: {
      /**
       * Cache per user/org, short TTL
       * Safe because org is derived server-side
       */
      "Cache-Control": "private, max-age=60",
    },
  });
}
