import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock the ChatResponseGenerator
const mockGenerateResponse = vi.fn().mockResolvedValue({
  content: 'I understand your concern. Can you tell me more about the pain?',
  usage: {
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150
  }
});

vi.mock('@/services/chat-response-generator', () => ({
  ChatResponseGenerator: vi.fn().mockImplementation(() => ({
    generateResponse: mockGenerateResponse
  }))
}));

// Mock rate limiting
vi.mock('@/lib/rate-limiter', () => ({
  medicalRateLimiter: {
    takeToken: vi.fn().mockReturnValue(0)
  }
}));

describe('/api/chat route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the default mock behavior
    mockGenerateResponse.mockResolvedValue({
      content: 'I understand your concern. Can you tell me more about the pain?',
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST method', () => {
    it('should validate request body and return chat response', async () => {
      const requestBody = {
        message: 'I have a headache and feel nauseous',
        patientId: 'patient-123',
        encounterId: 'encounter-456',
        conversationHistory: []
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          message: expect.any(String),
          messageId: expect.any(String),
          timestamp: expect.any(String),
          usage: expect.objectContaining({
            promptTokens: expect.any(Number),
            completionTokens: expect.any(Number),
            totalTokens: expect.any(Number)
          })
        }
      });
    });

    it('should return validation error for invalid request', async () => {
      const { medicalRateLimiter } = await import('@/lib/rate-limiter');
      vi.mocked(medicalRateLimiter.takeToken).mockReturnValue(0); // Reset rate limiter mock
      
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Validation failed');
    });

    it('should return rate limit error when rate limit exceeded', async () => {
      const { medicalRateLimiter } = await import('@/lib/rate-limiter');
      vi.mocked(medicalRateLimiter.takeToken).mockReturnValue(1000);

      const requestBody = {
        message: 'Test message',
        patientId: 'patient-123',
        encounterId: 'encounter-456',
        conversationHistory: []
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Rate limit exceeded');
    });

    it('should handle internal server errors', async () => {
      const { medicalRateLimiter } = await import('@/lib/rate-limiter');
      vi.mocked(medicalRateLimiter.takeToken).mockReturnValue(0); // Reset rate limiter mock
      
      mockGenerateResponse.mockRejectedValue(new Error('Service unavailable'));

      const requestBody = {
        message: 'Test message',
        patientId: 'patient-123',
        encounterId: 'encounter-456',
        conversationHistory: []
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Internal server error');
    });
  });
});