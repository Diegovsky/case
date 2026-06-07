import { Box, Fab } from "@mui/material";
import { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import AppHeader from "~/components/AppHeader";
import AppDrawer from "~/components/Drawer";
import type { Route } from "./+types/basic";
import { MessageSquare } from "lucide-react";
import Chat from "~/components/Chat";
import { Hook } from "~/utils";
import { useApp } from "~/context";

export default function BasicLayout(_: Route.ComponentProps) {
	const open = new Hook(useState(false));
	const nav = useNavigate();

	const { isReadOnly } = useApp();

	const [chatOpen, setChatOpen] = useState(isReadOnly.value);

	const body = (
		<Box
			className="stack"
			sx={{
				position: "relative",
				flexGrow: 1,
			}}
		>
			<Box
				sx={{
					display: "contents",
				}}
			>
				<div className="scroll-container">
					<Outlet />
				</div>
				<Fab
					data-open={chatOpen}
					color="primary"
					onClick={() => setChatOpen(!chatOpen)}
					sx={{
						position: "absolute",
						bottom: "24px",
						left: "calc(24px)",
						zIndex: 11,
					}}
				>
					<MessageSquare />
				</Fab>
			</Box>
			{chatOpen && (
				<Chat
					onExtraInfo={async ({ updated_info: updatedInfo }) => {
						console.log("extra info", updatedInfo, isReadOnly.value);
						if (updatedInfo && isReadOnly.value) {
							nav("/tests");
						}
					}}
					sx={{
						borderLeft: 1,
					}}
				/>
			)}
		</Box>
	);

	return (
		<Box sx={{ display: "flex", flexGrow: 1 }}>
			{
				// <AppDrawer open={open} />
			}

			<Box
				component="main"
				sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
			>
				<AppHeader open={open} />
				{body}
			</Box>
		</Box>
	);
}
