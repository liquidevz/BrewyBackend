import express, { Request, Response } from 'express';
import Collection from '../models/Collection';
import Product from '../models/Product';

const router = express.Router();

// Get all collections (public)
router.get('/', async (req: Request, res: Response) => {
    try {
        const collections = await Collection.find().sort({ createdAt: -1 });
        res.json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

// Get single collection by ID or handle with populated products (public)
router.get('/:identifier', async (req: Request, res: Response) => {
    try {
        const { identifier } = req.params;
        const collection = await Collection.findOne({
            $or: [{ id: identifier }, { handle: identifier }]
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // Fetch all products in this collection
        const products = await Product.find({
            id: { $in: collection.productIds }
        });

        // Return collection with full product details
        const collectionWithProducts = {
            ...collection.toObject(),
            products
        };

        res.json(collectionWithProducts);
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ error: 'Failed to fetch collection' });
    }
});

// Get products by collection handle (public)
router.get('/:handle/products', async (req: Request, res: Response) => {
    try {
        const { handle } = req.params;
        const collection = await Collection.findOne({ handle });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const products = await Product.find({
            id: { $in: collection.productIds }
        });

        res.json(products);
    } catch (error) {
        console.error('Error fetching products by collection:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

export default router;
