const mongoose = require('mongoose');
require('dotenv').config();

const collectionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    handle: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    productIds: [{ type: String }],
    image: { type: String }
}, { timestamps: true });

const Collection = mongoose.model('Collection', collectionSchema);

const sampleCollections = [
    {
        id: 'coll_all_flavors',
        name: 'All Flavors',
        handle: 'all-flavors',
        description: 'Complete collection of all Brewy flavors - from bold cherry to refreshing watermelon',
        productIds: ['prod_black_cherry', 'prod_grape', 'prod_lemon_lime', 'prod_strawberry_lemonade', 'prod_watermelon'],
        image: '/collections/all-flavors.jpg'
    },
    {
        id: 'coll_citrus',
        name: 'Citrus Collection',
        handle: 'citrus',
        description: 'Refreshing citrus flavors perfect for a hot day',
        productIds: ['prod_lemon_lime', 'prod_strawberry_lemonade'],
        image: '/collections/citrus.jpg'
    },
    {
        id: 'coll_berry',
        name: 'Berry Collection',
        handle: 'berry',
        description: 'Sweet and tart berry flavors that will tantalize your taste buds',
        productIds: ['prod_black_cherry', 'prod_grape', 'prod_strawberry_lemonade', 'prod_watermelon'],
        image: '/collections/berry.jpg'
    }
];

async function seedCollections() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/drinkbrewy';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Clear existing collections
        await Collection.deleteMany({});
        console.log('Cleared existing collections');

        // Insert sample collections
        await Collection.insertMany(sampleCollections);
        console.log('Sample collections inserted successfully');
        console.log(`- ${sampleCollections[0].name}: ${sampleCollections[0].productIds.length} products`);
        console.log(`- ${sampleCollections[1].name}: ${sampleCollections[1].productIds.length} products`);
        console.log(`- ${sampleCollections[2].name}: ${sampleCollections[2].productIds.length} products`);

        mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding collections:', error);
        process.exit(1);
    }
}

seedCollections();
