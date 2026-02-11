"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function OrgDetail({
  data,
}: {
  data: {
    organization: any;
    owner: any;
    compliance: any;
    documents: any[];
  };
}) {
  const { organization, owner, compliance, documents } = data;
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  const handleViewDocument = async (documentId: string, fileName: string) => {
    setLoadingDoc(documentId);
    try {
      const response = await fetch(
        `/api/organization/documents/view?documentId=${documentId}`
      );

      if (!response.ok) {
        throw new Error("Failed to get document URL");
      }

      const { url } = await response.json();

      // Open in new tab
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error viewing document:", error);
      alert("Failed to view document");
    } finally {
      setLoadingDoc(null);
    }
  };

  const formatFileSize = (sizeStr: string) => {
    const bytes = parseInt(sizeStr);
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "FSSAI_LICENSE":
        return "FSSAI License";
      case "GST_CERTIFICATE":
        return "GST Certificate";
      case "OTHER":
        return "Other Document";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{organization.name}</h1>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <section>
          <h2 className="text-lg font-medium mb-2">Business Information</h2>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Address:</span> {organization.address}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">City:</span> {organization.city}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  organization.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : organization.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {organization.status}
              </span>
            </p>
          </div>
        </section>

        <hr />

        <section>
          <h2 className="text-lg font-medium mb-2">Owner Details</h2>
          {owner ? (
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Name:</span> {owner.ownerName}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Phone:</span> {owner.countryCode}{" "}
                {owner.phone}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No owner information</p>
          )}
        </section>

        <hr />

        <section>
          <h2 className="text-lg font-medium mb-2">Compliance Information</h2>
          {compliance ? (
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">FSSAI Type:</span>{" "}
                {compliance.fssaiType}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">FSSAI Number:</span>{" "}
                {compliance.fssaiNumber}
              </p>
              {compliance.gstin && (
                <p className="text-gray-600">
                  <span className="font-medium">GSTIN:</span> {compliance.gstin}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No compliance information</p>
          )}
        </section>

        <hr />

        <section>
          <h2 className="text-lg font-medium mb-3">Uploaded Documents</h2>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                      📄
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{getDocumentTypeLabel(doc.documentType)}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDocument(doc.id, doc.fileName)}
                    disabled={loadingDoc === doc.id}
                  >
                    {loadingDoc === doc.id ? "Loading..." : "View"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
