import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Admin login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Check for simple password authentication (backward compatibility)
    if (password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { id: 'admin', username: 'admin', role: 'admin' },
        (process.env.JWT_SECRET || 'secret') as string,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        token,
        admin: { username: 'admin', role: 'admin' }
      });
    }

    // Check database for admin
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      (process.env.JWT_SECRET || 'secret') as string,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Create admin (superadmin only)
router.post('/create', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Check if requester is superadmin
    if (req.admin?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can create new admins' });
    }

    const { username, password, email, role } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      username,
      password: hashedPassword,
      email,
      role: role || 'admin'
    });

    await admin.save();

    res.status(201).json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Get current admin info
router.get('/me', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (req.admin?.id === 'admin') {
      return res.json({
        username: 'admin',
        role: 'admin'
      });
    }

    const admin = await Admin.findById(req.admin?.id).select('-password');

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Error fetching admin info:', error);
    res.status(500).json({ error: 'Failed to fetch admin info' });
  }
});

// Change password
router.post('/change-password', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.admin?.id === 'admin') {
      return res.status(400).json({ error: 'Cannot change password for default admin' });
    }

    const admin = await Admin.findById(req.admin?.id);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
