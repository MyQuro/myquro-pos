import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItem } from "@/db/schema";
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
    .update(menuItem)
    .set(body)
    .where(
      and(
        eq(menuItem.id, params.id),
        eq(menuItem.organizationId, ctx.organizationId)
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
    .delete(menuItem)
    .where(
      and(
        eq(menuItem.id, params.id),
        eq(menuItem.organizationId, ctx.organizationId)
      )
    );

  return NextResponse.json({ success: true });
}
