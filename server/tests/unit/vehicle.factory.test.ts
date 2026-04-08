import { VehicleFactory } from '../../src/modules/vehicle/vehicle.factory';
import { VehicleType, SlotType } from '@prisma/client';
import { Car } from '../../src/modules/vehicle/models/Car';
import { Motorcycle } from '../../src/modules/vehicle/models/Motorcycle';
import { Truck } from '../../src/modules/vehicle/models/Truck';
import { ElectricVehicle } from '../../src/modules/vehicle/models/ElectricVehicle';

describe('VehicleFactory (Factory Pattern)', () => {
  it('should create a Car instance for CAR type', () => {
    const vehicle = VehicleFactory.create(VehicleType.CAR, 'ABC-1234', 'Toyota', 'Camry');
    expect(vehicle).toBeInstanceOf(Car);
    expect(vehicle.type).toBe(VehicleType.CAR);
    expect(vehicle.licensePlate).toBe('ABC-1234');
  });

  it('should create a Motorcycle instance for MOTORCYCLE type', () => {
    const vehicle = VehicleFactory.create(VehicleType.MOTORCYCLE, 'MOTO-001');
    expect(vehicle).toBeInstanceOf(Motorcycle);
    expect(vehicle.type).toBe(VehicleType.MOTORCYCLE);
  });

  it('should create a Truck instance for TRUCK type', () => {
    const vehicle = VehicleFactory.create(VehicleType.TRUCK, 'TRK-001');
    expect(vehicle).toBeInstanceOf(Truck);
    expect(vehicle.type).toBe(VehicleType.TRUCK);
  });

  it('should create an ElectricVehicle instance for ELECTRIC type', () => {
    const vehicle = VehicleFactory.create(VehicleType.ELECTRIC, 'EV-001');
    expect(vehicle).toBeInstanceOf(ElectricVehicle);
    expect(vehicle.type).toBe(VehicleType.ELECTRIC);
  });

  it('should throw ValidationError for unknown type', () => {
    expect(() => VehicleFactory.create('UNKNOWN' as VehicleType, 'X')).toThrow();
  });
});

describe('Vehicle Polymorphism (OOP)', () => {
  it('Car should be compatible with REGULAR and LARGE slots', () => {
    const car = VehicleFactory.create(VehicleType.CAR, 'ABC-1234');
    expect(car.getCompatibleSlotTypes()).toContain(SlotType.REGULAR);
    expect(car.getCompatibleSlotTypes()).toContain(SlotType.LARGE);
    expect(car.getCompatibleSlotTypes()).not.toContain(SlotType.COMPACT);
  });

  it('Motorcycle should fit in COMPACT, REGULAR, and LARGE slots', () => {
    const moto = VehicleFactory.create(VehicleType.MOTORCYCLE, 'MOTO-001');
    expect(moto.getCompatibleSlotTypes()).toContain(SlotType.COMPACT);
    expect(moto.getCompatibleSlotTypes()).toContain(SlotType.REGULAR);
    expect(moto.getCompatibleSlotTypes()).toContain(SlotType.LARGE);
  });

  it('Truck should only fit in LARGE slots', () => {
    const truck = VehicleFactory.create(VehicleType.TRUCK, 'TRK-001');
    expect(truck.getCompatibleSlotTypes()).toEqual([SlotType.LARGE]);
  });

  it('ElectricVehicle should prefer ELECTRIC_CHARGING slots', () => {
    const ev = VehicleFactory.create(VehicleType.ELECTRIC, 'EV-001');
    expect(ev.getCompatibleSlotTypes()).toContain(SlotType.ELECTRIC_CHARGING);
  });

  it('canFitInSlot should use polymorphic getCompatibleSlotTypes', () => {
    const car = VehicleFactory.create(VehicleType.CAR, 'ABC-1234');
    expect(car.canFitInSlot(SlotType.REGULAR)).toBe(true);
    expect(car.canFitInSlot(SlotType.COMPACT)).toBe(false);
  });

  it('getSizeMultiplier varies by vehicle type', () => {
    const car = VehicleFactory.create(VehicleType.CAR, 'C');
    const moto = VehicleFactory.create(VehicleType.MOTORCYCLE, 'M');
    const truck = VehicleFactory.create(VehicleType.TRUCK, 'T');
    const ev = VehicleFactory.create(VehicleType.ELECTRIC, 'E');

    expect(car.getSizeMultiplier()).toBe(1.0);
    expect(moto.getSizeMultiplier()).toBe(0.5);
    expect(truck.getSizeMultiplier()).toBe(2.0);
    expect(ev.getSizeMultiplier()).toBe(1.2);
  });

  it('calculatePrice should use size multiplier', () => {
    const car = VehicleFactory.create(VehicleType.CAR, 'C');
    const truck = VehicleFactory.create(VehicleType.TRUCK, 'T');

    expect(car.calculatePrice(10, 2)).toBe(20);   // 10 * 1.0 * 2
    expect(truck.calculatePrice(10, 2)).toBe(40);  // 10 * 2.0 * 2
  });
});
