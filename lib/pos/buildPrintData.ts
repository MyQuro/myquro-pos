import { db } from "@/db";
import { order, orderItem, orderPayment } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function buildPrintData({
  orderId,
  organizationId,
  type, // "KOT" | "BILL"
}: {
  orderId: string;
  organizationId: string;
  type: "KOT" | "BILL";
}) {

  const existing = await db
    .select()
    .from(order)
    .where(
      and(
        eq(order.id, orderId),
        eq(order.organizationId, organizationId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Order not found");
  }

  const ord = existing[0];

  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId));

  if (items.length === 0) {
    throw new Error("Order has no items");
  }


  let payment = null;

  if (type === "BILL") {
    const p = await db
      .select()
      .from(orderPayment)
      .where(eq(orderPayment.orderId, orderId))
      .limit(1);

    payment = p.length > 0 ? p[0] : null;
  }

  return {
    header: {
      orderId: ord.id,
      orderNumber: ord.orderNumber,
      orderType: ord.orderType,
      tableLabel: ord.tableLabel,
      createdAt: ord.createdAt,
      billedAt: ord.billedAt,
    },

    items: items.map((i) => ({
      name: i.itemName,
      code: i.itemCode,
      qty: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),

    totals:
      type === "BILL"
        ? {
            subtotal: ord.subtotal,
            tax: ord.tax,
            total: ord.total,
          }
        : null,

    payment:
      type === "BILL" && payment
        ? {
            method: payment.paymentMethod,
            amount: payment.amount,
            paidAt: payment.paidAt,
          }
        : null,
  };
}
