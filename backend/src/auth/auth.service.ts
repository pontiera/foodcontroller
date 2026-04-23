import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate org slug
    const slug = this.generateSlug(dto.organizationName);
    const slugExists = await this.prisma.organization.findUnique({ where: { slug } });
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    // Create user + organization atomically
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          emailVerified: true, // Simplified for dev; add email verification in prod
        },
      });

      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug: finalSlug,
        },
      });

      await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: 'OWNER',
          position: 'Owner',
          joinedAt: new Date(),
        },
      });

      return { user, org };
    });

    const tokens = await this.generateTokens(result.user.id, result.org.id);
    return {
      user: this.sanitizeUser(result.user),
      organization: result.org,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        organizations: {
          include: { organization: true },
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const membership = user.organizations[0];
    if (!membership) throw new UnauthorizedException('No organization found');

    const tokens = await this.generateTokens(user.id, membership.organizationId);

    // Store refresh token hash
    const rtHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: rtHash },
    });

    return {
      user: this.sanitizeUser(user),
      organization: membership.organization,
      role: membership.role,
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const rtMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!rtMatches) throw new UnauthorizedException();

    const membership = await this.prisma.userOrganization.findFirst({
      where: { userId, isActive: true },
    });
    if (!membership) throw new UnauthorizedException();

    const tokens = await this.generateTokens(userId, membership.organizationId);
    const rtHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: rtHash } });

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, organizationId: string) {
    const payload = { sub: userId, orgId: organizationId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, ...safe } = user;
    return safe;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
