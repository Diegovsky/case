import { redirect } from "react-router";
import { authTokenRefreshCreate } from "./client/sdk.gen";
import { client } from "./client/client.gen";

export type JWT = {
	access: string;
	refresh: string;
};

function goToLogin(): never {
	console.log("Unauth: login NOW");
	throw redirect("/login");
}

async function refresh(user: JWT) {
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

async function expiredMiddleware(
	jwt: JWT | null,
	resp: Response,
	req: Request,
) {
	if (resp.status === 401 && jwt) {
		const respBody = await resp.clone().json();
		if (respBody.code === "token_not_valid" && !req.url.includes("auth")) {
			console.log("re-authing");

			await refresh(jwt);
			req.headers.set("Authorization", `Bearer ${jwt.access}`);
			const refreshReq = new Request(req);

			resp = await fetch(refreshReq);
		} else {
			console.log("Invalid credentials, re-login");
			goToLogin();
		}
	}
	return resp;
}

const state: { jwt: JWT | null } = {
	jwt: null,
};

client.interceptors.response.use(async (resp, req) =>
	expiredMiddleware(state.jwt, resp, req),
);
client.setConfig({
	auth: () => state.jwt?.access,
	throwOnError: true,
	fetch: async (req, opts) =>
		await fetch(req instanceof Request ? req.clone() : req, opts),
});

export function setupClient(jwt: JWT) {
	if (!jwt)
		throw new Error(
			"User authentication data is required to setup the client.",
		);
	state.jwt = jwt;
}
