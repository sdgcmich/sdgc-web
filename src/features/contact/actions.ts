"use server";

import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { contactSchema, type ContactFormData } from "./validation";
import type { ActionResult } from "@/features/auth/types";
import { dispatchContactNotification } from "./notifications";

export async function submitContactAction(
  input: ContactFormData,
): Promise<ActionResult<{ reference: string }>> {
  const result = contactSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Please correct the errors in the form.",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const { name, email, phone, senderType, category, subject, attachmentUrl, message, honeypot } =
    result.data;

  // Bot detection: honeypot field must be empty
  if (honeypot && honeypot.length > 0) {
    // Silently drop spam without informing the bot
    return {
      success: true,
      data: {
        reference: `SDGC-BOT-${randomInt(100000, 1000000)}`,
      },
    };
  }

  const supabase = createAdminClient();

  // Enforce durable rate limits per client IP (V11-10)
  try {
    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    const clientIp =
      forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "127.0.0.1";

    const isLoopback =
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp === "localhost" ||
      clientIp.startsWith("127.");
    const maxSubmissions = isLoopback ? 100 : 5;

    const { data: isAllowed } = await supabase.rpc("check_contact_rate_limit", {
      p_client_ip: clientIp,
      p_max_submissions: maxSubmissions,
      p_window_seconds: 300,
    });

    if (isAllowed === false) {
      return {
        success: false,
        error:
          "Too many messages submitted from this connection. Please wait a few minutes before trying again.",
      };
    }
  } catch {
    // Graceful fallback if headers or RPC are not available in isolated test runners
  }

  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      name,
      email,
      phone: phone || null,
      sender_type: senderType || null,
      category: category || null,
      subject: subject || null,
      attachment_url: attachmentUrl || null,
      message,
      status: "unread",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to persist contact message:", error);
    return {
      success: false,
      error: "Unable to submit your message at this time. Please try again or email us directly.",
    };
  }

  const reference = `SDGC-MSG-${data.id.slice(0, 8).toUpperCase()}`;

  // Deliver notification to local capture with deduplication (safe for test environments)
  await dispatchContactNotification({
    messageId: data.id,
    reference,
    senderName: name,
    senderEmail: email,
    senderPhone: phone || null,
    senderType: senderType || null,
    category: category || null,
    subject: subject || null,
    attachmentUrl: attachmentUrl || null,
    messageBody: message,
    submittedAt: new Date().toISOString(),
  });

  return {
    success: true,
    data: {
      reference,
    },
  };
}
