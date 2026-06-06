import { Box, Fab } from "@mui/material";
import { useRef, useState } from "react";
import { Outlet } from "react-router";
import AppHeader from "~/components/AppHeader";
import AppDrawer from "~/components/Drawer";
import { handleResponse, Hook } from "~/utils";
import type { Route } from "./+types/basic";
import { MessageSquare } from "lucide-react";
import Chat from "~/components/Chat";
import { AppProvider } from "~/context";
import { userMeRetrieve } from "~/client";

export const loader = async () => handleResponse(await userMeRetrieve());

export default function BasicLayout({
	loaderData: user,
}: Route.ComponentProps) {
	const open = new Hook(useState(false));

	const [chatOpen, setChatOpen] = useState(false);

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
					sx={{
						borderLeft: 1,
					}}
					messages={user.messages}
				/>
			)}
		</Box>
	);
	const aiContext = useRef("");

	return (
		<AppProvider app={{ user, aiContext }}>
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
						{body}
					</Box>
				</Box>
			</Box>
		</AppProvider>
	);
}
