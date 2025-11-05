import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePracticeDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
