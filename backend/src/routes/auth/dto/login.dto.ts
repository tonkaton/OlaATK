import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
	@IsString()
	username!: string; // Can be: admin username, user email, or user phone number

	@IsString()
	@IsNotEmpty()
	password!: string;
}
