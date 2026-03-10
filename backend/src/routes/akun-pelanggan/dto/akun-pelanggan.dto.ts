import { IsString, IsNotEmpty, IsEmail, IsInt, IsOptional, ValidateIf } from 'class-validator';

export class CreateAkunPelangganDto {
	@IsInt()
	@IsNotEmpty()
	id_pelanggan!: number;

	@IsEmail()
	@IsNotEmpty()
	email!: string;

	@IsString()
	@IsNotEmpty()
	nomor_telepon!: string;

	@IsString()
	@IsNotEmpty()
	hashed_password!: string;

	@IsString()
	@IsOptional()
	alamat?: string;
}

export class UpdateAkunPelangganDto {
	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	nomor_telepon?: string;

	@IsOptional()
	@IsString()
	hashed_password?: string;

	@IsOptional()
	@IsString()
	alamat?: string;
}
