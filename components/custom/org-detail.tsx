"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Building, 
  User, 
  CheckmarkOutline, 
  Document, 
  DocumentView, 
  Phone, 
  Location, 
  Identification,
  Information,
  Download
} from "@carbon/icons-react";
import { cn } from "@/lib/utils";

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
    if (isNaN(bytes)) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "FSSAI_LICENSE": return "FSSAI License";
      case "GST_CERTIFICATE": return "GST Certificate";
      case "OTHER": return "Other Document";
      default: return type;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-6 py-10 pb-32">
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6"
      >
        <div className="size-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <Building size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-50">{organization.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
              <Location size={14} /> {organization.city}
            </span>
            <div className={cn(
               "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
               organization.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
               organization.status === 'PENDING' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
               'bg-red-500/10 text-red-400 border-red-500/20'
            )}>
               {organization.status}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Info */}
        <InfoSection title="Business Profile" icon={<Information size={20} />}>
           <div className="space-y-4">
              <DataRow label="Address" value={organization.address} />
              <DataRow label="City" value={organization.city} />
              <DataRow label="Joined" value={organization.createdAtFormatted || "N/A"} />
           </div>
        </InfoSection>

        {/* Owner Details */}
        <InfoSection title="Ownership" icon={<User size={20} />}>
           {owner ? (
             <div className="space-y-4">
               <DataRow label="Principal Owner" value={owner.ownerName} />
               <DataRow label="Contact Phone" value={`${owner.countryCode} ${owner.phone}`} />
             </div>
           ) : (
             <p className="text-sm text-neutral-600">Documentation missing</p>
           )}
        </InfoSection>

        {/* Compliance */}
        <InfoSection title="Compliance & Tax" icon={<Identification size={20} />} className="md:col-span-2">
           {compliance ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
               <DataRow label="FSSAI License Type" value={compliance.fssaiType} />
               <DataRow label="FSSAI Number" value={compliance.fssaiNumber} />
               <DataRow label="GSTIN" value={compliance.gstin || "Not provided"} />
             </div>
           ) : (
             <p className="text-sm text-neutral-600">No compliance data submitted</p>
           )}
        </InfoSection>

        {/* Documents */}
        <InfoSection title="Verification Documents" icon={<Document size={20} />} className="md:col-span-2">
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl hover:bg-neutral-900 group transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-blue-400 transition-colors">
                        <Download size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-neutral-200 group-hover:text-white transition-colors tracking-tight truncate max-w-[140px]">{doc.fileName}</p>
                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">
                          {getDocumentTypeLabel(doc.documentType)} • {formatFileSize(doc.fileSize)} • {doc.uploadedAtFormatted}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocument(doc.id, doc.fileName)}
                      disabled={loadingDoc === doc.id}
                      className="bg-neutral-950 border-neutral-800 h-9 rounded-xl px-4 text-[11px] font-bold uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 hover:text-black hover:border-transparent transition-all active:scale-95 shadow-lg"
                    >
                      {loadingDoc === doc.id ? (
                        <div className="size-3 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Preview"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-neutral-900/30 border-2 border-dashed border-neutral-800 rounded-[32px] opacity-40">
                 <Document size={48} className="mx-auto mb-4 text-neutral-700" />
                 <p className="text-[11px] font-bold uppercase tracking-[0.2em]">No Documents Available</p>
              </div>
            )}
        </InfoSection>
      </div>
    </div>
  );
}

function InfoSection({ title, icon, children, className }: { title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] p-8 backdrop-blur-sm group hover:border-neutral-700/50 transition-all duration-500", className)}
    >
      <div className="flex items-center gap-3 mb-8">
         <div className="size-9 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 group-hover:text-neutral-300 transition-colors duration-500">
            {icon}
         </div>
         <h2 className="font-bold text-[14px] text-neutral-50 uppercase tracking-[0.25em]">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function DataRow({ label, value }: { label: string, value: string | null }) {
  return (
    <div className="space-y-1.5">
       <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{label}</p>
       <p className="text-[15px] font-medium text-neutral-200 tracking-tight leading-relaxed">{value || "N/A"}</p>
    </div>
  );
}
