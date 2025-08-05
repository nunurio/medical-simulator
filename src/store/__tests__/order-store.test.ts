import { describe, it, expect, beforeEach } from 'vitest';
import type { OrderStore } from '@/types/state';
import type { MedicalOrder, OrderStatus, Prescription } from '@/types/medical-orders';
import { createOrderId, createPatientId, createProviderId, createISODateTime } from '@/types/core';
import { useOrderStore } from '../order-store';

describe('OrderStore', () => {
  beforeEach(() => {
    // Zustandのストアをリセット
    useOrderStore.setState({ orders: {}, pendingOrders: [] });
  });

  describe('createOrder', () => {
    it('creates a new order with generated id and timestamps', () => {
      // Arrange
      const store = useOrderStore.getState();
      const newOrder: Prescription = {
        id: createOrderId('temp-id'), // Will be replaced by store
        orderType: 'prescription',
        patientId: createPatientId('patient-123'),
        orderedBy: createProviderId('provider-456'),
        orderedAt: createISODateTime('2024-01-01T00:00:00.000Z'),
        status: 'pending',
        priority: 'routine',
        medication: {
          name: 'Aspirin',
          strength: '100mg',
          form: 'tablet',
        },
        dosage: {
          amount: 1,
          unit: 'tablet',
        },
        frequency: 'once_daily',
        duration: {
          value: 30,
          unit: 'days',
        },
        refills: 0,
        substitutionAllowed: true,
      };

      // Act
      store.createOrder(newOrder);

      // Assert
      const updatedStore = useOrderStore.getState();
      const orders = Object.values(updatedStore.orders);
      expect(orders).toHaveLength(1);
      
      const createdOrder = orders[0] as Prescription;
      expect(createdOrder).toBeDefined();
      expect(createdOrder.id).toBeDefined();
      expect(createdOrder.id).toMatch(/^order-/);
      expect(createdOrder.id).not.toBe('temp-id');
      expect(createdOrder.orderedAt).toBeDefined();
      expect(createdOrder.orderType).toBe('prescription');
      expect(createdOrder.patientId).toBe(createPatientId('patient-123'));
      expect(createdOrder.status).toBe('pending');
      expect(updatedStore.pendingOrders).toContain(createdOrder.id);
    });
  });

  describe('updateOrderStatus', () => {
    it('updates the status of an existing order', () => {
      // Arrange
      const store = useOrderStore.getState();
      const order: Prescription = {
        id: createOrderId('order-123'),
        orderType: 'prescription',
        patientId: createPatientId('patient-123'),
        orderedBy: createProviderId('provider-456'),
        orderedAt: createISODateTime('2024-01-01T00:00:00.000Z'),
        status: 'pending',
        priority: 'routine',
        medication: {
          name: 'Aspirin',
          strength: '100mg',
          form: 'tablet',
        },
        dosage: {
          amount: 1,
          unit: 'tablet',
        },
        frequency: 'once_daily',
        duration: {
          value: 30,
          unit: 'days',
        },
        refills: 0,
        substitutionAllowed: true,
      };
      
      // 直接ストアに追加してテストの準備
      useOrderStore.setState({
        orders: { 'order-123': order },
        pendingOrders: ['order-123'],
      });

      // Act
      store.updateOrderStatus('order-123', 'active');

      // Assert
      const updatedStore = useOrderStore.getState();
      const updatedOrder = updatedStore.orders['order-123'];
      expect(updatedOrder.status).toBe('active');
      expect(updatedStore.pendingOrders).not.toContain('order-123');
    });

    it('adds order to pendingOrders when status changes to pending', () => {
      // Arrange
      const store = useOrderStore.getState();
      const order: Prescription = {
        id: createOrderId('order-456'),
        orderType: 'prescription',
        patientId: createPatientId('patient-123'),
        orderedBy: createProviderId('provider-456'),
        orderedAt: createISODateTime('2024-01-01T00:00:00.000Z'),
        status: 'draft',
        priority: 'routine',
        medication: {
          name: 'Ibuprofen',
          strength: '200mg',
          form: 'tablet',
        },
        dosage: {
          amount: 1,
          unit: 'tablet',
        },
        frequency: 'twice_daily',
        duration: {
          value: 7,
          unit: 'days',
        },
        refills: 0,
        substitutionAllowed: true,
      };
      
      useOrderStore.setState({
        orders: { 'order-456': order },
        pendingOrders: [],
      });

      // Act
      store.updateOrderStatus('order-456', 'pending');

      // Assert
      const updatedStore = useOrderStore.getState();
      expect(updatedStore.pendingOrders).toContain('order-456');
    });
  });

  describe('getOrdersByPatient', () => {
    it('returns all orders for a specific patient', () => {
      // Arrange
      const store = useOrderStore.getState();
      const order1: Prescription = {
        id: createOrderId('order-1'),
        orderType: 'prescription',
        patientId: createPatientId('patient-123'),
        orderedBy: createProviderId('provider-456'),
        orderedAt: createISODateTime('2024-01-01T00:00:00.000Z'),
        status: 'active',
        priority: 'routine',
        medication: {
          name: 'Aspirin',
          strength: '100mg',
          form: 'tablet',
        },
        dosage: {
          amount: 1,
          unit: 'tablet',
        },
        frequency: 'once_daily',
        duration: {
          value: 30,
          unit: 'days',
        },
        refills: 0,
        substitutionAllowed: true,
      };

      const order2: Prescription = {
        id: createOrderId('order-2'),
        orderType: 'prescription',
        patientId: createPatientId('patient-456'),
        orderedBy: createProviderId('provider-456'),
        orderedAt: createISODateTime('2024-01-02T00:00:00.000Z'),
        status: 'pending',
        priority: 'urgent',
        medication: {
          name: 'Ibuprofen',
          strength: '200mg',
          form: 'tablet',
        },
        dosage: {
          amount: 2,
          unit: 'tablet',
        },
        frequency: 'twice_daily',
        duration: {
          value: 7,
          unit: 'days',
        },
        refills: 0,
        substitutionAllowed: true,
      };

      const order3: Prescription = {
        id: createOrderId('order-3'),
        orderType: 'prescription',
        patientId: createPatientId('patient-123'),
        orderedBy: createProviderId('provider-789'),
        orderedAt: createISODateTime('2024-01-03T00:00:00.000Z'),
        status: 'completed',
        priority: 'routine',
        medication: {
          name: 'Paracetamol',
          strength: '500mg',
          form: 'tablet',
        },
        dosage: {
          amount: 1,
          unit: 'tablet',
        },
        frequency: 'three_times_daily',
        duration: {
          value: 5,
          unit: 'days',
        },
        refills: 0,
        substitutionAllowed: false,
      };

      useOrderStore.setState({
        orders: {
          'order-1': order1,
          'order-2': order2,
          'order-3': order3,
        },
        pendingOrders: ['order-2'],
      });

      // Act
      const patientOrders = store.getOrdersByPatient(createPatientId('patient-123'));

      // Assert
      expect(patientOrders).toHaveLength(2);
      expect(patientOrders.map(o => o.id)).toContain('order-1');
      expect(patientOrders.map(o => o.id)).toContain('order-3');
      expect(patientOrders.map(o => o.id)).not.toContain('order-2');
    });

    it('returns empty array when no orders exist for patient', () => {
      // Arrange
      const store = useOrderStore.getState();
      useOrderStore.setState({
        orders: {},
        pendingOrders: [],
      });

      // Act
      const patientOrders = store.getOrdersByPatient(createPatientId('non-existing-patient'));

      // Assert
      expect(patientOrders).toEqual([]);
    });
  });

  describe('cancelOrder', () => {
    it('updates order status to cancelled', () => {
      // Arrange
      const store = useOrderStore.getState();
      const order: Prescription = {
        id: createOrderId('order-cancel-1'),
        orderType: 'prescription',
        patientId: createPatientId('patient-123'),
        orderedBy: createProviderId('provider-456'),
        orderedAt: createISODateTime('2024-01-01T00:00:00.000Z'),
        status: 'active',
        priority: 'routine',
        medication: {
          name: 'Aspirin',
          strength: '100mg',
          form: 'tablet',
        },
        dosage: {
          amount: 1,
          unit: 'tablet',
        },
        frequency: 'once_daily',
        duration: {
          value: 30,
          unit: 'days',
        },
        refills: 0,
        substitutionAllowed: true,
      };

      useOrderStore.setState({
        orders: { 'order-cancel-1': order },
        pendingOrders: [],
      });

      // Act
      store.cancelOrder('order-cancel-1');

      // Assert
      const updatedStore = useOrderStore.getState();
      const cancelledOrder = updatedStore.orders['order-cancel-1'];
      expect(cancelledOrder.status).toBe('cancelled');
    });

    it('removes order from pendingOrders when cancelled', () => {
      // Arrange
      const store = useOrderStore.getState();
      const order: Prescription = {
        id: createOrderId('order-cancel-2'),
        orderType: 'prescription',
        patientId: createPatientId('patient-123'),
        orderedBy: createProviderId('provider-456'),
        orderedAt: createISODateTime('2024-01-01T00:00:00.000Z'),
        status: 'pending',
        priority: 'routine',
        medication: {
          name: 'Aspirin',
          strength: '100mg',
          form: 'tablet',
        },
        dosage: {
          amount: 1,
          unit: 'tablet',
        },
        frequency: 'once_daily',
        duration: {
          value: 30,
          unit: 'days',
        },
        refills: 0,
        substitutionAllowed: true,
      };

      useOrderStore.setState({
        orders: { 'order-cancel-2': order },
        pendingOrders: ['order-cancel-2'],
      });

      // Act
      store.cancelOrder('order-cancel-2');

      // Assert
      const updatedStore = useOrderStore.getState();
      expect(updatedStore.pendingOrders).not.toContain('order-cancel-2');
    });
  });

  describe('getPendingOrdersCount', () => {
    it('returns the count of pending orders', () => {
      // Arrange
      const store = useOrderStore.getState();
      useOrderStore.setState({
        orders: {},
        pendingOrders: ['order-1', 'order-2', 'order-3'],
      });

      // Act
      const count = store.getPendingOrdersCount();

      // Assert
      expect(count).toBe(3);
    });

    it('returns 0 when no pending orders', () => {
      // Arrange
      const store = useOrderStore.getState();
      useOrderStore.setState({
        orders: {},
        pendingOrders: [],
      });

      // Act
      const count = store.getPendingOrdersCount();

      // Assert
      expect(count).toBe(0);
    });
  });
});