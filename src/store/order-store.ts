import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { OrderStore } from '@/types/state';
import type { MedicalOrder, OrderStatus } from '@/types/medical-orders';
import type { PatientId, OrderId } from '@/types/core';
import { createOrderId } from '@/types/core';

export const useOrderStore = create<OrderStore>()(
  immer((set, get) => ({
    // State
    orders: {},
    pendingOrders: [],
    
    // Actions
    createOrder: (order) => {
      set((state) => {
        // Generate a new ID with order- prefix
        const orderId = createOrderId(`order-${crypto.randomUUID()}`);
        const orderWithId = { ...order, id: orderId };
        state.orders[orderId] = orderWithId;
        if (orderWithId.status === 'pending') {
          state.pendingOrders.push(orderId);
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