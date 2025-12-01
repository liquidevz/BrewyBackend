import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  name: string;
  flavor: string;
  price: number;
  description: string;
  handle: string;
  images: string[];
  stock: number;
  availableForSale: boolean;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    availableForSale: boolean;
    sku?: string;
  }>;
  dimensions?: {
    length: number;
    breadth: number;
    height: number;
    weight: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    flavor: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    handle: { type: String, required: true, unique: true },
    images: [{ type: String }],
    stock: { type: Number, default: 0 },
    availableForSale: { type: Boolean, default: true },
    variants: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        availableForSale: { type: Boolean, default: true },
        sku: { type: String }
      }
    ],
    dimensions: {
      length: { type: Number, default: 10 },
      breadth: { type: Number, default: 10 },
      height: { type: Number, default: 10 },
      weight: { type: Number, default: 0.5 }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
