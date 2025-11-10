import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { StaffMember, StaffMemberDocument } from './schemas/staff-member.schema';
import { CreateStaffMemberDto } from './dto/create-staff-member.dto';
import { UpdateStaffMemberDto } from './dto/update-staff-member.dto';
import { ListStaffMembersQueryDto } from './dto/list-staff-members.dto';

const scrypt = promisify(_scrypt);

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(StaffMember.name)
    private readonly staffModel: Model<StaffMemberDocument>
  ) {}

  async create(dto: CreateStaffMemberDto) {
    const roles = this.normalizeRoles(dto.roles);
    if (!roles.length) {
      throw new BadRequestException('At least one role is required');
    }
    const passwordHash = await this.hashPassword(dto.password);
    const doc = new this.staffModel({
      email: dto.email,
      name: dto.name,
      roles,
      active: dto.active ?? true,
      passwordHash
    });
    try {
      const saved = await doc.save();
      return this.sanitize(saved.toObject());
    } catch (error) {
      this.handleMongooseError(error);
    }
  }

  async findAll(query: ListStaffMembersQueryDto = {}) {
    const filter: FilterQuery<StaffMemberDocument> = {};
    if (query.role) {
      filter.roles = query.role;
    }
    if (typeof query.active === 'boolean') {
      filter.active = query.active;
    }
    const staff = await this.staffModel
      .find(filter)
      .sort({ name: 1, email: 1 })
      .lean();
    return staff.map(entry => this.sanitize(entry));
  }

  async findById(id: string) {
    this.ensureValidId(id);
    const staff = await this.staffModel.findById(id).lean();
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }
    return this.sanitize(staff);
  }

  async update(id: string, dto: UpdateStaffMemberDto) {
    this.ensureValidId(id);
    const staff = await this.staffModel.findById(id);
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    if (dto.email) {
      staff.email = dto.email;
    }
    if (dto.name !== undefined) {
      staff.name = dto.name;
    }
    if (dto.roles) {
      const roles = this.normalizeRoles(dto.roles);
      if (!roles.length) {
        throw new BadRequestException('At least one role is required');
      }
      staff.roles = roles;
    }
    if (dto.active !== undefined) {
      staff.active = dto.active;
    }
    if (dto.password) {
      staff.passwordHash = await this.hashPassword(dto.password);
    }

    try {
      const saved = await staff.save();
      return this.sanitize(saved.toObject());
    } catch (error) {
      this.handleMongooseError(error);
    }
  }

  async remove(id: string) {
    this.ensureValidId(id);
    const removed = await this.staffModel.findByIdAndDelete(id).lean();
    if (!removed) {
      throw new NotFoundException('Staff member not found');
    }
    return this.sanitize(removed);
  }

  async listActiveEmailsByRole(role: string) {
    const normalizedRole = role.trim().toLowerCase();
    if (!normalizedRole) {
      return [];
    }
    const recipients = await this.staffModel
      .find({ roles: normalizedRole, active: true })
      .select({ email: 1, _id: 0 })
      .lean();
    return recipients.map(entry => entry.email);
  }

  async markNotified(emails: string[]) {
    if (!emails.length) {
      return;
    }
    await this.staffModel.updateMany(
      { email: { $in: emails } },
      { $set: { lastNotifiedAt: new Date() } }
    );
  }

  async authenticate(email: string, password: string) {
    const identifier = email.trim().toLowerCase();
    if (!identifier) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const staff = await this.staffModel
      .findOne({ email: identifier, active: true })
      .lean();
    if (!staff?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await this.verifyPassword(password, staff.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.sanitize(staff);
  }

  async recordLogin(id: string) {
    if (!isValidObjectId(id)) {
      return;
    }
    await this.staffModel.findByIdAndUpdate(id, {
      $set: { lastLoginAt: new Date() }
    });
  }

  async seedFromEnvIfEmpty() {
    const existing = await this.staffModel.estimatedDocumentCount();
    if (existing > 0) {
      return { inserted: 0, skipped: existing };
    }
    const seedEntries = await this.collectSeedEntriesFromEnv();
    const entries = seedEntries.length ? seedEntries : await this.defaultSeedEntries();
    if (!entries.length) {
      return { inserted: 0, skipped: 0 };
    }
    await this.staffModel.insertMany(entries, { ordered: false });
    return { inserted: entries.length, skipped: 0 };
  }

  private async collectSeedEntriesFromEnv() {
    const sources: Record<string, string | undefined> = {
      moderator: process.env.NOTIFY_MODERATORS,
      analyst: process.env.NOTIFY_ANALYSTS
    };
    const map = new Map<string, Set<string>>();
    Object.entries(sources).forEach(([role, raw]) => {
      if (!raw) {
        return;
      }
      raw
        .split(',')
        .map(entry => entry.trim().toLowerCase())
        .filter(Boolean)
        .forEach(email => {
          if (!map.has(email)) {
            map.set(email, new Set());
          }
          map.get(email)!.add(role);
        });
    });
    if (!map.size) {
      return [];
    }
    const defaultPassword =
      process.env.STAFF_DEFAULT_PASSWORD ??
      process.env.ADMIN_DEFAULT_PASSWORD ??
      'changeme123';
    const passwordHash = await this.hashPassword(defaultPassword);
    return Array.from(map.entries()).map(([email, roles]) => ({
      email,
      name: email.split('@')[0],
      roles: Array.from(roles),
      active: true,
      passwordHash
    }));
  }

  private async defaultSeedEntries() {
    const defaults = [
      { email: 'moderator@example.com', password: 'modpass', roles: ['moderator'] },
      { email: 'analyst@example.com', password: 'analyst', roles: ['analyst'] },
      { email: 'admin@example.com', password: 'admin', roles: ['admin'] }
    ];
    return Promise.all(
      defaults.map(async entry => ({
        email: entry.email,
        name: entry.email.split('@')[0],
        roles: entry.roles,
        active: true,
        passwordHash: await this.hashPassword(entry.password)
      }))
    );
  }

  private normalizeRoles(roles: string[]) {
    return Array.from(
      new Set(
        roles
          .map(role => role.trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }

  private ensureValidId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid staff member id');
    }
  }

  private handleMongooseError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new BadRequestException('Email already exists');
    }
    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }
    throw new BadRequestException('Unable to process staff member');
  }

  private sanitize<T extends { passwordHash?: string }>(staff: T) {
    const sanitized = { ...staff };
    delete (sanitized as { passwordHash?: string }).passwordHash;
    return sanitized;
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt:${salt}:${derived.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedHash: string) {
    const [algo, salt, hash] = storedHash.split(':');
    if (algo !== 'scrypt' || !salt || !hash) {
      return false;
    }
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return derived.toString('hex') === hash;
  }
}
