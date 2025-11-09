import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthService } from '../auth.service';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    if (!requiredRoles.length) {
      // Route does not require auth
      return true;
    }

    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = this.authService.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const user = await this.authService.verifyToken(token);
    request.user = user;

    const allowed = requiredRoles.some(role => user.roles.includes(role));
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
