import {
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { order } from "./order";

export const orderPayment = pgTable("order_payment", {
  id: text("id").primaryKey(),

  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),

  paymentMethod: text("payment_method").notNull(),
  // CASH | UPI | CARD

  amount: integer("amount").notNull(),

  paidAt: timestamp("paid_at").defaultNow().notNull(),
});
