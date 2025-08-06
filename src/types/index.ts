/**
 * Central export point for all type definitions in the medical simulator application.
 */

// Core types
export * from './core';

// Patient types
export * from './patient';

// Chat types
export * from './chat';

// Medical order types
export * from './medical-orders';

// State management types
export * from './state';

// Validation types and services
export * from './validation-exports';

// LLM types - explicit exports to avoid conflicts
export {
  LLMPromptTypeSchema,
  type LLMPromptType,
  ResponseFormatSchema,
  LLMRequestSchema,
  type LLMRequest,
  LLMResponseSchema,
  type LLMResponse,
  LLMError
} from './llm';

export {
  type PatientContext as LLMPatientContext // Rename to avoid conflict
} from './llm';

export * from './llm-chat-schemas';

// API types
export * from './api';