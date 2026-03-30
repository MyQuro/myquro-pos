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
import { 
  CloudUpload, 
  Document, 
  CheckmarkOutline, 
  Error, 
  Information,
  Download,
  InformationSquare
} from "@carbon/icons-react";
import { cn } from "@/lib/utils";

type DocumentType = "FSSAI_LICENSE" | "GST_CERTIFICATE" | "OTHER";

interface UploadedDocument {
  id: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  status: "uploading" | "completed" | "failed";
}

interface UploadDocumentsProps {
  onUploadComplete?: (doc: {
    documentType: string;
    fileName: string;
    fileMimeType: string;
    fileSize: number;
    storageKey: string;
  }) => void;
}

export default function UploadDocuments({ onUploadComplete }: UploadDocumentsProps) {
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const uploadResponse = await fetch(
        "/api/organization/documents/presign-upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const uploadData = await uploadResponse.json();
      const { objectKey, fileName, fileSize } = uploadData;

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

      if (!metadataResponse.ok) {
        throw new Error("Failed to save metadata");
      }

      const metadataResult = await metadataResponse.json();
      
      if (metadataResult.pendingMetadata) {
        onUploadComplete?.({
          documentType,
          fileName,
          fileMimeType: file.type,
          fileSize,
          storageKey: objectKey,
        });
      }

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === tempId ? { ...doc, status: "completed" } : doc
        )
      );
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === tempId ? { ...doc, status: "failed" } : doc
        )
      );
    } finally {
      setUploading(false);
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
      case "FSSAI_LICENSE": return "FSSAI License";
      case "GST_CERTIFICATE": return "GST Certificate";
      case "OTHER": return "Other Document";
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight">Verification Documents</h2>
        <p className="text-sm text-neutral-500 font-medium">
          Upload essential business documents for faster verification.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] p-8 backdrop-blur-sm shadow-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as DocumentType)}
            >
              <SelectTrigger className="bg-neutral-950 border-neutral-800 h-12 rounded-xl text-white focus:ring-1 focus:ring-white/20 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="FSSAI_LICENSE">FSSAI License</SelectItem>
                <SelectItem value="GST_CERTIFICATE">GST Certificate</SelectItem>
                <SelectItem value="OTHER">Other Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Select File</Label>
            <div className="relative group">
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 h-12"
              />
              <div className={cn(
                "h-12 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center px-4 gap-3 text-neutral-400 group-hover:border-neutral-700 transition-all",
                uploading && "opacity-50"
              )}>
                <CloudUpload size={20} className={cn(uploading && "animate-bounce")} />
                <span className="text-[13px] font-medium leading-none">
                  {uploading ? "Uploading sequence..." : "Choose PDF or Image"}
                </span>
                <div className="ml-auto px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                  Browse
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[13px] font-medium"
          >
            <Error size={18} />
            {error}
          </motion.div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-4">
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
             {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-[28px] hover:bg-neutral-900/80 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-lg",
                      doc.status === 'completed' ? "bg-green-500/10 border-green-500/30 text-green-400" :
                      doc.status === 'failed' ? "bg-red-500/10 border-red-500/30 text-red-400" :
                      "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    )}>
                      {doc.status === 'completed' ? <CheckmarkOutline size={22} /> :
                       doc.status === 'failed' ? <Error size={22} /> :
                       <Document size={22} className="animate-pulse" />}
                    </div>
                    <div>
                      <p className="font-bold text-[14px] text-neutral-100 tracking-tight">{doc.fileName}</p>
                      <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">
                        {getDocumentTypeLabel(doc.documentType)} • {formatFileSize(doc.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-neutral-950 border border-neutral-800 text-neutral-500">
                    {doc.status}
                  </div>
                </motion.div>
             ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-neutral-900/20 border-2 border-dashed border-neutral-800/50 rounded-[40px]">
             <div className="size-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-700 mx-auto mb-6">
                <Document size={32} />
             </div>
             <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-600">Pending Secure Upload</p>
          </div>
        )}
      </div>

      {/* Guidelines */}
      <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[32px] flex gap-4 items-start">
         <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
            <InformationSquare size={20} />
         </div>
         <div className="space-y-2">
            <h4 className="text-[13px] font-bold text-blue-400 uppercase tracking-widest">Upload Guidelines</h4>
            <ul className="text-[13px] text-neutral-500 font-medium leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
               <li className="flex items-center gap-2">
                  <div className="size-1 bg-blue-500/40 rounded-full" /> Max file size: 10MB
               </li>
               <li className="flex items-center gap-2">
                  <div className="size-1 bg-blue-500/40 rounded-full" /> Formats: PDF, PNG, JPG
               </li>
               <li className="flex items-center gap-2">
                  <div className="size-1 bg-blue-500/40 rounded-full" /> Clear, readable scan
               </li>
               <li className="flex items-center gap-2">
                  <div className="size-1 bg-blue-500/40 rounded-full" /> Secure encryption
               </li>
            </ul>
         </div>
      </div>
    </div>
  );
}