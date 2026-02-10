import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { menuCategory } from "./menu_category";
import { organization } from "./organization";

export const menuItem = pgTable(
  "menu_item",
  {
    id: text("id").primaryKey(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    categoryId: text("category_id")
      .notNull()
      .references(() => menuCategory.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    itemCode: text("item_code").notNull(),

    price: integer("price").notNull(),

    isVeg: boolean("is_veg").default(true).notNull(),

    isAvailable: boolean("is_available").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    itemCodeOrgUnique: uniqueIndex("menu_item_org_item_code_unique").on(
      table.organizationId,
      table.itemCode
    ),
  })
);
