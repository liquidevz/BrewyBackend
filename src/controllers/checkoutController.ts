import { Request, Response } from "express";
import z from "zod";
import ShiprocketCheckoutService from "../services/shiprocketCheckout";

class CheckoutController {
  private static checkoutSchema = z.object({
    items: z
      .array(
        z.object({
          variant_id: z.string().min(1, "variant_id is required"),
          quantity: z.number().min(1, "Quantity must be at least 1"),
        }),
      )
      .min(1, "At least one item is required"),
    redirect_url: z.string().min(1, "redirect_url is required"),
  });

  static checkout = (req: Request, res: Response) => {
    const result = this.checkoutSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { items } = result.data;

    ShiprocketCheckoutService.checkout(items, req.body.redirect_url)
      .then((result) => {
        return res.status(200).json(result);
      })
      .catch((error) => {
        return res.status(500).json({
          message: "Internal server error",
          error: error.message,
          stack: error.stack,
        });
      });
  };
}

export default CheckoutController;
