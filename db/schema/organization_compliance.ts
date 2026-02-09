import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";

export const organizationCompliance = pgTable(
  "organization_compliance",
  {
    id: text("id").primaryKey(),

    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),

    fssaiType: text("fssai_type").notNull(),
    // BASIC | STATE | CENTRAL

    fssaiNumber: text("fssai_number").notNull(),

    gstin: text("gstin"), // optional

    submittedAt: timestamp("submitted_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);
