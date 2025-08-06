import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatResponseGenerator } from '@/services/chat-response-generator';
import { medicalRateLimiter } from '@/lib/rate-limiter';

// Request validation schema
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  patientId: z.string().min(1),
  encounterId: z.string().min(1),
  conversationHistory: z.array(z.object({
    role: z.enum(['patient', 'provider', 'system']),
    content: z.string(),
    timestamp: z.string()
  })).default([])
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const waitTime = medicalRateLimiter.takeToken();
    if (waitTime > 0) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ChatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed: ' + validationResult.error.issues.map(e => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    const { message, patientId, encounterId, conversationHistory } = validationResult.data;

    // Initialize chat response generator
    const generator = new ChatResponseGenerator();
    
    // Generate response with minimal patient context for now
    const response = await generator.generateResponse(
      message,
      { patientId },
      conversationHistory
    );

    return NextResponse.json({
      success: true,
      data: {
        message: response.content,
        messageId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        usage: response.usage,
        warnings: response.warnings
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}