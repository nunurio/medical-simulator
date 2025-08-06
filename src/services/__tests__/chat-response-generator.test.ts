import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatResponseGenerator } from '../chat-response-generator';
import type { LLMService } from '../llm-service';
import type { MedicalTerminologyValidator } from '../medical-terminology-validator';

// Mock dependencies
const mockLLMService = {
  generateChatResponse: vi.fn()
} as unknown as LLMService;

const mockValidator = {
  validateResponse: vi.fn()
} as unknown as MedicalTerminologyValidator;

describe('ChatResponseGenerator', () => {
  let generator: ChatResponseGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new ChatResponseGenerator(mockLLMService, mockValidator);
  });

  describe('generateResponse', () => {
    it('should generate chat response with patient persona context', async () => {
      const mockLLMResponse = {
        content: 'I feel dizzy and my head hurts a lot.',
        usage: { promptTokens: 80, completionTokens: 20, totalTokens: 100 }
      };

      vi.mocked(mockLLMService.generateChatResponse).mockResolvedValue(mockLLMResponse);
      vi.mocked(mockValidator.validateResponse).mockResolvedValue({
        isValid: true,
        filteredContent: mockLLMResponse.content,
        warnings: []
      });

      const result = await generator.generateResponse(
        'How are you feeling today?',
        {
          patientId: 'patient-123',
          demographics: {
            firstName: 'John',
            lastName: 'Doe',
            age: 45,
            gender: 'male'
          },
          currentConditions: ['migraine', 'hypertension']
        },
        []
      );

      expect(result.content).toBe('I feel dizzy and my head hurts a lot.');
      expect(result.usage).toEqual({
        promptTokens: 80,
        completionTokens: 20,
        totalTokens: 100
      });
      expect(mockLLMService.generateChatResponse).toHaveBeenCalledWith(
        'How are you feeling today?',
        expect.objectContaining({
          patientId: 'patient-123',
          patientContext: expect.any(String),
          conversationHistory: expect.any(String)
        })
      );
    });

    it('should format conversation history correctly', async () => {
      const conversationHistory = [
        { role: 'provider' as const, content: 'Hello, how are you feeling?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'patient' as const, content: 'I have a headache', timestamp: '2025-01-01T10:01:00Z' }
      ];

      vi.mocked(mockLLMService.generateChatResponse).mockResolvedValue({
        content: 'The headache is getting worse.',
        usage: { promptTokens: 100, completionTokens: 25, totalTokens: 125 }
      });
      vi.mocked(mockValidator.validateResponse).mockResolvedValue({
        isValid: true,
        filteredContent: 'The headache is getting worse.',
        warnings: []
      });

      await generator.generateResponse(
        'Can you describe the pain more?',
        { patientId: 'patient-123' },
        conversationHistory
      );

      expect(mockLLMService.generateChatResponse).toHaveBeenCalledWith(
        'Can you describe the pain more?',
        expect.objectContaining({
          conversationHistory: expect.stringContaining('医療従事者: Hello, how are you feeling?')
        })
      );
    });

    it('should limit conversation history to last 10 messages', async () => {
      const longHistory = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 === 0 ? 'provider' as const : 'patient' as const,
        content: `Message ${i + 1}`,
        timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString()
      }));

      vi.mocked(mockLLMService.generateChatResponse).mockResolvedValue({
        content: 'Response',
        usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 }
      });
      vi.mocked(mockValidator.validateResponse).mockResolvedValue({
        isValid: true,
        filteredContent: 'Response',
        warnings: []
      });

      await generator.generateResponse('Test message', { patientId: 'test' }, longHistory);

      const callArgs = vi.mocked(mockLLMService.generateChatResponse).mock.calls[0][1];
      const historyContent = callArgs.conversationHistory;
      
      // Should only include last 10 messages (Message 6 to Message 15)
      expect(historyContent).toContain('Message 6');
      expect(historyContent).toContain('Message 15');
      expect(historyContent).not.toContain('Message 5');
    });

    it('should handle validation warnings in response', async () => {
      vi.mocked(mockLLMService.generateChatResponse).mockResolvedValue({
        content: 'I think you should take some aspirin for your headache.',
        usage: { promptTokens: 60, completionTokens: 15, totalTokens: 75 }
      });
      vi.mocked(mockValidator.validateResponse).mockResolvedValue({
        isValid: true,
        filteredContent: 'I have a headache that bothers me.',
        warnings: ['Removed medical advice: aspirin recommendation']
      });

      const result = await generator.generateResponse(
        'What should I do about my headache?',
        { patientId: 'patient-123' },
        []
      );

      expect(result.content).toBe('I have a headache that bothers me.');
      expect(result.warnings).toEqual(['Removed medical advice: aspirin recommendation']);
    });

    it('should throw error when validation fails', async () => {
      vi.mocked(mockLLMService.generateChatResponse).mockResolvedValue({
        content: 'Invalid response',
        usage: { promptTokens: 30, completionTokens: 5, totalTokens: 35 }
      });
      vi.mocked(mockValidator.validateResponse).mockResolvedValue({
        isValid: false,
        filteredContent: '',
        warnings: [],
        errors: ['Response contained inappropriate medical advice']
      });

      await expect(
        generator.generateResponse('Test', { patientId: 'test' }, [])
      ).rejects.toThrow('Response validation failed: Response contained inappropriate medical advice');
    });
  });

  describe('buildPatientContext', () => {
    it('should format patient context correctly', () => {
      const patientPersona = {
        patientId: 'patient-123',
        demographics: {
          firstName: 'Jane',
          lastName: 'Smith',
          age: 32,
          gender: 'female'
        },
        currentConditions: ['asthma', 'anxiety'],
        vitalSigns: {
          bloodPressure: { systolic: 120, diastolic: 80 },
          heartRate: { value: 72 }
        }
      };

      const context = generator.buildPatientContext(patientPersona);

      expect(context).toContain('Jane Smith');
      expect(context).toContain('32歳');
      expect(context).toContain('女性');
      expect(context).toContain('asthma');
      expect(context).toContain('anxiety');
      expect(context).toContain('120/80');
      expect(context).toContain('72');
    });
  });

  describe('formatConversationHistory', () => {
    it('should format conversation history with proper labels', () => {
      const history = [
        { role: 'provider' as const, content: 'How are you?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'patient' as const, content: 'I feel sick', timestamp: '2025-01-01T10:01:00Z' }
      ];

      const formatted = generator.formatConversationHistory(history);

      expect(formatted).toContain('医療従事者: How are you?');
      expect(formatted).toContain('患者: I feel sick');
    });

    it('should return empty string for empty history', () => {
      const formatted = generator.formatConversationHistory([]);
      expect(formatted).toBe('');
    });
  });
});