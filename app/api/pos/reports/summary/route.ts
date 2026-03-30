import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderPayment, purchases, orderItem, menuItem, customers } from "@/db/schema";
import { requirePosContext } from "@/app/api/pos/_utils";
import { eq, and, gte, lte, sum, sql } from "drizzle-orm";

/* ---------- Date Helpers ---------- */

function getDailyRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/* ---------- CSV Helper ---------- */

function generateCSV(data: any) {
  const formatAmount = (amount: number) => (amount / 100).toFixed(2);
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  
  const periodName = data.period.charAt(0).toUpperCase() + data.period.slice(1);
  const generatedDate = new Date().toLocaleString("en-IN");

  const csv = [
    ["SALES & PROFIT REPORT"],
    [""],
    ["Report Type:", periodName],
    ["Period Start:", formatDate(data.start)],
    ["Period End:", formatDate(data.end)],
    ["Generated On:", generatedDate],
    [""],
    ["=== FINANCIAL SUMMARY ==="],
    ["Metric", "Value (INR)"],
    ["Total Orders", data.totalOrders.toString()],
    ["Total Revenue", formatAmount(data.totalRevenue)],
    ["Total Purchase Cost", formatAmount(data.totalCost)],
    ["Gross Profit", formatAmount(data.totalRevenue - data.totalCost)],
    [""],
    ["=== PAYMENT BREAKDOWN ==="],
    ["Method", "Amount (INR)"],
    ["Cash", formatAmount(data.paymentBreakdown.cash)],
    ["UPI", formatAmount(data.paymentBreakdown.upi)],
    ["Card", formatAmount(data.paymentBreakdown.card)],
    [""],
    ["=== TOP PRODUCTS ==="],
    ["Product", "Qty", "Revenue"],
    ...data.topProducts.map((p: any) => [p.name, p.totalQuantity, formatAmount(p.revenue)]),
  ];

  return csv.map(row => row.join(",")).join("\n");
}

/* ---------- Route ---------- */

export async function GET(req: Request) {
  const ctx = await requirePosContext();
  if ("error" in ctx) return ctx.error;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = searchParams.get("format");

  let start: Date;
  let end: Date;

  if (period === "daily") {
    ({ start, end } = getDailyRange());
  } else if (period === "weekly") {
    ({ start, end } = getWeekRange());
  } else if (period === "monthly") {
    ({ start, end } = getMonthRange());
  } else if (from && to) {
    start = new Date(from);
    end = new Date(to);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  try {
    // 1. Order Stats
    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`COUNT(${order.id})`,
        totalRevenue: sum(order.total),
      })
      .from(order)
      .where(
        and(
          eq(order.organizationId, ctx.organizationId),
          eq(order.status, "PAID"),
          gte(order.paidAt, start),
          lte(order.paidAt, end)
        )
      );

    // 2. Payment Stats
    const paymentStats = await db
      .select({
        method: orderPayment.paymentMethod,
        amount: sum(orderPayment.amount),
      })
      .from(orderPayment)
      .innerJoin(order, eq(orderPayment.orderId, order.id))
      .where(
        and(
          eq(order.organizationId, ctx.organizationId),
          eq(order.status, "PAID"),
          gte(order.paidAt, start),
          lte(order.paidAt, end)
        )
      )
      .groupBy(orderPayment.paymentMethod);

    // 3. Purchase Cost
    const [purchaseCost] = await db
      .select({
        total: sum(purchases.totalCost),
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.organizationId, ctx.organizationId),
          gte(purchases.purchaseDate, start),
          lte(purchases.purchaseDate, end)
        )
      );

    // 4. Top Products
    const topProducts = await db
      .select({
        id: orderItem.menuItemId,
        name: orderItem.itemName,
        totalQuantity: sum(orderItem.quantity),
        revenue: sum(orderItem.lineTotal),
      })
      .from(orderItem)
      .innerJoin(order, eq(orderItem.orderId, order.id))
      .where(
        and(
          eq(order.organizationId, ctx.organizationId),
          eq(order.status, "PAID"),
          gte(order.paidAt, start),
          lte(order.paidAt, end)
        )
      )
      .groupBy(orderItem.menuItemId, orderItem.itemName)
      .orderBy(sql`SUM(${orderItem.quantity}) DESC`)
      .limit(5);

    // 5. Customer Segments
    const customerStats = await db
      .select({
        segment: customers.segment,
        count: sql<number>`COUNT(${order.id})`,
        revenue: sum(order.total),
      })
      .from(order)
      .innerJoin(customers, eq(order.customerId, customers.id))
      .where(
        and(
          eq(order.organizationId, ctx.organizationId),
          eq(order.status, "PAID"),
          gte(order.paidAt, start),
          lte(order.paidAt, end)
        )
      )
      .groupBy(customers.segment);

    const breakdown = { cash: 0, upi: 0, card: 0 };
    paymentStats.forEach(p => {
      const amt = Number(p.amount ?? 0);
      if (p.method === "CASH") breakdown.cash = amt;
      else if (p.method === "UPI") breakdown.upi = amt;
      else if (p.method === "CARD") breakdown.card = amt;
    });

    const finalData = {
      period: period || "custom",
      start,
      end,
      totalOrders: Number(orderStats?.totalOrders ?? 0),
      totalRevenue: Number(orderStats?.totalRevenue ?? 0),
      totalCost: Number(purchaseCost?.total ?? 0),
      topProducts: topProducts.map(p => ({
        ...p,
        totalQuantity: Number(p.totalQuantity),
        revenue: Number(p.revenue)
      })),
      customerSegments: customerStats.map(c => ({
        ...c,
        count: Number(c.count),
        revenue: Number(c.revenue)
      })),
      paymentBreakdown: breakdown,
    };

    if (format === "csv") {
      const csv = generateCSV(finalData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="report.csv"`,
        },
      });
    }

    return NextResponse.json(finalData);
  } catch (err) {
    console.error("Report error", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
