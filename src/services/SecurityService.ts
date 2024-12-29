import { TwoFactorSetup, SecurityQuestion, User } from '../types';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export class SecurityService {
  async setupTwoFactor(user: User): Promise<TwoFactorSetup> {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'EventHub', secret);
    
    const qrCode = await QRCode.toDataURL(otpauth);
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substr(2, 8).toUpperCase()
    );

    return {
      secret,
      qrCode,
      backupCodes
    };
  }

  verifyTwoFactorToken(secret: string, token: string): boolean {
    return authenticator.verify({ token, secret });
  }

  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateSecurityQuestions(questions: SecurityQuestion[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (questions.length < 3) {
      errors.push('At least 3 security questions are required');
    }

    questions.forEach((q, index) => {
      if (!q.question || !q.answer) {
        errors.push(`Question ${index + 1} is incomplete`);
      }
      if (q.answer && q.answer.length < 3) {
        errors.push(`Answer for question ${index + 1} is too short`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  hashPassword(password: string): string {
    // In a real app, use bcrypt or similar
    return btoa(password);
  }

  verifyPassword(password: string, hash: string): boolean {
    return btoa(password) === hash;
  }
}

export const securityService = new SecurityService();