import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import type { CreateClaimDto } from './dto/create-claim.dto';
import type { ListClaimsQueryDto } from './dto/list-claims.dto';
import type { UpdateClaimDto } from './dto/update-claim.dto';
import { ClaimsService } from './claims.service';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async list(@Query() query: ListClaimsQueryDto) {
    try {
      const safeQuery = {
        practiceKey: query.practiceKey,
        limit: query.limit ?? 10,
        skip: query.skip ?? 0
      };
      const data = await this.claimsService.findAll(safeQuery);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    try {
      const data = await this.claimsService.findByKey(key);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() payload: CreateClaimDto) {
    try {
      const data = await this.claimsService.create(payload);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Patch(':key')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(@Param('key') key: string, @Body() payload: UpdateClaimDto) {
    try {
      const data = await this.claimsService.update(key, payload);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Delete(':key')
  async remove(@Param('key') key: string) {
    try {
      const data = await this.claimsService.delete(key);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  private wrapSuccess<T>(data: T) {
    return { data, error: null };
  }

  private wrapAndThrowError(error: unknown): never {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      const rawMessage =
        typeof response === 'string'
          ? response
          : (response as Record<string, unknown>).message ?? 'Request failed';
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
      throw new HttpException({ error: true, message }, status);
    }

    throw new HttpException(
      { error: true, message: 'Request failed' },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
