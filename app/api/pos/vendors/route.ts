import { NextResponse } from "next/server";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq } from "drizzle-orm";

export async function GET() {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  try {
    const list = await db
      .select()
      .from(vendors)
      .where(eq(vendors.organizationId, ctx.organizationId));
    return NextResponse.json(list);
  } catch (err) {
    console.error("GET vendors error", err);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { name, contactName, phone, email, address } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
  }

  try {
    const contactInfo = JSON.stringify({ contactName, phone, email, address });

    const [newVendor] = await db
      .insert(vendors)
      .values({
        id: crypto.randomUUID(),
        organizationId: ctx.organizationId,
        name,
        contactInfo,
      })
      .returning();

    return NextResponse.json(newVendor, { status: 201 });
  } catch (err) {
    console.error("POST vendor error", err);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}
