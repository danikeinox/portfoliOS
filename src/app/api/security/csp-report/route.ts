import { NextResponse, type NextRequest } from 'next/server';

// Simple in-memory rate limiter for CSP reports
const reportBucket = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
    return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
    // Rate limit: max 20 reports per IP per minute
    const ip = getClientIp(request);
    const now = Date.now();
    const entry = reportBucket.get(ip);

    if (entry && entry.resetAt > now) {
        if (entry.count >= 20) {
            return new NextResponse(null, { status: 429 });
        }
        entry.count += 1;
    } else {
        reportBucket.set(ip, { count: 1, resetAt: now + 60_000 });
    }

    // Cleanup expired entries periodically
    if (reportBucket.size > 500) {
        for (const [key, val] of reportBucket.entries()) {
            if (val.resetAt <= now) reportBucket.delete(key);
        }
    }

    try {
        const body = await request.json();
        console.warn('🛡️ CSP Violation Report:', body);
        
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('❌ Error parsing CSP report:', error);
        return new NextResponse('Invalid JSON', { status: 400 });
    }
}
