import {
	type RouteConfig,
	index,
	layout,
	route,
} from "@react-router/dev/routes";

export default [
	route("login", "routes/login.tsx"),
	route("onboarding", "routes/onboarding.tsx"),
	layout("layouts/basic.tsx", [
		index("routes/home.tsx"),
		route("topics", "routes/topics.tsx"),
	]),
] satisfies RouteConfig;
