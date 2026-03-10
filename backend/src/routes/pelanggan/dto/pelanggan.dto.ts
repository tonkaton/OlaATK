import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePelangganDto {
	@IsString()
	@IsNotEmpty()
	nama_lengkap!: string;

	@IsString()
	@IsNotEmpty()
	nomor_telepon!: string;

	@IsString()
	@IsOptional()
	alamat?: string;
}

export class UpdatePelangganDto {
	@IsOptional()
	@IsString()
	nama_lengkap?: string;

	@IsOptional()
	@IsString()
	nomor_telepon?: string;

	@IsOptional()
	@IsString()
	alamat?: string;
}
