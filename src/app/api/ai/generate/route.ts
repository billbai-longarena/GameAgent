import { NextResponse } from 'next/server';
import { aiService } from '@/services/ai.service'; // 使用路径别名 @ 指向 src

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const prompt = body.prompt;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        if (!aiService.isAvailable()) {
            return NextResponse.json({ error: 'AI Service is not available (API Key not configured)' }, { status: 503 });
        }

        console.log(`API Route (ai/generate): Received prompt: "${prompt}"`);
        const generatedText = await aiService.generateText(prompt);
        console.log(`API Route (ai/generate): Text generated: "${generatedText}"`);

        return NextResponse.json({ generatedText });
    } catch (error: any) {
        console.error('API Route (ai/generate): Error generating text:', error.message);
        // 根据错误类型返回更具体的错误码和信息
        if (error.message.includes('Gemini API Key is not configured')) {
            return NextResponse.json({ error: 'AI Service is not available (API Key not configured)' }, { status: 503 });
        }
        if (error.message.includes('Failed to generate text using Gemini API (curl)')) {
            return NextResponse.json({ error: `AI service provider error: ${error.message}` }, { status: 502 });
        }
        return NextResponse.json({ error: `Failed to generate text: ${error.message}` }, { status: 500 });
    }
}
