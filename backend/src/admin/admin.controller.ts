import {
  Controller,
  HttpException,
  HttpStatus,
  Post
} from '@nestjs/common';
import { AdminService } from './admin.service';

interface ResponsePayload<T> {
  data: T | null;
  error: { message: string } | null;
}

@Controller('admin/seed')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('practices')
  async seedPractices(): Promise<ResponsePayload<unknown>> {
    try {
      const data = await this.adminService.seedPractices();
      return { data, error: null };
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post('claims')
  async seedClaims(): Promise<ResponsePayload<unknown>> {
    try {
      const data = await this.adminService.seedClaims();
      return { data, error: null };
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post('submissions-accepted')
  async seedSubmissions(): Promise<ResponsePayload<unknown>> {
    try {
      const data = await this.adminService.seedSubmissions();
      return { data, error: null };
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post('evidence')
  async seedEvidence(): Promise<ResponsePayload<unknown>> {
    try {
      const data = await this.adminService.seedEvidence();
      return { data, error: null };
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post('all')
  async seedAll(): Promise<ResponsePayload<unknown>> {
    try {
      const data = await this.adminService.seedAll();
      return { data, error: null };
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  private wrapAndThrowError(error: unknown): never {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const rawMessage =
        typeof response === 'string'
          ? response
          : (response as Record<string, unknown>).message ?? 'Request failed';
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
      throw new HttpException({ data: null, error: { message } }, error.getStatus());
    }

    throw new HttpException(
      { data: null, error: { message: 'Request failed' } },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
