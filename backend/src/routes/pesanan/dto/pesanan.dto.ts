import { IsString, IsNotEmpty, IsInt, IsNumber, IsOptional, IsArray, ValidateNested, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum StatusPesanan {
  MENUNGGU = 'MENUNGGU',
  DIPROSES = 'DIPROSES',
  SELESAI = 'SELESAI',
  BATAL = 'BATAL',
}

export enum ModePesanan {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export class ItemPesananDto {
  @IsString()
  @IsNotEmpty()
  nama_barang!: string;

  @IsNumber()
  @Min(0)
  harga_satuan!: number;

  @IsInt()
  @Min(1)
  jumlah!: number;
}

export class CreatePesananDto {
  @IsInt()
  @IsNotEmpty()
  id_pelanggan!: number;

  @IsString()
  @IsNotEmpty()
  jenis_layanan!: string;

  @IsEnum(ModePesanan)
  @IsOptional()
  mode_pesanan?: ModePesanan;

  @IsString()
  @IsOptional()
  nama_file?: string;

  @IsString()
  @IsOptional()
  catatan_pesanan?: string;

  @IsNumber()
  @IsNotEmpty()
  nilai_pesanan!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPesananDto)
  @IsOptional()
  items?: ItemPesananDto[];
}

export class UpdatePesananDto {
  @IsString()
  @IsOptional()
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

export class UpdateStatusPesananDto {
  @IsEnum(StatusPesanan)
  @IsNotEmpty()
  status!: StatusPesanan;
}