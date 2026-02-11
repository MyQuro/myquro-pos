import { NextResponse } from "next/server";
import { requirePosContext } from "@/app/api/pos/_utils";
import { buildPrintData } from "@/lib/pos/buildPrintData";
import { logPrintEvent } from "@/lib/pos/logPrintEvent";

export async function POST(
  _req: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  try {
    const data = await buildPrintData({
      orderId: params.orderId,
      organizationId: ctx.organizationId,
      type: "KOT",
    });

    await logPrintEvent({
      orderId: params.orderId,
      printType: "KOT",
      status: "SUCCESS",
    });

    return NextResponse.json(data);
  } catch {
    await logPrintEvent({
      orderId: params.orderId,
      printType: "KOT",
      status: "FAILED",
      errorMessage: "Failed to build print data",
    });

    return NextResponse.json(
      { error: "Failed to build print data" },
      { status: 400 }
    );
  }
}
