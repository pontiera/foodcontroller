// jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: { sub: string; orgId: string }) {
    const membership = await this.prisma.userOrganization.findFirst({
      where: { userId: payload.sub, organizationId: payload.orgId, isActive: true },
      include: { user: true, organization: true },
    });
    if (!membership || !membership.user.isActive) throw new UnauthorizedException();
    return {
      sub: payload.sub,
      orgId: payload.orgId,
      role: membership.role,
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
    };
  }
}
