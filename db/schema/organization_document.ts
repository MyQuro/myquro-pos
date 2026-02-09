import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";

export const organizationDocument = pgTable(
  "organization_document",
  {
    id: text("id").primaryKey(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    documentType: text("document_type").notNull(),
    // FSSAI_LICENSE | GST_CERTIFICATE | OTHER

    fileName: text("file_name").notNull(),

    fileMimeType: text("file_mime_type").notNull(),

    fileSize: text("file_size").notNull(),

    storageKey: text("storage_key").notNull(),
    // object storage key/path (S3, R2, Supabase, etc.)

    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  }
);
