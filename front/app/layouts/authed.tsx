import { setupClient } from "~/auth";
import Session from "~/session.server";
import type { Jwt, User } from "~/client";
import type { Route } from "./+types/authed";
import { AppProvider } from "~/context";
import { Outlet } from "react-router";

export async function loader({ request }: Route.LoaderArgs): Promise<Jwt> {
	const ses = await Session.fromRequest(request);
	const jwt = ses.login();

	return jwt;
}

export default function AuthedComponent({
	loaderData: jwt,
}: Route.ComponentProps) {
	// guarantees both client and server have HTTP client setup.
	// yes it is weird but works, and middlewares are not yet stable, so...
	setupClient(jwt);
	return (
		<AppProvider app={{ user: jwt.user }}>
			<Outlet />
		</AppProvider>
	);
}
