import { prisma, LeadActivityType } from '@/lib/prisma';
import { LeadSource } from '@/lib/constants';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, message, source } = body;

        if (!phone) {
            return NextResponse.json({ error: "Phone number is mandatory" }, { status: 400 });
        }

        if (!name) {
            return NextResponse.json({ error: "Name is mandatory" }, { status: 400 });
        }

        const validSources = Object.values(LeadSource);
        const leadSource = source && validSources.includes(source as LeadSource)
            ? (source as LeadSource)
            : LeadSource.WEBSITE_1;

        const existingLead = await prisma.lead.findFirst({
            where: {
                OR: [
                    { phone: phone },
                    ...(email ? [{ email: email }] : [])
                ]
            }
        });

        if (existingLead) {
            const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (systemUser) {
                await prisma.leadActivity.create({
                    data: {
                        leadId: existingLead.id,
                        userId: systemUser.id,
                        type: LeadActivityType.NOTE,
                        content: `Duplicate lead submission attempt from ${leadSource}.`
                    }
                });
            }

            return NextResponse.json({
                message: "Lead already exists",
                leadId: existingLead.id
            }, { status: 409 });
        }

        const systemUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!systemUser) {
            return NextResponse.json({ error: "System configuration error: No admin found" }, { status: 500 });
        }

        const lead = await prisma.lead.create({
            data: {
                name,
                email,
                phone,
                message,
                source: leadSource,
                status: 'NEW',
                temperature: 'COLD',
                activities: {
                    create: {
                        userId: systemUser.id,
                        type: LeadActivityType.NOTE,
                        content: `Lead created from ${leadSource} `
                    }
                }
            }
        });

        return NextResponse.json(lead, { status: 201 });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
