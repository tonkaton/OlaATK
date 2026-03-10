
import type { ValidationError } from 'class-validator';
import type { Request, Response, IRouter } from 'express';

export interface AuthStatus {
	isAuthenticated: boolean;
	userType?: 'admin' | 'user';
	userId?: number;
}

export type SuccessResponse<T = Record<string, unknown>> = {
	success: true;

	/** Http Status Code of the response (defaults to 200) */
	statusCode?: number;

	/** Data payload of the response */
	data: T;
};

export type ErrorResponse = {
	success: false;

	/** Http Status Code of the response (defaults to 500)
	 * 
	 * This will not be available on the response body
	*/
	statusCode?: number;

	/** Error message describing the failure */
	message: string;

	/** Optional cause of the error (do not use for sensitive info) */
	cause?: string;
};

export type ClassValidatorErrorResponse = Omit<ErrorResponse, "cause"> & {
	message: 'Validation failed';
	cause: string[];
};

export type ApiResponse<T = object> = SuccessResponse<T> | ClassValidatorErrorResponse | ErrorResponse;
export type ApiRouteHandler<T> = (req: Request, res?: Response) => ApiResponse<T> | Promise<ApiResponse<T>>;
export type Method = keyof Omit<IRouter, "param" | "all" | "use" | "route" | "stack">;

export type RouteDefinitions = {
	[path: `/${string}`]: {
		[method in Method]?: ApiRouteHandler<unknown>;
	};
};
