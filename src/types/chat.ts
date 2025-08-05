/**
 * Chat-related type definitions for the medical simulator application.
 */

import type { EncounterId, ISODateTime } from './core';

// Message role types
export type MessageRole = 'patient' | 'provider' | 'system';

// Base message interface
interface BaseChatMessage {
  readonly id: string;
  readonly timestamp: ISODateTime;
  readonly encounterId: EncounterId;
}

// Message type discriminators
export type ChatMessage = 
  | PatientMessage
  | SimulatorMessage
  | SystemMessage
  | ActionMessage;

// Patient message from the simulated patient
export interface PatientMessage extends BaseChatMessage {
  messageType: 'patient';
  content: string;
  symptoms?: SymptomReport[];
  painLevel?: PainScale;
  mood?: MoodIndicator;
}

// Message from the medical simulator/AI
export interface SimulatorMessage extends BaseChatMessage {
  messageType: 'simulator';
  content: string;
  actions?: AvailableAction[];
  clinicalNotes?: string;
}

// System-generated messages
export interface SystemMessage extends BaseChatMessage {
  messageType: 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

// Action result messages
export interface ActionMessage extends BaseChatMessage {
  messageType: 'action';
  content: string;
  action: AvailableAction;
  result?: ActionResult;
}

// Symptom reporting
export interface SymptomReport {
  readonly symptom: string;
  readonly severity: 1 | 2 | 3 | 4 | 5;
  readonly duration: string;
  readonly triggers?: string[];
  readonly location?: string;
  readonly quality?: string;
}

// Pain scale (0-10)
export type PainScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Mood indicators
export type MoodIndicator = 'calm' | 'anxious' | 'distressed' | 'confused' | 'irritable' | 'depressed';

// Action types
export type ActionType = 
  | 'order_test'
  | 'order_medication'
  | 'order_imaging'
  | 'view_result'
  | 'physical_exam'
  | 'ask_question'
  | 'provide_education'
  | 'consult_specialist';

export type ActionCategory = 'diagnostic' | 'treatment' | 'communication' | 'referral';
export type ActionUrgency = 'routine' | 'urgent' | 'stat';

// Available actions for the user
export interface AvailableAction {
  readonly actionType: ActionType;
  readonly label: string;
  readonly actionId: string;
  readonly category?: ActionCategory;
  readonly urgency?: ActionUrgency;
}

// Action execution result
export interface ActionResult {
  readonly status: 'pending' | 'completed' | 'failed';
  readonly data?: Record<string, unknown>;
  readonly error?: string;
}

// Chat conversation
export interface ChatConversation {
  readonly id: string;
  readonly encounterId: EncounterId;
  readonly startedAt: ISODateTime;
  readonly endedAt: ISODateTime | null;
  readonly lastActivityAt: ISODateTime;
  readonly messages: ChatMessage[];
  readonly status: 'active' | 'paused' | 'completed';
  readonly participants: {
    patient: {
      role: 'patient';
      name: string;
    };
    provider: {
      role: 'provider';
      name: string;
    };
  };
}