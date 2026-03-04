import axios from 'axios';

/**
 * Format a phone number for MSG91.
 * Strips non-digits and prepends the country code digits.
 * e.g. ("9876543210", "+91") → "919876543210"
 */
function formatPhoneNumber(phone: string, countryCode = '+91'): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCode = countryCode.replace(/\D/g, '');
    // Avoid double-prepending the country code
    if (cleanPhone.startsWith(cleanCode)) return cleanPhone;
    return `${cleanCode}${cleanPhone}`;
}

export interface WhatsAppOtpResult {
    success: boolean;
    requestId?: string;
    error?: string;
}

/**
 * Send an OTP to a WhatsApp number via MSG91.
 *
 * Uses the same MSG91 template as interbuddy-backend:
 *   - body_1 → OTP value
 *   - button_1 → URL variable (OTP value)
 *
 * Env vars required:
 *   MSG91_AUTH_KEY
 *   MSG91_WHATSAPP_INTEGRATED_NUMBER   (default: 918110825234)
 *   MSG91_WHATSAPP_TEMPLATE_NAME       (default: naveen)
 *   MSG91_WHATSAPP_NAMESPACE           (default: 30cbc456_a2f7_4f6c_b840_4832c308825d)
 *   MSG91_WHATSAPP_BUTTON_SUFFIX       (default: verify  — only used as fallback label)
 */
export async function sendWhatsAppOtp(
    phone: string,
    otp: string,
    countryCode = '+91',
): Promise<WhatsAppOtpResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER || '918110825234';
    const templateName = process.env.MSG91_WHATSAPP_TEMPLATE_NAME || 'naveen';
    const namespace = process.env.MSG91_WHATSAPP_NAMESPACE || '30cbc456_a2f7_4f6c_b840_4832c308825d';

    if (!authKey) {
        console.error('❌ MSG91_AUTH_KEY is not set — WhatsApp OTP will fail!');
        return { success: false, error: 'MSG91 auth key not configured' };
    }

    const formattedPhone = formatPhoneNumber(phone, countryCode);

    const payload = {
        integrated_number: integratedNumber,
        content_type: 'template',
        payload: {
            messaging_product: 'whatsapp',
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en', policy: 'deterministic' },
                namespace,
                to_and_components: [
                    {
                        to: [formattedPhone],
                        components: {
                            body_1: { type: 'text', value: otp },
                            button_1: { subtype: 'url', type: 'text', value: otp },
                        },
                    },
                ],
            },
        },
    };

    try {
        const response = await axios.post(
            'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
            payload,
            {
                headers: { 'Content-Type': 'application/json', authkey: authKey },
                timeout: 10000,
            },
        );

        const data = response.data;
        const isSuccess =
            data?.status === 'success' ||
            data?.type === 'success' ||
            (data?.hasError === false && !data?.errors);

        if (isSuccess) {
            const requestId = data?.request_id || data?.data?.id;
            console.log(`✅ WhatsApp OTP queued for ${formattedPhone} | requestId: ${requestId ?? 'n/a'}`);
            return { success: true, requestId };
        }

        const errMsg = data?.message || data?.error || JSON.stringify(data);
        console.error(`❌ MSG91 rejected the message: ${errMsg}`);
        return { success: false, error: errMsg };
    } catch (err: any) {
        const status = err?.response?.status;
        const body = err?.response?.data;
        const msg = body?.message || err?.message || 'MSG91 API error';
        console.error(`❌ MSG91 HTTP error [${status ?? 'no response'}]: ${msg}`);
        return { success: false, error: msg };
    }
}
