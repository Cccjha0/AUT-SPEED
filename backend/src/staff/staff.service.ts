import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { StaffMember, StaffMemberDocument } from './schemas/staff-member.schema';
import { CreateStaffMemberDto } from './dto/create-staff-member.dto';
import { UpdateStaffMemberDto } from './dto/update-staff-member.dto';
import { ListStaffMembersQueryDto } from './dto/list-staff-members.dto';

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
    const doc = new this.staffModel({
      email: dto.email,
      name: dto.name,
      roles,
      active: dto.active ?? true
    });
    try {
      const saved = await doc.save();
      return saved.toObject();
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
    return this.staffModel
      .find(filter)
      .sort({ name: 1, email: 1 })
      .lean();
  }

  async findById(id: string) {
    this.ensureValidId(id);
    const staff = await this.staffModel.findById(id).lean();
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }
    return staff;
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

    try {
      const saved = await staff.save();
      return saved.toObject();
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
    return removed;
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

  async seedFromEnvIfEmpty() {
    const existing = await this.staffModel.estimatedDocumentCount();
    if (existing > 0) {
      return { inserted: 0, skipped: existing };
    }
    const seedEntries = this.collectSeedEntriesFromEnv();
    if (!seedEntries.length) {
      return { inserted: 0, skipped: 0 };
    }
    await this.staffModel.insertMany(seedEntries, { ordered: false });
    return { inserted: seedEntries.length, skipped: 0 };
  }

  private collectSeedEntriesFromEnv() {
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
    return Array.from(map.entries()).map(([email, roles]) => ({
      email,
      name: email.split('@')[0],
      roles: Array.from(roles),
      active: true
    }));
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

}
