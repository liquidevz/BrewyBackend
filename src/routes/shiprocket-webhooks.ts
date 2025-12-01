import express, { Request, Response } from 'express';
import crypto from 'crypto';
import Product from '../models/Product';
import Collection from '../models/Collection';

const router = express.Router();

/**
 * Shiprocket Webhook Handlers
 * These endpoints receive real-time updates from Shiprocket when catalog changes
 */

// HMAC verification middleware
const verifyHMAC = (req: Request, res: Response, next: any) => {
    try {
        const signature = req.header('X-Api-HMAC-SHA256');
        const apiKey = req.header('X-Api-Key');

        if (!signature || !apiKey) {
            return res.status(401).json({ error: 'Missing authentication headers' });
        }

        // Verify API key matches
        if (apiKey !== process.env.SHIPROCKET_API_KEY) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        // Calculate HMAC
        const payload = JSON.stringify(req.body);
        const calculatedHMAC = crypto
            .createHmac('sha256', process.env.SHIPROCKET_API_SECRET || '')
            .update(payload)
            .digest('hex');

        // Compare signatures
        if (calculatedHMAC !== signature) {
            return res.status(401).json({ error: 'Invalid HMAC signature' });
        }

        next();
    } catch (error) {
        console.error('HMAC verification error:', error);
        res.status(500).json({ error: 'Failed to verify webhook signature' });
    }
};

/**
 * @swagger
 * /api/shiprocket-webhooks/product:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Product update webhook from Shiprocket
 *     description: Receives real-time product updates from Shiprocket. Requires HMAC-SHA256 signature verification for authentication. Updates or creates products in the database.
 *     security:
 *       - ApiKeyAuth: []
 *       - HMACAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - title
 *               - updated_at
 *               - status
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 632910392
 *               title:
 *                 type: string
 *                 example: IPod Nano - 8GB
 *               body_html:
 *                 type: string
 *                 example: It's the small iPod
 *               vendor:
 *                 type: string
 *                 example: Apple
 *               product_type:
 *                 type: string
 *                 example: Electronics
 *               updated_at:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [active, draft]
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *               image:
 *                 type: object
 *                 properties:
 *                   src:
 *                     type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product updated successfully
 *                 productId:
 *                   type: string
 *       401:
 *         description: Missing authentication headers or invalid signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to process product webhook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/product', verifyHMAC, async (req: Request, res: Response) => {
    try {
        const productData = req.body;

        console.log('Received product webhook from Shiprocket:', productData.id);

        // Transform Shiprocket product format to DrinkBrewy format
        const updateData: any = {
            id: productData.id.toString(),
            name: productData.title,
            description: productData.body_html || '',
            flavor: productData.product_type || 'Beverages',
            updatedAt: new Date(productData.updated_at),
            availableForSale: productData.status === 'active'
        };

        // Process variants
        if (productData.variants && productData.variants.length > 0) {
            const primaryVariant = productData.variants[0];

            updateData.price = parseFloat(primaryVariant.price) || 0;
            updateData.stock = primaryVariant.quantity || 0;

            // Map all variants
            updateData.variants = productData.variants.map((variant: any) => ({
                id: variant.id.toString(),
                title: variant.title,
                price: parseFloat(variant.price) || 0,
                availableForSale: updateData.availableForSale,
                sku: variant.sku || variant.id.toString()
            }));

            // Set dimensions from variant weight
            if (primaryVariant.weight) {
                updateData.dimensions = {
                    length: 10,
                    breadth: 10,
                    height: 10,
                    weight: parseFloat(primaryVariant.weight) || 0.5
                };
            }

            // Set images from variant
            if (primaryVariant.image?.src) {
                updateData.images = [primaryVariant.image.src];
            }
        }

        // Set product image
        if (productData.image?.src && !updateData.images) {
            updateData.images = [productData.image.src];
        }

        // Generate handle from title if not exists
        if (!updateData.handle && updateData.name) {
            updateData.handle = updateData.name.toLowerCase().replace(/\s+/g, '-');
        }

        // Update or create product
        const product = await Product.findOneAndUpdate(
            { id: productData.id.toString() },
            updateData,
            { upsert: true, new: true, runValidators: false }
        );

        console.log('Product updated via webhook:', product.id);

        res.json({
            success: true,
            message: 'Product updated successfully',
            productId: product.id
        });
    } catch (error) {
        console.error('Error processing product webhook:', error);
        res.status(500).json({ error: 'Failed to process product webhook' });
    }
});

/**
 * @swagger
 * /api/shiprocket-webhooks/collection:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Collection update webhook from Shiprocket
 *     description: Receives real-time collection updates from Shiprocket. Requires HMAC-SHA256 signature verification for authentication. Updates or creates collections in the database.
 *     security:
 *       - ApiKeyAuth: []
 *       - HMACAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - title
 *               - updated_at
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 482865238
 *               updated_at:
 *                 type: string
 *                 format: date-time
 *               title:
 *                 type: string
 *                 example: Smart iPods
 *               body_html:
 *                 type: string
 *                 example: The best selling iPod ever
 *               image:
 *                 type: object
 *                 properties:
 *                   src:
 *                     type: string
 *     responses:
 *       200:
 *         description: Collection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Collection updated successfully
 *                 collectionId:
 *                   type: string
 *       401:
 *         description: Missing authentication headers or invalid signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to process collection webhook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/collection', verifyHMAC, async (req: Request, res: Response) => {
    try {
        const collectionData = req.body;

        console.log('Received collection webhook from Shiprocket:', collectionData.id);

        // Transform Shiprocket collection format to DrinkBrewy format
        const updateData: any = {
            id: collectionData.id.toString(),
            name: collectionData.title,
            description: collectionData.body_html || '',
            updatedAt: new Date(collectionData.updated_at)
        };

        // Set image
        if (collectionData.image?.src) {
            updateData.image = collectionData.image.src;
        }

        // Generate handle from title if not exists
        if (!updateData.handle && updateData.name) {
            updateData.handle = updateData.name.toLowerCase().replace(/\s+/g, '-');
        }

        // Update or create collection
        const collection = await Collection.findOneAndUpdate(
            { id: collectionData.id.toString() },
            updateData,
            { upsert: true, new: true, runValidators: false }
        );

        console.log('Collection updated via webhook:', collection.id);

        res.json({
            success: true,
            message: 'Collection updated successfully',
            collectionId: collection.id
        });
    } catch (error) {
        console.error('Error processing collection webhook:', error);
        res.status(500).json({ error: 'Failed to process collection webhook' });
    }
});

export default router;
