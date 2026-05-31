import { z } from "zod";

export const ticketPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const createTicketSchema = z
  .object({
    title: z.string().trim().min(5, "Title must be at least 5 characters.").max(160, "Title must be 160 characters or fewer."),
    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters.")
      .max(5000, "Description must be 5000 characters or fewer."),
    priority: ticketPrioritySchema
  })
  .strict();

export const createCommentSchema = z
  .object({
    body: z.string().trim().min(2, "Comment must be at least 2 characters.").max(4000, "Comment must be 4000 characters or fewer."),
    is_internal_note: z.boolean().optional().default(false)
  })
  .strict();

export const ticketIdParamSchema = z.coerce.number().int().positive();

export function computeSlaDueAt(priority, now = new Date()) {
  const hoursByPriority = {
    critical: 1,
    high: 4,
    medium: 24,
    low: 48
  };

  const hours = hoursByPriority[priority];
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}
