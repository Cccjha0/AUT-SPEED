import {
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from './interfaces/auth-user.interface';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly staffService: StaffService
  ) {}

  async login(username: string, password: string) {
    const staff = await this.staffService.authenticate(username, password);
    const payload: AuthUser = {
      username: staff.email,
      roles: staff.roles
    };
    const token = await this.jwtService.signAsync(payload);
    const rawId = (staff as { _id?: unknown })._id;
    if (rawId) {
      const id =
        typeof rawId === 'string'
          ? rawId
          : typeof (rawId as { toString?: () => string }).toString === 'function'
            ? (rawId as { toString: () => string }).toString()
            : null;
      if (id) {
        await this.staffService.recordLogin(id);
      }
    }
    return { token, roles: staff.roles };
  }

  extractTokenFromRequest(req: Request): string | null {
    const header = req.headers.authorization ?? req.headers.Authorization;
    if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
      return header.slice(7).trim();
    }
    if (req.query?.token && typeof req.query.token === 'string') {
      return req.query.token;
    }
    return null;
  }

  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthUser>(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
