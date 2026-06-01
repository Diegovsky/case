import type { Route } from "./+types/home";
import { Box } from "@mui/material";
import Chat, { type ChatMessage } from "../components/Chat";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "AI Assistant" },
		{ name: "description", content: "Welcome to AI Assistant!" },
	];
}

export default function Home() {
	return null;
}
