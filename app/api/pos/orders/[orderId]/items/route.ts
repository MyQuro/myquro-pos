import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem, menuItem } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const body = await req.json();
  const { menuItemId, quantity } = body;

  // 1. Validate input
  if (!menuItemId || typeof quantity !== "number" || quantity < 1) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 }
    );
  }

  // 2. Fetch order (org-scoped)
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

  // 3. Fetch menu item (must be available)
  const [item] = await db
    .select({
      id: menuItem.id,
      name: menuItem.name,
      itemCode: menuItem.itemCode,
      price: menuItem.price,
    })
    .from(menuItem)
    .where(
      and(
        eq(menuItem.id, menuItemId),
        eq(menuItem.organizationId, ctx.organizationId),
        eq(menuItem.isAvailable, true)
      )
    );

  if (!item) {
    return NextResponse.json(
      { error: "Item unavailable" },
      { status: 400 }
    );
  }

  // 4. Append item to order
  await db.insert(orderItem).values({
    id: crypto.randomUUID(),
    orderId: ord.id,
    menuItemId: item.id,
    itemName: item.name,
    itemCode: item.itemCode,
    unitPrice: item.price,
    quantity,
    lineTotal: item.price * quantity,
  });

  return NextResponse.json({ success: true });
}
