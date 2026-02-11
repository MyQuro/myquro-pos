import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderPrintEvent } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const body = await req.json();
  const { printType, status, errorMessage } = body;

  // 1. Validate input
  if (!["KOT", "BILL"].includes(printType)) {
    return NextResponse.json(
      { error: "Invalid print type" },
      { status: 400 }
    );
  }

  if (!["SUCCESS", "FAILED"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid print status" },
      { status: 400 }
    );
  }

  // 2. Validate order ownership
  const [ord] = await db
    .select({ id: order.id })
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

  // 3. Insert print event
  await db.insert(orderPrintEvent).values({
    id: crypto.randomUUID(),
    orderId: ord.id,
    printType,
    status,
    errorMessage: status === "FAILED" ? errorMessage ?? null : null,
  });

  return NextResponse.json({ success: true });
}
