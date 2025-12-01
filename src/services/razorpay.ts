import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export interface VerifyPaymentParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const createRazorpayOrder = async (params: CreateOrderParams) => {
  try {
    const { amount, currency = "INR", receipt, notes } = params;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `order_${Date.now()}`,
      notes,
    });

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return {
      success: false,
      error: "Failed to create Razorpay order",
    };
  }
};

export const verifyRazorpayPayment = (params: VerifyPaymentParams): boolean => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    return expectedSignature === razorpaySignature;
  } catch (error) {
    console.error("Razorpay payment verification error:", error);
    return false;
  }
};

export const getRazorpayPayment = async (paymentId: string) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error("Razorpay payment fetch error:", error);
    return {
      success: false,
      error: "Failed to fetch payment details",
    };
  }
};

export const refundRazorpayPayment = async (
  paymentId: string,
  amount?: number
) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return {
      success: true,
      refund,
    };
  } catch (error) {
    console.error("Razorpay refund error:", error);
    return {
      success: false,
      error: "Failed to process refund",
    };
  }
};
