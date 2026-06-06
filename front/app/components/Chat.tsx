import {
	Box,
	TextField,
	IconButton,
	type BoxProps,
	Toolbar,
	AppBar,
	Typography,
	Paper,
	CircularProgress,
} from "@mui/material";
import { Send } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { userMeSendMessageCreate, type ChatMessage } from "~/client";
import { handleResponse, Hook, HookedArray } from "~/utils";
import InnerMarkdown from "./InnerMarkdown";
import { useApp } from "~/context";

export type ChatSender = "User" | "AI";

interface ChatProps extends BoxProps {
	messages: ChatMessage[];
}

export default function Chat({
	messages: initialMessages,
	sx,
	...props
}: ChatProps) {
	const app = useApp();
	const messages = new HookedArray(useState(initialMessages));
	const currentMessage = new Hook(useState(""));
	const [isPending, startTransition] = useTransition();

	const anchorRef = useRef<HTMLElement>(null);

	const scrollWindow = () => {
		if (!anchorRef) return;
		anchorRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(scrollWindow, [anchorRef, messages.value, isPending]);

	const sendMessage = () => {
		if (isPending) return;

		// fakely add message to the chat window.
		currentMessage.set("");
		const newMsg: ChatMessage = {
			sender: "user",
			text: currentMessage.value,
			hashid: "pending",
		};
		messages.append(newMsg);

		startTransition(async () => {
			const newMsgs = handleResponse(
				await userMeSendMessageCreate({
					body: {
						text: currentMessage.value,
						context: JSON.stringify(app.aiContext),
					},
				}),
			);
			messages.set((messages) => [
				...messages.filter((msg) => msg.hashid !== "pending"),
				...newMsgs,
			]);
		});
	};
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				...sx,
			}}
			{...props}
		>
			<AppBar color="secondary" sx={{ position: "static" }}>
				<Toolbar>AI Teacher</Toolbar>
			</AppBar>
			<Box
				className="scroll-container"
				sx={{ gap: 2, p: 2, display: "flex", flexDirection: "column" }}
			>
				{messages.value.map((m, i) => {
					const isUser = m.sender === "user";
					return (
						<Paper
							sx={{
								"& > *": {
									my: 0,
								},
								p: 1.5,
								borderRadius: 6,
								...(isUser
									? {
											borderTopRightRadius: 0,
										}
									: {
											borderTopLeftRadius: 0,
										}),
								alignSelf: isUser ? "end" : "start",
								backgroundColor: isUser ? "unset" : "#fdf",
							}}
							key={m.hashid}
						>
							<InnerMarkdown content={m.text} />
						</Paper>
					);
				})}
				{isPending && <CircularProgress color="primary" />}
				<div ref={anchorRef} />
			</Box>
			<Box
				sx={{
					bgcolor: "background.paper",
					justifySelf: "flex",
					borderTop: 1,
					p: 2,
					display: "flex",
				}}
			>
				<TextField
					fullWidth
					value={currentMessage.value}
					onChange={currentMessage.onChange()}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							sendMessage();
						}
					}}
					placeholder="Type a message..."
					variant="outlined"
				/>
				<IconButton
					disabled={isPending}
					onClick={sendMessage}
					color="primary"
					sx={{ ml: 1 }}
				>
					<Send />
				</IconButton>
			</Box>
		</Box>
	);
}
