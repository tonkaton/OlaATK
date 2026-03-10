import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateDataLayananDto {
	@IsString()
	@IsNotEmpty()
	nama!: string;

	@IsString()
	@IsNotEmpty()
	deskripsi!: string;

	@IsString()
	@IsNotEmpty()
	nama_icon!: string;

	@IsBoolean()
	@IsNotEmpty()
	status_layanan!: boolean;
}

export class UpdateDataLayananDto {
	@IsString()
	@IsNotEmpty()
	nama?: string;

	@IsString()
	@IsNotEmpty()
	deskripsi?: string;

	@IsString()
	@IsNotEmpty()
	nama_icon?: string;

	@IsBoolean()
	status_layanan?: boolean;
}
