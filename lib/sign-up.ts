"use client";

import { authClient } from "@/lib/auth-client";

type SignUpInput = {
  email: string;
  password: string;
  name: string;
};

export async function signUp({ email, password, name }: SignUpInput) {
  const { data, error } = await authClient.signUp.email(
    {
      email,
      password,
      name,
      callbackURL: "/setup",
    },
    {
      onRequest: () => {
        // optional: set loading state
        console.log("Signing up...");
      },

      onSuccess: () => {
        // user is already signed in by default
        // redirect handled by callbackURL
        console.log("Signup successful");
      },

      onError: (ctx) => {
        console.error("Signup error:", ctx.error);
        alert(ctx.error.message);
      },
    }
  );

  return { data, error };
}
