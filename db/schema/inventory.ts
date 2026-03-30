import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { menuItem } from "./menu_item";

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => menuItem.id, { onDelete: "cascade" }),
  currentStock: integer("current_stock").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10).notNull(),
  lastRestockedAt: timestamp("last_restocked_at"),
  lastUnitCost: integer("last_unit_cost"), // in paise
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const inventoryLogs = pgTable("inventory_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  inventoryId: text("inventory_id")
    .notNull()
    .references(() => inventory.id, { onDelete: "cascade" }),
  changeQuantity: integer("change_quantity").notNull(), // positive for restock, negative for deduction
  reason: text("reason").notNull(), // "Sale", "Manual Adjustment", "Restock"
  referenceId: text("reference_id"), // Optional order ID or purchase ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
