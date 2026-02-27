import { PrismaClient, Role, LeadStatus, LeadTemperature, LeadActivityType, TaskStatus, DocumentType, NotificationType } from './generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seeding...');

    // 1. Users
    const passwordHash = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@inter.in' },
        update: {},
        create: {
            email: 'admin@inter.in',
            name: 'System Admin',
            passwordHash: passwordHash,
            role: 'ADMIN',
            isActive: true,
            emailVerified: new Date(),
        },
    });

    const manager = await prisma.user.upsert({
        where: { email: 'manager@inter.in' },
        update: {},
        create: {
            email: 'manager@inter.in',
            name: 'Office Manager',
            passwordHash: passwordHash,
            role: 'MANAGER',
            isActive: true,
            emailVerified: new Date(),
        },
    });

    const employee = await prisma.user.upsert({
        where: { email: 'sales@inter.in' },
        update: {},
        create: {
            email: 'sales@inter.in',
            name: 'Sales Rep 1',
            passwordHash: passwordHash,
            role: 'SALES_REP',
            isActive: true,
            emailVerified: new Date(),
        },
    });

    console.log('Users seeded');

    // 2. Employee Profile
    await prisma.employeeProfile.upsert({
        where: { userId: employee.id },
        update: {},
        create: {
            userId: employee.id,
            phone: '1234567890',
            department: 'Sales',
            designation: 'Senior Sales Executive',
            salary: 50000,
            joiningDate: new Date('2024-01-01'),
        },
    });

    console.log('Employee Profiles seeded');

    // 3. Leads
    const lead1 = await prisma.lead.create({
        data: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '9876543210',
            source: 'WEBSITE_1',
            status: 'UNDER_REVIEW',
            temperature: 'HOT',
            message: 'Looking for a custom software solution.',
        },
    });

    const lead2 = await prisma.lead.create({
        data: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '9888888888',
            source: 'InterfxPayments',
            status: 'NEW',
            temperature: 'WARM',
            message: 'Heard about your CRM through a friend.',
        },
    });

    console.log('Leads seeded');

    // 4. Lead Assignments
    await prisma.leadAssignment.create({
        data: {
            leadId: lead1.id,
            assignedTo: employee.id,
            assignedBy: admin.id,
        },
    });

    console.log('Lead Assignments seeded');

    // 5. Lead Activities
    await prisma.leadActivity.create({
        data: {
            leadId: lead1.id,
            userId: employee.id,
            type: 'CALL',
            content: 'Initial discovery call performed. Client is interested in a demo.',
        },
    });

    console.log('Lead Activities seeded');

    // 6. Lead Tasks & Reminders
    const task = await prisma.leadTask.create({
        data: {
            leadId: lead1.id,
            assignedTo: employee.id,
            title: 'Send Proposal',
            description: 'Draft and send the technical proposal by Friday.',
            dueAt: new Date(Date.now() + 86400000 * 2), // 2 days from now
        },
    });

    await prisma.reminder.create({
        data: {
            taskId: task.id,
            remindAt: new Date(Date.now() + 86400000), // 1 day from now
        },
    });

    console.log('Tasks and Reminders seeded');

    // 7. Notifications
    /*
    await prisma.notification.create({
        data: {
            userId: employee.id,
            title: 'New Lead Assigned',
            message: `You have been assigned lead: ${lead1.name}`,
            type: 'LEAD_ASSIGNED',
        },
    });

    console.log('Notifications seeded');
    */

    // 8. Lead Documents
    await prisma.leadDocument.create({
        data: {
            leadId: lead1.id,
            uploadedBy: employee.id,
            type: 'REQUIREMENT',
            fileName: 'requirements_spec.pdf',
            fileUrl: 'https://example.com/docs/requirements_spec.pdf',
        },
    });

    console.log('Documents seeded');

    // 9. Students (Converted Leads)
    /*
    const convertedLead = await prisma.lead.create({
        data: {
            name: 'Ali Khan',
            phone: '9555555555',
            source: 'Website 3',
            status: 'CONVERTED',
        }
    });

    await prisma.student.create({
        data: {
            leadId: convertedLead.id,
            name: 'Ali Khan',
            phone: '9555555555',
            onboardedBy: employee.id,
        },
    });

    console.log('Students seeded');
    */

    // 10. Audit Logs
    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: 'CREATE_USER',
            entity: 'User',
            entityId: manager.id,
            metadata: { role: 'MANAGER' },
        },
    });

    // 11. Application Checklist (Standard Documents)
    const checklistItems = [
        "10th Mark Sheet", "12th Mark Sheet", "Academic Transcripts", "Affidavit of Support",
        "Bachelor's Mark Sheets", "Bank Balance Certificate", "Bank Statement",
        "Birth Certificate", "Curriculum Vitae (CV)", "Education Loan Sanction Letter",
        "Experience Letter(s)", "GRE/GMAT/SAT/ACT Score Card",
        "IELTS/TOEFL/PTE/Duolingo Score Card", "Income Proof of Sponsor",
        "Letter(s) of Recommendation (LOR)", "Master's Degree Certificate",
        "Medium of Instruction (MOI)", "Passport", "Photographs", "Relieving Letter",
        "Salary Slips", "Statement of Purpose (SOP)"
    ];

    for (const name of checklistItems) {
        await prisma.applicationChecklist.upsert({
            where: { id: `seed-${name.toLowerCase().replace(/\s+/g, '-')}` }, // Using stable IDs for seeds if possible, but schema doesn't have unique name yet
            update: {},
            create: {
                name,
                type: 'MANDATORY',
                isEnquiryForm: false,
                isMandatory: true,
            }
        }).catch(() => {
            // If ID strategy fails (e.g. not UUID), just create
            return prisma.applicationChecklist.create({
                data: {
                    name,
                    type: 'MANDATORY',
                    isEnquiryForm: false,
                    isMandatory: true,
                }
            });
        });
    }

    console.log('Application Checklist seeded');
    console.log('Audit Logs seeded');
    console.log('Seeding completed successfully!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
