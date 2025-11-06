import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class CreatePracticeDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  name!: string;
}
