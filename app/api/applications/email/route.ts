import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendCustomEmail } from "@/lib/mail";

// POST /api/applications/email - Send email to students
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { emails, subject, body: emailBody } = body;

        if (!emails || !Array.isArray(emails) || emails.length === 0 || !subject || !emailBody) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        // In a real app, you might queue this or send via promise.all
        // For now, send them all
        const results = await Promise.allSettled(
            emails.map(email => sendCustomEmail(email, subject, emailBody))
        );

        return NextResponse.json({
            message: "Emails processed",
            results: results.map(r => r.status)
        });
    } catch (error) {
        console.error("Error sending bulk emails:", error);
        return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
    }
}
