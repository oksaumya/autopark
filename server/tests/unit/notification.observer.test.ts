import { NotificationService } from '../../src/modules/notification/notification.service';
import { INotificationObserver, NotificationPayload } from '../../src/core/interfaces/IObserver';

// Mock observer to test the Observer Pattern
class MockObserver implements INotificationObserver {
  public receivedPayloads: NotificationPayload[] = [];

  async update(payload: NotificationPayload): Promise<void> {
    this.receivedPayloads.push(payload);
  }
}

// We need to mock the NotificationRepository since it uses database
jest.mock('../../src/modules/notification/notification.repository');
jest.mock('../../src/config/database', () => ({
  DatabaseConnection: {
    getInstance: () => ({
      getClient: () => ({}),
    }),
  },
}));

describe('NotificationService (Observer Pattern)', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it('should attach observers', () => {
    const observer1 = new MockObserver();
    const observer2 = new MockObserver();

    service.attach(observer1);
    service.attach(observer2);

    // Verify observers are attached by notifying
    const payload: NotificationPayload = {
      userId: 'user-1',
      type: 'BOOKING_CONFIRMED',
      title: 'Test',
      message: 'Test message',
    };

    service.notify(payload);
    // Both observers should eventually receive the notification
  });

  it('should notify all attached observers', async () => {
    const observer1 = new MockObserver();
    const observer2 = new MockObserver();
    const observer3 = new MockObserver();

    service.attach(observer1);
    service.attach(observer2);
    service.attach(observer3);

    const payload: NotificationPayload = {
      userId: 'user-1',
      type: 'VEHICLE_ENTERED',
      title: 'Vehicle Entered',
      message: 'Your vehicle has entered the parking lot',
    };

    await service.notify(payload);

    expect(observer1.receivedPayloads).toHaveLength(1);
    expect(observer2.receivedPayloads).toHaveLength(1);
    expect(observer3.receivedPayloads).toHaveLength(1);

    expect(observer1.receivedPayloads[0]).toEqual(payload);
    expect(observer2.receivedPayloads[0]).toEqual(payload);
    expect(observer3.receivedPayloads[0]).toEqual(payload);
  });

  it('should detach observers', async () => {
    const observer1 = new MockObserver();
    const observer2 = new MockObserver();

    service.attach(observer1);
    service.attach(observer2);

    // Detach observer1
    service.detach(observer1);

    const payload: NotificationPayload = {
      userId: 'user-1',
      type: 'PAYMENT_SUCCESS',
      title: 'Payment',
      message: 'Payment processed',
    };

    await service.notify(payload);

    expect(observer1.receivedPayloads).toHaveLength(0); // detached, should not receive
    expect(observer2.receivedPayloads).toHaveLength(1); // still attached
  });

  it('should handle observer errors gracefully', async () => {
    const failingObserver: INotificationObserver = {
      async update() {
        throw new Error('Observer failed');
      },
    };
    const successObserver = new MockObserver();

    service.attach(failingObserver);
    service.attach(successObserver);

    const payload: NotificationPayload = {
      userId: 'user-1',
      type: 'BOOKING_CANCELLED',
      title: 'Cancelled',
      message: 'Booking cancelled',
    };

    // Should not throw even if one observer fails
    await expect(service.notify(payload)).resolves.not.toThrow();

    // Success observer should still receive the notification
    expect(successObserver.receivedPayloads).toHaveLength(1);
  });
});
