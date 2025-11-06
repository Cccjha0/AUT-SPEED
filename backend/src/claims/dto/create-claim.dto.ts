import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class CreateClaimDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  practiceKey!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  text!: string;
}
