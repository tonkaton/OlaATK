import { IsString, IsNotEmpty, IsNumber, IsInt, IsOptional } from 'class-validator';

export class CreateStokBarangDto {
	@IsString()
	@IsNotEmpty()
	nama!: string;

	@IsNumber()
	@IsNotEmpty()
	harga_satuan!: number;

	@IsInt()
	@IsNotEmpty()
	jumlah_stok!: number;

	@IsString()
	@IsOptional()
	satuan?: string;

	@IsInt()
	@IsOptional()
	isi_per_satuan?: number;
}

export class UpdateStokBarangDto {
	@IsString()
	@IsNotEmpty()
	nama?: string;

	@IsNumber()
	harga_satuan?: number;

	@IsInt()
	jumlah_stok?: number;

	@IsString()
	@IsOptional()
	satuan?: string;

	@IsInt()
	@IsOptional()
	isi_per_satuan?: number;
}
