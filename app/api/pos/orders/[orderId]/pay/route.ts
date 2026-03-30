import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderPayment, orderItem, inventory, inventoryLogs, customers } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { orderId } = await params;
  const { payments } = await req.json();

  if (!Array.isArray(payments) || payments.length === 0) {
    return NextResponse.json(
      { error: "Must provide at least one payment method" },
      { status: 400 }
    );
  }

  /* ---------- Fetch order ---------- */

  const existing = await db
    .select()
    .from(order)
    .where(
      and(
        eq(order.id, orderId),
        eq(order.organizationId, ctx.organizationId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  const ord = existing[0];

  if (ord.status !== "BILLED") {
    return NextResponse.json(
      { error: "Only BILLED orders can be paid" },
      { status: 400 }
    );
  }

  if (!ord.total || ord.total <= 0) {
    return NextResponse.json(
      { error: "Invalid order total" },
      { status: 400 }
    );
  }

  let totalPaid = 0;
  for (const p of payments) {
    if (!["CASH", "UPI", "CARD"].includes(p.method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    totalPaid += p.amount;
  }

  if (totalPaid !== ord.total) {
    return NextResponse.json({ error: "Payment amount does not match order total" }, { status: 400 });
  }

  /* ---------- Insert payments ---------- */

  try {
    for (const p of payments) {
      await db.insert(orderPayment).values({
        id: crypto.randomUUID(),
        orderId: ord.id,
        paymentMethod: p.method,
        amount: p.amount,
      });
    }
  } catch (err) {
    console.error("Payment insert err", err)
    return NextResponse.json(
      { error: "Failed to record payments" },
      { status: 500 }
    );
  }

  /* ---------- Update order → PAID ---------- */

  await db
    .update(order)
    .set({
      status: "PAID",
      paidAt: new Date(),
    })
    .where(
      and(
        eq(order.id, ord.id),
        eq(order.organizationId, ctx.organizationId),
        eq(order.status, "BILLED")
      )
    );

  /* ---------- Auto-deduct Inventory ---------- */
  try {
    const items = await db.select().from(orderItem).where(eq(orderItem.orderId, ord.id));

    for (const item of items) {
      const invData = await db
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.organizationId, ctx.organizationId),
            eq(inventory.menuItemId, item.menuItemId!)
          )
        )
        .limit(1);

      if (invData.length > 0) {
        const inv = invData[0];
        const newStock = inv.currentStock - item.quantity;

        // Deduct stock
        await db
          .update(inventory)
          .set({ currentStock: newStock })
          .where(eq(inventory.id, inv.id));

        // Log deduction
        await db.insert(inventoryLogs).values({
          id: crypto.randomUUID(),
          organizationId: ctx.organizationId,
          inventoryId: inv.id,
          changeQuantity: -item.quantity,
          reason: "Sale",
          referenceId: ord.id,
        });
      }
    }
  } catch (err) {
    console.error("Inventory deduction err:", err);
    // Non-blocking error, so allow payment success
  }

  /* ---------- Loyalty Points ---------- */

  if (ord.customerId) {
    try {
      const rupees = ord.total / 100;
      const points = Math.floor(rupees / 100); // 1 pt per ₹100
      
      await db
        .update(customers)
        .set({
          loyaltyPoints: sql`${customers.loyaltyPoints} + ${points}`,
          totalSpent: sql`${customers.totalSpent} + ${ord.total}`,
        })
        .where(eq(customers.id, ord.customerId));
    } catch (loyaltyErr) {
      console.error("Loyalty update failed:", loyaltyErr);
    }
  }

  return NextResponse.json({ success: true });
}
