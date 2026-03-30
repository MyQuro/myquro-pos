import React from "react";
import { View, Time, CheckmarkOutline, Information } from "@carbon/icons-react";
import { Button } from "@/components/ui/button";

export default function PreferencesSettingsPage() {
  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Preferences</h1>
        <p className="text-neutral-500 font-medium font-['Lexend']">Personalize your workspace and system behavior.</p>
      </div>

      <div className="space-y-8">
        {/* Appearance Section */}
        <div className="space-y-6">
           <div className="px-1 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                 <View size={20} />
              </div>
              <div>
                 <h3 className="font-bold text-lg text-white mb-0.5">Appearance</h3>
                 <p className="text-[13px] text-neutral-500 font-medium">Select your preferred visual style and interface theme.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ThemeCard label="System" icon={<View size={24} />} active />
              <ThemeCard label="Dark" icon={<View size={24} />} description="Deep OLED blacks" />
              <ThemeCard label="Light" icon={<View size={24} />} description="High visibility" />
           </div>
        </div>

        {/* Localization Section */}
        <div className="space-y-6">
           <div className="px-1 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <Time size={20} />
              </div>
              <div>
                 <h3 className="font-bold text-lg text-white mb-0.5">Localization</h3>
                 <p className="text-[13px] text-neutral-500 font-medium">Set your preferred time zone and regional formats.</p>
              </div>
           </div>

           <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] p-8 backdrop-blur-sm shadow-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">Default Time Zone</label>
                    <div className="bg-neutral-950 border border-neutral-800 h-12 rounded-xl flex items-center px-4 text-neutral-100 font-bold text-sm">
                       (GMT+05:30) India Standard Time (IST)
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 ml-1">DateFormat</label>
                    <div className="bg-neutral-950 border border-neutral-800 h-12 rounded-xl flex items-center px-4 text-neutral-100 font-bold text-sm">
                       DD / MM / YYYY
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button className="px-10 h-14 bg-white hover:bg-neutral-200 text-black rounded-[24px] font-bold uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all active:scale-95 leading-none">
           Apply Changes
        </Button>
      </div>
    </div>
  );
}

function ThemeCard({ label, icon, active, description }: { label: string, icon: React.ReactNode, active?: boolean, description?: string }) {
  return (
    <div className={`relative p-6 border rounded-[28px] transition-all duration-500 cursor-pointer group ${
      active 
        ? 'bg-neutral-900 border-neutral-700 shadow-2xl' 
        : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
    }`}>
       {active && (
          <div className="absolute top-4 right-4 size-6 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg">
             <CheckmarkOutline size={14} />
          </div>
       )}
       <div className={`size-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
         active ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-950 text-neutral-700 group-hover:text-neutral-400'
       }`}>
          {icon}
       </div>
       <h4 className="font-bold text-lg text-neutral-100 mb-1">{label}</h4>
       <p className="text-[12px] text-neutral-600 font-medium uppercase tracking-widest">{description || 'Default preference'}</p>
    </div>
  );
}
