import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  // In-memory store for reset tokens (MVP - acceptable for low volume).
  // Format: token -> { userId, expiresAt }
  private resetTokens = new Map<string, { userId: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signup(dto: SignupDto) {
    if (dto.hasAcceptedTerms !== true) {
      throw new BadRequestException('You must accept the legal disclaimer to create an account');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        hasAcceptedTerms: true,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Always respond success to avoid leaking which emails exist
    if (!user) {
      return { message: 'If an account exists for this email, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    this.resetTokens.set(token, { userId: user.id, expiresAt });

    await this.mailService.sendPasswordResetEmail(user.email, token);

    return { message: 'If an account exists for this email, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = this.resetTokens.get(dto.token);

    if (!record || record.expiresAt < Date.now()) {
      throw new BadRequestException('This reset link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    this.resetTokens.delete(dto.token);

    return { message: 'Password has been reset successfully' };
  }

  private buildAuthResponse(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}