import { NextResponse } from "next/server";
import { db } from "@/db";
import { purchases, purchaseItems, inventory } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: Request) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { vendorId, referenceNumber, notes, items } = await req.json();

  if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const purchaseId = crypto.randomUUID();
    let totalCost = 0;

    await db.transaction(async (tx) => {
      // 1. Calculate total and prepare items
      const processedItems = [];
      
      for (const item of items) {
        const lineTotal = (item.quantity || 0) * (item.unitCost || 0);
        totalCost += lineTotal;

        // Check if inventory record already exists
        let invId: string;
        const existingInv = await tx
          .select()
          .from(inventory)
          .where(
            and(
              eq(inventory.organizationId, ctx.organizationId),
              eq(inventory.menuItemId, item.menuItemId)
            )
          )
          .limit(1);

        if (existingInv.length > 0) {
          invId = existingInv[0].id;
          // Increment stock
          await tx
            .update(inventory)
            .set({
              currentStock: sql`${inventory.currentStock} + ${item.quantity}`,
              lastRestockedAt: new Date(),
              lastUnitCost: item.unitCost,
            })
            .where(eq(inventory.id, invId));
        } else {
          invId = crypto.randomUUID();
          // Create new inventory record
          await tx.insert(inventory).values({
            id: invId,
            organizationId: ctx.organizationId,
            menuItemId: item.menuItemId,
            currentStock: item.quantity,
            lowStockThreshold: 10,
            lastRestockedAt: new Date(),
            lastUnitCost: item.unitCost,
          });
        }

        processedItems.push({
          id: crypto.randomUUID(),
          purchaseId,
          inventoryId: invId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: lineTotal,
        });
      }

      // 2. Insert Purchase Header
      await tx.insert(purchases).values({
        id: purchaseId,
        organizationId: ctx.organizationId,
        vendorId,
        totalCost,
        referenceNumber,
        notes,
        status: "Completed",
      });

      // 3. Insert Purchase Items
      await tx.insert(purchaseItems).values(processedItems);
    });

    return NextResponse.json({ success: true, purchaseId }, { status: 201 });
  } catch (err) {
    console.error("POST purchase error", err);
    return NextResponse.json({ error: "Failed to record purchase" }, { status: 500 });
  }
}
