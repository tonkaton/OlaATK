import type { RouteDefinitions } from "../types/index.js";

const rootRoute: RouteDefinitions["/"] = {
	get: (req) => ({
		success: true,
		statusCode: 200,
		data: {
			message: "Ola ATK Backend is running."
		}
	})
};

export default rootRoute;
