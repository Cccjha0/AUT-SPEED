import { IsNotEmpty, IsString } from 'class-validator';

export class GetRatingDto {
  @IsString()
  @IsNotEmpty()
  doi!: string;
}

