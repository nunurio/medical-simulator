import { LLMService } from './llm-service';
import { MedicalTerminologyValidator } from './medical-terminology-validator';

export interface ChatMessage {
  role: 'patient' | 'provider' | 'system';
  content: string;
  timestamp: string;
}

export interface PatientPersona {
  patientId: string;
  demographics?: {
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
  };
  currentConditions?: string[];
  vitalSigns?: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: { value: number };
    temperature?: { value: number };
  };
  [key: string]: unknown;
}

export interface ChatGenerationResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  warnings?: string[];
}

export class ChatResponseGenerator {
  constructor(
    private llmService?: LLMService,
    private validator?: MedicalTerminologyValidator
  ) {
    this.llmService = llmService || LLMService.getInstance();
    this.validator = validator || new MedicalTerminologyValidator();
  }

  async generateResponse(
    message: string,
    patientPersona: PatientPersona,
    conversationHistory: ChatMessage[]
  ): Promise<ChatGenerationResult> {
    // Build patient context
    const patientContext = this.buildPatientContext(patientPersona);
    
    // Format conversation history (limit to last 10 messages)
    const formattedHistory = this.formatConversationHistory(
      conversationHistory.slice(-10)
    );

    // Generate response using LLM service
    const llmResponse = await this.llmService!.generateChatResponse(message, {
      patientId: patientPersona.patientId,
      patientContext,
      conversationHistory: formattedHistory
    });

    // Validate and filter response
    const validationResult = await this.validator!.validateResponse(llmResponse.content);
    
    if (!validationResult.isValid) {
      throw new Error(`Response validation failed: ${validationResult.errors?.join(', ')}`);
    }

    return {
      content: validationResult.filteredContent,
      usage: llmResponse.usage,
      warnings: validationResult.warnings
    };
  }

  buildPatientContext(patientPersona: PatientPersona): string {
    const { demographics, currentConditions, vitalSigns } = patientPersona;
    
    let context = `患者ID: ${patientPersona.patientId}\n`;
    
    if (demographics) {
      const { firstName, lastName, age, gender } = demographics;
      context += `患者名: ${firstName || ''} ${lastName || ''}\n`;
      if (age) context += `年齢: ${age}歳\n`;
      if (gender) context += `性別: ${gender === 'male' ? '男性' : gender === 'female' ? '女性' : gender}\n`;
    }
    
    if (currentConditions?.length) {
      context += `現在の症状・状態: ${currentConditions.join(', ')}\n`;
    }
    
    if (vitalSigns) {
      context += 'バイタルサイン:\n';
      if (vitalSigns.bloodPressure) {
        context += `血圧: ${vitalSigns.bloodPressure.systolic}/${vitalSigns.bloodPressure.diastolic} mmHg\n`;
      }
      if (vitalSigns.heartRate) {
        context += `心拍数: ${vitalSigns.heartRate.value} bpm\n`;
      }
      if (vitalSigns.temperature) {
        context += `体温: ${vitalSigns.temperature.value}°C\n`;
      }
    }
    
    return context;
  }

  formatConversationHistory(history: ChatMessage[]): string {
    if (history.length === 0) return '';
    
    return history.map(msg => {
      const role = msg.role === 'provider' ? '医療従事者' : 
                   msg.role === 'patient' ? '患者' : 'システム';
      return `${role}: ${msg.content}`;
    }).join('\n');
  }
}