import axios from 'axios';

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let authToken: string | null = null;
let tokenExpiry: number = 0;

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface ShiprocketOrderParams {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: 'Prepaid' | 'COD';
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

const getShiprocketToken = async (): Promise<string> => {
  try {
    // Return cached token if still valid
    if (authToken && Date.now() < tokenExpiry) {
      return authToken;
    }

    // Shiprocket uses API key and secret for authentication
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email: process.env.SHIPROCKET_API_KEY,
      password: process.env.SHIPROCKET_API_SECRET,
    });

    authToken = response.data.token;
    // Token typically expires in 10 days, we'll refresh after 9 days
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;

    return authToken;
  } catch (error) {
    console.error('Shiprocket authentication error:', error);
    throw new Error('Failed to authenticate with Shiprocket');
  }
};

export const createShiprocketOrder = async (orderData: ShiprocketOrderParams) => {
  try {
    const token = await getShiprocketToken();

    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/create/adhoc`,
      orderData,
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
      orderId: response.data.order_id,
      shipmentId: response.data.shipment_id,
    };
  } catch (error: any) {
    console.error('Shiprocket order creation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create Shiprocket order',
    };
  }
};

export const generateAWB = async (shipmentId: number, courierId?: number) => {
  try {
    const token = await getShiprocketToken();

    const payload: any = { shipment_id: shipmentId };
    if (courierId) {
      payload.courier_id = courierId;
    }

    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/assign/awb`,
      payload,
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
      awbCode: response.data.response?.data?.awb_code,
    };
  } catch (error: any) {
    console.error('Shiprocket AWB generation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to generate AWB',
    };
  }
};

export const requestShipmentPickup = async (shipmentId: number) => {
  try {
    const token = await getShiprocketToken();

    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/generate/pickup`,
      { shipment_id: [shipmentId] },
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
    };
  } catch (error: any) {
    console.error('Shiprocket pickup request error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to request pickup',
    };
  }
};

export const trackShipment = async (shipmentId: number) => {
  try {
    const token = await getShiprocketToken();

    const response = await axios.get(
      `${SHIPROCKET_BASE_URL}/courier/track/shipment/${shipmentId}`,
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
      trackingData: response.data.tracking_data,
    };
  } catch (error: any) {
    console.error('Shiprocket tracking error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to track shipment',
    };
  }
};

export const cancelShipment = async (orderId: string) => {
  try {
    const token = await getShiprocketToken();

    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/cancel`,
      { ids: [orderId] },
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
    };
  } catch (error: any) {
    console.error('Shiprocket cancellation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to cancel shipment',
    };
  }
};

export const getAvailableCouriers = async (
  pickupPincode: string,
  deliveryPincode: string,
  weight: number,
  cod: boolean = false
) => {
  try {
    const token = await getShiprocketToken();

    const response = await axios.get(
      `${SHIPROCKET_BASE_URL}/courier/serviceability`,
      {
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: deliveryPincode,
          weight,
          cod: cod ? 1 : 0,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      couriers: response.data.data?.available_courier_companies || [],
    };
  } catch (error: any) {
    console.error('Shiprocket courier check error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to check available couriers',
    };
  }
};
