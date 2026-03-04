import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/mail';
import { sendWhatsAppOtp } from '@/lib/whatsapp';
import crypto from 'crypto';

/**
 * Normalise a phone string into multiple candidates for fuzzy lookup.
 * e.g. "+919876543210" → ["9876543210", "+919876543210", "919876543210"]
 */
function phoneVariants(raw: string): string[] {
    const clean = raw.replace(/[\s\-().]/g, '');
    const digits = clean.replace(/\D/g, '');
    const last10 = digits.slice(-10);
    const variants = new Set<string>([
        clean,
        raw,
        digits,
        last10,
        `+91${last10}`,
        `91${last10}`,
    ]);
    return [...variants];
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, phone, role } = body;

        const isStudent = (role === 'student' || role === 'STUDENT') && !!phone;

        // ── Student: look up user via Lead.phone ──────────────────────────────
        if (isStudent) {
            const candidates = phoneVariants(phone);

            const lead = await prisma.lead.findFirst({
                where: { phone: { in: candidates } },
                include: { user: true },
            });

            if (!lead?.user) {
                // Don't reveal whether the number exists
                return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' }, { status: 200 });
            }

            const user = lead.user;
            const otp = crypto.randomInt(100000, 999999).toString();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await prisma.user.update({
                where: { id: user.id },
                data: { otp, otpExpiresAt },
            });

            const waResult = await sendWhatsAppOtp(phone, otp);
            if (!waResult.success) {
                console.warn(`⚠️  WhatsApp OTP failed (${waResult.error}) — falling back to email`);
                if (user.email) await sendOTPEmail(user.email, otp);
            }

            return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' }, { status: 200 });
        }

        // ── Non-student: look up user via email ──────────────────────────────
        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' }, { status: 200 });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { email },
            data: { otp, otpExpiresAt },
        });

        await sendOTPEmail(email, otp);

        return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' }, { status: 200 });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
