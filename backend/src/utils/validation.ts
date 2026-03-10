import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import type { ClassConstructor } from 'class-transformer';
import type { ClassValidatorErrorResponse, ErrorResponse } from '../types/index.js';

/**
 * Validate a DTO and return errors if validation fails
 */
export async function validateDto<T extends object>(
	dtoClass: ClassConstructor<T>,
	data: any
): Promise<{ dto: T; errors: null } | { dto: null; errors: ClassValidatorErrorResponse | ErrorResponse }> {
	const dtoInstance = plainToInstance(dtoClass, data);
	if (!dtoInstance) {
		return {
			dto: null,
			errors: {
				success: false,
				statusCode: 400,
				message: 'Missing or invalid redata',
			},
		};
	}

	const validationErrors = await validate(dtoInstance);

	if (validationErrors.length > 0) {
		return {
			dto: null,
			errors: {
				success: false,
				statusCode: 400,
				message: "Validation failed",
				cause: validationErrors.flatMap((error: ValidationError) => {
					if (error.constraints) {
						return Object.values(error.constraints);
					} else {
						return [];
					}
				}),
			} satisfies ClassValidatorErrorResponse,
		};
	}

	return { dto: dtoInstance, errors: null };
}
