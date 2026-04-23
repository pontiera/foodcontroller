// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    const roleHierarchy = { OWNER: 4, ADMIN: 3, MANAGER: 2, STAFF: 1 };
    const userLevel = roleHierarchy[user.role] ?? 0;
    const requiredLevel = Math.min(...requiredRoles.map((r) => roleHierarchy[r] ?? 99));

    if (userLevel < requiredLevel) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
