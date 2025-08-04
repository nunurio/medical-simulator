import { describe, it, expect } from 'vitest';
import type {
  AppState,
  PatientStore,
  ChatStore,
  OrderStore,
  SimulationStore,
  UIStore,
  SimulationMode,
  DifficultyLevel,
  Department
} from '../state';
import type { PatientId, EncounterId } from '../core';
import type { PatientPersona } from '../patient';
import type { ChatMessage } from '../chat';
import type { MedicalOrder } from '../medical-orders';
import { createPatientId, createEncounterId } from '../core';

describe('State Management Types', () => {
  describe('Patient Store', () => {
    it('should define patient store interface', () => {
      const patientStore: Partial<PatientStore> = {
        patients: {},
        activePatientId: null,
        loadingPatientId: null,
        error: null,
        
        setActivePatient: (id: PatientId) => {},
        loadPatient: async (id: PatientId) => ({} as PatientPersona),
        updatePatientVitals: (id: PatientId, vitals: unknown) => {},
        clearPatientError: () => {}
      };

      expect(patientStore.patients).toBeDefined();
      expect(patientStore.activePatientId).toBeNull();
    });
  });

  describe('Chat Store', () => {
    it('should define chat store interface', () => {
      const chatStore: Partial<ChatStore> = {
        conversations: {},
        activeConversationId: null,
        isTyping: false,
        
        addMessage: (conversationId: string, message: ChatMessage) => {},
        setTyping: (isTyping: boolean) => {},
        createConversation: (encounterId: EncounterId) => 'conv-001',
        endConversation: (conversationId: string) => {}
      };

      expect(chatStore.conversations).toBeDefined();
      expect(chatStore.isTyping).toBe(false);
    });
  });

  describe('Order Store', () => {
    it('should define order store interface', () => {
      const orderStore: Partial<OrderStore> = {
        orders: {},
        pendingOrders: [],
        
        createOrder: (order: MedicalOrder) => {},
        updateOrderStatus: (orderId: string, status: unknown) => {},
        cancelOrder: (orderId: string) => {},
        getPendingOrdersCount: () => 0
      };

      expect(orderStore.orders).toBeDefined();
      expect(orderStore.pendingOrders).toEqual([]);
    });
  });

  describe('Simulation Store', () => {
    it('should define simulation store interface', () => {
      const simulationStore: Partial<SimulationStore> = {
        mode: 'outpatient',
        difficulty: 'beginner',
        department: 'general_medicine',
        isRunning: false,
        startTime: null,
        endTime: null,
        score: null,
        
        startSimulation: () => {},
        endSimulation: () => {},
        setMode: (mode: SimulationMode) => {},
        setDifficulty: (level: DifficultyLevel) => {},
        setDepartment: (dept: Department) => {},
        calculateScore: () => 0
      };

      expect(simulationStore.mode).toBe('outpatient');
      expect(simulationStore.difficulty).toBe('beginner');
      expect(simulationStore.isRunning).toBe(false);
    });

    it('should support simulation modes', () => {
      const modes: SimulationMode[] = ['outpatient', 'emergency', 'inpatient'];
      modes.forEach(mode => {
        expect(['outpatient', 'emergency', 'inpatient']).toContain(mode);
      });
    });

    it('should support difficulty levels', () => {
      const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
      levels.forEach(level => {
        expect(['beginner', 'intermediate', 'advanced']).toContain(level);
      });
    });

    it('should support departments', () => {
      const departments: Department[] = [
        'general_medicine',
        'cardiology',
        'gastroenterology',
        'respiratory',
        'neurology',
        'emergency'
      ];
      
      departments.forEach(dept => {
        expect([
          'general_medicine',
          'cardiology',
          'gastroenterology',
          'respiratory',
          'neurology',
          'emergency'
        ]).toContain(dept);
      });
    });
  });

  describe('UI Store', () => {
    it('should define UI store interface', () => {
      const uiStore: Partial<UIStore> = {
        theme: 'light',
        sidebarOpen: true,
        activeTab: 'patient',
        modals: {
          orderModal: false,
          resultModal: false,
          helpModal: false
        },
        notifications: [],
        
        setTheme: (theme: 'light' | 'dark') => {},
        toggleSidebar: () => {},
        setActiveTab: (tab: string) => {},
        openModal: (modal: string) => {},
        closeModal: (modal: string) => {},
        addNotification: (notification: unknown) => {},
        removeNotification: (id: string) => {}
      };

      expect(uiStore.theme).toBe('light');
      expect(uiStore.sidebarOpen).toBe(true);
      expect(uiStore.modals?.orderModal).toBe(false);
    });
  });

  describe('App State', () => {
    it('should combine all store slices', () => {
      const appState: Partial<AppState> = {
        // Patient store
        patients: {},
        activePatientId: null,
        
        // Chat store
        conversations: {},
        activeConversationId: null,
        isTyping: false,
        
        // Order store
        orders: {},
        pendingOrders: [],
        
        // Simulation store
        mode: 'outpatient',
        difficulty: 'beginner',
        department: 'general_medicine',
        isRunning: false,
        
        // UI store
        theme: 'light',
        sidebarOpen: true,
        activeTab: 'patient'
      };

      expect(appState).toBeDefined();
      expect(appState.mode).toBe('outpatient');
      expect(appState.theme).toBe('light');
    });
  });
});