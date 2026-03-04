import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://mauropatricio1_db_user:root@cluster0.wgkbjgt.mongodb.net/?appName=Cluster0';

async function listCredits() {
    try {
        await mongoose.connect(MONGODB_URI);
        const credits = await mongoose.connection.collection('credits').find({}).toArray();
        console.log(`Total credits: ${credits.length}`);
        credits.forEach(c => {
            console.log(`ID: ${c._id}, Status: ${c.status}, Amount: ${c.amount}, Client: ${c.client}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listCredits();
