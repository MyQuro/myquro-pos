import {
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { customers } from "./customer";

export const order = pgTable("order", {
  id: text("id").primaryKey(),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  orderType: text("order_type").notNull(),
  // DINE_IN | TAKEAWAY

  status: text("status").notNull(),
  // OPEN | BILLED | PAID | CANCELLED

  tableLabel: text("table_label"),
  // required for DINE_IN, null for TAKEAWAY
  orderNumber: text("order_number"),
  // required for TAKEAWAY, null for DINE_IN

  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),

  customerId: text("customer_id")
    .references(() => customers.id, { onDelete: "set null" }),

  subtotal: integer("subtotal"),
  tax: integer("tax"),
  discountAmount: integer("discount_amount").default(0),
  manualDiscountAmount: integer("manual_discount_amount").default(0),
  total: integer("total"),
  // all stored ONLY at billing time

  billedAt: timestamp("billed_at"),
  paidAt: timestamp("paid_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
