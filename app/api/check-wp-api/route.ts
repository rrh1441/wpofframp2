// app/api/check-wp-api/route.ts
import { NextResponse } from 'next/server';

// Helper (remains the same)
const normalizeUrlForApiCheck = (inputUrl: string): string | null => {
    let normalized = inputUrl.trim();
    if (!normalized) return null;
    if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
    }
    try {
        const urlObj = new URL(normalized);
        return urlObj.origin;
    } catch (e) {
        console.error("Invalid URL provided for API check:", inputUrl, e);
        return null;
    }
};

export async function POST(req: Request) {
    let wpUrl: string;
    let originalInputUrl = ''; // Store original for error messages

    try {
        const body = await req.json();
        wpUrl = body.wpUrl;
        originalInputUrl = wpUrl; // Keep the user's input for context

        if (!wpUrl || typeof wpUrl !== 'string') {
            return NextResponse.json({ success: false, message: "Please provide the WordPress site URL." }, { status: 400 });
        }
    } catch (error) {
        console.error("Failed to parse request body:", error);
        return NextResponse.json({ success: false, message: "Invalid request format." }, { status: 400 });
    }

    const normalizedOrigin = normalizeUrlForApiCheck(wpUrl);

    if (!normalizedOrigin) {
         // Provide clearer guidance on invalid URL format
         return NextResponse.json({
             success: false,
             message: "The URL you entered doesn't seem quite right. Please make sure it's a valid web address, like 'https://example.com'."
            }, { status: 200 }); // Return 200 OK but success: false for client handling
    }

    const targetApiUrl = `${normalizedOrigin}/wp-json/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
        console.log(`[API Check] Checking URL: ${targetApiUrl}`);
        const response = await fetch(targetApiUrl, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'WP-Offramp-Checker/1.0'
            }
        });
        clearTimeout(timeoutId);

        console.log(`[API Check] Response status for ${targetApiUrl}: ${response.status}`);

        if (response.ok) { // Status 200-299
            return NextResponse.json({
                success: true,
                // Keep success message concise
                message: "Success! The WordPress REST API is accessible."
            });
        } else if (response.status === 404) {
            // Refined 404 message with clear action
            return NextResponse.json({
                success: false,
                message: `We couldn't find the WordPress API at ${targetApiUrl}. This usually means the "Permalinks" setting needs updating. Action: Go to your WordPress Admin dashboard, navigate to Settings -> Permalinks, select any option other than 'Plain' (e.g., 'Post name'), and click Save Changes. Then, try checking the status again.`,
                code: 'not_found_permalink' // More specific code
            });
        } else if (response.status === 401 || response.status === 403) {
             // Refined 401/403 message with clear action
            return NextResponse.json({
                success: false,
                message: `Access to the WordPress API was blocked (Error ${response.status}). This is often caused by a security plugin (like Wordfence, iThemes Security) or server firewall rules. Action: Check your security plugin's settings for anything blocking the 'REST API'. You might need to adjust its firewall or temporarily disable it to test. If unsure, contact your hosting provider.`,
                code: 'forbidden_security' // More specific code
            });
        } else {
            // Refined general server error message
            return NextResponse.json({
                success: false,
                message: `The server responded with an unexpected error (Status: ${response.status}). Action: Check if your website at ${normalizedOrigin} is working correctly. You may need to check server error logs or contact your hosting provider or website administrator for help.`,
                code: 'server_error'
            });
        }

    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error(`[API Check] Fetch error for ${targetApiUrl}:`, error);

        if (error.name === 'AbortError') {
             // Refined timeout message
            return NextResponse.json({
                success: false,
                message: `The connection to your website timed out. The server might be slow or temporarily unavailable. Action: Please wait a few moments and try checking the status again. Also, check if your website (${normalizedOrigin}) is loading correctly in your browser.`,
                code: 'timeout'
            });
        }
        // Refined general network error message
        return NextResponse.json({
            success: false,
            message: `We couldn't connect to the server for the URL provided (${originalInputUrl}). Action: Please double-check that the URL is correct and that your website is online and accessible from the internet. Also, ensure your own internet connection is working.`,
            code: 'network_error'
        });
    }
}