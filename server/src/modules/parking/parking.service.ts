import { SlotStatus, SlotType, VehicleType } from '../../core/types/enums';
import { IParkingStrategy } from '../../core/interfaces/IParkingStrategy';
import { ValidationError } from '../../core/errors/ValidationError';
import { VehicleFactory } from '../vehicle/vehicle.factory';
import { NearestSlotStrategy } from './strategies/NearestSlotStrategy';
import { CheapestSlotStrategy } from './strategies/CheapestSlotStrategy';
import { PrioritySlotStrategy } from './strategies/PrioritySlotStrategy';
import { ParkingSlotRepository, ParkingFloorRepository } from './parking.repository';
import { ParkingMapper } from './parking.mapper';
import {
  ParkingSlotResponseDTO,
  ParkingFloorResponseDTO,
  CreateSlotDTO,
  UpdateSlotDTO,
  CreateFloorDTO,
} from './parking.dto';

/**
 * ParkingService — Dependency Inversion Principle.
 * Depends on IParkingStrategy (abstraction), not concrete strategy classes.
 * Strategy is injected/swapped at runtime.
 */
export class ParkingService {
  private slotRepo: ParkingSlotRepository;
  private floorRepo: ParkingFloorRepository;
  private strategy: IParkingStrategy;

  private static strategyMap: Record<string, IParkingStrategy> = {
    nearest: new NearestSlotStrategy(),
    cheapest: new CheapestSlotStrategy(),
    priority: new PrioritySlotStrategy(),
  };

  constructor(strategy?: IParkingStrategy) {
    this.slotRepo = new ParkingSlotRepository();
    this.floorRepo = new ParkingFloorRepository();
    this.strategy = strategy ?? new NearestSlotStrategy();
  }

  setStrategy(strategy: IParkingStrategy): void {
    this.strategy = strategy;
  }

  static getStrategy(name: string): IParkingStrategy {
    return ParkingService.strategyMap[name] ?? new NearestSlotStrategy();
  }

  async getAllSlots(filters?: { status?: SlotStatus; type?: SlotType; floorId?: string }): Promise<ParkingSlotResponseDTO[]> {
    const slots = await this.slotRepo.findAllWithFloor(filters);
    return ParkingMapper.slotToDTOList(slots);
  }

  async getSlotById(id: string): Promise<ParkingSlotResponseDTO> {
    const slot = await this.slotRepo.findByIdOrThrow(id);
    return ParkingMapper.slotToDTO(slot);
  }

  async createSlot(data: CreateSlotDTO): Promise<ParkingSlotResponseDTO> {
    await this.floorRepo.findByIdOrThrow(data.floorId);
    const slot = await this.slotRepo.create({
      slotNumber: data.slotNumber,
      type: data.type as SlotType,
      pricePerHour: data.pricePerHour,
      distanceFromEntry: data.distanceFromEntry ?? 0,
      floor: { connect: { id: data.floorId } },
    });
    return ParkingMapper.slotToDTO(slot);
  }

  async updateSlot(id: string, data: UpdateSlotDTO): Promise<ParkingSlotResponseDTO> {
    const updateData: any = {};
    if (data.type) updateData.type = data.type;
    if (data.pricePerHour) updateData.pricePerHour = data.pricePerHour;
    if (data.status) updateData.status = data.status;
    if (data.distanceFromEntry !== undefined) updateData.distanceFromEntry = data.distanceFromEntry;

    const slot = await this.slotRepo.update(id, updateData);
    return ParkingMapper.slotToDTO(slot);
  }

  async deleteSlot(id: string): Promise<void> {
    await this.slotRepo.update(id, { isActive: false });
  }

  /**
   * Allocates a parking slot using the Strategy Pattern.
   * The factory creates a vehicle to determine compatible slot types (Polymorphism).
   * The strategy selects the best available slot (Strategy Pattern).
   */
  async allocateSlot(vehicleType: VehicleType, strategyName?: string): Promise<ParkingSlotResponseDTO> {
    if (strategyName) {
      this.setStrategy(ParkingService.getStrategy(strategyName));
    }

    const vehicle = VehicleFactory.create(vehicleType, 'TEMP');
    const compatibleTypes = vehicle.getCompatibleSlotTypes();
    const availableSlots = await this.slotRepo.findAvailableByTypes(compatibleTypes);
    const chosen = this.strategy.allocate(availableSlots);

    if (!chosen) {
      throw new ValidationError(`No available parking slots for vehicle type ${vehicleType}. Please try a different strategy or check back later.`);
    }

    return {
      id: chosen.id,
      slotNumber: chosen.slotNumber,
      type: chosen.type,
      status: 'AVAILABLE',
      floorId: '',
      pricePerHour: chosen.pricePerHour,
      distanceFromEntry: chosen.distanceFromEntry,
      createdAt: new Date().toISOString(),
    };
  }

  async getAvailableSlots(vehicleType?: VehicleType): Promise<ParkingSlotResponseDTO[]> {
    if (vehicleType) {
      const vehicle = VehicleFactory.create(vehicleType, 'TEMP');
      const compatibleTypes = vehicle.getCompatibleSlotTypes();
      const slots = await this.slotRepo.findAllWithFloor({ status: SlotStatus.AVAILABLE });
      const filtered = slots.filter((s) => compatibleTypes.includes(s.type));
      return ParkingMapper.slotToDTOList(filtered);
    }
    return this.getAllSlots({ status: SlotStatus.AVAILABLE });
  }

  // Floor operations
  async getAllFloors(): Promise<ParkingFloorResponseDTO[]> {
    const floors = await this.floorRepo.findAllWithCounts();
    return floors.map((f) => ParkingMapper.floorToDTO(f));
  }

  async createFloor(data: CreateFloorDTO): Promise<ParkingFloorResponseDTO> {
    const floor = await this.floorRepo.create(data);
    return ParkingMapper.floorToDTO(floor as any);
  }
}
