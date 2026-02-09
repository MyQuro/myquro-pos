import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./auth-schema";

export const organizationOwner = pgTable(
  "organization_owner",
  {
    id: text("id").primaryKey(),

    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),

    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),

    ownerName: text("owner_name").notNull(),

    countryCode: varchar("country_code", { length: 5 }).notNull(),
    phone: varchar("phone", { length: 10 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);
