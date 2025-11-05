import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  practiceKey!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;
}
