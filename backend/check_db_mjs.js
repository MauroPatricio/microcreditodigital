import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://mauropatricio1_db_user:root@cluster0.wgkbjgt.mongodb.net/?appName=Cluster0';

async function checkCredit() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const id = '69a8221936057e19ee7d80c1';
        const credit = await mongoose.connection.collection('credits').findOne({ _id: new mongoose.Types.ObjectId(id) });

        if (credit) {
            console.log('Credit Found:');
            console.log('Status:', credit.status);
            console.log('Amount:', credit.amount);
            console.log('Approved Amount:', credit.approvedAmount);
            console.log('Institution:', credit.institution);
            console.log('Full Analysis:', JSON.stringify(credit.confidenceAnalysis, null, 2));
        } else {
            console.log('Credit NOT found');
        }

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkCredit();
