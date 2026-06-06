import {
	Box,
	Card,
	CardActions,
	CardContent,
	CardHeader,
	type CardProps,
	Container,
	Typography,
} from "@mui/material";
import { Fragment, useEffect, useId } from "react";
import "./home.css";
import { green, red } from "@mui/material/colors";
import { Link, useLocation, useNavigate } from "react-router";
import { type BriefModuleSection, moduleList } from "~/client";
import InnerHtml from "~/components/InnerHtml";
import { useApp } from "~/context";
import { handleResponse } from "~/utils";
import type { Route } from "./+types/home";

interface InfoCardProps {
	completed: boolean;
	disabled: boolean;
	section: BriefModuleSection;
	sectionNames: Record<string, string>;
}

function InfoCard({
	section,
	disabled,
	completed,
	sectionNames,
	...props
}: InfoCardProps & CardProps) {
	const id = `section-${section.hashid}`;
	const state = disabled ? "disabled" : completed ? "completed" : "normal";
	const bgColor = {
		disabled: red[50],
		completed: green[100],
		normal: "inherit",
	};
	return (
		<Card
			component={Link}
			id={id}
			onClick={() => window.history.replaceState(null, "", `#${id}`)}
			variant="outlined"
			to={`topics/${section.hashid}`}
			sx={{
				position: "relative",
				backgroundColor: bgColor[state],
				textDecoration: "none",
				color: disabled ? "text.disabled" : "text.main",
				pointerEvents: disabled ? "none" : "auto",
				cursor: disabled ? "default" : "pointer",
			}}
			{...props}
		>
			{completed && (
				<Typography
					variant="caption"
					sx={{
						position: "absolute",
						m: 1,
						top: 0,
						right: 0,
					}}
				>
					Complete
				</Typography>
			)}
			<CardHeader
				sx={{
					"& .MuiCardHeader-title": {
						minHeight: "2lh",
					},
				}}
				title={section.name}
				subheader={
					section.dependencies.length > 0 && (
						<>
							Needs:{" "}
							{section.dependencies.map((hashid) => sectionNames[hashid])}
						</>
					)
				}
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
	const sectionNames = Object.fromEntries(
		modules.flatMap((m) => m.sections.map((s) => [s.hashid, s.name])),
	);

	const nav = useNavigate();
	const loc = useLocation();

	useEffect(() => {
		nav(loc, { replace: true });
	}, []);

	const rankSection = (a: InfoCardProps) => +10 * a.completed + 11 * a.disabled;

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
						<Typography id={mod.name} variant="h4">
							{mod.name}
						</Typography>
						{mod.dependencies.length > 0 && (
							<Typography>
								Needs:{" "}
								{mod.dependencies.map((id) => moduleNames[id]).join(", ")}
							</Typography>
						)}
					</Box>
					{mod.sections
						.map((sec) => ({
							completed: user.completed_sections.some(
								(s) => s.hashid === sec.hashid,
							),
							sectionNames,
							sections: mod.sections,
							disabled: !availableSections.has(sec.hashid),
							section: sec,
						}))
						.sort((a, b) => rankSection(a) - rankSection(b))
						.map((props) => (
							<InfoCard key={props.section.hashid} {...props} />
						))}
				</Fragment>
			))}
		</Box>
	);
}
