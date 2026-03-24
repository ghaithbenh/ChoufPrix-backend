import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:/money/compb/.env' });
import * as dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function checkCategories() {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('scraper');
        const collection = db.collection('products');
        
        const distinctCategories = await collection.distinct('category');
        console.log('Total Categories:', distinctCategories.length);
        console.log('First 50 Categories:', distinctCategories.slice(0, 50));
        
        const sampleProducts = await collection.find({ category: { $ne: 'Other' } }).limit(5).toArray();
        console.log('Sample products with category:', JSON.stringify(sampleProducts.map(p => ({ name: p.name, category: p.category })), null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

checkCategories();
