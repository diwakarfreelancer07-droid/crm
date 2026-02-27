import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeadSource } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, phone, email, message, source, data } = body;

        // Validation
        if (!name || !phone) {
            return NextResponse.json(
                { error: "Name and Phone are required" },
                {
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
            );
        }

        // Map source
        let leadSource: LeadSource = LeadSource.WEBSITE_1; // Default
        const normalizedSource = source?.toString().toLowerCase().replace(/[^a-z0-9]/g, '') || '';

        if (normalizedSource.includes('website2') || normalizedSource.includes('site2')) {
            leadSource = LeadSource.WEBSITE_2;
        } else if (normalizedSource.includes('website3') || normalizedSource.includes('site3')) {
            leadSource = LeadSource.WEBSITE_3;
        } else if (normalizedSource.includes('website4') || normalizedSource.includes('site4')) {
            leadSource = LeadSource.WEBSITE_4;
        } else if (normalizedSource.includes('interfx')) {
            leadSource = LeadSource.INTERFX;
        }
        // implicit else: WEBSITE_1

        // Create Lead
        const lead = await prisma.lead.create({
            data: {
                name,
                phone,
                email: email || null,
                message: message || null,
                source: leadSource,
                data: data || undefined,
                status: "NEW", // Default status
                temperature: "COLD", // Default temperature
            },
        });

        // Log the activity
        // Note: Since webhooks are external, we don't have a userId. 
        // We might want to create a system user or just accept that `uploadedBy` etc are for authenticated users.
        // For now, simpler is better.

        return NextResponse.json(
            { success: true, leadId: lead.id, message: "Lead captured successfully" },
            {
                status: 201,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            }
        );

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            }
        );
    }
}

export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
