import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  // Order header
  const [ord] = await db
    .select({
      id: order.id,
      orderType: order.orderType,
      status: order.status,
      tableLabel: order.tableLabel,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      createdAt: order.createdAt,
      billedAt: order.billedAt,
      paidAt: order.paidAt,
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

  // Order items
  const items = await db
    .select({
      id: orderItem.id,
      itemName: orderItem.itemName,
      itemCode: orderItem.itemCode,
      unitPrice: orderItem.unitPrice,
      quantity: orderItem.quantity,
      lineTotal: orderItem.lineTotal,
    })
    .from(orderItem)
    .where(eq(orderItem.orderId, ord.id))
    .orderBy(orderItem.createdAt);

  return NextResponse.json({
    order: ord,
    items,
    totals: {
      subtotal: ord.subtotal,
      tax: ord.tax,
      total: ord.total,
    },
  });
}