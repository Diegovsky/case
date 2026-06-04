import {
	createCookieSessionStorage,
	type Session as SessionData,
	redirect,
} from "react-router";
import type { Jwt, User } from "~/client/types.gen";

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

	static async getUserFromRequest(request: Request): Promise<User> {
		const session = await Session.fromRequest(request);
		const auth = session.login();
		return auth.user;
	}

	set(key: string, val: any) {
		this.data.set(key, val);
	}

	get(key: string): any | undefined {
		return this.data.get(key);
	}

	login(): Jwt {
		const auth = this.get(AUTH_KEY) as Jwt | undefined;
		if (
			auth === undefined ||
			typeof auth.access === "undefined" ||
			typeof auth.refresh === "undefined"
		) {
			console.log("redirecting to log in");
			throw redirect("/login");
		}
		console.log("AUTH INFO:", auth);
		return auth;
	}

	async setTokens(tokens: Jwt) {
		this.set(AUTH_KEY, tokens);
	}

	async commit(): Promise<ResponseOpts> {
		return setCookie(await commitSession(this.data));
	}

	async delete(): Promise<ResponseOpts> {
		return setCookie(await destroySession(this.data));
	}
}
