import * as React from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Member Login",
  description: "Sign in to the Saugatuck Douglas Garden Club member area.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wide">
          Member Portal
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight">
          Sign In to Your Account
        </h1>
        <p className="text-xs text-muted-foreground">
          Enter your username or email address and password below.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <React.Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/40" />}>
          <LoginForm />
        </React.Suspense>
      </div>
    </div>
  );
}
