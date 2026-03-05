/**
 * lib/exotel.ts
 * Reusable Exotel API wrapper for the CRM
 * Ported from taxiby_backend ExotelService
 */
import axios from "axios";

const getExotelConfig = () => {
    const sid = process.env.EXOTEL_SID?.trim();
    const apiKey = process.env.EXOTEL_API_KEY?.trim();
    const apiToken = process.env.EXOTEL_API_TOKEN?.trim();
    const subdomain = process.env.EXOTEL_SUBDOMAIN?.trim() || 'api.in.exotel.com';
    const virtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER?.trim();

    if (!sid || !apiKey || !apiToken) {
        throw new Error('EXOTEL_MISSING_CREDENTIALS');
    }

    return { sid, apiKey, apiToken, subdomain, virtualNumber: virtualNumber! };
};

const authHeader = (apiKey: string, apiToken: string) =>
    'Basic ' + Buffer.from(`${apiKey}:${apiToken}`).toString('base64');

// --------------------------------------------------------------------------
// Create a new Exotel user (agent / counselor)
// Uses the CCM v2 API — POST /v2/accounts/{sid}/users
// --------------------------------------------------------------------------
export async function createExotelUser(opts: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}): Promise<{ sid: string;[key: string]: any }> {
    const { sid, apiKey, apiToken, subdomain } = getExotelConfig();

    // Exotel CCM v2 requires name 3–20 chars
    const firstName = (opts.firstName || 'Agent').padEnd(3, '_').substring(0, 20).trim();
    const lastName = (opts.lastName || 'User').padEnd(3, '_').substring(0, 20).trim();

    const url = `https://ccm-${subdomain}/v2/accounts/${sid}/users`;

    const payload = {
        first_name: firstName,
        last_name: lastName,
        email: opts.email,
        role: 'user',
        device_contact_uri: opts.phone,
        device_name: `${firstName}'s Phone`,
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: authHeader(apiKey, apiToken),
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        console.error('[Exotel Create User API Error Payload]:', JSON.stringify({
            status: res.status,
            statusText: res.statusText,
            data: data
        }, null, 2));

        const msg =
            data?.response?.error_data?.description ||
            data?.response?.error_data?.message ||
            data?.message ||
            'Exotel createUser failed';
        throw new Error(msg);
    }

    const userData = data?.response?.data || data?.data || data;
    const userSid = userData?.sid || userData?.id;

    if (!userSid) {
        throw new Error(`Exotel createUser response missing SID: ${JSON.stringify(data)}`);
    }

    return { ...userData, sid: userSid };
}

// --------------------------------------------------------------------------
// Make an outbound click-to-call
// Exotel calls `from` first, then bridges to `to`
// --------------------------------------------------------------------------
export async function makeOutboundCall(from: string, to: string, callerId: string): Promise<any> {
    const { sid, apiKey, apiToken, subdomain } = getExotelConfig();
    const baseUrl = `https://${subdomain}/v1/Accounts/${sid}`;

    try {
        console.log(`Initiating outbound call from ${from} to ${to} via callerId ${callerId}`);

        const params = new URLSearchParams();
        params.append('From', from);
        params.append('To', to);
        params.append('CallerId', callerId);

        const response = await axios.post(`${baseUrl}/Calls/connect.json`, params, {
            auth: {
                username: apiKey,
                password: apiToken,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        console.log(`Outbound call initiated: ${JSON.stringify(response.data?.Call)}`);
        return response.data?.Call || response.data;
    } catch (error: any) {
        let exotelMessage = '';

        if (error?.response?.data) {
            const data = error.response.data;
            console.error(`Exotel making outbound call raw error data: ${JSON.stringify(data)}`);

            if (data?.response?.error_data?.description) {
                exotelMessage = data.response.error_data.description;
            } else if (data?.response?.error_data?.message) {
                exotelMessage = data.response.error_data.message;
            } else if (data?.RestException?.Message) {
                exotelMessage = data.RestException.Message;
            } else if (data?.message) {
                exotelMessage = data.message;
            } else if (data?.response?.message) {
                exotelMessage = data.response.message;
            }
        }

        const finalMessage = exotelMessage || error?.message || `Exotel making outbound call failed`;
        console.error(`Exotel Error [making outbound call] extracted message: ${finalMessage}`);

        throw new Error(`Exotel Error: ${finalMessage}`);
    }
}

// --------------------------------------------------------------------------
// Generate a short-lived browser token for in-browser SIP calling (optional)
// --------------------------------------------------------------------------
export async function generateBrowserToken(agentId: string): Promise<string> {
    const { sid, apiKey, apiToken, subdomain } = getExotelConfig();

    const url = `https://${subdomain}/v1/Accounts/${sid}/Tools/BrowserToken.json`;

    const body = new URLSearchParams({ AgentId: agentId });

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: authHeader(apiKey, apiToken),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    const data = await res.json();

    const token = data?.BrowserToken?.Token || data?.Token;
    if (!token) throw new Error(`Exotel browserToken missing: ${JSON.stringify(data)}`);

    return token;
}

// --------------------------------------------------------------------------
// Set agent availability (requires fetching their tel device first)
// --------------------------------------------------------------------------
export async function setExotelAvailability(userSid: string, available: boolean) {
    const { sid, apiKey, apiToken, subdomain } = getExotelConfig();

    // 1) Fetch user devices
    const userUrl = `https://ccm-${subdomain}/v2/accounts/${sid}/users/${userSid}?fields=devices`;
    const userRes = await fetch(userUrl, {
        headers: {
            Authorization: authHeader(apiKey, apiToken),
            Accept: 'application/json',
        },
    });
    const userData = await userRes.json();
    const devices: any[] = userData?.response?.data?.devices || userData?.data?.devices || [];

    const telDevice = devices.find((d: any) => {
        const type = typeof d.type === 'object' ? d.type?.name : d.type;
        return String(type).toLowerCase() === 'tel';
    });

    if (!telDevice) {
        throw new Error(`No tel device found for Exotel user ${userSid}`);
    }

    // 2) Update availability
    const deviceUrl = `https://ccm-${subdomain}/v2/accounts/${sid}/users/${userSid}/devices/${telDevice.id}`;
    const res = await fetch(deviceUrl, {
        method: 'PUT',
        headers: {
            Authorization: authHeader(apiKey, apiToken),
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ available }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Exotel setAvailability failed: ${JSON.stringify(err)}`);
    }

    return res.json();
}
