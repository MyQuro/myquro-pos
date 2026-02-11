import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuCategory } from "@/db/schema";
import { requirePosContext } from "../../../_utils";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const body = await req.json();

  await db
    .update(menuCategory)
    .set(body)
    .where(
      and(
        eq(menuCategory.id, params.id),
        eq(menuCategory.organizationId, ctx.organizationId)
      )
    );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  await db
    .delete(menuCategory)
    .where(
      and(
        eq(menuCategory.id, params.id),
        eq(menuCategory.organizationId, ctx.organizationId)
      )
    );

  return NextResponse.json({ success: true });
}
