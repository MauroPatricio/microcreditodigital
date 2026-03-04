const { MongoClient, ObjectId } = require('mongodb');

async function checkLoan() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db('microcreditodigital');
        const credit = await db.collection('credits').findOne({ _id: new ObjectId('69a8221936057e19ee7d80c1') });
        if (credit) {
            console.log("\n--- LOAN DETAILS ---");
            console.log("Status:", credit.status);
            console.log("Contract Status:", credit.contractStatus);
            console.log("Current Stage:", credit.currentStage);
            console.log("--------------------\n");
        } else {
            console.log("Loan not found!");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

checkLoan();
