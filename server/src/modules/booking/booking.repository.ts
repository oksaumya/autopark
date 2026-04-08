import { Booking, Prisma, BookingStatus, Vehicle, ParkingSlot } from '@prisma/client';
import { BaseRepository } from '../../core/abstract/BaseRepository';

type BookingWithRelations = Booking & { vehicle: Vehicle; slot: ParkingSlot };

export class BookingRepository extends BaseRepository<Booking, Prisma.BookingCreateInput, Prisma.BookingUpdateInput> {
  protected entityName = 'Booking';

  protected getModelDelegate() {
    return this.prisma.booking;
  }

  async findByUserId(userId: string): Promise<BookingWithRelations[]> {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { vehicle: true, slot: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdWithRelations(id: string): Promise<BookingWithRelations | null> {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true, slot: true, payment: true },
    });
  }

  async findAllWithRelations(): Promise<BookingWithRelations[]> {
    return this.prisma.booking.findMany({
      include: { vehicle: true, slot: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOverlapping(slotId: string, startTime: Date, endTime: Date): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        slotId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.PENDING] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
  }

  async findActiveBySlotId(slotId: string): Promise<Booking | null> {
    return this.prisma.booking.findFirst({
      where: {
        slotId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
      },
    });
  }

  async countByStatus(status: BookingStatus): Promise<number> {
    return this.prisma.booking.count({ where: { status } });
  }
}
