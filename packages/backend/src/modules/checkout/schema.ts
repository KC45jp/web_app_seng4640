import { z } from "zod";

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["credit_card", "paypal"]).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
