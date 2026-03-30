import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem, menuItem, menuCategory, customers } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function POST(
  _req: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { orderId } = params;

  /* ---------- Fetch Order ---------- */

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

  const o = existing[0];

  if (o.orderType === "TAKEAWAY") {
    return NextResponse.json(
      { error: "Takeaway orders are billed at creation" },
      { status: 400 }
    );
  }

  if (o.status !== "OPEN") {
    return NextResponse.json(
      { error: "Only OPEN orders can be billed" },
      { status: 400 }
    );
  }

  /* ---------- Fetch Items & Rates ---------- */

  const items = await db
    .select({
      lineTotal: orderItem.lineTotal,
      gstRate: menuCategory.gstRate,
    })
    .from(orderItem)
    .innerJoin(menuItem, eq(orderItem.menuItemId, menuItem.id))
    .innerJoin(menuCategory, eq(menuItem.categoryId, menuCategory.id))
    .where(eq(orderItem.orderId, orderId));

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Cannot bill empty order" },
      { status: 400 }
    );
  }

  /* ---------- Calculate Totals ---------- */

  let discountRate = 0;
  if (o.customerId) {
    const [c] = await db
      .select({ segment: customers.segment })
      .from(customers)
      .where(eq(customers.id, o.customerId));
      
    if (c?.segment === "Wholesale") discountRate = 0.10;
    else if (c?.segment === "Loyal") discountRate = 0.05;
  }

  let subtotal = 0;
  let tax = 0;

  for (const i of items) {
    const line = Number(i.lineTotal) || 0;
    subtotal += line;

    const discountedLineTotal = line * (1 - discountRate);
    tax += discountedLineTotal * (i.gstRate / 100);
  }

  const discountAmount = Math.round(subtotal * discountRate);
  tax = Math.round(tax);
  const total = subtotal - discountAmount + tax;

  const now = new Date();

  /* ---------- Update Order → BILLED ---------- */

  const updated = await db
    .update(order)
    .set({
      status: "BILLED",
      subtotal,
      tax,
      discountAmount,
      total,
      billedAt: now,
    })
    .where(
      and(
        eq(order.id, orderId),
        eq(order.organizationId, ctx.organizationId),
        eq(order.status, "OPEN")
      )
    )
    .returning({ id: order.id });

  if (updated.length === 0) {
    return NextResponse.json(
      { error: "Failed to bill order" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    orderId,
    subtotal,
    discountAmount,
    tax,
    total,
  });
}
