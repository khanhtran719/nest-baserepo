import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
