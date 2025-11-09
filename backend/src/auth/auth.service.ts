import {
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from './interfaces/auth-user.interface';

interface ConfiguredUser {
  username: string;
  password: string;
  roles: string[];
}

const DEFAULT_USERS: ConfiguredUser[] = [
  { username: 'moderator', password: 'modpass', roles: ['moderator'] },
  { username: 'analyst', password: 'analyst', roles: ['analyst'] },
  { username: 'admin', password: 'admin', roles: ['admin'] }
];

@Injectable()
export class AuthService {
  private readonly users: ConfiguredUser[];

  constructor(private readonly jwtService: JwtService) {
    this.users = this.loadUsersFromEnv();
  }

  async login(username: string, password: string) {
    const user = this.users.find(entry => entry.username === username);
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const payload: AuthUser = {
      username: user.username,
      roles: user.roles
    };
    const token = await this.jwtService.signAsync(payload);
    return { token, roles: user.roles };
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

  private loadUsersFromEnv(): ConfiguredUser[] {
    const raw = process.env.AUTH_USERS;
    if (!raw) {
      return DEFAULT_USERS;
    }
    const entries = raw
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(token => {
        const [username, password, rolesRaw] = token.split(':');
        const roles =
          rolesRaw?.split('+').map(role => role.trim()).filter(Boolean) ?? [];
        if (!username || !password || !roles.length) {
          return null;
        }
        return { username, password, roles };
      })
      .filter((entry): entry is ConfiguredUser => Boolean(entry));

    return entries.length ? entries : DEFAULT_USERS;
  }
}
