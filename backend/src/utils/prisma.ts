import { Prisma as PrismaLib } from '../prisma/generated/client.js';

/**
 * Prisma utility class
 */
export class Prisma {
  /**
   * Converts all properties of an object to strings.
   * @param obj - The object whose properties are to be converted
   * @returns A new object with all properties as strings
   * @throws Error if a property cannot be safely converted to string
   */
  static convertPropertiesToString<T extends Record<string, any>>(obj: T) {
    const newObj: Record<keyof T, string> = {} as Record<keyof T, string>;
    const properties = Object.keys(obj) as (keyof T)[];

    for (const property of properties) {
      const value = obj[property];

      if (typeof value === 'undefined') {
        continue;
      }

      if (value === null) {
        newObj[property] = 'null';
        continue;
      }

      if (typeof value === 'string') {
        newObj[property] = value;
        continue;
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
        newObj[property] = String(value);
        continue;
      }

      throw new Error(
        `Konversi tidak aman dari properti ${String(property)} dengan tipe ${typeof value} ke string`,
      );
    }

    return newObj;
  }

  /**
   * Converts all properties of an object from strings to numbers.
   * @param obj - The object whose properties are to be converted
   * @returns A new object with all properties as numbers
   * @throws Error if a property cannot be safely converted to number
   */
  static convertPropertiesToNumber<T extends Record<string, any>>(obj: T) {
    const newObj: Record<keyof T, number> = {} as Record<keyof T, number>;
    const properties = Object.keys(obj) as (keyof T)[];

    for (const property of properties) {
      const value = obj[property];

      // If already number, just copy it
      if (typeof value === 'number') {
        newObj[property] = value;
        continue;
      }

      // Only allow string values for conversion
      if (typeof value !== 'string') {
        throw new Error(`Properti ${String(property)} bukan string`);
      }

      const castedValue = (value as string).trim();
      const num = Number(castedValue);

      // Check for NaN (conversion failure)
      if (isNaN(num)) {
        throw new Error(
          `Properti ${String(property)} tidak dapat dikonversi ke angka`,
        );
      }

      newObj[property] = num;
    }

    return newObj;
  }

  /**
   * Handles Prisma errors and returns appropriate error information.
   * Checks against known Prisma error codes and extracts relevant error details.
   *
   * @param error - The error object to handle (typically a Prisma error)
   * @returns Object with error type and details:
   *   - For P2002 (Unique constraint): { type: 'unique', fields: string[], message: string }
   *   - For P2025 (Record not found): { type: 'not-found', message: string }
   *   - For P2003 (Foreign key constraint): { type: 'foreign-key', message: string }
   *   - For P2006 (Provided value too long): { type: 'value-too-long', message: string }
   *   - For unknown errors: { type: 'unknown', message: string }
   *
   * @example
   * try {
   *   await prisma.user.create({ data: { ... } });
   * } catch (error) {
   *   const result = Prisma.handlePrismaError(error);
   *   if (result.type === 'unique') {
   *     console.log('Duplicate value for fields:', result.fields);
   *   }
   * }
   */
  static handlePrismaError(error: unknown) {
    if (!(error instanceof Error)) {
      return {
        type: 'unknown',
        message: 'Terjadi kesalahan yang tidak diketahui',
      };
    }

    if (!(error instanceof PrismaLib.PrismaClientKnownRequestError)) {
      return {
        type: 'unknown',
        message: error.message || 'Terjadi kesalahan yang tidak diketahui',
      };
    }

    let returnData: {
      type:
        | 'unique'
        | 'not-found'
        | 'foreign-key'
        | 'value-too-long'
        | 'invalid-input'
        | 'unknown';
      message: string;
      fields?: string[];
      code?: string;
    } = { type: 'unknown', message: 'Terjadi kesalahan yang tidak diketahui' };

    switch (error.code) {
      case 'P2002': {
        // P2002: Unique constraint failed

        const target = error.meta?.['target'];
        const fields = Array.isArray(target)
          ? (target as string[])
          : [String(target || 'unknown')];
        const fieldsList = Array.isArray(target)
          ? (target as string[]).join(', ')
          : String(target || 'unknown');

        return {
          type: 'unique',
          message: `Nilai sudah ada untuk field: ${fieldsList}`,
          fields,
          code: error.code,
        };
      }

      case 'P2025': {
        // P2025: Record not found
        const cause = error.meta?.['cause'];

        returnData = {
          type: 'not-found',
          message: cause ? String(cause) : 'Data tidak ditemukan',
          code: error.code,
        };
        break;
      }

      case 'P2003': {
        // P2003: Foreign key constraint failed
        returnData = {
          type: 'foreign-key',
          message: `Referensi data tidak valid: ${error.meta?.['field_name'] || 'unknown field'}`,
          code: error.code,
        };
        break;
      }

      case 'P2006': {
        // P2006: Provided value is too long
        returnData = {
          type: 'value-too-long',
          message: `Nilai terlalu panjang untuk field: ${error.meta?.['field_name'] || 'unknown field'}`,
          code: error.code,
        };
        break;
      }

      case 'P2012': {
        // P2012: Missing required field
        returnData = {
          type: 'invalid-input',
          message: `Field wajib diisi: ${error.meta?.['field_name'] || 'unknown field'}`,
          code: error.code,
        };

        break;
      }

      case 'P2014': {
        // P2014: Required relation violation
        returnData = {
          type: 'invalid-input',
          message: `Operasi gagal karena ada record yang bergantung`,
          code: error.code,
        };
        break;
      }
    }

    return returnData;
  }
}
