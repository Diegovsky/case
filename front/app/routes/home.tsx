import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Container,
	Fab,
	type CardProps,
} from "@mui/material";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import Chat, { type ChatMessage } from "../components/Chat";
import "./home.css";

const messages: ChatMessage[] = [
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
	{ id: "h", sender: "User", text: "ola" },
];

function Body({ children }: { children?: React.ReactNode }) {
	const [chatOpen, setChatOpen] = useState(false);

	return (
		<Box
			className="stack"
			sx={{
				flexGrow: 1,
			}}
		>
			<Box
				sx={{
					flex: 1,
					display: "contents",
					position: "relative",
					p: 2,
				}}
			>
				<div className="scroll-container"> {children}</div>
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
					messages={messages}
				/>
			)}
		</Box>
	);
}

function InfoCard({
	section,
	...props
}: {
	section: { title: string; content: string };
} & CardProps) {
	return (
		<Card {...props}>
			<CardHeader title={section.title}></CardHeader>
			<CardContent>{section.content}</CardContent>
		</Card>
	);
}

export default function Home() {
	return (
		<Body>
			<Box
				component={Container}
				sx={{
					my: 2,
					display: "grid",
					gap: 2,
					gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
				}}
			>
				{Array.from({ length: 10 }).map((_, i) => (
					<InfoCard key={i} section={{ title: `Title-${i}`, content: "ola" }} />
				))}
			</Box>
		</Body>
	);
}
