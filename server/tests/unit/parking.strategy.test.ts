import { NearestSlotStrategy } from '../../src/modules/parking/strategies/NearestSlotStrategy';
import { CheapestSlotStrategy } from '../../src/modules/parking/strategies/CheapestSlotStrategy';
import { PrioritySlotStrategy } from '../../src/modules/parking/strategies/PrioritySlotStrategy';
import { AvailableSlot, IParkingStrategy } from '../../src/core/interfaces/IParkingStrategy';
import { SlotType } from '@prisma/client';

const mockSlots: AvailableSlot[] = [
  { id: '1', slotNumber: 'G-001', type: SlotType.REGULAR, pricePerHour: 5, distanceFromEntry: 10, floorLevel: 0 },
  { id: '2', slotNumber: 'G-002', type: SlotType.REGULAR, pricePerHour: 3, distanceFromEntry: 20, floorLevel: 0 },
  { id: '3', slotNumber: 'F1-001', type: SlotType.COMPACT, pricePerHour: 8, distanceFromEntry: 5, floorLevel: 1 },
  { id: '4', slotNumber: 'B-001', type: SlotType.LARGE, pricePerHour: 2, distanceFromEntry: 30, floorLevel: -1 },
];

describe('NearestSlotStrategy (Strategy Pattern)', () => {
  const strategy: IParkingStrategy = new NearestSlotStrategy();

  it('should have name "nearest"', () => {
    expect(strategy.name).toBe('nearest');
  });

  it('should return the slot closest to the entry', () => {
    const result = strategy.allocate(mockSlots);
    expect(result?.id).toBe('3'); // distance = 5
  });

  it('should return null for empty array', () => {
    expect(strategy.allocate([])).toBeNull();
  });
});

describe('CheapestSlotStrategy (Strategy Pattern)', () => {
  const strategy: IParkingStrategy = new CheapestSlotStrategy();

  it('should have name "cheapest"', () => {
    expect(strategy.name).toBe('cheapest');
  });

  it('should return the cheapest slot', () => {
    const result = strategy.allocate(mockSlots);
    expect(result?.id).toBe('4'); // price = 2
  });

  it('should return null for empty array', () => {
    expect(strategy.allocate([])).toBeNull();
  });
});

describe('PrioritySlotStrategy (Strategy Pattern)', () => {
  const strategy: IParkingStrategy = new PrioritySlotStrategy();

  it('should have name "priority"', () => {
    expect(strategy.name).toBe('priority');
  });

  it('should balance distance and floor level', () => {
    const result = strategy.allocate(mockSlots);
    // G-001: 10 + 0*10 = 10
    // G-002: 20 + 0*10 = 20
    // F1-001: 5 + 1*10 = 15
    // B-001: 30 + 1*10 = 40
    expect(result?.id).toBe('1'); // score = 10
  });

  it('should return null for empty array', () => {
    expect(strategy.allocate([])).toBeNull();
  });
});

describe('Strategy Pattern - Liskov Substitution', () => {
  it('all strategies should be interchangeable via IParkingStrategy', () => {
    const strategies: IParkingStrategy[] = [
      new NearestSlotStrategy(),
      new CheapestSlotStrategy(),
      new PrioritySlotStrategy(),
    ];

    strategies.forEach((strategy) => {
      const result = strategy.allocate(mockSlots);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('slotNumber');
    });
  });
});
