import { NextResponse } from "next/server";
import { db } from "@/db";
import { inventory, menuItem } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  try {
    // Join inventory with menuItem to get names
    const list = await db
      .select({
        id: inventory.id,
        menuItemId: inventory.menuItemId,
        itemName: menuItem.name,
        category: menuItem.categoryId,
        price: menuItem.price,
        currentStock: inventory.currentStock,
        lowStockThreshold: inventory.lowStockThreshold,
        lastRestockedAt: inventory.lastRestockedAt,
        lastUnitCost: inventory.lastUnitCost,
      })
      .from(inventory)
      .innerJoin(menuItem, eq(inventory.menuItemId, menuItem.id))
      .where(eq(inventory.organizationId, ctx.organizationId));

    return NextResponse.json(list);
  } catch (err) {
    console.error("GET inventory error", err);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { menuItemId, initialStock, threshold } = await req.json();

  if (!menuItemId) {
    return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 });
  }

  try {
    // Check if already exists
    const existing = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.organizationId, ctx.organizationId),
          eq(inventory.menuItemId, menuItemId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Inventory tracking already exists for this item" }, { status: 400 });
    }

    const [newInv] = await db
      .insert(inventory)
      .values({
        id: crypto.randomUUID(),
        organizationId: ctx.organizationId,
        menuItemId,
        currentStock: initialStock || 0,
        lowStockThreshold: threshold || 10,
        lastRestockedAt: initialStock > 0 ? new Date() : null,
      })
      .returning();

    return NextResponse.json(newInv, { status: 201 });
  } catch (err) {
    console.error("POST inventory error", err);
    return NextResponse.json({ error: "Failed to setup inventory item" }, { status: 500 });
  }
}
