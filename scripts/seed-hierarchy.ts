import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Hierarchy Data...');

    // 1. Create Agent
    const agentEmail = 'agent.lead@example.com';
    const passwordHash = await bcrypt.hash('password123', 10);

    let agent = await prisma.user.findUnique({ where: { email: agentEmail } });
    if (!agent) {
        agent = await prisma.user.create({
            data: {
                name: 'Agent Lead 1',
                email: agentEmail,
                passwordHash,
                role: 'AGENT',
                employeeProfile: {
                    create: {
                        department: 'Sales',
                        designation: 'Senior Agent'
                    }
                }
            },
            include: { employeeProfile: true }
        });
        console.log('Created Agent:', agent.name);
    } else {
        console.log('Agent already exists:', agent.name);
    }

    // 2. Create Counselor (Subordinate)
    const counselorEmail = 'counselor.sub@example.com';
    let counselor = await prisma.user.findUnique({
        where: { email: counselorEmail },
        include: { employeeProfile: true }
    }) as any;

    if (!counselor) {
        counselor = await prisma.user.create({
            data: {
                name: 'Counselor Sub 1',
                email: counselorEmail,
                passwordHash,
                role: 'COUNSELOR',
                employeeProfile: {
                    create: {
                        department: 'Sales',
                        designation: 'Junior Counselor',
                        managerId: (agent as any).id // Assign to Agent
                    }
                }
            },
            include: { employeeProfile: true }
        });
        console.log('Created Counselor:', counselor.name, 'reporting to', (agent as any).name);
    } else {
        console.log('Counselor already exists:', counselor.name);
        // Ensure hierarchy
        if (counselor.employeeProfile?.managerId !== (agent as any).id) {
            await prisma.employeeProfile.update({
                where: { userId: counselor.id },
                data: { managerId: (agent as any).id }
            });
            console.log('Updated Counselor manager to Agent');
        }
    }

    // 3. Create Lead assigned to Agent
    const lead = await prisma.lead.create({
        data: {
            name: 'Test Lead Hierarchy',
            email: 'test.lead.hierarchy@example.com',
            phone: '555-0199',
            source: 'WEB_FORM',
            status: 'NEW',
            assignments: {
                create: {
                    assignedTo: agent!.id,
                    assignedBy: agent!.id // Self-assigned for test
                }
            }
        }
    });
    console.log('Created Lead assigned to Agent:', lead.name);

    console.log('Hierarchy Seed Complete.');
    console.log(`Agent Login: ${agentEmail} / password123`);
    console.log(`Counselor Login: ${counselorEmail} / password123`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
