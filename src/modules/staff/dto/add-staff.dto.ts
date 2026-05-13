import { IsEmail } from 'class-validator';

export class AddStaffDto {
  @IsEmail()
  email: string;
}
