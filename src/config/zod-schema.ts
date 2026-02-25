import { z } from "zod";

export const OpenClawSchema = z
  .object({
    $schema: z.string().optional(),
    meta: z
      .object({
        lastTouchedVersion: z.string().optional(),
        lastTouchedAt: z.string().optional(),
      })
      .strict()
      .optional(),
    gateway: z.any().optional(),
    mesh: z.any().optional(),
    auth: z.any().optional(),
    logging: z.any().optional(),
    discovery: z.any().optional(),
  })
  .passthrough(); // Allow other fields for now to avoid breaking existing configs
