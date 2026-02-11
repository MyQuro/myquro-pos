import {
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { order } from "./order";

export const orderPrintEvent = pgTable("order_print_event", {
  id: text("id").primaryKey(),

  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),

  printType: text("print_type").notNull(),
  // KOT | BILL

  printedAt: timestamp("printed_at").defaultNow().notNull(),

  status: text("status").notNull(),
  // SUCCESS | FAILED

  errorMessage: text("error_message"),
});
