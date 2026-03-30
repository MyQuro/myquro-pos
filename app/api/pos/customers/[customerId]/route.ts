import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function PUT(
  req: Request,
  props: { params: Promise<{ customerId: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { customerId } = params;
  const body = await req.json();
  const { name, phone, email, segment } = body;

  try {
    const [updated] = await db
      .update(customers)
      .set({
        name,
        phone: phone || null,
        email: email || null,
        segment: segment || "Retail",
      })
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.organizationId, ctx.organizationId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/pos/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ customerId: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { customerId } = params;

  try {
    const [deleted] = await db
      .delete(customers)
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.organizationId, ctx.organizationId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/pos/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
