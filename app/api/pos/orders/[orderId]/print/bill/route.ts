import { NextResponse } from "next/server";
import { requirePosContext } from "@/app/api/pos/_utils";
import { buildPrintData } from "@/lib/pos/buildPrintData";
import { logPrintEvent } from "@/lib/pos/logPrintEvent";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  let resolvedParams: { orderId: string } | undefined;
  try {
    resolvedParams = await params;
    const data = await buildPrintData({
      orderId: resolvedParams.orderId,
      organizationId: ctx.organizationId,
      type: "BILL",
    });

    await logPrintEvent({
      orderId: resolvedParams.orderId,
      printType: "BILL",
      status: "SUCCESS",
    });

    return NextResponse.json(data);
  } catch {
    await logPrintEvent({
      orderId: resolvedParams?.orderId || "unknown",
      printType: "BILL",
      status: "FAILED",
      errorMessage: "Failed to build print data",
    });

    return NextResponse.json(
      { error: "Failed to build print data" },
      { status: 400 }
    );
  }
}
