/**
 * Integrated app store combining all store slices
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AppState } from '@/types/state';
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
  loadingPatientId: null,
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
    
    setTyping: (isTyping) => {
      useChatStore.getState().setTyping(isTyping);
    },
    
    setActiveConversation: (id) => {
      useChatStore.getState().setActiveConversation(id);
    },
    
    endConversation: (conversationId) => {
      useChatStore.getState().endConversation(conversationId);
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
        state.startTime = new Date().toISOString() as any;
        state.endTime = null;
        state.score = null;
      });
    },
    
    endSimulation: () => {
      useSimulationStore.getState().endSimulation();
      set((state) => {
        state.isRunning = false;
        state.endTime = new Date().toISOString() as any;
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
        loadingPatientId: null,
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
        department: 'internal_medicine',
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
      
      localStorage.setItem('medical-simulator-state', JSON.stringify(toPersist));
    },
    
    loadPersistedState: () => {
      if (typeof window === 'undefined') return;
      
      const persisted = localStorage.getItem('medical-simulator-state');
      if (!persisted) return;
      
      try {
        const state = JSON.parse(persisted);
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
      
      setTyping: (isTyping) => {
        useChatStore.getState().setTyping(isTyping);
      },
      
      setActiveConversation: (id) => {
        useChatStore.getState().setActiveConversation(id);
      },
      
      endConversation: (conversationId) => {
        useChatStore.getState().endConversation(conversationId);
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
          state.startTime = new Date().toISOString() as any;
          state.endTime = null;
          state.score = null;
        });
      },
      
      endSimulation: () => {
        useSimulationStore.getState().endSimulation();
        set((state) => {
          state.isRunning = false;
          state.endTime = new Date().toISOString() as any;
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
          loadingPatientId: null,
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
        
        localStorage.setItem('medical-simulator-state', JSON.stringify(toPersist));
      },
      
      loadPersistedState: () => {
        if (typeof window === 'undefined') return;
        
        const persisted = localStorage.getItem('medical-simulator-state');
        if (!persisted) return;
        
        try {
          const state = JSON.parse(persisted);
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
