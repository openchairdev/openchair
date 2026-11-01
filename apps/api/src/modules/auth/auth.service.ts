import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

import { RequestOtpDto } from './dto/request-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    // Delete existing OTPs for this phone number
    await this.prisma.otpCode.deleteMany({
      where: {
        phoneNumber: dto.phoneNumber,
      },
    });

    const code = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000,
    );

    await this.prisma.otpCode.create({
      data: {
        phoneNumber: dto.phoneNumber,
        code,
        expiresAt,
      },
    });

    return {
      success: true,
      otp: code, // development only
      expiresAt,
    };
  }

async verifyOtp(dto: VerifyOtpDto) {
  const otp = await this.prisma.otpCode.findFirst({
    where: {
      phoneNumber: dto.phoneNumber,
      code: dto.code,
    },
  });

  if (!otp) {
    return {
      success: false,
      message: 'Invalid OTP',
    };
  }

  if (otp.expiresAt < new Date()) {
    return {
      success: false,
      message: 'OTP expired',
    };
  }

  await this.prisma.otpCode.delete({
    where: {
      id: otp.id,
    },
  });

  let user = await this.prisma.user.findUnique({
    where: {
      phoneNumber: dto.phoneNumber,
    },
  });

  let isNewUser = false;

  if (!user) {
    isNewUser = true;

    user = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        role: 'CUSTOMER',
        securityLevel: 'OTP_ONLY',
        isActive: true,
      },
    });
  }

  return {
    success: true,
    isNewUser,
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      securityLevel: user.securityLevel,
    },
  };
}
}