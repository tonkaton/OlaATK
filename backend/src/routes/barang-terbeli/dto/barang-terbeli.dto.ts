import { IsString, IsNotEmpty, IsNumber, IsInt } from 'class-validator';

export class CreateBarangTerbeliDto {
	@IsInt()
	@IsNotEmpty()
	id_pesanan!: number;

	@IsString()
	@IsNotEmpty()
	nama_barang!: string;

	@IsNumber()
	@IsNotEmpty()
	harga_satuan!: number;

	@IsInt()
	@IsNotEmpty()
	jumlah!: number;
}

export class UpdateBarangTerbeliDto {
	@IsString()
	@IsNotEmpty()
	nama_barang?: string;

	@IsNumber()
	harga_satuan?: number;

	@IsInt()
	jumlah?: number;
}
