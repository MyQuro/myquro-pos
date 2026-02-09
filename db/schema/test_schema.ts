import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const test = pgTable("test", {
  id: uuid("id").defaultRandom().primaryKey(),
  test: varchar("name", { length: 255 }).notNull(),
});
