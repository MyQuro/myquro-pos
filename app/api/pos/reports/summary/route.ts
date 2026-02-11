import { NextResponse } from "next/server";
import { db } from "@/db";
import { order, orderPayment } from "@/db/schema";
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
  const day = now.getDay(); // 0 = Sunday
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

function generateCSV(data: {
  period: string;
  start: Date;
  end: Date;
  totalOrders: number;
  totalRevenue: number;
  cashRevenue: number;
  upiRevenue: number;
  cardRevenue: number;
}) {
  const formatAmount = (amount: number) => (amount / 100).toFixed(2);
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  
  const avgOrderValue = data.totalOrders > 0 
    ? (data.totalRevenue / data.totalOrders / 100).toFixed(2)
    : "0.00";

  const totalRevenue = parseFloat(formatAmount(data.totalRevenue));
  const cashAmount = parseFloat(formatAmount(data.cashRevenue));
  const upiAmount = parseFloat(formatAmount(data.upiRevenue));
  const cardAmount = parseFloat(formatAmount(data.cardRevenue));

  const cashPercent = totalRevenue > 0 ? ((cashAmount / totalRevenue) * 100).toFixed(2) : "0.00";
  const upiPercent = totalRevenue > 0 ? ((upiAmount / totalRevenue) * 100).toFixed(2) : "0.00";
  const cardPercent = totalRevenue > 0 ? ((cardAmount / totalRevenue) * 100).toFixed(2) : "0.00";

  const periodName = data.period.charAt(0).toUpperCase() + data.period.slice(1);
  const generatedDate = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const csv = [
    // Header
    ["SALES REPORT"],
    [""],
    
    // Report Info
    ["Report Type:", periodName],
    ["Period Start:", formatDate(data.start)],
    ["Period End:", formatDate(data.end)],
    ["Generated On:", generatedDate],
    ["Currency:", "INR"],
    [""],
    
    // Summary Section
    ["=== SUMMARY ==="],
    [""],
    ["Metric", "Value"],
    ["Total Orders", data.totalOrders.toString()],
    ["Total Revenue", formatAmount(data.totalRevenue)],
    ["Average Order Value", avgOrderValue],
    [""],
    
    // Payment Breakdown Section
    ["=== PAYMENT BREAKDOWN ==="],
    [""],
    ["Payment Method", "Amount (INR)", "Percentage (%)", "Number of Decimal Places"],
    ["Cash", cashAmount.toFixed(2), cashPercent, "2"],
    ["UPI", upiAmount.toFixed(2), upiPercent, "2"],
    ["Card", cardAmount.toFixed(2), cardPercent, "2"],
    [""],
    ["Total", totalRevenue.toFixed(2), "100.00", "2"],
    [""],
    
    // Additional Metrics
    ["=== ADDITIONAL METRICS ==="],
    [""],
    ["Metric", "Value"],
    ["Revenue per Order", avgOrderValue],
    ["Cash Transactions", cashAmount.toFixed(2)],
    ["Digital Transactions (UPI + Card)", (upiAmount + cardAmount).toFixed(2)],
    ["Digital Payment Percentage", totalRevenue > 0 ? (((upiAmount + cardAmount) / totalRevenue) * 100).toFixed(2) + "%" : "0.00%"],
    [""],
    
    // Footer
    [""],
    ["---"],
    ["End of Report"],
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
  const format = searchParams.get("format"); // 'csv' or 'json'

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

    // Normalize time bounds
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    return NextResponse.json(
      { error: "Invalid period or date range" },
      { status: 400 }
    );
  }

  /* ---------- SQL Aggregation ---------- */

  const [result] = await db
    .select({
      totalOrders: sql<number>`COUNT(DISTINCT ${order.id})`,
      totalRevenue: sum(order.total),

      cashRevenue: sql<number>`
        SUM(
          CASE 
            WHEN ${orderPayment.paymentMethod} = 'CASH' 
            THEN ${order.total} 
            ELSE 0 
          END
        )
      `,

      upiRevenue: sql<number>`
        SUM(
          CASE 
            WHEN ${orderPayment.paymentMethod} = 'UPI' 
            THEN ${order.total} 
            ELSE 0 
          END
        )
      `,

      cardRevenue: sql<number>`
        SUM(
          CASE 
            WHEN ${orderPayment.paymentMethod} = 'CARD' 
            THEN ${order.total} 
            ELSE 0 
          END
        )
      `,
    })
    .from(order)
    .leftJoin(orderPayment, eq(orderPayment.orderId, order.id))
    .where(
      and(
        eq(order.organizationId, ctx.organizationId),
        eq(order.status, "PAID"),
        gte(order.paidAt, start),
        lte(order.paidAt, end)
      )
    );

  const reportData = {
    period: period || "custom",
    start,
    end,
    totalOrders: Number(result?.totalOrders ?? 0),
    totalRevenue: Number(result?.totalRevenue ?? 0),
    cashRevenue: Number(result?.cashRevenue ?? 0),
    upiRevenue: Number(result?.upiRevenue ?? 0),
    cardRevenue: Number(result?.cardRevenue ?? 0),
  };

  /* ---------- CSV Export ---------- */

  if (format === "csv") {
    const csv = generateCSV(reportData);
    
    const filename = `sales-report-${period || "custom"}-${start.toISOString().split("T")[0]}-to-${end.toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  /* ---------- JSON Response ---------- */

  return NextResponse.json({
    period: reportData.period,
    start: reportData.start,
    end: reportData.end,
    totalOrders: reportData.totalOrders,
    totalRevenue: reportData.totalRevenue,
    paymentBreakdown: {
      cash: reportData.cashRevenue,
      upi: reportData.upiRevenue,
      card: reportData.cardRevenue,
    },
  });
}
