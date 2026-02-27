import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const url = req.nextUrl.searchParams.get("url");
        if (!url) {
            return new NextResponse("Missing URL parameter", { status: 400 });
        }

        const apiKey = process.env.EXOTEL_API_KEY;
        const apiToken = process.env.EXOTEL_API_TOKEN;

        if (!apiKey || !apiToken) {
            return new NextResponse("Exotel credentials not configured", { status: 500 });
        }

        const basicAuth = Buffer.from(`${apiKey}:${apiToken}`).toString('base64');

        const response = await fetch(url, {
            headers: {
                Authorization: `Basic ${basicAuth}`,
            },
        });

        if (!response.ok) {
            console.error("Exotel recording fetch error:", response.status, response.statusText);
            return new NextResponse(`Error fetching recording: ${response.status}`, { status: response.status });
        }

        // Stream the audio data back to the client
        return new NextResponse(response.body, {
            headers: {
                "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
                "Content-Length": response.headers.get("Content-Length") || "",
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=86400", // Cache for 24 hours
            },
        });
    } catch (error) {
        console.error("Error streaming recording:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
