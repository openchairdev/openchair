import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

import { CreateBusinessDto } from './dto/create-business.dto.js';

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateBusinessDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        phoneNumber: dto.phoneNumber,
      },
    });

    if (!user) {
      throw new Error(
        'User must verify phone number first',
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      10,
    );

    return this.prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            email: dto.email,
            passwordHash,
            securityLevel: 'PASSWORD',
          },
        });

        const company =
          await tx.company.create({
            data: {
              name: dto.businessName,
            },
          });

        const location =
          await tx.location.create({
            data: {
              companyId: company.id,

              name: dto.locationName,

              slug:
                dto.locationName
                  .toLowerCase()
                  .replace(/\s+/g, '-'),

              timezone: dto.timezone,

              addressLine1:
                dto.addressLine1,

              city: dto.city,

              state: dto.state,

              postalCode:
                dto.postalCode,
            },
          });

        const membership =
          await tx.locationMember.create({
            data: {
              userId: user.id,

              locationId:
                location.id,

              role: 'OWNER',
            },
          });

        const staff =
          await tx.staff.create({
            data: {
              userId: user.id,

              locationId:
                location.id,

              displayName:
                dto.ownerDisplayName,
            },
          });

        const landingPage =
          await tx.landingPage.create({
            data: {
              locationId:
                location.id,

              headline:
                dto.businessName,

              subHeadline:
                dto.locationName,

              welcomeMessage:
                'Welcome to our salon.',
            },
          });

        return {
          success: true,

          company,

          location,

          membership,

          staff,

          landingPage,
        };
      },
    );
  }
}