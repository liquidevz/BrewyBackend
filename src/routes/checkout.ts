import express, { Request, Response } from "express";
import CheckoutController from "../controllers/checkoutController";
import Product from "../models/Product";
import { generateAccessToken } from "../services/shiprocketCheckout";

const router = express.Router();

router.post("/", CheckoutController.checkout);

/**
 * @swagger
 * /api/checkout/generate-token:
 *   post:
 *     tags:
 *       - Checkout
 *     summary: Generate Shiprocket Checkout access token
 *     description: Generates an access token for initiating Shiprocket Checkout. Validates cart items and creates a checkout session with HMAC authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cart_data
 *               - redirect_url
 *             properties:
 *               cart_data:
 *                 type: object
 *                 properties:
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         variant_id:
 *                           type: string
 *                           example: prod_grape
 *                         quantity:
 *                           type: integer
 *                           example: 2
 *               redirect_url:
 *                 type: string
 *                 example: https://yourdomain.com/checkout/success
 *     responses:
 *       200:
 *         description: Checkout token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 message:
 *                   type: string
 *                   example: Checkout token generated successfully
 *       400:
 *         description: Missing required fields or invalid product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to generate checkout token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate-token', async (req: Request, res: Response) => {
    try {
        const { cart_data, redirect_url } = req.body;

        if (!cart_data || !cart_data.items || !redirect_url) {
            return res.status(400).json({ error: 'Missing required fields: cart_data and redirect_url' });
        }

        // Validate that all products exist
        for (const item of cart_data.items) {
            const product = await Product.findOne({
                $or: [
                    { id: item.variant_id },
                    { 'variants.id': item.variant_id }
                ]
            });

            if (!product) {
                return res.status(404).json({ error: `Product with variant ID ${item.variant_id} not found` });
            }

            if (!product.availableForSale) {
                return res.status(400).json({ error: `Product ${product.name} is not available for sale` });
            }
        }

        // Generate access token
        const result = await generateAccessToken({
            cart_data,
            redirect_url,
            timestamp: new Date().toISOString()
        });

        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Failed to generate checkout token' });
        }

        res.json({
            success: true,
            token: result.token,
            message: 'Checkout token generated successfully'
        });
    } catch (error) {
        console.error('Error generating checkout token:', error);
        res.status(500).json({ error: 'Failed to generate checkout token' });
    }
});

export default router;
