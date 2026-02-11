import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderPayment } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { orderId } = await params;
  const { paymentMethod } = await req.json();

  /* ---------- Validate payment method ---------- */

  if (!["CASH", "UPI", "CARD"].includes(paymentMethod)) {
    return NextResponse.json(
      { error: "Invalid payment method" },
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

  /* ---------- Insert payment (unique orderId enforced by DB) ---------- */

  try {
    await db.insert(orderPayment).values({
      id: crypto.randomUUID(),
      orderId: ord.id,
      paymentMethod,
      amount: ord.total,
      // paidAt auto default
    });
  } catch {
    return NextResponse.json(
      { error: "Payment already recorded for this order" },
      { status: 400 }
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

  return NextResponse.json({ success: true });
}
