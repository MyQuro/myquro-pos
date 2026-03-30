import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { organization } from "./organization";

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  segment: text("segment").default("Retail").notNull(), // Retail, Wholesale, Loyal
  totalSpent: integer("total_spent").default(0).notNull(), // in cents/paise
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
