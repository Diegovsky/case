import { setupClient, type JWT } from "~/auth";
import Session from "~/session";
import type { Route } from "./+types/authed";
import { AppProvider } from "~/context";
import { createContext, Outlet, type MiddlewareFunction } from "react-router";
import { handleResponse, Hook } from "~/utils";
import { userMeRetrieve, type User } from "~/client";
import { useRef, useState } from "react";
import { Box } from "@mui/material";
import { useRouteError } from "react-router";

export const jwtContext = createContext<JWT>();
export const userContext = createContext<User>();

const authMiddleware: MiddlewareFunction = async (
	{ request, context },
	next,
) => {
	const ses = await Session.fromRequest(request);
	const jwt = ses.login();
	setupClient(jwt);
	context.set(jwtContext, jwt);
	const user = handleResponse(await userMeRetrieve());
	context.set(userContext, user);
	return await next();
};

export const middleware = [authMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
	const jwt = context.get(jwtContext);
	const user = context.get(userContext);
	return { user, jwt };
};

export default function AuthedComponent({
	loaderData: { jwt, user },
}: Route.ComponentProps) {
	setupClient(jwt);
	const isReadOnly = new Hook(useState(user.info!.length === 0));

	const aiContext = useRef("");
	return (
		<AppProvider app={{ aiContext, user, isReadOnly }}>
			<Box
				sx={{ display: "flex", flexDirection: "column", minHeight: "100svh" }}
			>
				<Outlet />
			</Box>
		</AppProvider>
	);
}
