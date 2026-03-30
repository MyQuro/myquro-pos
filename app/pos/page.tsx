import React from 'react';
import { requireActiveOrganization } from "@/lib/require-active-organization";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from './dashboard-client';
import { db } from "@/db";
import { order, orderItem } from "@/db/schema";
import { and, eq, gte, inArray, desc, sum, count } from "drizzle-orm";

export default async function POSPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const { organizationId } = await requireActiveOrganization(session.user.id);
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 1. Open Orders Count
  const openOrdersResult = await db.select({ count: count() })
    .from(order)
    .where(and(
      eq(order.organizationId, organizationId),
      inArray(order.status, ["OPEN", "BILLED"])
    ));
  const openOrdersCount = openOrdersResult[0].count;

  // 2. Completed Orders Count Today
  const completedOrdersResult = await db.select({ count: count() })
    .from(order)
    .where(and(
      eq(order.organizationId, organizationId),
      eq(order.status, "PAID"),
      gte(order.createdAt, startOfToday)
    ));
  const completedOrdersCount = completedOrdersResult[0].count;

  // 3. Total Revenue Today
  const revenueResult = await db.select({ total: sum(order.total) })
    .from(order)
    .where(and(
      eq(order.organizationId, organizationId),
      eq(order.status, "PAID"),
      gte(order.createdAt, startOfToday)
    ));
  const totalRevenueNumber = Number(revenueResult[0]?.total || 0) / 100;
  const formattedRevenue = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalRevenueNumber);

  // 4. Recent Activity
  const recentOrdersData = await db.select()
    .from(order)
    .where(eq(order.organizationId, organizationId))
    .orderBy(desc(order.createdAt))
    .limit(4);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "₹0.00";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount / 100);
  };

  const recentActivity = recentOrdersData.map(o => {
    const diffMins = Math.floor((new Date().getTime() - new Date(o.createdAt).getTime()) / 60000);
    const timeStr = diffMins === 0 ? "Just now" : diffMins < 60 ? `${diffMins} mins ago` : `${Math.floor(diffMins/60)} hrs ago`;
    return {
      id: o.orderNumber || o.id.slice(0, 8),
      type: o.orderType === "DINE_IN" ? "Dine In" : "Takeaway",
      amount: formatCurrency(o.total),
      time: timeStr,
      status: o.status === "PAID" ? "Completed" : o.status === "OPEN" ? "Preparing" : "Ready"
    };
  });

  // 5. Top Items Today
  const topItemsData = await db.select({
    name: orderItem.itemName,
    sales: sum(orderItem.quantity).mapWith(Number)
  })
  .from(orderItem)
  .innerJoin(order, eq(orderItem.orderId, order.id))
  .where(and(
    eq(order.organizationId, organizationId),
    eq(order.status, "PAID"),
    gte(order.createdAt, startOfToday)
  ))
  .groupBy(orderItem.itemName)
  .orderBy(desc(sum(orderItem.quantity)))
  .limit(4);

  const topItemsMax = Math.max(...topItemsData.map(i => i.sales), 50);
  const topItems = topItemsData.map(i => ({
    name: i.name,
    sales: i.sales,
    max: topItemsMax
  }));

  return (
    <DashboardClient 
      userName={session.user.name} 
      openOrdersCount={openOrdersCount}
      completedOrdersCount={completedOrdersCount}
      formattedRevenue={formattedRevenue}
      recentActivity={recentActivity}
      topItems={topItems}
    />
  );
}