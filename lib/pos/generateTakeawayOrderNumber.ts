import { db } from "@/db";
import { order } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";

/**
 * Generates next takeaway order number for an organization.
 * Format: ORD-001, ORD-002, ...
 * Resets daily per organization.
 *
 * Must be called INSIDE an order-creation flow.
 */
export async function generateTakeawayOrderNumber(
  organizationId: string
): Promise<string> {
  // Fetch last takeaway order of today for this org
  const lastOrder = await db
    .select({
      orderNumber: order.orderNumber,
    })
    .from(order)
    .where(
      and(
        eq(order.organizationId, organizationId),
        eq(order.orderType, "TAKEAWAY"),
        // DATE boundary — Neon/Postgres safe
        sql`DATE(${order.createdAt}) = CURRENT_DATE`
      )
    )
    .orderBy(desc(order.createdAt))
    .limit(1);

  let nextNumber = 1;

  if (lastOrder.length > 0 && lastOrder[0].orderNumber) {
    const match = lastOrder[0].orderNumber.match(/ORD-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `ORD-${String(nextNumber).padStart(3, "0")}`;
}
