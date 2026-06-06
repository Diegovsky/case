import { defineConfig } from "@hey-api/openapi-ts";
import { env } from "node:process";

const HOST = env.API_HOST || "http://localhost:8000";

export default defineConfig({
	plugins: ["@hey-api/client-fetch"],
	input: `${HOST}/api/schema/`,
	output: "app/client",
});
