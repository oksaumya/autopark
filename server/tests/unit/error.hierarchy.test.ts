import { AppError } from '../../src/core/errors/AppError';
import { NotFoundError } from '../../src/core/errors/NotFoundError';
import { ValidationError } from '../../src/core/errors/ValidationError';
import { AuthenticationError } from '../../src/core/errors/AuthenticationError';
import { AuthorizationError } from '../../src/core/errors/AuthorizationError';
import { ConflictError } from '../../src/core/errors/ConflictError';

describe('Error Hierarchy (Inheritance + Polymorphism)', () => {
  it('NotFoundError should extend AppError with 404 status', () => {
    const error = new NotFoundError('User', '123');
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain('User');
    expect(error.message).toContain('123');
    expect(error.isOperational).toBe(true);
  });

  it('ValidationError should extend AppError with 400 status and fields', () => {
    const fields = { email: 'Invalid email' };
    const error = new ValidationError('Validation failed', fields);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.fields).toEqual(fields);
  });

  it('AuthenticationError should extend AppError with 401 status', () => {
    const error = new AuthenticationError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Authentication required');
  });

  it('AuthorizationError should extend AppError with 403 status', () => {
    const error = new AuthorizationError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
  });

  it('ConflictError should extend AppError with 409 status', () => {
    const error = new ConflictError('Already exists');
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(409);
  });

  it('All errors should be substitutable for AppError (Liskov)', () => {
    const errors: AppError[] = [
      new NotFoundError('Vehicle', '1'),
      new ValidationError('Invalid'),
      new AuthenticationError(),
      new AuthorizationError(),
      new ConflictError('Duplicate'),
    ];

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(AppError);
      expect(typeof error.statusCode).toBe('number');
      expect(typeof error.message).toBe('string');
      expect(typeof error.isOperational).toBe('boolean');
    });
  });

  it('AppError readonly properties (Encapsulation)', () => {
    const error = new AppError('test', 500);
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });
});
