/**
 * lib/exotel.ts
 * Reusable Exotel API wrapper for the CRM
 * Ported from taxiby_backend ExotelService
 */

const getExotelConfig = () => {
    const sid = process.env.EXOTEL_SID!;
    const apiKey = process.env.EXOTEL_API_KEY!;
    const apiToken = process.env.EXOTEL_API_TOKEN!;
    const subdomain = process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com';
    const virtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER!;

    return { sid, apiKey, apiToken, subdomain, virtualNumber };
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
export async function makeOutboundCall(opts: {
    from: string;       // agent's phone number
    to: string;         // lead / student phone number
    statusCallbackUrl?: string;
}): Promise<{ callSid: string;[key: string]: any }> {
    const { sid, apiKey, apiToken, subdomain, virtualNumber } = getExotelConfig();

    const url = `https://${subdomain}/v1/Accounts/${sid}/Calls/connect.json`;

    const body = new URLSearchParams({
        From: opts.from,
        To: opts.to,
        CallerId: virtualNumber,
        ...(opts.statusCallbackUrl ? { StatusCallback: opts.statusCallbackUrl } : {}),
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: authHeader(apiKey, apiToken),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
        const msg =
            data?.RestException?.Message ||
            data?.message ||
            'Exotel makeCall failed';
        throw new Error(msg);
    }

    const callSid = data?.Call?.Sid ?? data?.Sid ?? null;
    if (!callSid) throw new Error(`Exotel makeCall response missing Sid: ${JSON.stringify(data)}`);

    return { callSid, ...data };
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
