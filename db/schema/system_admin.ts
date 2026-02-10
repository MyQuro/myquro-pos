import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const systemAdmin = pgTable("system_admin", {
    id: text("id").primaryKey(),

    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }).unique(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
});