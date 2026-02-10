import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { organization } from "./organization";

export const menuCategory = pgTable("menu_category", {
  id: text("id").primaryKey(),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  name: text("name").notNull(),

  sortOrder: integer("sort_order").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
