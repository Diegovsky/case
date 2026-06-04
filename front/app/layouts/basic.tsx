import { Box } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router";
import { setupClient } from "~/auth";
import type { User } from "~/client";
import AppHeader from "~/components/AppHeader";
import AppDrawer from "~/components/Drawer";
import { AppProvider } from "~/context";
import Session from "~/session.server";
import { Hook } from "~/utils";
import type { Route } from "./+types/basic";

export async function loader({ request }: Route.LoaderArgs): Promise<User> {
	const ses = await Session.fromRequest(request);
	const jwt = ses.login();
	setupClient(jwt);

	return jwt.user;
}

export default function BasicLayout({
	loaderData: user,
}: Route.ComponentProps) {
	const open = new Hook(useState(true));
	const app = { user };

	return (
		<AppProvider app={app}>
			<Box
				sx={{ display: "flex", flexDirection: "column", minHeight: "100svh" }}
			>
				<Box sx={{ display: "flex", flexGrow: 1 }}>
					<AppDrawer open={open} />

					<Box
						component="main"
						sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
					>
						<AppHeader open={open} />
						<Outlet />
					</Box>
				</Box>
			</Box>
		</AppProvider>
	);
}
