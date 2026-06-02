import {
	Box,
	TextField,
	IconButton,
	List,
	ListItem,
	ListItemText,
	type BoxProps,
} from "@mui/material";
import { Send } from "lucide-react";

export type ChatSender = "User" | "AI";

export interface ChatMessage {
	id: string;
	sender: ChatSender;
	text: string;
}

interface ChatProps extends BoxProps {
	messages: ChatMessage[];
}

export default function Chat({ messages, sx, ...props }: ChatProps) {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				...sx,
			}}
			{...props}
		>
			<Box sx={{ overflow: "auto", maxHeight: "100%", flexGrow: 1 }}>
				<List sx={{ p: 2 }}>
					{messages.map((m) => (
						<ListItem key={m.id} alignItems="flex-start">
							<ListItemText primary={m.sender} secondary={m.text} />
						</ListItem>
					))}
				</List>
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
