import { BookingStatus, SlotStatus, VehicleType, PaymentStatus } from '../../core/types/enums';
import { NotFoundError } from '../../core/errors/NotFoundError';
import { ConflictError } from '../../core/errors/ConflictError';
import { ValidationError } from '../../core/errors/ValidationError';
import { BookingRepository } from './booking.repository';
import { BookingMapper } from './booking.mapper';
import { BookingResponseDTO, CreateBookingDTO } from './booking.dto';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { ParkingSlotRepository } from '../parking/parking.repository';
import { ParkingService } from '../parking/parking.service';
import { NotificationService } from '../notification/notification.service';
import { VehicleFactory } from '../vehicle/vehicle.factory';
import { DatabaseConnection } from '../../config/database';
import { Logger } from '../../utils/logger';

export class BookingService {
  private bookingRepo: BookingRepository;
  private vehicleRepo: VehicleRepository;
  private slotRepo: ParkingSlotRepository;
  private parkingService: ParkingService;
  private notificationService: NotificationService;
  private logger: Logger;

  constructor(notificationService: NotificationService) {
    this.bookingRepo = new BookingRepository();
    this.vehicleRepo = new VehicleRepository();
    this.slotRepo = new ParkingSlotRepository();
    this.parkingService = new ParkingService();
    this.notificationService = notificationService;
    this.logger = new Logger('BookingService');
  }

  async getUserBookings(userId: string): Promise<BookingResponseDTO[]> {
    const bookings = await this.bookingRepo.findByUserId(userId);
    return BookingMapper.toDTOList(bookings);
  }

  async getBookingById(id: string): Promise<BookingResponseDTO> {
    const booking = await this.bookingRepo.findByIdWithRelations(id);
    if (!booking) throw new NotFoundError('Booking', id);
    return BookingMapper.toDTO(booking);
  }

  async getAllBookings(): Promise<BookingResponseDTO[]> {
    const bookings = await this.bookingRepo.findAllWithRelations();
    return BookingMapper.toDTOList(bookings);
  }

  async createBooking(userId: string, data: CreateBookingDTO): Promise<BookingResponseDTO> {
    const vehicle = await this.vehicleRepo.findByIdOrThrow(data.vehicleId);
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      throw new ValidationError('End time must be after start time');
    }

    const prisma = DatabaseConnection.getInstance().getClient();

