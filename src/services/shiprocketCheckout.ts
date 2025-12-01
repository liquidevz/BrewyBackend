import axios from "axios";
import crypto from "crypto";

/**
 * Shiprocket Checkout Service
 * Handles access token generation for Shiprocket Checkout
 */

const SHIPROCKET_CHECKOUT_BASE_URL = "https://checkout-api.shiprocket.com";

// Helper function to generate HMAC-SHA256 signature
const generateHMAC = (payload: object, secret: string): string => {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("base64");
};

export interface CheckoutCartItem {
  variant_id: string;
  quantity: number;
}

export interface CheckoutCartData {
  items: CheckoutCartItem[];
}

export interface AccessTokenParams {
  cart_data: CheckoutCartData;
  redirect_url: string;
  timestamp?: string;
}

export interface AccessTokenResponse {
  success: boolean;
  token?: string;
  error?: string;
  data?: any;
}

/**
 * Generate Shiprocket Checkout access token
 * This token is used to initialize the checkout session on frontend
 */
export const generateAccessToken = async (
  params: AccessTokenParams
): Promise<AccessTokenResponse> => {
  try {
    const apiKey = process.env.SHIPROCKET_API_KEY;
    const apiSecret = process.env.SHIPROCKET_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error("Shiprocket API credentials not configured");
    }

    // Add timestamp if not provided
    const timestamp = params.timestamp || new Date().toISOString();

    // Build request payload
    const payload = {
      cart_data: params.cart_data,
      redirect_url: params.redirect_url,
      timestamp,
    };

    // Generate HMAC signature
    const hmacSignature = generateHMAC(payload, apiSecret);

    console.log("Generating Shiprocket Checkout access token...");

    // Call Shiprocket Checkout API
    const response = await axios.post(
      `${SHIPROCKET_CHECKOUT_BASE_URL}/api/v1/access-token/checkout`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
          "X-Api-HMAC-SHA256": hmacSignature,
        },
      }
    );

    if (response.data && response.data.result && response.data.result.token) {
      return {
        success: true,
        token: response.data.result.token,
        data: response.data,
      };
    }

    return {
      success: false,
      error: "Token not found in response",
    };
  } catch (error: any) {
    console.log(error);
    console.error(
      "Shiprocket Checkout token generation error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to generate checkout token",
    };
  }
};

/**
 * Verify HMAC signature for incoming webhooks
 */
export const verifyWebhookHMAC = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const calculatedHMAC = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return calculatedHMAC === signature;
};

export default {
  generateAccessToken,
  verifyWebhookHMAC,
};
