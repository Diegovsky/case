import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	plugins: ["@hey-api/client-fetch"],
	input: "http://localhost:8000/api/schema/",
	output: "app/client",
});
