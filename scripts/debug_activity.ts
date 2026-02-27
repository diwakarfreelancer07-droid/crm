import { PrismaClient, LeadActivityType, LeadStatus, LeadTemperature } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting debug script...');

    // 1. Get a valid user (Admin)
    const user = await prisma.user.findFirst({
        where: { email: 'admin@inter.in' } // From seed
    });

    if (!user) {
        console.error('No admin user found. Seed might not have run.');
        return;
    }
    console.log('Found User:', user.id, user.email);

    // 2. Get a valid lead
    const lead = await prisma.lead.findFirst();
    if (!lead) {
        console.error('No lead found. Seed might not have run.');
        return;
    }
    console.log('Found Lead:', lead.id, lead.name);

    // 3. Attempt the transaction
    console.log('Attempting transaction...');
    const type = LeadActivityType.CALL;
    const content = 'Debug activity content';
    const updateLead = true;

    try {
        const activity = await prisma.$transaction(async (tx) => {
            console.log('Inside transaction: Creating activity...');
            const newActivity = await tx.leadActivity.create({
                data: {
                    leadId: lead.id,
                    userId: user.id,
                    type: type,
                    content: content || `Action: ${type}`,
                }
            });
            console.log('Activity created:', newActivity.id);

            if (updateLead) {
                console.log('Inside transaction: Updating lead status...');
                await tx.lead.update({
                    where: { id: lead.id },
                    data: {
                        status: LeadStatus.IN_PROGRESS,
                        temperature: LeadTemperature.WARM
                    }
                });

                console.log('Inside transaction: Creating status change activity...');
                await tx.leadActivity.create({
                    data: {
                        leadId: lead.id,
                        userId: user.id,
                        type: LeadActivityType.STATUS_CHANGE,
                        content: `Status changed to IN_PROGRESS`
                    }
                });

                console.log('Inside transaction: Creating temperature change activity...');
                await tx.leadActivity.create({
                    data: {
                        leadId: lead.id,
                        userId: user.id,
                        type: LeadActivityType.TEMPERATURE_CHANGE,
                        content: `Temperature changed to WARM`
                    }
                });
            }

            return newActivity;
        });

        console.log('Transaction successful!', activity);
    } catch (error: any) {
        const fs = require('fs');
        const output = `
Transaction failed!
Error code: ${error.code}
Error message: ${error.message}
Error meta: ${JSON.stringify(error.meta, null, 2)}
Full Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
`;
        fs.writeFileSync('debug_output.txt', output);
        console.error('Written to debug_output.txt');
    } finally {
        await prisma.$disconnect();
    }
}

main();
