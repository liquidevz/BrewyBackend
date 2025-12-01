const mongoose = require('mongoose');
require('dotenv').config();

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  flavor: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  handle: { type: String, required: true, unique: true },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  availableForSale: { type: Boolean, default: true },
  variants: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    availableForSale: { type: Boolean, default: true },
    sku: { type: String }
  }],
  dimensions: {
    length: { type: Number, default: 10 },
    breadth: { type: Number, default: 10 },
    height: { type: Number, default: 10 },
    weight: { type: Number, default: 0.5 }
  }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

const sampleProducts = [
  {
    id: 'prod_black_cherry',
    name: 'Black Cherry Brewy',
    flavor: 'blackCherry',
    price: 49,
    description: 'Rich and bold black cherry flavor with zero sugar. A perfect blend of sweet and tart notes that will tantalize your taste buds.',
    handle: 'black-cherry',
    images: ['/labels/cherry.png'],
    stock: 100,
    availableForSale: true,
    variants: [
      {
        id: 'var_black_cherry_single',
        title: 'Single Can',
        price: 49,
        availableForSale: true,
        sku: 'BC-SINGLE'
      },
      {
        id: 'var_black_cherry_pack',
        title: '6 Pack',
        price: 279,
        availableForSale: true,
        sku: 'BC-PACK6'
      }
    ],
    dimensions: {
      length: 6,
      breadth: 6,
      height: 12,
      weight: 0.35
    }
  },
  {
    id: 'prod_grape',
    name: 'Grape Brewy',
    flavor: 'grape',
    price: 49,
    description: 'Juicy grape goodness in every sip. Made with natural grape extracts and packed with prebiotics for your gut health.',
    handle: 'grape',
    images: ['/labels/grape.png'],
    stock: 100,
    availableForSale: true,
    variants: [
      {
        id: 'var_grape_single',
        title: 'Single Can',
        price: 49,
        availableForSale: true,
        sku: 'GR-SINGLE'
      },
      {
        id: 'var_grape_pack',
        title: '6 Pack',
        price: 279,
        availableForSale: true,
        sku: 'GR-PACK6'
      }
    ],
    dimensions: {
      length: 6,
      breadth: 6,
      height: 12,
      weight: 0.35
    }
  },
  {
    id: 'prod_lemon_lime',
    name: 'Lemon Lime Brewy',
    flavor: 'lemonLime',
    price: 49,
    description: 'Refreshing citrus burst with the perfect balance of lemon and lime. Zero calories, maximum refreshment.',
    handle: 'lemon-lime',
    images: ['/labels/lemon-lime.png'],
    stock: 100,
    availableForSale: true,
    variants: [
      {
        id: 'var_lemon_lime_single',
        title: 'Single Can',
        price: 49,
        availableForSale: true,
        sku: 'LL-SINGLE'
      },
      {
        id: 'var_lemon_lime_pack',
        title: '6 Pack',
        price: 279,
        availableForSale: true,
        sku: 'LL-PACK6'
      }
    ],
    dimensions: {
      length: 6,
      breadth: 6,
      height: 12,
      weight: 0.35
    }
  },
  {
    id: 'prod_strawberry_lemonade',
    name: 'Strawberry Lemonade Brewy',
    flavor: 'strawberryLemonade',
    price: 49,
    description: 'Sweet strawberries meet tangy lemonade in this delightful fusion. Plant-based and packed with flavor.',
    handle: 'strawberry-lemonade',
    images: ['/labels/strawberry.png'],
    stock: 100,
    availableForSale: true,
    variants: [
      {
        id: 'var_strawberry_lemonade_single',
        title: 'Single Can',
        price: 49,
        availableForSale: true,
        sku: 'SL-SINGLE'
      },
      {
        id: 'var_strawberry_lemonade_pack',
        title: '6 Pack',
        price: 279,
        availableForSale: true,
        sku: 'SL-PACK6'
      }
    ],
    dimensions: {
      length: 6,
      breadth: 6,
      height: 12,
      weight: 0.35
    }
  },
  {
    id: 'prod_watermelon',
    name: 'Watermelon Brewy',
    flavor: 'watermelon',
    price: 49,
    description: 'Fresh watermelon taste that brings summer vibes all year round. Hydrating and delicious with zero sugar.',
    handle: 'watermelon',
    images: ['/labels/watermelon.png'],
    stock: 100,
    availableForSale: true,
    variants: [
      {
        id: 'var_watermelon_single',
        title: 'Single Can',
        price: 49,
        availableForSale: true,
        sku: 'WM-SINGLE'
      },
      {
        id: 'var_watermelon_pack',
        title: '6 Pack',
        price: 279,
        availableForSale: true,
        sku: 'WM-PACK6'
      }
    ],
    dimensions: {
      length: 6,
      breadth: 6,
      height: 12,
      weight: 0.35
    }
  }
];

async function seedProducts() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/drinkbrewy';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log('Sample products inserted successfully');

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
