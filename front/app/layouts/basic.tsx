import { useState } from "react";
import { Outlet } from "react-router";
import { Box } from "@mui/material";
import AppDrawer from "~/components/Drawer";
import AppHeader from "~/components/AppHeader";
import { Hook } from "~/utils";

export default function BasicLayout() {
	const open = new Hook(useState(true));

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
