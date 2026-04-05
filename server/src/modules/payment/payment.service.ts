import { PaymentStatus } from '../../core/types/enums';
import { NotFoundError } from '../../core/errors/NotFoundError';
import { ConflictError } from '../../core/errors/ConflictError';
import { ValidationError } from '../../core/errors/ValidationError';
import { PaymentRepository } from './payment.repository';
import { PaymentMapper } from './payment.mapper';
import { PaymentResponseDTO, CreatePaymentDTO } from './payment.dto';
import { BookingRepository } from '../booking/booking.repository';
import { NotificationService } from '../notification/notification.service';
import crypto from 'crypto';
import { Logger } from '../../utils/logger';

export class PaymentService {
  private paymentRepo: PaymentRepository;
  private bookingRepo: BookingRepository;
  private notificationService: NotificationService;
  private logger: Logger;

  constructor(notificationService: NotificationService) {
    this.paymentRepo = new PaymentRepository();
    this.bookingRepo = new BookingRepository();
    this.notificationService = notificationService;
    this.logger = new Logger('PaymentService');
  }

  async getUserPayments(userId: string): Promise<PaymentResponseDTO[]> {
    const payments = await this.paymentRepo.findByUserId(userId);
    return PaymentMapper.toDTOList(payments);
  }

  async getPaymentById(id: string): Promise<PaymentResponseDTO> {
    const payment = await this.paymentRepo.findByIdOrThrow(id);
    return PaymentMapper.toDTO(payment);
  }

  async processPayment(userId: string, data: CreatePaymentDTO): Promise<PaymentResponseDTO> {
    const booking = await this.bookingRepo.findByIdOrThrow(data.bookingId);

    if (!booking.totalAmount) {
      throw new ValidationError('Booking has no amount calculated');
    }

    const existingPayment = await this.paymentRepo.findByBookingId(data.bookingId);
    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      throw new ConflictError('Payment already completed for this booking');
    }

    // Simulate payment processing
    const transactionId = `TXN-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    const payment = await this.paymentRepo.create({
      booking: { connect: { id: data.bookingId } },
      user: { connect: { id: userId } },
      amount: Number(booking.totalAmount),
      method: data.method,
      status: PaymentStatus.COMPLETED,
      transactionId,
      paidAt: new Date(),
    });

    await this.notificationService.notify({
      userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Successful',
      message: `Payment of $${Number(booking.totalAmount).toFixed(2)} processed. Transaction: ${transactionId}`,
    });

    this.logger.info('Payment processed', { id: payment.id, userId, bookingId: data.bookingId, amount: Number(booking.totalAmount) });

    return PaymentMapper.toDTO(payment);
  }

  async refundPayment(id: string): Promise<PaymentResponseDTO> {
    const payment = await this.paymentRepo.findByIdOrThrow(id);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new ValidationError('Can only refund completed payments');
    }

    const updated = await this.paymentRepo.update(id, { status: PaymentStatus.REFUNDED });

    await this.notificationService.notify({
      userId: payment.userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Refunded',
      message: `Refund of $${Number(payment.amount).toFixed(2)} processed.`,
    });

    return PaymentMapper.toDTO(updated);
  }
}
