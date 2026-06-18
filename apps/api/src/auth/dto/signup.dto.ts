import { IsEmail, IsString, MinLength, IsEnum, IsBoolean, Equals } from 'class-validator';
import { UserRole } from '@prisma/client';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @IsEnum(UserRole, { message: 'role must be FOUNDER, INVESTOR, or ADMIN' })
  role!: UserRole;

  @IsBoolean()
  @Equals(true, { message: 'You must accept the legal disclaimer to create an account' })
  hasAcceptedTerms!: boolean;
}