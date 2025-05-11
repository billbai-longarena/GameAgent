import { NextResponse } from 'next/server';
import { aiService } from '@/services/ai.service'; // 使用路径别名 @ 指向 src

export async function GET() {
    try {
        const available = aiService.isAvailable();
        if (available) {
            return NextResponse.json({ status: 'available', message: 'AI Service is configured and available.' });
        } else {
            return NextResponse.json({ status: 'unavailable', message: 'AI Service is not available (API Key not configured).' }, { status: 503 });
        }
    } catch (error: any) {
        console.error('API Route (ai/status): Error checking AI service status:', error.message);
        return NextResponse.json({ status: 'error', message: `Failed to check AI service status: ${error.message}` }, { status: 500 });
    }
}
