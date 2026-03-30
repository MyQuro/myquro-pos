import React from "react";
import { Integration, CloudUpload, Email, Security, CheckmarkOutline, Error, ArrowRight } from "@carbon/icons-react";
import { Button } from "@/components/ui/button";

export default function IntegrationsSettingsPage() {
  const integrations = [
    {
      name: "Amazon S3",
      category: "Storage",
      description: "Secure cloud storage for verification documents and assets.",
      status: "connected",
      icon: <CloudUpload size={24} />,
      accent: "orange"
    },
    {
      name: "Resend",
      category: "Email",
      description: "Transactional email delivery for receipting and alerts.",
      status: "connected",
      icon: <Email size={24} />,
      accent: "blue"
    },
    {
      name: "Twilio",
      category: "SMS",
      description: "Mobile notifications and two-factor authentication.",
      status: "disconnected",
      icon: <Security size={24} />,
      accent: "red"
    },
    {
       name: "Stripe",
       category: "Payments",
       description: "Integrated payment processing for digital transactions.",
       status: "disconnected",
       icon: <Integration size={24} />,
       accent: "purple"
    }
  ];

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Integrations</h1>
        <p className="text-neutral-500 font-medium font-['Lexend']">Connect your workspace with third-party services and tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((app, idx) => (
          <div 
            key={idx} 
            className="group relative bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] p-8 backdrop-blur-sm shadow-2xl hover:bg-neutral-900/60 hover:border-neutral-700 transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`size-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-xl ${
                app.status === 'connected' 
                  ? 'bg-neutral-950 border-neutral-800 text-neutral-100 group-hover:border-neutral-700' 
                  : 'bg-neutral-950 border-neutral-800 text-neutral-700 opacity-60'
              }`}>
                {app.icon}
              </div>
              <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border ${
                app.status === 'connected'
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-neutral-950 text-neutral-600 border-neutral-800'
              }`}>
                {app.status}
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-white">{app.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 px-2 py-0.5 border border-neutral-800 rounded-md">{app.category}</span>
              </div>
              <p className="text-[14px] text-neutral-500 font-medium leading-relaxed">
                {app.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-neutral-800/50">
              {app.status === 'connected' ? (
                <button className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">Configure Settings</button>
              ) : (
                <button className="text-[11px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
                   Connect Service <ArrowRight size={14} />
                </button>
              )}
              
              {app.status === 'connected' && (
                <div className="flex items-center gap-2 text-green-400/60 text-[10px] font-bold uppercase tracking-widest">
                   <CheckmarkOutline size={14} /> Active
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-neutral-900/20 border-2 border-dashed border-neutral-800/50 rounded-[40px] flex flex-col items-center justify-center text-center py-16">
         <div className="size-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-700 mb-6">
            <Integration size={32} />
         </div>
         <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-600 mb-2">Request Custom Integration</h4>
         <p className="text-[13px] text-neutral-700 font-medium max-w-xs mx-auto mb-8">
            Can't find the service you need? Our team can build custom bridges for your enterprise tools.
         </p>
         <Button variant="outline" className="border-neutral-800 text-[11px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white rounded-2xl h-12 px-8">
            Contact Support
         </Button>
      </div>
    </div>
  );
}
