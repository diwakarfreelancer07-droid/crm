// Fix existing CallLog rows that have malformed phone numbers (leading 0 instead of +91)
// and re-link them to their lead/student
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function toE164(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
}

(async () => {
    try {
        const logs = await prisma.callLog.findMany({ where: { leadId: null, studentId: null } });
        console.log(`Found ${logs.length} unlinked CallLog rows`);

        for (const log of logs) {
            const customerPhone = log.direction === 'outbound' ? log.toNumber : log.callerId;
            const e164 = toE164(customerPhone);
            const last10 = e164.slice(-10);
            const variants = [e164, e164.replace('+91', ''), last10];
            console.log(`  CallSid: ${log.exotelCallSid}, customerPhone: ${customerPhone} → ${e164}`);

            const lead = await prisma.lead.findFirst({ where: { phone: { in: variants } }, select: { id: true, name: true } });
            const student = await prisma.student.findFirst({ where: { phone: { in: variants } }, select: { id: true, name: true } }).catch(() => null);

            if (lead || student) {
                // Also fix the stored phone numbers
                const callerE164 = toE164(log.callerId);
                const toE164val = toE164(log.toNumber);
                await prisma.callLog.update({
                    where: { id: log.id },
                    data: {
                        leadId: lead?.id ?? undefined,
                        studentId: student?.id ?? undefined,
                        callerId: callerE164,
                        toNumber: toE164val,
                    },
                });
                console.log(`    ✅ Linked to ${lead ? `lead: ${lead.name}` : `student: ${student?.name}`}`);
            } else {
                // At least fix the stored phone number format
                await prisma.callLog.update({
                    where: { id: log.id },
                    data: {
                        callerId: toE164(log.callerId),
                        toNumber: toE164(log.toNumber),
                    },
                });
                console.log(`    ⚠ No lead/student found. Phone normalised only.`);
            }
        }
        console.log('Done');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
})();
