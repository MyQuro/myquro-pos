"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DocumentType = "FSSAI_LICENSE" | "GST_CERTIFICATE" | "OTHER";

interface UploadedDocument {
  id: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  status: "uploading" | "completed" | "failed";
}

export default function UploadDocuments() {
  const [documentType, setDocumentType] = useState<DocumentType>("FSSAI_LICENSE");
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, PNG, and JPEG files are allowed");
      return;
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setUploading(true);

    const tempId = crypto.randomUUID();
    const newDoc: UploadedDocument = {
      id: tempId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      status: "uploading",
    };

    setDocuments((prev) => [...prev, newDoc]);

    try {
      // Create FormData with file and metadata
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);

      // Upload file to our API (which uploads to R2 server-side)
      const uploadResponse = await fetch(
        "/api/organization/documents/presign-upload",
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("Upload response status:", uploadResponse.status);

      if (!uploadResponse.ok) {
        const contentType = uploadResponse.headers.get("content-type");
        let errorMessage = "Failed to upload file";
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await uploadResponse.json();
          console.error("Server error data:", errorData);
          errorMessage = errorData.details || errorData.error || errorMessage;
        } else {
          const text = await uploadResponse.text();
          console.error("Non-JSON response:", text);
          errorMessage = `Server error: ${uploadResponse.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const uploadData = await uploadResponse.json();
      console.log("Upload successful:", uploadData);

      const { objectKey, fileName, fileSize } = uploadData;

      console.log("Saving metadata for:", objectKey);

      // Save metadata to database
      const metadataResponse = await fetch(
        "/api/organization/documents/save-metadata",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType,
            fileName,
            fileMimeType: file.type,
            fileSize,
            storageKey: objectKey,
          }),
        }
      );

      console.log("Metadata response status:", metadataResponse.status);

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        console.error("Metadata save failed:", errorData);
        setError(`File uploaded but metadata save failed: ${errorData.error || 'Unknown error'}`);
      } else {
        const metadataResult = await metadataResponse.json();
        console.log("Metadata save result:", metadataResult);
        
        if (metadataResult.pendingMetadata) {
          console.log("Metadata will be saved after organization setup");
        }
      }

      // Update document status to completed
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === tempId ? { ...doc, status: "completed" } : doc
        )
      );
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      
      // Update document status to failed
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === tempId ? { ...doc, status: "failed" } : doc
        )
      );
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case "FSSAI_LICENSE":
        return "FSSAI License";
      case "GST_CERTIFICATE":
        return "GST Certificate";
      case "OTHER":
        return "Other Document";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Upload Documents</h2>
        <p className="text-sm text-gray-600">
          Upload your business documents like FSSAI license, GST certificate, etc.
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="documentType">Document Type</Label>
          <Select
            value={documentType}
            onValueChange={(value) => setDocumentType(value as DocumentType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FSSAI_LICENSE">FSSAI License</SelectItem>
              <SelectItem value="GST_CERTIFICATE">GST Certificate</SelectItem>
              <SelectItem value="OTHER">Other Document</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Select File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
            {uploading && (
              <span className="text-sm text-gray-500">Uploading...</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Accepted formats: PDF, PNG, JPEG (Max 10MB)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Uploaded Documents</h3>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                      doc.status === "completed"
                        ? "bg-green-100"
                        : doc.status === "failed"
                        ? "bg-red-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {doc.status === "completed"
                      ? "✓"
                      : doc.status === "failed"
                      ? "✗"
                      : "⏳"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{doc.fileName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{getDocumentTypeLabel(doc.documentType)}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  {doc.status === "completed" && (
                    <span className="text-xs text-green-600 font-medium">
                      Uploaded
                    </span>
                  )}
                  {doc.status === "failed" && (
                    <span className="text-xs text-red-600 font-medium">
                      Failed
                    </span>
                  )}
                  {doc.status === "uploading" && (
                    <span className="text-xs text-blue-600 font-medium">
                      Uploading...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📋 Document Upload Guidelines
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Upload clear, readable copies of your documents</li>
          <li>Ensure all text and details are visible</li>
          <li>FSSAI License and GST Certificate are recommended for compliance</li>
          <li>Files are securely stored and encrypted</li>
        </ul>
      </div>
    </div>
  );
}