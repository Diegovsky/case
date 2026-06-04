import { redirect } from "react-router";
import { authTokenRefreshCreate } from "./client/sdk.gen";
import { client } from "./client/client.gen";
import type { Jwt } from "./client/types.gen";

function goToLogin(): never {
	console.log("Unauth: login NOW");
	throw redirect("/login");
}
async function refresh(user: Jwt) {
	const data = await authTokenRefreshCreate({
		body: user,
	});
	const tokens = data.data;
	if (tokens === undefined) {
		goToLogin();
	}
	user.access = tokens.access;
	if (tokens.refresh) user.refresh = tokens.refresh;
}

async function expiredMiddleware(user: Jwt, resp: Response, req: Request) {
	if (resp.status === 401) {
		const respBody = await resp.clone().json();
		console.log({ url: req.url, code: resp.status });
		if (respBody.code === "token_not_valid" && !req.url.includes("auth")) {
			console.log("re-authing");

			await refresh(user);
			const refreshReq = new Request(req, {
				headers: {
					Authorization: `Bearer ${user.access}`,
				},
			});

			resp = await fetch(refreshReq);
		} else {
			console.log("Invalid credentials, re-login");
			goToLogin();
		}
	}
	return resp;
}

export function setupClient(user: Jwt) {
	if (!user)
		throw new Error(
			"User authentication data is required to setup the client.",
		);
	client.interceptors.response.use(async (resp, req) =>
		expiredMiddleware(user, resp, req),
	);
	client.setConfig({
		auth: () => user.access,
		throwOnError: true,
		fetch: async (req, opts) =>
			await fetch(req instanceof Request ? req.clone() : req, opts),
	});
}
