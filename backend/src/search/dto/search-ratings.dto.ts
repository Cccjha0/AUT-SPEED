import { IsNotEmpty, IsString } from 'class-validator';

export class SearchRatingsDto {
  @IsString()
  @IsNotEmpty()
  doi!: string;
}
