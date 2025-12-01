import express, { Request, Response } from 'express';
import Product from '../models/Product';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all products (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ availableForSale: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID or handle (public)
router.get('/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const product = await Product.findOne({
      $or: [{ id: identifier }, { handle: identifier }]
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
router.post('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const productData = req.body;
    
    // Check if product with same ID or handle exists
    const existingProduct = await Product.findOne({
      $or: [{ id: productData.id }, { handle: productData.handle }]
    });
    
    if (existingProduct) {
      return res.status(400).json({ error: 'Product with this ID or handle already exists' });
    }
    
    const product = new Product(productData);
    await product.save();
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const product = await Product.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOneAndDelete({ id });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully', product });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Update stock (admin only)
router.patch('/:id/stock', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    const product = await Product.findOneAndUpdate(
      { id },
      { stock },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

export default router;
