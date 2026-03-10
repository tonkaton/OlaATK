import { IsString, IsNotEmpty, IsInt, IsNumber, IsOptional, IsArray, ValidateNested, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

// [BARU] 1. DTO untuk item barang (biar bisa beli cetak + jilid sekaligus)
export class ItemPesananDto {
  @IsString()
  @IsNotEmpty()
  nama_barang!: string; // Pake tanda seru (!) biar TypeScript ga rewel

  @IsNumber()
  @Min(0)
  harga_satuan!: number;

  @IsInt()
  @Min(1)
  jumlah!: number;
}

// [UPGRADE] 2. DTO Create sekarang support Mode & Items
export class CreatePesananDto {
  @IsInt()
  @IsNotEmpty()
  id_pelanggan!: number;

  @IsString()
  @IsNotEmpty()
  jenis_layanan!: string;

  // Baru: Mode Online/Offline
  @IsString()
  @IsOptional()
  @IsIn(['ONLINE', 'OFFLINE'])
  mode_pesanan?: string; 

  @IsString()
  @IsOptional()
  nama_file?: string;

  @IsString()
  @IsOptional()
  catatan_pesanan?: string;

  @IsNumber()
  @IsNotEmpty()
  nilai_pesanan!: number;

  // Baru: Array Item (Cetak, Jilid, dll)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPesananDto)
  @IsOptional()
  items?: ItemPesananDto[];
}

// [FIX] 3. DTO Update yang bener (semua Optional)
export class UpdatePesananDto {
  @IsString()
  @IsOptional() // Sebelumnya IsNotEmpty tapi propertinya optional (aneh kan?), gua benerin jadi IsOptional
  jenis_layanan?: string;

  @IsString()
  @IsOptional()
  nama_file?: string;

  @IsString()
  @IsOptional()
  catatan_pesanan?: string;

  @IsNumber()
  @IsOptional()
  nilai_pesanan?: number;
}

// [BARU] 4. DTO Khusus buat ganti Status doang
export class UpdateStatusPesananDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['MENUNGGU', 'DIPROSES', 'SELESAI', 'BATAL'])
  status!: string;
}