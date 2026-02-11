import { db } from "@/db";
import { orderPrintEvent } from "@/db/schema";

export async function logPrintEvent({
  orderId,
  printType,
  status,
  errorMessage,
}: {
  orderId: string;
  printType: "KOT" | "BILL";
  status: "SUCCESS" | "FAILED";
  errorMessage?: string;
}) {
  await db.insert(orderPrintEvent).values({
    id: crypto.randomUUID(),
    orderId,
    printType,
    status,
    errorMessage: errorMessage ?? null,
  });
}
