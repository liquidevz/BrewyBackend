import express, { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayPayment,
  refundRazorpayPayment,
} from '../services/razorpay';
import { createShiprocketOrder } from '../services/shiprocket';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency, items, customer } = req.body;

    if (!amount || !items || !customer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate products and calculate total
    let calculatedTotal = 0;
    for (const item of items) {
      const product = await Product.findOne({ id: item.productId });
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      if (!product.availableForSale) {
        return res.status(400).json({ error: `Product ${product.name} is not available` });
      }
      calculatedTotal += product.price * item.quantity;
    }

    // Create Razorpay order
    const orderId = `ORD_${Date.now()}`;
    const result = await createRazorpayOrder({
      amount: calculatedTotal,
      currency: currency || 'INR',
      receipt: orderId,
      notes: { orderId, customerEmail: customer.email },
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Create order in database
    const order = new Order({
      orderId,
      razorpayOrderId: result.order.id,
      amount: calculatedTotal,
      currency: currency || 'INR',
      status: 'created',
      customer,
      items,
    });

    await order.save();

    res.json({
      success: true,
      orderId,
      razorpayOrderId: result.order.id,
      amount: calculatedTotal,
      currency: result.order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify payment
router.post('/verify-payment', async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    // Verify signature
    const isValid = verifyRazorpayPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update order in database
    const order = await Order.findOneAndUpdate(
      { orderId: orderId || razorpayOrderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get payment details
router.get('/payment/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const result = await getRazorpayPayment(paymentId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// Refund payment (admin only)
router.post('/refund', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, amount } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const result = await refundRazorpayPayment(paymentId, amount);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: result.refund,
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

export default router;
