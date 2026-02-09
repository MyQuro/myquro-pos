"use client";

import { authClient } from "@/lib/auth-client";

type SignInInput = {
  email: string;
  password: string;
};

export async function signIn({ email, password }: SignInInput) {
  const { data, error } = await authClient.signIn.email(
    {
      email,
      password,
      callbackURL: "/setup", // your onboarding gate
      rememberMe: false,       // explicit, matches docs
    },
    {
      onRequest: () => {
        // optional: show loading indicator
        console.log("Signing in...");
      },

      onSuccess: () => {
        // redirect handled automatically by callbackURL
        console.log("Sign in successful");
      },

      onError: (ctx) => {
        console.error("Sign in error:", ctx.error);
        alert(ctx.error.message);
      },
    }
  );

  return { data, error };
}
