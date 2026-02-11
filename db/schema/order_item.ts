import {
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { order } from "./order";
import { menuItem } from "./menu_item";

export const orderItem = pgTable("order_item", {
  id: text("id").primaryKey(),

  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),

  menuItemId: text("menu_item_id")
    .references(() => menuItem.id),
  // nullable for historical safety

  itemName: text("item_name").notNull(),
  itemCode: text("item_code").notNull(),

  unitPrice: integer("unit_price").notNull(),
  // copied from menu at time of addition/billing

  quantity: integer("quantity").notNull(),

  lineTotal: integer("line_total").notNull(),
  // unitPrice * quantity

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
