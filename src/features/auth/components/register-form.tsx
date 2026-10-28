"use client";

import * as React from "react";
import Link from "next/link";
import { registerAction } from "@/features/auth/actions";
import { registerSchema, type RegisterFormData } from "../validation";
import { PROJECT_INTEREST_CHOICES, type ProjectInterestCode } from "@/features/membership/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";

export function RegisterForm() {
  const [mounted, setMounted] = React.useState(false);
  const [formData, setFormData] = React.useState<RegisterFormData>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneHome: "",
    phoneCell: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "MI",
    zipCode: "",
    birthMonth: undefined,
    birthDay: undefined,
    spouseFirstName: "",
    masterGardener: false,
    directoryOptOut: false,
    gardeningInterests: "",
    volunteerExperience: "",
    interestsExperience: "",
    projectInterests: [],
    password: "",
    passwordConfirmation: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userModifiedUsername, setUserModifiedUsername] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-8" aria-busy="true">
        <section className="space-y-4">
          <div className="h-6 w-56 bg-muted/40 rounded border-b border-border pb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted/40 rounded" />
              <div className="h-10 w-full rounded-md border border-input bg-background/50" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted/40 rounded" />
              <div className="h-10 w-full rounded-md border border-input bg-background/50" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-muted/40 rounded" />
              <div className="h-10 w-full rounded-md border border-input bg-background/50" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted/40 rounded" />
              <div className="h-10 w-full rounded-md border border-input bg-background/50" />
            </div>
          </div>
        </section>
        <section className="space-y-4">
          <div className="h-6 w-64 bg-muted/40 rounded border-b border-border pb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-10 w-full rounded-md border border-input bg-background/50" />
            <div className="h-10 w-full rounded-md border border-input bg-background/50" />
          </div>
        </section>
        <div className="h-12 w-48 rounded-md bg-primary/20" />
      </div>
    );
  }

  if (submittedEmail) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Registration Submitted Successfully!
            </h2>
            <p className="text-sm text-muted-foreground">
              Your member profile has been created and is pending confirmation.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-5 border border-border space-y-4 text-sm text-foreground">
          <h3 className="font-semibold text-foreground">Next Steps for Membership:</h3>
          <ol className="list-decimal list-inside space-y-2.5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Verify Your Email:</strong> We've sent a
              confirmation link to <strong className="text-primary">{submittedEmail}</strong>.
              Please check your inbox and confirm your address.
            </li>
            <li>
              <strong className="text-foreground">Annual Dues Payment:</strong> Sign in to the
              member portal to complete your $50 annual dues payment (by card or offline check).
            </li>
            <li>
              <strong className="text-foreground">Officer Verification:</strong> Club leadership
              will review and approve your membership once dues payment is received.
            </li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/login?registered=true"
            className="inline-flex justify-center items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Proceed to Member Sign In &rarr;
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center items-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleProjectToggle = (code: ProjectInterestCode) => {
    setFormData((prev) => {
      const exists = prev.projectInterests.includes(code);
      const updated = exists
        ? prev.projectInterests.filter((c) => c !== code)
        : [...prev.projectInterests, code];
      return { ...prev, projectInterests: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage(null);

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append("username", formData.username);
      formPayload.append("firstName", formData.firstName);
      formPayload.append("lastName", formData.lastName);
      formPayload.append("email", formData.email);
      formPayload.append("password", formData.password);
      formPayload.append("passwordConfirmation", formData.passwordConfirmation);
      if (formData.phoneHome) formPayload.append("phoneHome", formData.phoneHome);
      if (formData.phoneCell) formPayload.append("phoneCell", formData.phoneCell);
      if (formData.addressLine1) formPayload.append("addressLine1", formData.addressLine1);
      if (formData.addressLine2) formPayload.append("addressLine2", formData.addressLine2);
      if (formData.city) formPayload.append("city", formData.city);
      if (formData.state) formPayload.append("state", formData.state);
      if (formData.zipCode) formPayload.append("zipCode", formData.zipCode);
      if (formData.birthMonth) formPayload.append("birthMonth", String(formData.birthMonth));
      if (formData.birthDay) formPayload.append("birthDay", String(formData.birthDay));
      if (formData.spouseFirstName) formPayload.append("spouseFirstName", formData.spouseFirstName);
      if (formData.masterGardener) formPayload.append("masterGardener", "true");
      if (formData.directoryOptOut) formPayload.append("directoryOptOut", "true");
      if (formData.gardeningInterests)
        formPayload.append("gardeningInterests", formData.gardeningInterests);
      if (formData.volunteerExperience)
        formPayload.append("volunteerExperience", formData.volunteerExperience);
      if (formData.interestsExperience)
        formPayload.append("interestsExperience", formData.interestsExperience);
      for (const code of formData.projectInterests) {
        formPayload.append("projectInterests", code);
      }

      const res = await registerAction(formPayload);
      if (!res.success) {
        setErrorMessage(res.error);
        if (res.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            if (v?.[0]) mapped[k] = v[0];
          }
          setErrors(mapped);
        }
      } else {
        setSubmittedEmail(formData.email);
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {errorMessage && (
        <div
          className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* Account Identity */}
      <section className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground border-b border-border pb-2">
          Account Login Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-username" required>
              Club User Handle
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold font-mono text-muted-foreground select-none">
                @
              </span>
              <Input
                id="reg-username"
                value={formData.username}
                onChange={(e) => {
                  setUserModifiedUsername(true);
                  setFormData({
                    ...formData,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                  });
                }}
                placeholder="e.g. daisy"
                error={errors.username}
                className="pl-7 font-mono font-medium"
                aria-describedby={errors.username ? "username-error" : undefined}
              />
            </div>
            {errors.username ? (
              <p id="username-error" className="mt-1 text-xs text-destructive">
                {errors.username}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                Defaults to your first name. You can customize your handle now or update it anytime
                in your profile.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reg-email" required>
              Email Address
            </Label>
            <Input
              id="reg-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="daisy@example.com"
              error={errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-password" required>
              Password{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (Min. 12 characters)
              </span>
            </Label>
            <Input
              id="reg-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••"
              error={errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-xs text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reg-confirm-password" required>
              Confirm Password
            </Label>
            <Input
              id="reg-confirm-password"
              type="password"
              value={formData.passwordConfirmation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  passwordConfirmation: e.target.value,
                })
              }
              placeholder="••••••••••••"
              error={errors.passwordConfirmation}
              aria-describedby={errors.passwordConfirmation ? "confirm-error" : undefined}
            />
            {errors.passwordConfirmation && (
              <p id="confirm-error" className="mt-1 text-xs text-destructive">
                {errors.passwordConfirmation}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Member Personal Details */}
      <section className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground border-b border-border pb-2">
          Member Contact & Address Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-firstname" required>
              First Name
            </Label>
            <Input
              id="reg-firstname"
              value={formData.firstName}
              onChange={(e) => {
                const newFirst = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  firstName: newFirst,
                  username: userModifiedUsername
                    ? prev.username
                    : newFirst.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                }));
              }}
              placeholder="Daisy"
              error={errors.firstName}
              aria-describedby={errors.firstName ? "firstname-error" : undefined}
            />
            {errors.firstName && (
              <p id="firstname-error" className="mt-1 text-xs text-destructive">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reg-lastname" required>
              Last Name
            </Label>
            <Input
              id="reg-lastname"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Miller"
              error={errors.lastName}
              aria-describedby={errors.lastName ? "lastname-error" : undefined}
            />
            {errors.lastName && (
              <p id="lastname-error" className="mt-1 text-xs text-destructive">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-phone-home">Home Phone</Label>
            <Input
              id="reg-phone-home"
              type="tel"
              value={formData.phoneHome || ""}
              onChange={(e) => setFormData({ ...formData, phoneHome: e.target.value })}
              placeholder="(269) 555-0123"
            />
          </div>

          <div>
            <Label htmlFor="reg-phone-cell">Cell Phone</Label>
            <Input
              id="reg-phone-cell"
              type="tel"
              value={formData.phoneCell || ""}
              onChange={(e) => setFormData({ ...formData, phoneCell: e.target.value })}
              placeholder="(269) 555-0199"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reg-address1">Street Address</Label>
          <Input
            id="reg-address1"
            value={formData.addressLine1 || ""}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            placeholder="123 Center Street"
          />
        </div>

        <div>
          <Label htmlFor="reg-address2">Address Line 2 (Apt, Suite, Unit)</Label>
          <Input
            id="reg-address2"
            value={formData.addressLine2 || ""}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            placeholder="Apt 4B"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="reg-city">City</Label>
            <Input
              id="reg-city"
              value={formData.city || ""}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Douglas"
            />
          </div>
          <div>
            <Label htmlFor="reg-state">State</Label>
            <Input
              id="reg-state"
              value={formData.state || "MI"}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="MI"
            />
          </div>
          <div>
            <Label htmlFor="reg-zip">ZIP Code</Label>
            <Input
              id="reg-zip"
              value={formData.zipCode || ""}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="49406"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-spouse">Spouse First Name</Label>
            <Input
              id="reg-spouse"
              value={formData.spouseFirstName || ""}
              onChange={(e) => setFormData({ ...formData, spouseFirstName: e.target.value })}
              placeholder="Robert"
            />
          </div>

          <div>
            <Label>
              Birthday{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (Month & Day only; year is not collected)
              </span>
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <label htmlFor="reg-birth-month" className="sr-only">
                  Birth Month
                </label>
                <Select
                  id="reg-birth-month"
                  value={formData.birthMonth ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      birthMonth: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                >
                  <option value="">Month</option>
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="reg-birth-day" className="sr-only">
                  Birth Day
                </label>
                <Input
                  id="reg-birth-day"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Day (1-31)"
                  value={formData.birthDay ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      birthDay: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  error={errors.birthDay}
                />
              </div>
            </div>
            {errors.birthDay && <p className="mt-1 text-xs text-destructive">{errors.birthDay}</p>}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Checkbox
            id="reg-master-gardener"
            label="I am a certified Master Gardener"
            checked={formData.masterGardener}
            onChange={(e) => setFormData({ ...formData, masterGardener: e.target.checked })}
          />
          <Checkbox
            id="reg-directory-opt-out"
            label="Keep my contact information private (do not list me in the Member Directory)"
            checked={formData.directoryOptOut}
            onChange={(e) => setFormData({ ...formData, directoryOptOut: e.target.checked })}
          />
        </div>

        <div>
          <Label htmlFor="reg-gardening-interests">Gardening Interests</Label>
          <Textarea
            id="reg-gardening-interests"
            rows={2}
            value={formData.gardeningInterests || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                gardeningInterests: e.target.value,
              })
            }
            placeholder="Tell us what you enjoy growing, favorite plants, or personal gardening hobbies."
          />
        </div>

        <div>
          <Label htmlFor="reg-volunteer-experience">Work & Volunteer Experience</Label>
          <Textarea
            id="reg-volunteer-experience"
            rows={2}
            value={formData.volunteerExperience || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                volunteerExperience: e.target.value,
              })
            }
            placeholder="Professional background, prior committee or volunteer work, or skills you'd love to share!"
          />
        </div>
      </section>

      {/* 8 Project Choices */}
      <section className="space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            Club Projects & Volunteer Interests
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select the club programs you would like to participate in:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4">
          {PROJECT_INTEREST_CHOICES.map((choice) => (
            <Checkbox
              key={choice.code}
              id={`choice-${choice.code}`}
              label={choice.label}
              checked={formData.projectInterests.includes(choice.code)}
              onChange={() => handleProjectToggle(choice.code)}
            />
          ))}
        </div>
      </section>

      {/* Dues terms acknowledgment */}
      <div className="rounded-xl bg-muted/40 p-4 border border-border text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">Annual Membership Dues & Approval Policy:</p>
        <p>
          SDGC membership dues are $50 per calendar year (January 1 – December 31). In accordance
          with club bylaws, membership activation requires manual verification and approval by club
          leadership even after payment.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
        {isSubmitting ? "Creating Profile..." : "Submit Member Profile & Application"}
      </Button>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        Already have a member account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign In Here &rarr;
        </Link>
      </div>
    </form>
  );
}
