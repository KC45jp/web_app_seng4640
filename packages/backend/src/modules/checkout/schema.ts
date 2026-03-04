import { z } from "zod";
import type { CheckoutInput } from "@seng4640/shared";

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["credit_card", "paypal"]),
}) satisfies z.ZodType<CheckoutInput>;

export type { CheckoutInput };
