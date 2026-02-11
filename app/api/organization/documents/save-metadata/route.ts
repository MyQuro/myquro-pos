import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationDocument, organization, organizationOwner } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    console.log("=== SAVE METADATA REQUEST ===");
    
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      console.error("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User ID:", session.user.id);

    const body = await req.json();
    console.log("Request body:", body);

    const {
      documentType,
      fileName,
      fileMimeType,
      fileSize,
      storageKey,
    } = body;

    if (!documentType || !fileName || !storageKey) {
      console.error("Missing required fields:", { documentType, fileName, storageKey });
      return NextResponse.json(
        { error: "Invalid payload - missing required fields" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "FSSAI_LICENSE",
      "GST_CERTIFICATE",
      "OTHER",
    ];

    if (!allowedTypes.includes(documentType)) {
      console.error("Invalid document type:", documentType);
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    console.log("Looking up organization for user...");

    // Get organization ID if exists
    const result = await db
      .select({
        organizationId: organization.id,
      })
      .from(organizationOwner)
      .innerJoin(
        organization,
        eq(organizationOwner.organizationId, organization.id)
      )
      .where(eq(organizationOwner.userId, session.user.id))
      .limit(1);

    console.log("Organization lookup result:", result);

    if (result.length === 0) {
      // During setup phase - document is uploaded but organization doesn't exist yet
      console.log("No organization found - setup phase. Skipping metadata save.");
      return NextResponse.json({ 
        success: true,
        message: "Document uploaded. Metadata will be linked after organization setup.",
        pendingMetadata: true,
      });
    }

    const organizationId = result[0].organizationId;
    console.log("Found organization ID:", organizationId);

    // Save to database
    const documentId = crypto.randomUUID();
    console.log("Inserting document with ID:", documentId);

    await db.insert(organizationDocument).values({
      id: documentId,
      organizationId,
      documentType,
      fileName,
      fileMimeType: fileMimeType || "application/octet-stream",
      fileSize: String(fileSize || 0),
      storageKey,
    });

    console.log("✅ Metadata saved successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Save metadata error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack");
    
    return NextResponse.json(
      { 
        error: "Failed to save metadata",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
