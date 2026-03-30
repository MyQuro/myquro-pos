import React from "react";
import { Email, Phone, Mobile, CheckmarkOutline } from "@carbon/icons-react";
import { Button } from "@/components/ui/button";

export default function NotificationsSettingsPage() {
  const notificationGroups = [
    {
      title: "Orders & Activity",
      description: "Stay updated on your store's movement.",
      items: [
        { label: "New Order Alerts", description: "Get notified when a new order is placed.", email: true, push: true, sms: false },
        { label: "Payment Success", description: "Confirmation when a transaction is completed.", email: true, push: false, sms: true },
        { label: "Inventory Low", description: "Alerts when stock levels fall below thresholds.", email: true, push: true, sms: false },
      ]
    },
    {
      title: "Security & Account",
      description: "Critical updates regarding your security.",
      items: [
        { label: "New Login Detected", description: "Alert when your account is logged into from a new device.", email: true, push: true, sms: true },
        { label: "Password Changed", description: "Confirmation after any security modification.", email: true, push: false, sms: false },
      ]
    }
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Notifications</h1>
        <p className="text-neutral-500 font-medium font-['Lexend']">Control how and when you receive updates from the system.</p>
      </div>

      <div className="space-y-8">
        {notificationGroups.map((group, idx) => (
          <div key={idx} className="space-y-6">
            <div className="px-1">
              <h3 className="font-bold text-lg text-white mb-1">{group.title}</h3>
              <p className="text-[13px] text-neutral-500 font-medium">{group.description}</p>
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-2xl">
              {group.items.map((item, itemIdx) => (
                <div 
                  key={itemIdx} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-6 ${
                    itemIdx !== group.items.length - 1 ? 'border-b border-neutral-800/50' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-bold text-[14px] text-neutral-100">{item.label}</p>
                    <p className="text-[12px] text-neutral-600 font-medium max-w-sm">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <NotificationToggle icon={<Email size={18} />} active={item.email} label="Email" />
                    <NotificationToggle icon={<Mobile size={18} />} active={item.push} label="Push" />
                    <NotificationToggle icon={<Phone size={18} />} active={item.sms} label="SMS" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button className="px-10 h-14 bg-white hover:bg-neutral-200 text-black rounded-[24px] font-bold uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all active:scale-95 leading-none">
           Save Preferences
        </Button>
      </div>
    </div>
  );
}

function NotificationToggle({ icon, active, label }: { icon: React.ReactNode, active: boolean, label: string }) {
  return (
    <button className={`size-10 rounded-xl border flex items-center justify-center transition-all ${
      active 
        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
        : 'bg-neutral-950 border-neutral-800 text-neutral-700 hover:border-neutral-700'
    }`} title={label}>
      {icon}
    </button>
  );
}
