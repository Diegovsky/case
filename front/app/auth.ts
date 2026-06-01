import { redirect } from "react-router";
import { authTokenRefreshCreate } from "./client/sdk.gen";
import { client } from "./client/client.gen";
import type { Jwt } from "./client/types.gen";

function goToLogin(): never {
	console.log("Unauth: login NOW");
	throw redirect("/login");
}

async function refresh(user: Jwt): Promise<string> {
	const data = await authTokenRefreshCreate({
		body: {
			refresh: user.refresh,
		},
	});
	const access = data.data?.access;
	if (access === undefined) {
		goToLogin();
	}
	user.access = access;
	return access as string;
}

async function expiredMiddleware(user: Jwt, resp: Response, req: Request) {
	if (
		resp.status === 401 &&
		(await resp.clone().json()).code === "token_not_valid"
	) {
		console.log("re-authing");
		const access = await refresh(user);
		resp = await fetch(
			new Request(req, {
				headers: {
					Authorization: `Bearer ${access}`,
				},
			}),
		);
		setUser(user);
	} else if (resp.status === 401 && !req.url.endsWith("/auth/")) {
		console.error(await resp.clone().text());
		goToLogin();
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
	setUser(user);
}

function setUser(user: Jwt) {
	client.setConfig({
		auth: () => user.access,
	});
}
