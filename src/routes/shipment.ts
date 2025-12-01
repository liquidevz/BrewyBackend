import express, { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import {
  createShiprocketOrder,
  generateAWB,
  requestShipmentPickup,
  trackShipment,
  cancelShipment,
  getAvailableCouriers,
} from '../services/shiprocket';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create shipment for an order (admin only)
router.post('/create', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, pickupLocation } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Find order
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ error: 'Order must be paid before creating shipment' });
    }

    // Prepare order items for Shiprocket
    const orderItems = [];
    let totalWeight = 0;
    let maxLength = 10,
      maxBreadth = 10,
      maxHeight = 10;

    for (const item of order.items) {
      const product = await Product.findOne({ id: item.productId });
      if (product) {
        orderItems.push({
          name: item.name,
          sku: item.variantId || item.productId,
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
        });

        if (product.dimensions) {
          totalWeight += (product.dimensions.weight || 0.5) * item.quantity;
          maxLength = Math.max(maxLength, product.dimensions.length || 10);
          maxBreadth = Math.max(maxBreadth, product.dimensions.breadth || 10);
          maxHeight = Math.max(maxHeight, product.dimensions.height || 10);
        } else {
          totalWeight += 0.5 * item.quantity;
        }
      }
    }

    // Create Shiprocket order
    const shiprocketData = {
      order_id: orderId,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: pickupLocation || 'Primary',
      billing_customer_name: order.customer.name.split(' ')[0] || order.customer.name,
      billing_last_name: order.customer.name.split(' ').slice(1).join(' ') || '',
      billing_address: order.customer.address.line1,
      billing_address_2: order.customer.address.line2 || '',
      billing_city: order.customer.address.city,
      billing_pincode: order.customer.address.pincode,
      billing_state: order.customer.address.state,
      billing_country: order.customer.address.country,
      billing_email: order.customer.email,
      billing_phone: order.customer.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: 'Prepaid' as const,
      sub_total: order.amount,
      length: maxLength,
      breadth: maxBreadth,
      height: maxHeight,
      weight: totalWeight,
    };

    const result = await createShiprocketOrder(shiprocketData);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Update order with shipment info
    order.shiprocketOrderId = result.orderId?.toString();
    order.shiprocketShipmentId = result.shipmentId?.toString();
    order.status = 'shipped';
    await order.save();

    res.json({
      success: true,
      message: 'Shipment created successfully',
      shiprocketOrderId: result.orderId,
      shiprocketShipmentId: result.shipmentId,
      order,
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// Generate AWB for shipment (admin only)
router.post('/generate-awb', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { shipmentId, courierId } = req.body;

    if (!shipmentId) {
      return res.status(400).json({ error: 'Shipment ID is required' });
    }

    const result = await generateAWB(parseInt(shipmentId), courierId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'AWB generated successfully',
      awbCode: result.awbCode,
      data: result.data,
    });
  } catch (error) {
    console.error('Error generating AWB:', error);
    res.status(500).json({ error: 'Failed to generate AWB' });
  }
});

// Request pickup (admin only)
router.post('/request-pickup', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { shipmentId } = req.body;

    if (!shipmentId) {
      return res.status(400).json({ error: 'Shipment ID is required' });
    }

    const result = await requestShipmentPickup(parseInt(shipmentId));

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Pickup requested successfully',
      data: result.data,
    });
  } catch (error) {
    console.error('Error requesting pickup:', error);
    res.status(500).json({ error: 'Failed to request pickup' });
  }
});

// Track shipment
router.get('/track/:shipmentId', async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params;

    const result = await trackShipment(parseInt(shipmentId));

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      trackingData: result.trackingData,
    });
  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({ error: 'Failed to track shipment' });
  }
});

// Cancel shipment (admin only)
router.post('/cancel', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const result = await cancelShipment(orderId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Update order status
    await Order.findOneAndUpdate({ orderId }, { status: 'failed' });

    res.json({
      success: true,
      message: 'Shipment cancelled successfully',
      data: result.data,
    });
  } catch (error) {
    console.error('Error cancelling shipment:', error);
    res.status(500).json({ error: 'Failed to cancel shipment' });
  }
});

// Check available couriers
router.post('/check-couriers', async (req: Request, res: Response) => {
  try {
    const { pickupPincode, deliveryPincode, weight, cod } = req.body;

    if (!pickupPincode || !deliveryPincode || !weight) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await getAvailableCouriers(
      pickupPincode,
      deliveryPincode,
      parseFloat(weight),
      cod || false
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      couriers: result.couriers,
    });
  } catch (error) {
    console.error('Error checking couriers:', error);
    res.status(500).json({ error: 'Failed to check available couriers' });
  }
});

export default router;
