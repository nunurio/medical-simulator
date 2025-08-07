/**
 * Integrated app store combining all store slices
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AppState } from '@/types/state';
import { createISODateTime, createScenarioId, createISODate, type OrderId } from '@/types/core';
import type { MedicalOrder } from '@/types/medical-orders';
import { usePatientStore } from './patient-store';
import { useChatStore } from './chat-store';
import { useOrderStore } from './order-store';
import { useSimulationStore } from './simulation-store';
import { useUIStore } from './ui-store';

// 初期状態
const initialState = {
  // PatientStore
  patients: {},
  activePatientId: null,
  loading: false,
  error: null,
  
  // ChatStore
  conversations: {},
  activeConversationId: null,
  isTyping: false,
  
  // OrderStore
  orders: {},
  pendingOrders: [],
  
  // SimulationStore
  mode: 'outpatient' as const,
  difficulty: 'beginner' as const,
  department: 'general_medicine' as const,
  isRunning: false,
  startTime: null,
  endTime: null,
  score: null,
  
  // UIStore
  theme: 'light' as const,
  sidebarOpen: true,
  activeTab: '',
  modals: {
    orderModal: false,
    resultModal: false,
    helpModal: false,
  },
  notifications: [],
};

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    ...initialState,
    
    // PatientStore Actions
    setPatients: (patients) => {
      usePatientStore.getState().setPatients(patients);
      set((state) => {
        state.patients = patients;
      });
    },
    
    addPatient: (patient) => {
      usePatientStore.getState().addPatient(patient);
      set((state) => {
        state.patients[patient.id] = patient;
      });
    },
    
    updatePatient: (id, updates) => {
      usePatientStore.getState().updatePatient(id, updates);
      set((state) => {
        if (state.patients[id]) {
          Object.assign(state.patients[id], updates);
        }
      });
    },
    
    removePatient: (id) => {
      usePatientStore.getState().removePatient(id);
      set((state) => {
        delete state.patients[id];
      });
    },
    
    setActivePatient: (id) => {
      usePatientStore.getState().setActivePatient(id);
      set((state) => {
        state.activePatientId = id;
      });
    },
    
    loadPatient: async (id) => {
      return usePatientStore.getState().loadPatient(id);
    },
    
    updatePatientVitals: (id, vitals) => {
      usePatientStore.getState().updatePatientVitals(id, vitals);
    },
    
    addPatientSymptom: (id, symptom) => {
      usePatientStore.getState().addPatientSymptom(id, symptom);
    },
    
    clearPatientError: () => {
      usePatientStore.getState().clearPatientError();
    },
    
    // ChatStore Actions
    createConversation: (encounterId) => {
      return useChatStore.getState().createConversation(encounterId);
    },
    
    addMessage: (conversationId, message) => {
      useChatStore.getState().addMessage(conversationId, message);
    },
    
    sendMessage: (conversationId, message) => {
      useChatStore.getState().sendMessage(conversationId, message);
    },
    
    removeMessage: (conversationId, messageId) => {
      useChatStore.getState().removeMessage(conversationId, messageId);
    },
    
    setTyping: (isTyping) => {
      useChatStore.getState().setTyping(isTyping);
    },
    
    setActiveConversation: (id) => {
      useChatStore.getState().setActiveConversation(id);
    },
    
    endConversation: (conversationId) => {
      useChatStore.getState().endConversation(conversationId);
    },
    
    // ChatStore History management
    archiveOldConversations: (olderThanMs) => {
      useChatStore.getState().archiveOldConversations(olderThanMs);
    },
    
    searchConversations: (query) => {
      return useChatStore.getState().searchConversations(query);
    },
    
    // ChatStore Context management
    updateConversationContext: (conversationId, context) => {
      useChatStore.getState().updateConversationContext(conversationId, context);
    },
    
    // ChatStore Message status management
    updateMessageStatus: (conversationId, messageId, status) => {
      useChatStore.getState().updateMessageStatus(conversationId, messageId, status);
    },
    
    confirmMessageDelivery: (conversationId, messageId, deliveryTime) => {
      useChatStore.getState().confirmMessageDelivery(conversationId, messageId, deliveryTime);
    },
    
    retryMessage: (conversationId, messageId) => {
      useChatStore.getState().retryMessage(conversationId, messageId);
    },
    
    // ChatStore Real-time communication
    setParticipantTyping: (conversationId, participant, isTyping) => {
      useChatStore.getState().setParticipantTyping(conversationId, participant, isTyping);
    },
    
    cleanupStaleTypingStates: (timeoutMs) => {
      useChatStore.getState().cleanupStaleTypingStates(timeoutMs);
    },
    
    // ChatStore Session management
    getSessionData: () => {
      return useChatStore.getState().getSessionData();
    },
    
    restoreSessionData: (sessionData) => {
      useChatStore.getState().restoreSessionData(sessionData);
    },
    
    // OrderStore Actions
    createOrder: (order) => {
      useOrderStore.getState().createOrder(order);
    },
    
    updateOrderStatus: (orderId, status) => {
      useOrderStore.getState().updateOrderStatus(orderId, status);
    },
    
    cancelOrder: (orderId) => {
      useOrderStore.getState().cancelOrder(orderId);
    },
    
    getPendingOrdersCount: () => {
      return useOrderStore.getState().getPendingOrdersCount();
    },
    
    getOrdersByPatient: (patientId) => {
      return useOrderStore.getState().getOrdersByPatient(patientId);
    },
    
    // SimulationStore Actions
    startSimulation: () => {
      useSimulationStore.getState().startSimulation();
      set((state) => {
        state.isRunning = true;
        state.startTime = createISODateTime(new Date().toISOString());
        state.endTime = null;
        state.score = null;
      });
    },
    
    endSimulation: () => {
      useSimulationStore.getState().endSimulation();
      set((state) => {
        state.isRunning = false;
        state.endTime = createISODateTime(new Date().toISOString());
      });
    },
    
    setMode: (mode) => {
      useSimulationStore.getState().setMode(mode);
      set((state) => {
        state.mode = mode;
      });
    },
    
    setDifficulty: (level) => {
      useSimulationStore.getState().setDifficulty(level);
      set((state) => {
        state.difficulty = level;
      });
    },
    
    setDepartment: (dept) => {
      useSimulationStore.getState().setDepartment(dept);
      set((state) => {
        state.department = dept;
      });
    },
    
    calculateScore: () => {
      return useSimulationStore.getState().calculateScore();
    },
    
    resetSimulation: () => {
      useSimulationStore.getState().resetSimulation();
      set((state) => {
        state.isRunning = false;
        state.startTime = null;
        state.endTime = null;
        state.score = null;
      });
    },
    
    // UIStore Actions
    setTheme: (theme) => {
      useUIStore.getState().setTheme(theme);
      set((state) => {
        state.theme = theme;
      });
    },
    
    toggleSidebar: () => {
      useUIStore.getState().toggleSidebar();
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      });
    },
    
    setActiveTab: (tab) => {
      useUIStore.getState().setActiveTab(tab);
      set((state) => {
        state.activeTab = tab;
      });
    },
    
    openModal: (modal) => {
      useUIStore.getState().openModal(modal);
      set((state) => {
        state.modals[modal] = true;
      });
    },
    
    closeModal: (modal) => {
      useUIStore.getState().closeModal(modal);
      set((state) => {
        state.modals[modal] = false;
      });
    },
    
    addNotification: (notification) => {
      useUIStore.getState().addNotification(notification);
    },
    
    removeNotification: (id) => {
      useUIStore.getState().removeNotification(id);
    },
    
    // Global Actions
    resetApp: () => {
      // 各ストアをリセット
      usePatientStore.setState({
        patients: {},
        activePatientId: null,
        loading: false,
        error: null,
      });
      
      useChatStore.setState({
        conversations: {},
        activeConversationId: null,
        isTyping: false,
      });
      
      useOrderStore.setState({
        orders: {},
        pendingOrders: [],
      });
      
      useSimulationStore.setState({
        mode: 'outpatient',
        difficulty: 'beginner',
        department: 'general_medicine',
        isRunning: false,
        startTime: null,
        endTime: null,
        score: null,
      });
      
      useUIStore.setState({
        theme: 'light',
        sidebarOpen: true,
        activeTab: '',
        modals: {
          orderModal: false,
          resultModal: false,
          helpModal: false,
        },
        notifications: [],
      });
      
      // AppStore自体もリセット
      set(() => initialState);
    },
    
    persistState: () => {
      if (typeof window === 'undefined') return;
      
      const state = get();
      const toPersist = {
        // UI設定を永続化
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        activeTab: state.activeTab,
        
        // アクティブな患者IDを永続化
        activePatientId: state.activePatientId,
        
        // シミュレーション設定を永続化
        mode: state.mode,
        difficulty: state.difficulty,
        department: state.department,
      };
      
      localStorage.setItem('medical-simulator-state', JSON.stringify({
        state: toPersist,
        version: 1
      }));
    },
    
    loadPersistedState: () => {
      if (typeof window === 'undefined') return;
      
      const persisted = localStorage.getItem('medical-simulator-state');
      if (!persisted) return;
      
      try {
        const parsed = JSON.parse(persisted);
        const state = parsed.state || parsed; // Handle both old and new format
        set((draft) => {
          // UI設定を復元
          if (state.theme) draft.theme = state.theme;
          if (typeof state.sidebarOpen === 'boolean') draft.sidebarOpen = state.sidebarOpen;
          if (state.activeTab) draft.activeTab = state.activeTab;
          
          // アクティブな患者IDを復元
          if (state.activePatientId) draft.activePatientId = state.activePatientId;
          
          // シミュレーション設定を復元
          if (state.mode) draft.mode = state.mode;
          if (state.difficulty) draft.difficulty = state.difficulty;
          if (state.department) draft.department = state.department;
        });
      } catch (error) {
        console.error('永続化状態の読み込みに失敗しました:', error);
      }
    },
  }))
);

// Factory function for creating app store (for testing)
export const createAppStore = () => {
  return create<AppState>()(
    immer((set, get) => ({
      ...initialState,
      
      // PatientStore Actions
      setPatients: (patients) => {
        set((state) => {
          state.patients = patients;
        });
      },
      
      addPatient: (patient) => {
        set((state) => {
          state.patients[patient.id] = patient;
        });
      },
      
      updatePatient: (id, updates) => {
        set((state) => {
          if (state.patients[id]) {
            Object.assign(state.patients[id], updates);
          }
        });
      },
      
      removePatient: (id) => {
        set((state) => {
          delete state.patients[id];
        });
      },
      
      setActivePatient: (id) => {
        set((state) => {
          state.activePatientId = id;
        });
      },
      
      loadPatient: async (id) => {
        set((state) => {
          state.loading = true;
        });
        // Mock implementation for testing
        const mockPatient = {
          id,
          scenarioId: createScenarioId('scenario-1'),
          demographics: {
            firstName: 'Test',
            lastName: 'Patient',
            dateOfBirth: createISODate('1980-01-01'),
            gender: 'male' as const,
            bloodType: 'A+' as const,
          },
          chiefComplaint: 'Test complaint',
          presentIllness: 'Test illness',
          medicalHistory: {
            surgicalHistory: [],
            familyHistory: [],
            pastIllnesses: [],
            hospitalizations: [],
          },
          currentConditions: [],
          medications: [],
          allergies: [],
          vitalSigns: {
            baseline: {
              bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' as const },
              heartRate: { value: 70, unit: 'bpm' as const },
              temperature: { value: 36.5, unit: 'celsius' as const },
              respiratoryRate: { value: 16, unit: 'breaths/min' as const },
              oxygenSaturation: { value: 98, unit: '%' as const },
              recordedAt: createISODateTime(new Date().toISOString()),
            },
            trend: 'stable' as const,
            criticalValues: {
              isHypotensive: false,
              isHypertensive: false,
              isTachycardic: false,
              isBradycardic: false,
              isFebrile: false,
              isHypoxic: false,
            },
          },
          socialHistory: {},
          insurance: {
            provider: 'Test Insurance',
            policyNumber: '12345',
            validUntil: createISODate('2025-12-31'),
          },
        };
        set((state) => {
          state.patients[id] = mockPatient;
          state.loading = false;
        });
        return mockPatient;
      },
      
      updatePatientVitals: (id, vitals) => {
        set((state) => {
          if (state.patients[id]) {
            state.patients[id].vitalSigns.baseline = vitals;
          }
        });
      },
      
      addPatientSymptom: () => {
        // Mock implementation
      },
      
      clearPatientError: () => {
        set((state) => {
          state.error = null;
        });
      },
      
      // ChatStore Actions
      createConversation: (encounterId) => {
        const conversationId = `conv-${crypto.randomUUID()}`;
        set((state) => {
          state.conversations[conversationId] = {
            id: conversationId,
            encounterId,
            startedAt: createISODateTime(new Date().toISOString()),
            endedAt: null,
            lastActivityAt: createISODateTime(new Date().toISOString()),
            messages: [],
            status: 'active',
            participants: {
              patient: { role: 'patient', name: '患者' },
              provider: { role: 'provider', name: '医師' }
            }
          };
          state.activeConversationId = conversationId;
        });
        return conversationId;
      },
      
      addMessage: (conversationId, message) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            conversation.messages.push(message);
            conversation.lastActivityAt = createISODateTime(new Date().toISOString());
          }
        });
      },
      
      sendMessage: (conversationId, message) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            conversation.messages.push(message);
            conversation.lastActivityAt = createISODateTime(new Date().toISOString());
          }
        });
      },
      
      removeMessage: (conversationId, messageId) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            conversation.messages = conversation.messages.filter(msg => msg.id !== messageId);
          }
        });
      },
      
      setTyping: (isTyping) => {
        set((state) => {
          state.isTyping = isTyping;
        });
      },
      
      setActiveConversation: (id) => {
        set((state) => {
          state.activeConversationId = id;
        });
      },
      
      endConversation: (conversationId) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            conversation.status = 'completed';
            conversation.endedAt = createISODateTime(new Date().toISOString());
          }
        });
      },
      
      // ChatStore History management
      archiveOldConversations: (olderThanMs) => {
        set((state) => {
          const now = Date.now();
          Object.values(state.conversations).forEach(conversation => {
            if (conversation.status === 'completed' && conversation.endedAt) {
              const endTime = new Date(conversation.endedAt).getTime();
              if (now - endTime >= olderThanMs) {
                conversation.status = 'archived';
              }
            }
          });
        });
      },
      
      searchConversations: (query) => {
        const state = get();
        const results: Array<{ conversationId: string; messages: import('@/types/chat').ChatMessage[] }> = [];
        
        Object.entries(state.conversations).forEach(([conversationId, conversation]) => {
          const matchingMessages = conversation.messages.filter(message => 
            'content' in message && message.content.includes(query)
          );
          if (matchingMessages.length > 0) {
            results.push({ conversationId, messages: matchingMessages });
          }
        });
        
        return results;
      },
      
      // ChatStore Context management
      updateConversationContext: (conversationId, context) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            if (!conversation.context) {
              conversation.context = {};
            }
            conversation.context = {
              ...conversation.context,
              ...context,
              metadata: {
                ...conversation.context.metadata,
                ...context.metadata
              }
            };
          }
        });
      },
      
      // ChatStore Message status management
      updateMessageStatus: (conversationId, messageId, status) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            const message = conversation.messages.find(m => m.id === messageId);
            if (message) {
              message.status = status as 'sending' | 'sent' | 'delivered' | 'failed';
            }
          }
        });
      },
      
      confirmMessageDelivery: (conversationId, messageId, deliveryTime) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            const message = conversation.messages.find(m => m.id === messageId);
            if (message) {
              message.status = 'delivered';
              message.deliveredAt = deliveryTime;
            }
          }
        });
      },
      
      retryMessage: (conversationId, messageId) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            const message = conversation.messages.find(m => m.id === messageId);
            if (message) {
              message.status = 'sending';
              message.retryCount = (message.retryCount || 0) + 1;
            }
          }
        });
      },
      
      // ChatStore Real-time communication
      setParticipantTyping: (conversationId, participant, isTyping) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            if (!conversation.typingState) {
              conversation.typingState = {};
            }
            
            const typingKey = `${participant}Typing`;
            conversation.typingState[typingKey] = isTyping;
            conversation.typingState.lastTypingUpdate = Date.now();
          }
        });
      },
      
      cleanupStaleTypingStates: (timeoutMs) => {
        set((state) => {
          const now = Date.now();
          Object.values(state.conversations).forEach(conversation => {
            if (conversation.typingState && conversation.typingState.lastTypingUpdate) {
              if (now - conversation.typingState.lastTypingUpdate >= timeoutMs) {
                conversation.typingState.patientTyping = false;
                conversation.typingState.providerTyping = false;
              }
            }
          });
        });
      },
      
      // ChatStore Session management
      getSessionData: () => {
        const state = get();
        return {
          conversations: state.conversations,
          activeConversationId: state.activeConversationId,
          isTyping: state.isTyping
        };
      },
      
      restoreSessionData: (sessionData) => {
        set((state) => {
          try {
            if (sessionData && typeof sessionData === 'object' && sessionData.conversations) {
              if (typeof sessionData.conversations === 'object') {
                state.conversations = sessionData.conversations;
              }
              if (sessionData.activeConversationId !== undefined) {
                state.activeConversationId = sessionData.activeConversationId;
              }
              if (typeof sessionData.isTyping === 'boolean') {
                state.isTyping = sessionData.isTyping;
              }
            }
          } catch (error) {
            console.error('セッションデータの復元に失敗:', error);
          }
        });
      },
      
      // OrderStore Actions
      createOrder: (order) => {
        set((state) => {
          const orderId = `order-${crypto.randomUUID()}` as OrderId;
          // Ensure order has id property
          const orderWithId: MedicalOrder = { ...order, id: orderId };
          state.orders[orderId] = orderWithId;
          state.pendingOrders.push(orderId);
        });
      },
      
      updateOrderStatus: (orderId, status) => {
        set((state) => {
          const order = state.orders[orderId];
          if (order) {
            order.status = status;
            // Remove from pending if completed or cancelled
            if (status === 'completed' || status === 'cancelled') {
              state.pendingOrders = state.pendingOrders.filter(id => id !== orderId);
            }
          }
        });
      },
      
      cancelOrder: (orderId) => {
        set((state) => {
          const order = state.orders[orderId];
          if (order && order.status === 'pending') {
            order.status = 'cancelled';
            state.pendingOrders = state.pendingOrders.filter(id => id !== orderId);
          }
        });
      },
      
      getPendingOrdersCount: () => {
        return get().pendingOrders.length;
      },
      
      getOrdersByPatient: (patientId) => {
        const orders = get().orders;
        return Object.values(orders).filter(order => order.patientId === patientId);
      },
      
      // SimulationStore Actions
      startSimulation: () => {
        set((state) => {
          state.isRunning = true;
          state.startTime = createISODateTime(new Date().toISOString());
          state.endTime = null;
          state.score = null;
        });
      },
      
      endSimulation: () => {
        set((state) => {
          state.isRunning = false;
          state.endTime = createISODateTime(new Date().toISOString());
        });
      },
      
      setMode: (mode) => {
        set((state) => {
          state.mode = mode;
        });
      },
      
      setDifficulty: (level) => {
        set((state) => {
          state.difficulty = level;
        });
      },
      
      setDepartment: (dept) => {
        set((state) => {
          state.department = dept;
        });
      },
      
      calculateScore: () => {
        // Mock implementation for testing
        return 85;
      },
      
      resetSimulation: () => {
        set((state) => {
          state.isRunning = false;
          state.startTime = null;
          state.endTime = null;
          state.score = null;
        });
      },
      
      // UIStore Actions
      setTheme: (theme) => {
        set((state) => {
          state.theme = theme;
        });
      },
      
      toggleSidebar: () => {
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        });
      },
      
      setActiveTab: (tab) => {
        set((state) => {
          state.activeTab = tab;
        });
      },
      
      openModal: (modal) => {
        set((state) => {
          state.modals[modal] = true;
        });
      },
      
      closeModal: (modal) => {
        set((state) => {
          state.modals[modal] = false;
        });
      },
      
      addNotification: (notification) => {
        set((state) => {
          const id = `notif-${Date.now()}`;
          const timestamp = createISODateTime(new Date().toISOString());
          const notificationWithId = { ...notification, id, timestamp };
          state.notifications.push(notificationWithId);
        });
      },
      
      removeNotification: (id) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },
      
      // Global Actions
      resetApp: () => {
        set(() => initialState);
      },
      
      persistState: () => {
        if (typeof window === 'undefined') return;
        
        const state = get();
        const toPersist = {
          // UI設定を永続化
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          activeTab: state.activeTab,
          
          // アクティブな患者IDを永続化
          activePatientId: state.activePatientId,
          
          // シミュレーション設定を永続化
          mode: state.mode,
          difficulty: state.difficulty,
          department: state.department,
        };
        
        localStorage.setItem('medical-simulator-state', JSON.stringify({
        state: toPersist,
        version: 1
      }));
      },
      
      loadPersistedState: () => {
        if (typeof window === 'undefined') return;
        
        const persisted = localStorage.getItem('medical-simulator-state');
        if (!persisted) return;
        
        try {
          const parsed = JSON.parse(persisted);
          const state = parsed.state || parsed; // Handle both old and new format
          set((draft) => {
            // UI設定を復元
            if (state.theme) draft.theme = state.theme;
            if (typeof state.sidebarOpen === 'boolean') draft.sidebarOpen = state.sidebarOpen;
            if (state.activeTab) draft.activeTab = state.activeTab;
            
            // アクティブな患者IDを復元
            if (state.activePatientId) draft.activePatientId = state.activePatientId;
            
            // シミュレーション設定を復元
            if (state.mode) draft.mode = state.mode;
            if (state.difficulty) draft.difficulty = state.difficulty;
            if (state.department) draft.department = state.department;
          });
        } catch (error) {
          console.error('永続化状態の読み込みに失敗しました:', error);
        }
      },
    }))
  );
};
