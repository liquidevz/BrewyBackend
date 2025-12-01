// Test Shiprocket Checkout Token Generation
// This script demonstrates how to generate a checkout token

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testCheckoutToken() {
    console.log('🧪 Testing Shiprocket Checkout Token Generation...\n');

    try {
        const response = await axios.post(`${BASE_URL}/api/checkout/generate-token`, {
            cart_data: {
                items: [
                    { variant_id: 'prod_grape', quantity: 2 },
                    { variant_id: 'prod_lemon_lime', quantity: 1 }
                ]
            },
            redirect_url: 'http://localhost:3000/checkout/success'
        });

        console.log('✅ Success! Checkout token generated:\n');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('\n📝 Note: Token generation may fail if Shiprocket API credentials are not configured correctly.');
    } catch (error) {
        console.error('❌ Error generating checkout token:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else {
            console.error(error.message);
        }
        console.log('\n💡 This is expected if Shiprocket Checkout API credentials are not yet configured.');
        console.log('   Update SHIPROCKET_API_KEY and SHIPROCKET_API_SECRET in .env after obtaining credentials from Shiprocket.');
    }
}

testCheckoutToken();
