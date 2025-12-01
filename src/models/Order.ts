import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'shipped' | 'delivered';
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
  };
  items: Array<{
    productId: string;
    variantId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  trackingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'shipped', 'delivered'],
      default: 'created'
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: {
        line1: { type: String },
        line2: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String, default: 'India' }
      }
    },
    items: [
      {
        productId: { type: String, required: true },
        variantId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ],
    shiprocketOrderId: { type: String },
    shiprocketShipmentId: { type: String },
    trackingUrl: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
