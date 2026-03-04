import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://mauropatricio1_db_user:root@cluster0.wgkbjgt.mongodb.net/?appName=Cluster0';

async function checkCredit() {
    try {
        await mongoose.connect(MONGODB_URI);
        const id = '69a8221936057e19ee7d80c1';
        const credit = await mongoose.connection.collection('credits').findOne({ _id: new mongoose.Types.ObjectId(id) });

        if (credit) {
            console.log('Status:', credit.status);
            console.log('Installments Count:', (credit.installments || []).length);

            if (credit.installments && credit.installments.length > 0) {
                const instId = credit.installments[0];
                const inst = await mongoose.connection.collection('installments').findOne({ _id: instId });
                console.log('First Installment details:', inst ? 'FOUND' : 'NOT FOUND');
            }

            console.log('Workflow History Count:', (credit.workflowHistory || []).length);
            console.log('Last Action:', credit.workflowHistory ? credit.workflowHistory[credit.workflowHistory.length - 1].action : 'NONE');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkCredit();
