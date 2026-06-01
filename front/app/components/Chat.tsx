import {
	Box,
	TextField,
	IconButton,
	List,
	ListItem,
	ListItemText,
} from "@mui/material";
import { Send } from "lucide-react";

export type ChatSender = "User" | "AI";

export interface ChatMessage {
	id: string;
	sender: ChatSender;
	text: string;
}

interface ChatProps {
	messages: ChatMessage[];
}

export default function Chat({ messages }: ChatProps) {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Box sx={{ overflow: "hidden" }}>
				<List sx={{ flexGrow: 1, p: 2 }}>
					{messages.map((m) => (
						<ListItem key={m.id} alignItems="flex-start">
							<ListItemText primary={m.sender} secondary={m.text} />
						</ListItem>
					))}
				</List>
			</Box>
			<Box
				sx={{
					borderTop: 1,
					position: "sticky",
					bottom: 0,
					p: 2,
					bgcolor: "background.paper",
					display: "flex",
				}}
			>
				<TextField
					fullWidth
					placeholder="Type a message..."
					variant="outlined"
				/>
				<IconButton color="primary" sx={{ ml: 1 }}>
					<Send />
				</IconButton>
			</Box>
		</Box>
	);
}
