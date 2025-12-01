import express, { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import {
  createFasterCheckout,
  verifyFasterCheckout,
  getFasterCheckoutStatus,
  cancelFasterCheckout,
  checkFasterServiceability,
} from '../services/shiprocket-faster';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create Faster Checkout session
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { items, customer, pickupPincode } = req.body;

    if (!items || !customer || !pickupPincode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const products = [];

    for (const item of items) {
      const product = await Product.findOne({ id: item.productId });
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      if (!product.availableForSale) {
        return res.status(400).json({ error: `Product ${product.name} is not available` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      products.push({
        name: product.name,
        sku: item.variantId || product.id,
        units: item.quantity,
        selling_price: product.price,
        discount: 0,
      });
    }

    // Generate unique order ID
    const orderId = `BREWY_${Date.now()}`;

    // Create order in database
    const order = new Order({
      orderId,
      razorpayOrderId: orderId, // Using same ID for tracking
      amount: totalAmount,
      currency: 'INR',
      status: 'created',
      customer,
      items,
    });

    await order.save();

    // Create Faster Checkout session
    const checkoutResult = await createFasterCheckout({
      order_id: orderId,
      order_amount: totalAmount,
      order_currency: 'INR',
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_name: customer.name,
      products,
      pickup_postcode: pickupPincode,
      callback_url: `${process.env.FRONTEND_URL}/checkout/callback`,
      redirect_url: `${process.env.FRONTEND_URL}/checkout/success`,
      webhook_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/faster-checkout/webhook`,
    });

    if (!checkoutResult.success) {
      return res.status(500).json({ error: checkoutResult.error });
    }

    // Update order with checkout ID
    order.razorpayOrderId = checkoutResult.checkout_id || orderId;
    await order.save();

    res.json({
      success: true,
      orderId,
      checkoutId: checkoutResult.checkout_id,
      checkoutUrl: checkoutResult.checkout_url,
      amount: totalAmount,
    });
  } catch (error) {
    console.error('Error creating Faster Checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify Faster Checkout payment
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { checkoutId, orderId } = req.body;

    if (!checkoutId) {
      return res.status(400).json({ error: 'Checkout ID is required' });
    }

    const result = await verifyFasterCheckout(checkoutId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Update order in database
    const order = await Order.findOneAndUpdate(
      { orderId: orderId || result.order_id },
      {
        status: result.payment_status === 'paid' ? 'paid' : 'created',
        shiprocketOrderId: result.order_id,
        shiprocketShipmentId: result.shipment_id,
        trackingUrl: result.tracking_url,
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Checkout verified successfully',
      order,
      paymentStatus: result.payment_status,
      trackingUrl: result.tracking_url,
    });
  } catch (error) {
    console.error('Error verifying Faster Checkout:', error);
    res.status(500).json({ error: 'Failed to verify checkout' });
  }
});

// Get Faster Checkout order status
router.get('/status/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await getFasterCheckoutStatus(orderId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      status: result.status,
      paymentStatus: result.payment_status,
      shipmentStatus: result.shipment_status,
      trackingUrl: result.tracking_url,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// Cancel Faster Checkout order (admin only)
router.post('/cancel', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const result = await cancelFasterCheckout(orderId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Update order status in database
    await Order.findOneAndUpdate({ orderId }, { status: 'failed' });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Check serviceability
router.post('/check-serviceability', async (req: Request, res: Response) => {
  try {
    const { pickupPincode, deliveryPincode, weight } = req.body;

    if (!pickupPincode || !deliveryPincode || !weight) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await checkFasterServiceability(
      pickupPincode,
      deliveryPincode,
      parseFloat(weight)
    );

    res.json({
      success: result.success,
      serviceable: result.serviceable,
      couriers: result.couriers,
      estimatedDeliveryDays: result.estimated_delivery_days,
      error: result.error,
    });
  } catch (error) {
    console.error('Error checking serviceability:', error);
    res.status(500).json({ error: 'Failed to check serviceability' });
  }
});

// Webhook handler for Faster Checkout
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;

    console.log('Faster Checkout Webhook received:', webhookData);

    const { order_id, payment_status, shipment_status, tracking_url, awb_code } = webhookData;

    if (!order_id) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Update order in database
    const updateData: any = {};

    if (payment_status) {
      updateData.status = payment_status === 'paid' ? 'paid' : 'failed';
    }

    if (shipment_status === 'shipped' || shipment_status === 'delivered') {
      updateData.status = shipment_status;
    }

    if (tracking_url) {
      updateData.trackingUrl = tracking_url;
    }

    const order = await Order.findOneAndUpdate(
      { orderId: order_id },
      updateData,
      { new: true }
    );

    if (!order) {
      console.error('Order not found for webhook:', order_id);
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('Order updated via webhook:', order);

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;
