const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNullReferences() {
  try {
    console.log('Attempting to fix null references in wallet_transactions...');

    // Fetch all transactions and filter in memory
    const allTransactions = await prisma.walletTransaction.findMany({
      select: { id: true, reference: true },
    });

    const transactionsToUpdate = allTransactions.filter(
      (tx) => tx.reference === null || tx.reference === ''
    );

    if (transactionsToUpdate.length === 0) {
      console.log('No transactions with null references found.');
      return;
    }

    console.log(`Found ${transactionsToUpdate.length} transactions to update.`);

    // Update each transaction with a unique reference
    for (const tx of transactionsToUpdate) {
      const uniqueReference = `ref_${new Date().getTime()}_${Math.random().toString(36).substring(2, 11)}`;
      await prisma.walletTransaction.update({
        where: { id: tx.id },
        data: { reference: uniqueReference },
      });
      console.log(`Updated transaction ID: ${tx.id}`);
    }

    console.log('Successfully updated all transactions with null references.');

  } catch (error) {
    console.error('Error fixing null references:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNullReferences();