import express, { Request, Response } from "express";
import Product from "../models/Product";
import { authenticateAdmin, AuthRequest } from "../middleware/auth";

const router = express.Router();

const crypto = require("crypto");

function stringToSafeInteger(inputString: string) {
  // 1. Hash the string (SHA-256)
  const hash = crypto.createHash("sha256").update(inputString).digest("hex");

  // 2. Take the first 14 hex chars (14 * 4 = 56 bits), which is close to 53
  // We slice it to ensure we fit in 53 bits.
  const hexFragment = hash.substring(0, 13); // 13 chars * 4 = 52 bits (Safe)

  // 3. Convert to a standard Number
  return parseInt(hexFragment, 16);
}

// Get all products (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ availableForSale: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ availableForSale: true }),
    ]);

    console.log(products[0]._id.toString());

    const mappedProducts = products.map((product) => ({
      id: stringToSafeInteger(product.id), // Ensure integer
      title: product.name,
      body_html: product.description,
      vendor: "Brewy",
      product_type: "Hard Seltzer",
      created_at: product.createdAt,
      handle: product.handle,
      updated_at: product.updatedAt,
      tags: "Hard Seltzer, Alcohol, Brewy",
      status: product.availableForSale ? "active" : "draft",
      variants: product.variants.map((v) => ({
        id: stringToSafeInteger(v.id), // Ensure integer
        title: v.title,
        price: v.price.toFixed(2),
        compare_at_price: v.price.toFixed(2), // Default to price if no compare_at
        sku: v.sku || "",
        quantity: product.stock,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
        taxable: true,
        option_values: {
          Color: "Default", // Placeholder as data is missing in DB
          Size: "Default", // Placeholder as data is missing in DB
        },
        grams: 0,
        image: {
          src: product.images[0] || "",
        },
        weight: 0,
        weight_unit: "lb",
      })),
      image: {
        src: product.images[0] || "",
      },
      options: [
        { name: "Color", values: ["Default"] },
        { name: "Size", values: ["Default"] },
      ],
    }));

    res.json({
      data: {
        total,
        products: mappedProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get single product by ID or handle (public)
router.get("/:identifier", async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const product = await Product.findOne({
      $or: [{ id: identifier }, { handle: identifier }],
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create product (admin only)
router.post("/", authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const productData = req.body;

    // Check if product with same ID or handle exists
    const existingProduct = await Product.findOne({
      $or: [{ id: productData.id }, { handle: productData.handle }],
    });

    if (existingProduct) {
      return res
        .status(400)
        .json({ error: "Product with this ID or handle already exists" });
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product (admin only)
router.put(
  "/:id",
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await Product.findOneAndUpdate({ id }, updateData, {
        new: true,
        runValidators: true,
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// Delete product (admin only)
router.delete(
  "/:id",
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const product = await Product.findOneAndDelete({ id });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product deleted successfully", product });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
);

// Update stock (admin only)
router.patch(
  "/:id/stock",
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      const product = await Product.findOneAndUpdate(
        { id },
        { stock },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error updating stock:", error);
      res.status(500).json({ error: "Failed to update stock" });
    }
  }
);

export default router;
