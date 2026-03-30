import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { inventory } from "./inventory";

export const vendors = pgTable("vendors", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const purchases = pgTable("purchases", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "restrict" }),
  totalCost: integer("total_cost").notNull(), // in cents/paise
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  status: text("status").default("Completed").notNull(), // Pending, Completed, Cancelled
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const purchaseItems = pgTable("purchase_items", {
  id: text("id").primaryKey(),
  purchaseId: text("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  inventoryId: text("inventory_id")
    .notNull()
    .references(() => inventory.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitCost: integer("unit_cost").notNull(), // in cents/paise
  totalCost: integer("total_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
