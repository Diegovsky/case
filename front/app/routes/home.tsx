import type { Route } from "./+types/home";
import {
	Box,
	Container,
	useMediaQuery,
	useTheme,
	Typography,
	Fab,
	Stack,
} from "@mui/material";
import { MessageSquare, X } from "lucide-react";
import Chat from "../components/Chat";
import { useApp } from "~/context";
import { useState } from "react";
import "./home.css";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Adaptive Learning Dashboard" },
		{
			name: "description",
			content: "Your personalized math learning workspace.",
		},
	];
}

export default function Home() {
	const theme = useTheme();
	const [chatOpen, setChatOpen] = useState(true);

	return (
		<Box
			className="stack"
			sx={{
				flexGrow: 1,
			}}
		>
			<Box
				sx={{
					position: "relative",
					bgcolor: "red",
					p: 2,
				}}
			>
				hi
				<Fab
					data-open={chatOpen}
					color="primary"
					onClick={() => setChatOpen(!chatOpen)}
					sx={{
						position: "absolute",
						bottom: "24px",
						right: "24px",
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
					messages={[]}
				/>
			)}
		</Box>
	);
}
