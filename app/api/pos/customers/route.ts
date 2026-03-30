import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq } from "drizzle-orm";

export async function GET() {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  try {
    const list = await db
      .select()
      .from(customers)
      .where(eq(customers.organizationId, ctx.organizationId));
    return NextResponse.json(list);
  } catch (err) {
    console.error("GET customers error", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { name, phone, email, segment } = await req.json();

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  try {
    const [newCustomer] = await db
      .insert(customers)
      .values({
        id: crypto.randomUUID(),
        organizationId: ctx.organizationId,
        name,
        phone,
        email: email || null,
        segment: segment || "Retail",
      })
      .returning();

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (err) {
    console.error("POST customer error", err);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
