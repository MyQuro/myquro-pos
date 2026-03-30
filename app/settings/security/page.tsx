import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SecurityClient from "@/app/settings/security/security-client";

export default async function SecuritySettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Security</h1>
        <p className="text-neutral-500 font-medium font-['Lexend']">Manage your password, authentication methods, and active sessions.</p>
      </div>

      <SecurityClient session={session} />
    </div>
  );
}
