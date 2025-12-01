import express, { Request, Response } from 'express';
import Order from '../models/Order';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all orders (admin only)
router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order
router.post('/', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    
    const order = new Order(orderData);
    await order.save();
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (admin only)
router.patch('/:orderId/status', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { orderId },
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Update order with payment info
router.patch('/:orderId/payment', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { razorpayPaymentId, razorpaySignature, status } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: status || 'paid'
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order payment:', error);
    res.status(500).json({ error: 'Failed to update order payment' });
  }
});

// Update order with shipment info (admin only)
router.patch('/:orderId/shipment', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { shiprocketOrderId, shiprocketShipmentId, trackingUrl } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        shiprocketOrderId,
        shiprocketShipmentId,
        trackingUrl,
        status: 'shipped'
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order shipment:', error);
    res.status(500).json({ error: 'Failed to update order shipment' });
  }
});

export default router;
