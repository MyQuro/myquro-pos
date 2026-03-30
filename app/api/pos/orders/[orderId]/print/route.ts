import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderItem, organization, customers } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const params = await props.params;
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { orderId } = params;

  // 1. Fetch Organization
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, ctx.organizationId))
    .limit(1);

  if (!org) return new NextResponse("Org not found", { status: 404 });

  // 2. Fetch Order
  const [o] = await db
    .select()
    .from(order)
    .where(
      and(
        eq(order.id, orderId),
        eq(order.organizationId, ctx.organizationId)
      )
    )
    .limit(1);

  if (!o) return new NextResponse("Order not found", { status: 404 });

  // 3. Fetch Items
  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId));

  // 4. Fetch Customer info if present
  let customerInfo = null;
  if (o.customerId) {
    const [c] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, o.customerId))
      .limit(1);
    customerInfo = c;
  }

  // Helper
  const formatPrice = (p: number | null) => (p ? `₹${(p / 100).toFixed(2)}` : "₹0.00");

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${o.orderNumber || o.tableLabel || "Order"}</title>
  <style>
    body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; font-size: 13px; color: #000; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .border-b { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
    .flex-between { display: flex; justify-content: space-between; }
    table { width: 100%; text-align: left; }
    th, td { padding: 4px 0; }
    th { border-bottom: 1px dashed #000; }
    @media print {
      body { width: 100%; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="text-center border-b">
    <h2>${org.name}</h2>
    <p>Receipt</p>
  </div>
  
  <div class="border-b">
    <p>Order Date: ${new Date(o.createdAt).toLocaleString("en-IN")}</p>
    ${o.orderType === "TAKEAWAY" ? `<p>Order No: <b>${o.orderNumber}</b></p>` : `<p>Table: <b>${o.tableLabel}</b></p>`}
    ${customerInfo ? `<p>Customer: ${customerInfo.name} (${customerInfo.phone})</p>` : o.customerName ? `<p>Customer: ${o.customerName}</p>` : ""}
  </div>

  <table class="border-b">
    <thead>
      <tr>
        <th>Item</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (i) => `
      <tr>
        <td>${i.itemName}</td>
        <td class="text-right">${i.quantity}</td>
        <td class="text-right">${formatPrice(i.lineTotal)}</td>
      </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="border-b">
    <div class="flex-between">
      <span>Subtotal</span>
      <span>${formatPrice(o.subtotal)}</span>
    </div>
    ${o.discountAmount ? `
    <div class="flex-between">
      <span>Discount</span>
      <span>-${formatPrice(o.discountAmount)}</span>
    </div>
    ` : ""}
    <div class="flex-between">
      <span>GST (Tax)</span>
      <span>${formatPrice(o.tax)}</span>
    </div>
    <div class="flex-between font-bold" style="font-size: 15px; margin-top: 5px;">
      <span>Total</span>
      <span>${formatPrice(o.total)}</span>
    </div>
  </div>

  <div class="text-center">
    <p>Thank you for your visit!</p>
    <p style="font-size: 10px; margin-top: 10px;">Powered by MyQuro</p>
  </div>
  
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
