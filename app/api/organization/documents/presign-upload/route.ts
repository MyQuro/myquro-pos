import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { organization, organizationOwner } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", session.user.id);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    console.log("File received:", file?.name, "Type:", documentType);

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    console.log("File validation passed");

    // Try to get organization ID, or use userId if in setup phase
    let orgIdentifier = session.user.id;

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

    if (result.length > 0) {
      orgIdentifier = result[0].organizationId;
      console.log("Using organization ID:", orgIdentifier);
    } else {
      console.log("Using user ID (setup phase):", orgIdentifier);
    }

    const objectKey = `org/${orgIdentifier}/${crypto.randomUUID()}-${file.name}`;
    console.log("Object key:", objectKey);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("File converted to buffer, size:", buffer.length);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
    });

    console.log("Uploading to R2...");
    await r2.send(command);
    console.log("Upload successful!");

    // Generate public URL if you have a custom domain
    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL}/${objectKey}`
      : null;

    return NextResponse.json({
      success: true,
      objectKey,
      fileName: file.name,
      fileSize: file.size,
      publicUrl,
    });
  } catch (error) {
    console.error("Upload error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { 
        error: "Upload failed", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
