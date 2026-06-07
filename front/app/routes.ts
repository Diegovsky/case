import {
	type RouteConfig,
	index,
	layout,
	route,
} from "@react-router/dev/routes";

export default [
	route("login", "routes/login.tsx"),
	layout("layouts/authed.tsx", [
		layout("layouts/basic.tsx", [
			index("routes/home.tsx"),
			route("tests", "routes/tests.tsx"),
			route("topics/:hashid", "routes/topics.tsx"),
		]),
	]),
] satisfies RouteConfig;
