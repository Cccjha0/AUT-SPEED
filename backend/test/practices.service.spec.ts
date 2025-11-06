import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PracticesService } from '../src/practices/practices.service';
import { Practice } from '../src/practices/schemas/practice.schema';

class PracticeModelMock {
  key: string;
  name: string;

  constructor(dto: { key: string; name: string }) {
    this.key = dto.key;
    this.name = dto.name;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async save(): Promise<{ toObject: () => Record<string, unknown> }> {
    return {
      toObject: () => ({
        _id: 'mock-id',
        key: this.key,
        name: this.name,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    };
  }
}

describe('PracticesService', () => {
  let service: PracticesService;
  let practiceModelSaveSpy: jest.SpyInstance;

  beforeEach(async () => {
    practiceModelSaveSpy = jest.spyOn(PracticeModelMock.prototype, 'save');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticesService,
        {
          provide: getModelToken(Practice.name),
          useValue: PracticeModelMock
        }
      ]
    }).compile();

    service = module.get<PracticesService>(PracticesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a practice successfully', async () => {
    const dto = { key: 'tdd', name: 'Test-Driven Development' };

    const result = await service.create(dto);

    expect(practiceModelSaveSpy).toHaveBeenCalledTimes(1);
    expect(result.key).toBe(dto.key);
    expect(result.name).toBe(dto.name);
    expect(result).toHaveProperty('_id');
  });

  it('throws BadRequestException when key already exists', async () => {
    practiceModelSaveSpy.mockImplementationOnce(async () => {
      throw { code: 11000 };
    });

    await expect(
      service.create({ key: 'tdd', name: 'Test-Driven Development' })
    ).rejects.toThrow(BadRequestException);
  });
});
