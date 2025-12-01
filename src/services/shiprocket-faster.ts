import axios from 'axios';

const SHIPROCKET_FASTER_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let authToken: string | null = null;
let tokenExpiry: number = 0;

const getShiprocketToken = async (): Promise<string> => {
  try {
    if (authToken && Date.now() < tokenExpiry) {
      return authToken;
    }

    // Shiprocket uses API key and secret for authentication
    const response = await axios.post(`${SHIPROCKET_FASTER_BASE_URL}/auth/login`, {
      email: process.env.SHIPROCKET_API_KEY,
      password: process.env.SHIPROCKET_API_SECRET,
    });

    authToken = response.data.token;
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;

    return authToken;
  } catch (error) {
    console.error('Shiprocket authentication error:', error);
    throw new Error('Failed to authenticate with Shiprocket');
  }
};

export interface FasterCheckoutProduct {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface FasterCheckoutParams {
  order_id: string;
  order_amount: number;
  order_currency?: string;
  customer_email: string;
  customer_phone: string;
  customer_name: string;
  products: FasterCheckoutProduct[];
  pickup_postcode: string;
  callback_url?: string;
  redirect_url?: string;
  webhook_url?: string;
}

export interface FasterCheckoutResponse {
  success: boolean;
  checkout_url?: string;
  checkout_id?: string;
  order_id?: string;
  error?: string;
}

/**
 * Create Shiprocket Faster Checkout session
 * This combines payment and shipping in one flow
 */
export const createFasterCheckout = async (
  params: FasterCheckoutParams
): Promise<FasterCheckoutResponse> => {
  try {
    const token = await getShiprocketToken();

    const checkoutData = {
      order_id: params.order_id,
      order_amount: params.order_amount,
      order_currency: params.order_currency || 'INR',
      customer_email: params.customer_email,
      customer_phone: params.customer_phone,
      customer_name: params.customer_name,
      products: params.products,
      pickup_postcode: params.pickup_postcode,
      callback_url: params.callback_url,
      redirect_url: params.redirect_url,
      webhook_url: params.webhook_url,
    };

    const response = await axios.post(
      `${SHIPROCKET_FASTER_BASE_URL}/faster/checkout/create`,
      checkoutData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      checkout_url: response.data.checkout_url,
      checkout_id: response.data.checkout_id,
      order_id: response.data.order_id,
    };
  } catch (error: any) {
    console.error('Shiprocket Faster Checkout error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create Faster Checkout session',
    };
  }
};

/**
 * Verify Faster Checkout payment and get order details
 */
export const verifyFasterCheckout = async (checkoutId: string) => {
  try {
    const token = await getShiprocketToken();

    const response = await axios.get(
      `${SHIPROCKET_FASTER_BASE_URL}/faster/checkout/${checkoutId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
      status: response.data.status,
      payment_status: response.data.payment_status,
      order_id: response.data.order_id,
      shipment_id: response.data.shipment_id,
      awb_code: response.data.awb_code,
      tracking_url: response.data.tracking_url,
    };
  } catch (error: any) {
    console.error('Shiprocket Faster Checkout verification error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to verify Faster Checkout',
    };
  }
};

/**
 * Get Faster Checkout order status
 */
export const getFasterCheckoutStatus = async (orderId: string) => {
  try {
    const token = await getShiprocketToken();

    const response = await axios.get(
      `${SHIPROCKET_FASTER_BASE_URL}/faster/orders/${orderId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
      status: response.data.status,
      payment_status: response.data.payment_status,
      shipment_status: response.data.shipment_status,
      tracking_url: response.data.tracking_url,
    };
  } catch (error: any) {
    console.error('Shiprocket Faster Checkout status error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to get order status',
    };
  }
};

/**
 * Cancel Faster Checkout order
 */
export const cancelFasterCheckout = async (orderId: string) => {
  try {
    const token = await getShiprocketToken();

    const response = await axios.post(
      `${SHIPROCKET_FASTER_BASE_URL}/faster/orders/${orderId}/cancel`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
      message: 'Order cancelled successfully',
    };
  } catch (error: any) {
    console.error('Shiprocket Faster Checkout cancellation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to cancel order',
    };
  }
};

/**
 * Get serviceability for Faster Checkout
 */
export const checkFasterServiceability = async (
  pickupPincode: string,
  deliveryPincode: string,
  weight: number
) => {
  try {
    const token = await getShiprocketToken();

    const response = await axios.get(
      `${SHIPROCKET_FASTER_BASE_URL}/courier/serviceability`,
      {
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: deliveryPincode,
          weight,
          cod: 0, // Faster Checkout is prepaid only
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      serviceable: response.data.data?.available_courier_companies?.length > 0,
      couriers: response.data.data?.available_courier_companies || [],
      estimated_delivery_days: response.data.data?.estimated_delivery_days,
    };
  } catch (error: any) {
    console.error('Shiprocket serviceability check error:', error.response?.data || error.message);
    return {
      success: false,
      serviceable: false,
      error: error.response?.data?.message || 'Failed to check serviceability',
    };
  }
};
