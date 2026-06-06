import {
	createCookieSessionStorage,
	type Session as SessionData,
	redirect,
} from "react-router";
import type { JWT } from "./auth";

export type ResponseOpts = { headers: Record<string, string> };

const { getSession, commitSession, destroySession } =
	createCookieSessionStorage({
		cookie: {
			name: "__session",
			httpOnly: true,
			path: "/",
			sameSite: "lax",
			secrets: ["2738912hajhshajwbs"], // In production, this should come from process.env.SESSION_SECRET
			secure: process.env.NODE_ENV === "production",
		},
	});

function setCookie(cookie: string) {
	return {
		headers: {
			"Set-Cookie": cookie,
		},
	};
}

const AUTH_KEY = "auth";

export default class Session {
	data: SessionData;

	constructor(data: SessionData) {
		this.data = data;
	}

	static async fromRequest(request: Request): Promise<Session> {
		return new Session(await getSession(request.headers.get("Cookie")));
	}

	set(key: string, val: any) {
		this.data.set(key, val);
	}

	get(key: string): any | undefined {
		return this.data.get(key);
	}

	login(): JWT {
		const auth = this.get(AUTH_KEY) as JWT | undefined;
		if (
			auth === undefined ||
			typeof auth.access === "undefined" ||
			typeof auth.refresh === "undefined"
		) {
			console.log("redirecting to log in");
			throw redirect("/login");
		}
		return auth;
	}

	async setTokens(tokens: JWT) {
		const cleanedTokens: JWT = {
			access: tokens.access,
			refresh: tokens.refresh,
		};
		this.set(AUTH_KEY, cleanedTokens);
	}

	async commit(): Promise<ResponseOpts> {
		return setCookie(await commitSession(this.data));
	}

	async delete(): Promise<ResponseOpts> {
		return setCookie(await destroySession(this.data));
	}
}
