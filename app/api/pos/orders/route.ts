import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem, menuItem } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { generateTakeawayOrderNumber } from "@/lib/pos/generateTakeawayOrderNumber";
import { eq, and, inArray, desc } from "drizzle-orm";

/* ============================================================
   GET ALL ORDERS (used by OrdersPage / OrderListPanel)
   ============================================================ */
export async function GET() {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  try {
    const orders = await db
      .select()
      .from(order)
      .where(eq(order.organizationId, ctx.organizationId))
      .orderBy(desc(order.createdAt));

    if (orders.length === 0) {
      return NextResponse.json([]);
    }

    const orderIds = orders.map((o) => o.id);

    const items = await db
      .select()
      .from(orderItem)
      .where(inArray(orderItem.orderId, orderIds));

    const itemsByOrderId: Record<string, any[]> = {};

    for (const item of items) {
      if (!itemsByOrderId[item.orderId]) {
        itemsByOrderId[item.orderId] = [];
      }

      itemsByOrderId[item.orderId].push({
        id: item.id,
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        createdAt: item.createdAt,
      });
    }

    return NextResponse.json(
      orders.map((o) => ({
        id: o.id,
        orderType: o.orderType,
        status: o.status,
        tableLabel: o.tableLabel,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        billedAt: o.billedAt,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
        items: itemsByOrderId[o.id] ?? [],
      }))
    );
  } catch (err) {
    console.error("GET /api/pos/orders failed", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/* ============================================================
   CREATE ORDER (used by NewOrderModal)
   ============================================================ */
export async function POST(req: Request) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const body = await req.json();
  const {
    orderType,
    tableLabel,
    customerName,
    customerPhone,
    items,
  } = body;

  /* ---------- Validation ---------- */

  if (!["DINE_IN", "TAKEAWAY"].includes(orderType)) {
    return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Order must contain at least one item" },
      { status: 400 }
    );
  }

  if (orderType === "DINE_IN" && !tableLabel?.trim()) {
    return NextResponse.json(
      { error: "Table label required for dine-in" },
      { status: 400 }
    );
  }

  for (const item of items) {
    if (!item.menuItemId || item.quantity < 1) {
      return NextResponse.json(
        { error: "Invalid item payload" },
        { status: 400 }
      );
    }
  }

  const menuItemIds = items.map((i: any) => i.menuItemId);

  /* ---------- Fetch menu items ---------- */

  const dbItems = await db
    .select()
    .from(menuItem)
    .where(
      and(
        eq(menuItem.organizationId, ctx.organizationId),
        eq(menuItem.isAvailable, true),
        inArray(menuItem.id, menuItemIds)
      )
    );

  if (dbItems.length !== menuItemIds.length) {
    return NextResponse.json(
      { error: "One or more items are unavailable" },
      { status: 400 }
    );
  }

  const menuItemMap = new Map(dbItems.map((i) => [i.id, i]));

  /* ---------- Create order ---------- */

  const orderId = crypto.randomUUID();

  const orderNumber =
    orderType === "TAKEAWAY"
      ? await generateTakeawayOrderNumber(ctx.organizationId)
      : null;

  const status = orderType === "TAKEAWAY" ? "BILLED" : "OPEN";

  try {
    await db.insert(order).values({
      id: orderId,
      organizationId: ctx.organizationId,
      orderType,
      status,
      tableLabel: orderType === "DINE_IN" ? tableLabel : null,
      orderNumber,
      customerName,
      customerPhone,
      billedAt: orderType === "TAKEAWAY" ? new Date() : null,
    });

    for (const item of items) {
      const m = menuItemMap.get(item.menuItemId)!;

      await db.insert(orderItem).values({
        id: crypto.randomUUID(),
        orderId,
        menuItemId: m.id,
        itemName: m.name,
        itemCode: m.itemCode,
        unitPrice: m.price,
        quantity: item.quantity,
        lineTotal: m.price * item.quantity,
      });
    }

    // 🔑 EXACT response the modal expects
    return NextResponse.json({ orderId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/pos/orders failed", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
