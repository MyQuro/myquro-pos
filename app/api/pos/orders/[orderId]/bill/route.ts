import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem } from "@/db/schema";
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

  /* ---------- Fetch Items ---------- */

  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId));

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Cannot bill empty order" },
      { status: 400 }
    );
  }

  /* ---------- Calculate Totals ---------- */

  const subtotal = items.reduce((sum, i) => {
    const line = Number(i.lineTotal) || 0;
    return sum + line;
  }, 0);

  const tax = 0; // Add GST later
  const total = subtotal + tax;

  const now = new Date();

  /* ---------- Update Order → BILLED ---------- */

  const updated = await db
    .update(order)
    .set({
      status: "BILLED",
      subtotal,
      tax,
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
    tax,
    total,
  });
}
