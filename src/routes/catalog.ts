import express, { Request, Response } from 'express';
import Product from '../models/Product';
import Collection from '../models/Collection';

const router = express.Router();

/**
 * Shiprocket Catalog Sync APIs
 * These are public endpoints for Shiprocket to fetch the merchant's catalog
 */

// Helper function to transform Product to Shiprocket format
const transformProductToShiprocket = (product: any) => {
    return {
        id: product.id,
        title: product.name,
        body_html: product.description,
        vendor: 'DrinkBrewy',
        product_type: product.flavor || 'Beverages',
        created_at: product.createdAt,
        updated_at: product.updatedAt,
        status: product.availableForSale ? 'active' : 'draft',
        variants: product.variants.map((variant: any) => ({
            id: variant.id,
            title: variant.title,
            price: variant.price.toString(),
            quantity: product.stock || 0,
            sku: variant.sku || product.id,
            updated_at: product.updatedAt,
            image: {
                src: product.images && product.images.length > 0 ? product.images[0] : ''
            },
            weight: product.dimensions?.weight || 0.5
        })),
        image: {
            src: product.images && product.images.length > 0 ? product.images[0] : ''
        }
    };
};

// Helper function to transform Collection to Shiprocket format
const transformCollectionToShiprocket = (collection: any) => {
    return {
        id: collection.id,
        updated_at: collection.updatedAt,
        title: collection.name,
        body_html: collection.description,
        image: {
            src: collection.image || ''
        }
    };
};

/**
 * @swagger
 * /api/catalog/products:
 *   get:
 *     tags:
 *       - Catalog Sync
 *     summary: Fetch all products with pagination (Shiprocket Catalog Sync)
 *     description: Public endpoint for Shiprocket to fetch the entire product catalog. Returns products in Shiprocket-compatible format with pagination support.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShiprocketProduct'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/products', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;
        const skip = (page - 1) * limit;

        // Fetch products with pagination
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments();
        const totalPages = Math.ceil(total / limit);

        // Transform products to Shiprocket format
        const transformedProducts = products.map(transformProductToShiprocket);

        res.json({
            products: transformedProducts,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching products for catalog sync:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * @swagger
 * /api/catalog/collections:
 *   get:
 *     tags:
 *       - Catalog Sync
 *     summary: Fetch all collections with pagination (Shiprocket Catalog Sync)
 *     description: Public endpoint for Shiprocket to fetch all product collections/categories. Returns collections in Shiprocket-compatible format with pagination support.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of collections per page
 *     responses:
 *       200:
 *         description: Successfully retrieved collections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 collections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShiprocketCollection'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/collections', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;
        const skip = (page - 1) * limit;

        // Fetch collections with pagination
        const collections = await Collection.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Collection.countDocuments();
        const totalPages = Math.ceil(total / limit);

        // Transform collections to Shiprocket format
        const transformedCollections = collections.map(transformCollectionToShiprocket);

        res.json({
            collections: transformedCollections,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching collections for catalog sync:', error);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

/**
 * @swagger
 * /api/catalog/collections/{collection_id}/products:
 *   get:
 *     tags:
 *       - Catalog Sync
 *     summary: Fetch products by collection ID with pagination (Shiprocket Catalog Sync)
 *     description: Public endpoint for Shiprocket to fetch products belonging to a specific collection. Returns products in Shiprocket-compatible format with pagination support.
 *     parameters:
 *       - in: path
 *         name: collection_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *         example: coll_citrus
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Successfully retrieved products for collection
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShiprocketProduct'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Collection not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/collections/:collection_id/products', async (req: Request, res: Response) => {
    try {
        const { collection_id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;
        const skip = (page - 1) * limit;

        // Find collection by ID
        const collection = await Collection.findOne({ id: collection_id });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // Fetch products in this collection with pagination
        const products = await Product.find({
            id: { $in: collection.productIds }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = collection.productIds.length;
        const totalPages = Math.ceil(total / limit);

        // Transform products to Shiprocket format
        const transformedProducts = products.map(transformProductToShiprocket);

        res.json({
            products: transformedProducts,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching products by collection for catalog sync:', error);
        res.status(500).json({ error: 'Failed to fetch products by collection' });
    }
});

export default router;
