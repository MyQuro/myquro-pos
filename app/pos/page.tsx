import React from 'react'
import { requireActiveOrganization } from "@/lib/require-active-organization";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function POSPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  await requireActiveOrganization(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Point of Sale</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="col-span-full">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a
              href="/pos/orders"
              className="p-6 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="text-4xl">📋</div>
                <h3 className="font-semibold">Order Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage orders
                </p>
              </div>
            </a>

            <a
              href="/pos/menu"
              className="p-6 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="text-4xl">📖</div>
                <h3 className="font-semibold">Menu Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage items and categories
                </p>
              </div>
            </a>

            <div className="p-6 border rounded-lg bg-muted/30 cursor-not-allowed">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="text-4xl opacity-50">📊</div>
                <h3 className="font-semibold text-muted-foreground">Reports</h3>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="col-span-full">
          <h2 className="text-xl font-semibold mb-4">Today&apos;s Overview</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-6 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-sm text-muted-foreground mb-1">
                Open Orders
              </div>
              <div className="text-3xl font-bold">-</div>
            </div>

            <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-sm text-muted-foreground mb-1">
                Completed Orders
              </div>
              <div className="text-3xl font-bold">-</div>
            </div>

            <div className="p-6 border rounded-lg bg-orange-50 dark:bg-orange-950">
              <div className="text-sm text-muted-foreground mb-1">
                Total Revenue
              </div>
              <div className="text-3xl font-bold">₹0.00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}