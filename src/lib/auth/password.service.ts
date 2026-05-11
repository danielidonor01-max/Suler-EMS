import bcrypt from 'bcryptjs';

/**
 * Isolated service for credential security operations.
 */
export class PasswordService {
  private static SALT_ROUNDS = 12;

  /**
   * Hashes a plain text password.
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Validates a password against a hash.
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Enforces password complexity rules.
   */
  static validateComplexity(password: string): { valid: boolean; reason?: string } {
    if (password.length < 8) {
      return { valid: false, reason: 'Password must be at least 8 characters long.' };
    }
    // Add more rules as needed (uppercase, symbols, etc.)
    return { valid: true };
  }
}
