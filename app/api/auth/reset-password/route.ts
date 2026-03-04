import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

function phoneVariants(raw: string): string[] {
    const clean = raw.replace(/[\s\-().]/g, '');
    const digits = clean.replace(/\D/g, '');
    const last10 = digits.slice(-10);
    const variants = new Set<string>([clean, raw, digits, last10, `+91${last10}`, `91${last10}`]);
    return [...variants];
}

export async function POST(req: Request) {
    try {
        const { email, phone, otp, newPassword } = await req.json();

        if ((!email && !phone) || !otp || !newPassword) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        let user: any = null;

        if (phone) {
            // Student: look up via Lead.phone
            const candidates = phoneVariants(phone);
            const lead = await prisma.lead.findFirst({
                where: { phone: { in: candidates } },
                include: { user: true },
            });
            if (!lead?.user) {
                return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
            }
            user = lead.user;
        } else {
            user = await prisma.user.findUnique({ where: { email } });
        }

        if (!user) {
            return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
        }

        if (user.otp !== otp || (user.otpExpiresAt && user.otpExpiresAt < new Date())) {
            return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                otp: null,
                otpExpiresAt: null,
            },
        });

        return NextResponse.json({ message: 'Password reset successful' }, { status: 200 });

    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
