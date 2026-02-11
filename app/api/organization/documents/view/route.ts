import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { organizationDocument, systemAdmin } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await db
      .select()
      .from(systemAdmin)
      .where(eq(systemAdmin.userId, session.user.id))
      .limit(1);

    if (isAdmin.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get document ID from query params
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Fetch document from database
    const [document] = await db
      .select()
      .from(organizationDocument)
      .where(eq(organizationDocument.id, documentId))
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Generate signed URL for viewing/downloading
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: document.storageKey,
    });

    const signedUrl = await getSignedUrl(r2, command, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({
      success: true,
      url: signedUrl,
      fileName: document.fileName,
      mimeType: document.fileMimeType,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      {
        error: "Failed to generate download URL",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}