    return await prisma.$transaction(async (tx: any) => {
      let slotId = data.slotId;

      // If no slot specified, use strategy to allocate one
      if (!slotId) {
        const allocated = await this.parkingService.allocateSlot(
          vehicle.type as VehicleType,
          data.strategy
        );
        slotId = allocated.id;
      } else {
        // Verify slot compatibility using Factory Pattern
        const slot = await tx.parkingSlot.findUnique({ where: { id: slotId } });
        if (!slot) throw new NotFoundError('Slot', slotId);

        const vehicleObj = VehicleFactory.create(vehicle.type as VehicleType, vehicle.licensePlate);
        if (!vehicleObj.canFitInSlot(slot.type)) {
          throw new ValidationError(`Vehicle type ${vehicle.type} cannot fit in slot type ${slot.type}`);
        }
      }

      // Check for overlapping bookings (INSIDE transaction for atomicity)
      const overlapping = await tx.booking.findMany({
        where: {
          slotId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
          OR: [
            { startTime: { lt: endTime }, endTime: { gt: startTime } },
          ],
        },
      });

      if (overlapping.length > 0) {
        throw new ConflictError('Slot is already booked for the selected time period');
      }

      // Calculate total amount
      const slot = await tx.parkingSlot.findUnique({ where: { id: slotId } });
      if (!slot) throw new NotFoundError('Slot', slotId);

      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const vehicleObj = VehicleFactory.create(vehicle.type as VehicleType, vehicle.licensePlate);
      const totalAmount = vehicleObj.calculatePrice(Number(slot.pricePerHour), Math.ceil(hours));

      const booking = await tx.booking.create({
        data: {
          userId,
          vehicleId: data.vehicleId,
          slotId,
          status: BookingStatus.CONFIRMED,
          startTime,
          endTime,
          totalAmount,
        },
        include: { vehicle: true, slot: true },
      });

      // Update slot status
      await tx.parkingSlot.update({
        where: { id: slotId },
        data: { status: SlotStatus.RESERVED },
      });

      // Notify via Observer Pattern
      await this.notificationService.notify({
        userId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: `Your booking for slot ${booking.slot.slotNumber} has been confirmed from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}.`,
      });

      this.logger.info('Booking created', { id: booking.id, userId, slotId: booking.slotId });

      return BookingMapper.toDTO(booking);
    });
  }

  async cancelBooking(id: string, userId: string): Promise<BookingResponseDTO> {
    const booking = await this.bookingRepo.findByIdWithRelations(id);
    if (!booking) throw new NotFoundError('Booking', id);

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      throw new ValidationError(`Cannot cancel a ${booking.status.toLowerCase()} booking`);
    }

    const prisma = DatabaseConnection.getInstance().getClient();

    const updated = await prisma.$transaction(async (tx: any) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED },
        include: { vehicle: true, slot: true },
      });

      await tx.parkingSlot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.AVAILABLE },
      });

      return updatedBooking;
    });

    await this.notificationService.notify({
      userId: booking.userId,
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled',
      message: `Your booking for slot ${booking.slot.slotNumber} has been cancelled.`,
    });

    return BookingMapper.toDTO(updated);
  }

  async checkin(id: string): Promise<BookingResponseDTO> {
    const booking = await this.bookingRepo.findByIdWithRelations(id);
    if (!booking) throw new NotFoundError('Booking', id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ValidationError('Only confirmed bookings can be checked in');
    }

    const prisma = DatabaseConnection.getInstance().getClient();
    const now = new Date();

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.ACTIVE, actualEntry: now },
        include: { vehicle: true, slot: true },
      }),
      prisma.parkingSlot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.OCCUPIED },
      }),
      prisma.entryExitLog.create({
        data: {
          vehicleId: booking.vehicleId,
          slotId: booking.slotId,
          bookingId: booking.id,
          entryTime: now,
        },
      }),
    ] as any);

    await this.notificationService.notify({
      userId: booking.userId,
      type: 'VEHICLE_ENTERED',
      title: 'Vehicle Entered',
      message: `Your vehicle ${booking.vehicle.licensePlate} has entered slot ${booking.slot.slotNumber}.`,
    });

    return BookingMapper.toDTO(updated);
  }

  async checkout(id: string): Promise<BookingResponseDTO> {
    const booking = await this.bookingRepo.findByIdWithRelations(id);
    if (!booking) throw new NotFoundError('Booking', id);

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new ValidationError('Only active bookings can be checked out');
    }

    // Verify payment is completed before checkout
    if (booking.payment?.status !== PaymentStatus.COMPLETED) {
      throw new ValidationError('Payment must be completed before checkout. Please process your payment first.');
    }

    const prisma = DatabaseConnection.getInstance().getClient();
    const now = new Date();

    // Recalculate amount based on actual duration
    const actualHours = (now.getTime() - (booking.actualEntry?.getTime() ?? booking.startTime.getTime())) / (1000 * 60 * 60);
    const vehicleObj = VehicleFactory.create(booking.vehicle.type as VehicleType, booking.vehicle.licensePlate);
    const totalAmount = vehicleObj.calculatePrice(Number(booking.slot.pricePerHour), Math.ceil(actualHours));

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.COMPLETED, actualExit: now, totalAmount },
        include: { vehicle: true, slot: true },
      }),
      prisma.parkingSlot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.AVAILABLE },
      }),
      prisma.entryExitLog.updateMany({
        where: { bookingId: booking.id, exitTime: null },
        data: { exitTime: now },
      }),
    ] as any);

    await this.notificationService.notify({
      userId: booking.userId,
      type: 'VEHICLE_EXITED',
      title: 'Vehicle Exited',
      message: `Your vehicle ${booking.vehicle.licensePlate} has exited. Total amount: $${totalAmount.toFixed(2)}.`,
    });

    return BookingMapper.toDTO(updated);
  }
}
