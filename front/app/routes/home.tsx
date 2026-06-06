import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Container,
	Fab,
	Typography,
	type CardProps,
} from "@mui/material";
import { MessageSquare } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import Chat, { type ChatMessage } from "../components/Chat";
import "./home.css";
import type { Route } from "./+types/home";
import { moduleList, type BriefModuleSection } from "~/client";
import { handleResponse } from "~/utils";
import InnerHtml from "~/components/InnerHtml";
import { Link } from "react-router";
import { useApp } from "~/context";

function InfoCard({
	section,
	disabled,
	...props
}: {
	section: BriefModuleSection;
	disabled: boolean;
} & CardProps) {
	return (
		<Card
			component={Link}
			variant="outlined"
			to={`topics/${section.hashid}`}
			sx={{
				textDecoration: "none",
				color: disabled ? "text.disabled" : "text.main",
				pointerEvents: disabled ? "none" : "auto",
				cursor: disabled ? "default" : "pointer",
			}}
			{...props}
		>
			<CardHeader
				sx={{
					"& .MuiCardHeader-title": {
						minHeight: "2lh",
					},
				}}
				title={section.name}
			></CardHeader>
			<CardContent>
				<InnerHtml content={section.preview} />
			</CardContent>
		</Card>
	);
}

export async function loader({ context }: Route.LoaderArgs) {
	const modules = handleResponse(await moduleList());

	return {
		modules,
	};
}

export default function Home({
	loaderData: { modules },
}: Route.ComponentProps) {
	const app = useApp();
	const { user } = app;
	const availableSections = new Set(
		user.available_sections.map((s) => s.hashid),
	);
	const moduleNames = Object.fromEntries(
		modules.map((m) => [m.hashid, m.name]),
	);
	const availableModules = new Set(user.available_modules.map((s) => s.hashid));
	app.aiContext = { modules, availableModules, availableSections };
	return (
		<Box
			component={Container}
			sx={{
				my: 2,
				display: "grid",
				gap: 2,
				gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
			}}
		>
			{modules.map((mod) => (
				<Fragment key={mod.hashid}>
					<Box sx={{ gridColumn: "1 / -1" }}>
						<Typography variant="h4">{mod.name}</Typography>
						{mod.dependencies.length > 0 && (
							<Typography>
								First complete:{" "}
								{mod.dependencies.map((id) => moduleNames[id]).join(", ")}
							</Typography>
						)}
					</Box>
					{mod.sections.map((sec, i) => (
						<InfoCard
							key={sec.hashid}
							disabled={!availableSections.has(sec.hashid)}
							section={sec}
						/>
					))}
				</Fragment>
			))}
		</Box>
	);
}
