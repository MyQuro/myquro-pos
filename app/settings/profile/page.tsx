import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ProfileClient from "./profile-client";

export default async function ProfileSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Profile Settings</h1>
        <p className="text-neutral-500 font-medium font-['Lexend']">Manage your personal information and how it appears across the platform.</p>
      </div>

      {session?.user && <ProfileClient user={session.user} />}
    </div>
  );
}
