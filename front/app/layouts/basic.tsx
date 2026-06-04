import { Box } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router";
import AppHeader from "~/components/AppHeader";
import AppDrawer from "~/components/Drawer";
import { Hook } from "~/utils";
import type { Route } from "./+types/basic";

export default function BasicLayout({}: Route.ComponentProps) {
	const open = new Hook(useState(false));

	return (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: "100svh" }}>
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
	);
}
