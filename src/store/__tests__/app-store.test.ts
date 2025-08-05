/**
 * Tests for the integrated app store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAppStore } from '../app-store';
import { createPatientId, createEncounterId, createISODateTime } from '@/types/core';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Setup global mocks
// @ts-expect-error - Mocking window for testing
global.window = {
  localStorage: localStorageMock
};
global.localStorage = localStorageMock as Storage;

describe('AppStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Store Integration', () => {
    it('should create a store with all slices integrated', () => {
      const store = createAppStore();

      // Verify all store slices are present
      // PatientStore
      expect(store.getState().patients).toBeDefined();
      expect(store.getState().activePatientId).toBeDefined();
      expect(store.getState().setActivePatient).toBeDefined();
      expect(store.getState().loadPatient).toBeDefined();
      expect(store.getState().updatePatientVitals).toBeDefined();

      // ChatStore
      expect(store.getState().conversations).toBeDefined();
      expect(store.getState().activeConversationId).toBeDefined();
      expect(store.getState().addMessage).toBeDefined();
      expect(store.getState().createConversation).toBeDefined();

      // OrderStore
      expect(store.getState().orders).toBeDefined();
      expect(store.getState().pendingOrders).toBeDefined();
      expect(store.getState().createOrder).toBeDefined();
      expect(store.getState().updateOrderStatus).toBeDefined();

      // SimulationStore
      expect(store.getState().mode).toBeDefined();
      expect(store.getState().difficulty).toBeDefined();
      expect(store.getState().startSimulation).toBeDefined();
      expect(store.getState().endSimulation).toBeDefined();

      // UIStore
      expect(store.getState().theme).toBeDefined();
      expect(store.getState().sidebarOpen).toBeDefined();
      expect(store.getState().setTheme).toBeDefined();
      expect(store.getState().toggleSidebar).toBeDefined();

      // Global actions
      expect(store.getState().resetApp).toBeDefined();
      expect(store.getState().persistState).toBeDefined();
      expect(store.getState().loadPersistedState).toBeDefined();
    });

    it('should have correct initial state', () => {
      const store = createAppStore();
      const state = store.getState();

      // PatientStore initial state
      expect(state.patients).toEqual({});
      expect(state.activePatientId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      // ChatStore initial state
      expect(state.conversations).toEqual({});
      expect(state.activeConversationId).toBeNull();
      expect(state.isTyping).toBe(false);

      // OrderStore initial state
      expect(state.orders).toEqual({});
      expect(state.pendingOrders).toEqual([]);

      // SimulationStore initial state
      expect(state.mode).toBe('outpatient');
      expect(state.difficulty).toBe('beginner');
      expect(state.department).toBe('general_medicine');
      expect(state.isRunning).toBe(false);
      expect(state.startTime).toBeNull();
      expect(state.endTime).toBeNull();
      expect(state.score).toBeNull();

      // UIStore initial state
      expect(state.theme).toBe('light');
      expect(state.sidebarOpen).toBe(true);
      expect(state.activeTab).toBe('');
      expect(state.modals).toEqual({
        orderModal: false,
        resultModal: false,
        helpModal: false,
      });
      expect(state.notifications).toEqual([]);
    });

    it('should reset entire app state', () => {
      const store = createAppStore();

      // Modify state
      store.getState().setTheme('dark');
      store.getState().toggleSidebar();
      store.getState().setActiveTab('orders');
      store.getState().setMode('emergency');
      store.getState().setDifficulty('advanced');

      expect(store.getState().theme).toBe('dark');
      expect(store.getState().sidebarOpen).toBe(false);
      expect(store.getState().activeTab).toBe('orders');
      expect(store.getState().mode).toBe('emergency');
      expect(store.getState().difficulty).toBe('advanced');

      // Reset app
      store.getState().resetApp();

      // Verify reset to initial state
      expect(store.getState().theme).toBe('light');
      expect(store.getState().sidebarOpen).toBe(true);
      expect(store.getState().activeTab).toBe('');
      expect(store.getState().mode).toBe('outpatient');
      expect(store.getState().difficulty).toBe('beginner');
    });
  });

  describe('State Persistence', () => {
    it('should persist state to localStorage', () => {
      const store = createAppStore();

      // Modify state
      store.getState().setTheme('dark');
      store.getState().setActiveTab('vitals');
      store.getState().setMode('emergency');

      // Persist state
      store.getState().persistState();

      // Verify localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'medical-simulator-state',
        expect.any(String)
      );

      // Verify persisted data structure
      const persistedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );
      expect(persistedData.state).toBeDefined();
      expect(persistedData.version).toBeDefined();
    });

    it('should load persisted state from localStorage', () => {
      const persistedState = {
        state: {
          theme: 'dark',
          sidebarOpen: false,
          activeTab: 'orders',
          mode: 'emergency',
          difficulty: 'advanced',
        },
        version: 1,
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(persistedState)
      );

      const store = createAppStore();

      // Load persisted state
      store.getState().loadPersistedState();

      // Verify state was loaded
      expect(store.getState().theme).toBe('dark');
      expect(store.getState().sidebarOpen).toBe(false);
      expect(store.getState().activeTab).toBe('orders');
      expect(store.getState().mode).toBe('emergency');
      expect(store.getState().difficulty).toBe('advanced');
    });

    it('should handle missing persisted state gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const store = createAppStore();

      // Load persisted state
      store.getState().loadPersistedState();

      // Verify default state is maintained
      expect(store.getState().theme).toBe('light');
      expect(store.getState().sidebarOpen).toBe(true);
    });

    it('should handle corrupted persisted state gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const store = createAppStore();

      // Load persisted state
      store.getState().loadPersistedState();

      // Verify default state is maintained
      expect(store.getState().theme).toBe('light');
      expect(store.getState().sidebarOpen).toBe(true);
    });
  });

  describe('Selective Persistence', () => {
    it('should only persist allowed fields', () => {
      const store = createAppStore();

      // Set various state fields
      // UI settings (should persist)
      store.getState().setTheme('dark');
      store.getState().toggleSidebar();
      
      // Patient data (should persist)
      store.getState().setActivePatient(createPatientId('patient-123'));
      
      // Chat data (should partially persist)
      const conversationId = store.getState().createConversation(createEncounterId('encounter-123'));
      store.getState().addMessage(conversationId, {
        id: 'msg-1',
        messageType: 'patient',
        content: 'Test message',
        timestamp: createISODateTime(new Date().toISOString()),
        encounterId: createEncounterId('encounter-123'),
      });
      
      // Simulation state (should not persist running state)
      store.getState().startSimulation();

      // Persist state
      store.getState().persistState();

      const persistedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );

      // Verify selective persistence
      expect(persistedData.state.theme).toBe('dark');
      expect(persistedData.state.sidebarOpen).toBe(false);
      expect(persistedData.state.activePatientId).toBe('patient-123');
      
      // Simulation running state should not persist
      expect(persistedData.state.isRunning).toBeUndefined();
      expect(persistedData.state.startTime).toBeUndefined();
      
      // Conversations should not be persisted (for PHI security)
      expect(persistedData.state.conversations).toBeUndefined();
    });

    it('should restore only persisted fields', () => {
      const persistedState = {
        state: {
          theme: 'dark',
          sidebarOpen: false,
          activePatientId: 'patient-123',
          mode: 'emergency',
          difficulty: 'advanced',
        },
        version: 1,
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(persistedState)
      );

      const store = createAppStore();

      // Set some runtime state
      store.getState().startSimulation();

      expect(store.getState().isRunning).toBe(true);

      // Load persisted state
      store.getState().loadPersistedState();

      // Verify persisted fields were restored
      expect(store.getState().theme).toBe('dark');
      expect(store.getState().sidebarOpen).toBe(false);
      expect(store.getState().activePatientId).toBe('patient-123');
      
      // Runtime state should be preserved
      expect(store.getState().isRunning).toBe(true);
    });
  });
});