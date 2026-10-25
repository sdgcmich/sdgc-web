import { z } from "zod";

export const ticketCheckoutSchema = z.object({
  eventId: z.string().min(1, "Please select an event."),
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "You must order at least 1 ticket.")
    .max(20, "Maximum 20 tickets per order."),
  purchaserName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),
  purchaserEmail: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(150, "Email cannot exceed 150 characters."),
  purchaserPhone: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(500).optional(),
});
