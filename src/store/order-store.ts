import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { OrderStore, MedicalOrder, OrderStatus, PatientId } from '@/types/state';

export const useOrderStore = create<OrderStore>()(
  immer((set, get) => ({
    // State
    orders: {},
    pendingOrders: [],
    
    // Actions
    createOrder: (order) => {
      set((state) => {
        state.orders[order.id] = order;
        if (order.status === 'pending') {
          state.pendingOrders.push(order.id);
        }
      });
    },
    
    updateOrderStatus: (orderId, status) => {
      set((state) => {
        const order = state.orders[orderId];
        if (order) {
          order.status = status;
          
          // ペンディングリストの管理
          if (status === 'pending' && !state.pendingOrders.includes(orderId)) {
            state.pendingOrders.push(orderId);
          } else if (status !== 'pending') {
            state.pendingOrders = state.pendingOrders.filter(id => id !== orderId);
          }
        }
      });
    },
    
    cancelOrder: (orderId) => {
      set((state) => {
        const order = state.orders[orderId];
        if (order) {
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
  }))
);