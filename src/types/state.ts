/**
 * State management type definitions for the medical simulator application.
 * Designed for use with Zustand state management library.
 */

import type { PatientId, EncounterId, ISODateTime } from './core';
import type { PatientPersona, VitalSigns } from './patient';
import type { ChatMessage, ChatConversation } from './chat';
import type { MedicalOrder, OrderStatus } from './medical-orders';

// Simulation types
export type SimulationMode = 'outpatient' | 'emergency' | 'inpatient';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type Department = 
  | 'general_medicine'
  | 'cardiology'
  | 'gastroenterology'
  | 'respiratory'
  | 'neurology'
  | 'emergency';

// Notification types
export interface Notification {
  readonly id: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly message: string;
  readonly timestamp: ISODateTime;
  readonly duration?: number;
}

// Patient store slice
export interface PatientStore {
  // State
  patients: Record<PatientId, PatientPersona>;
  activePatientId: PatientId | null;
  loadingPatientId: PatientId | null;
  error: string | null;
  
  // Actions
  setActivePatient: (id: PatientId) => void;
  loadPatient: (id: PatientId) => Promise<PatientPersona>;
  updatePatientVitals: (id: PatientId, vitals: VitalSigns) => void;
  addPatientSymptom: (id: PatientId, symptom: unknown) => void;
  clearPatientError: () => void;
}

// Chat store slice
export interface ChatStore {
  // State
  conversations: Record<string, ChatConversation>;
  activeConversationId: string | null;
  isTyping: boolean;
  
  // Actions
  addMessage: (conversationId: string, message: ChatMessage) => void;
  setTyping: (isTyping: boolean) => void;
  createConversation: (encounterId: EncounterId) => string;
  endConversation: (conversationId: string) => void;
  setActiveConversation: (id: string) => void;
}

// Order store slice
export interface OrderStore {
  // State
  orders: Record<string, MedicalOrder>;
  pendingOrders: string[];
  
  // Actions
  createOrder: (order: MedicalOrder) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => void;
  getPendingOrdersCount: () => number;
  getOrdersByPatient: (patientId: PatientId) => MedicalOrder[];
}

// Simulation store slice
export interface SimulationStore {
  // State
  mode: SimulationMode;
  difficulty: DifficultyLevel;
  department: Department;
  isRunning: boolean;
  startTime: ISODateTime | null;
  endTime: ISODateTime | null;
  score: number | null;
  
  // Actions
  startSimulation: () => void;
  endSimulation: () => void;
  setMode: (mode: SimulationMode) => void;
  setDifficulty: (level: DifficultyLevel) => void;
  setDepartment: (dept: Department) => void;
  calculateScore: () => number;
  resetSimulation: () => void;
}

// UI store slice
export interface UIStore {
  // State
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeTab: string;
  modals: {
    orderModal: boolean;
    resultModal: boolean;
    helpModal: boolean;
  };
  notifications: Notification[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  openModal: (modal: keyof UIStore['modals']) => void;
  closeModal: (modal: keyof UIStore['modals']) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

// Combined app state
export interface AppState extends 
  PatientStore,
  ChatStore,
  OrderStore,
  SimulationStore,
  UIStore {
  // Additional global actions
  resetApp: () => void;
  persistState: () => void;
  loadPersistedState: () => void;
}