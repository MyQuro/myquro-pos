import { pgTable, text,timestamp } from "drizzle-orm/pg-core";

export const organization = pgTable("organization", {
    id: text("id").primaryKey(),

    name: text("name").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    status: text("status").notNull().default("draft"), // draft, pending, active, rejected
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
})