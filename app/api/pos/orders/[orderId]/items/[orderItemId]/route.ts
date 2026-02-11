import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  props: {
    params: Promise<{ orderId: string; orderItemId: string }>;
  }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  // 1. Fetch order and validate state
  const [ord] = await db
    .select({
      id: order.id,
      status: order.status,
    })
    .from(order)
    .where(
      and(
        eq(order.id, params.orderId),
        eq(order.organizationId, ctx.organizationId)
      )
    );

  if (!ord) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  if (ord.status !== "OPEN") {
    return NextResponse.json(
      { error: "Order is not editable" },
      { status: 400 }
    );
  }

  // 2. Validate item belongs to order
  const [item] = await db
    .select({ id: orderItem.id })
    .from(orderItem)
    .where(
      and(
        eq(orderItem.id, params.orderItemId),
        eq(orderItem.orderId, ord.id)
      )
    );

  if (!item) {
    return NextResponse.json(
      { error: "Order item not found" },
      { status: 404 }
    );
  }

  // 3. Delete item
  await db
    .delete(orderItem)
    .where(eq(orderItem.id, params.orderItemId));

  return NextResponse.json({ success: true });
}
