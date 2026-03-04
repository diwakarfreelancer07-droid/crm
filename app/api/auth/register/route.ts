import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/mail';
import { sendWhatsAppOtp } from '@/lib/whatsapp';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email, password, name, role, phone } = await req.json();

        if (!email || !password || !name || !role || !phone) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Map frontend role string to Prisma Role enum
        const prismaRole = role.toUpperCase() === 'AGENT' ? 'AGENT' : 'STUDENT';

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    name,
                    passwordHash,
                    otp,
                    otpExpiresAt,
                    role: prismaRole,
                },
            });

            if (prismaRole === 'STUDENT') {
                await tx.lead.create({
                    data: {
                        userId: user.id,
                        name: name,
                        email: email,
                        phone: phone,
                        source: 'Self Registered',
                        status: 'NEW',
                    }
                });
            } else if (prismaRole === 'AGENT') {
                await tx.agentProfile.create({
                    data: {
                        userId: user.id,
                        phone: phone,
                    }
                });
            }

            return user;
        });

        // ── Send OTP: WhatsApp for students, Email for others ───────────────
        if (prismaRole === 'STUDENT') {
            const waResult = await sendWhatsAppOtp(phone, otp);
            if (!waResult.success) {
                // Fallback to email if WhatsApp delivery fails
                console.warn(`⚠️  WhatsApp OTP failed (${waResult.error}) — falling back to email`);
                await sendOTPEmail(email, otp);
                return NextResponse.json({
                    message: 'WhatsApp delivery failed. OTP sent to your email instead.',
                    userId: result.id,
                    otpChannel: 'email',
                }, { status: 201 });
            }

            return NextResponse.json({
                message: 'Registered! Please verify your WhatsApp OTP.',
                userId: result.id,
                otpChannel: 'whatsapp',
            }, { status: 201 });
        } else {
            // Agent / other roles → email OTP
            await sendOTPEmail(email, otp);

            return NextResponse.json({
                message: 'User registered. Please verify your email with the OTP sent.',
                userId: result.id,
                otpChannel: 'email',
            }, { status: 201 });
        }

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
