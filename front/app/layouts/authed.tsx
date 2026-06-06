import { setupClient } from "~/auth";
import Session from "~/session";
import type { Jwt, User } from "~/client";
import type { Route } from "./+types/authed";
import { AppProvider } from "~/context";
import { createContext, Outlet, type MiddlewareFunction } from "react-router";

export const jwtContext = createContext<Jwt>();

const authMiddleware: MiddlewareFunction = async (
	{ request, context },
	next,
) => {
	const ses = await Session.fromRequest(request);
	const jwt = ses.login();
	setupClient(jwt);
	context.set(jwtContext, jwt);
	return await next();
};

export const middleware = [authMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
	return context.get(jwtContext);
};

export default function AuthedComponent({
	loaderData: jwt,
}: Route.ComponentProps) {
	setupClient(jwt);
	return <Outlet />;
}
