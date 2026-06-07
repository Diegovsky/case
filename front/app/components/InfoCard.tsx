import {
	Card,
	CardContent,
	CardHeader,
	type CardProps,
	Typography,
} from "@mui/material";
import { green, red } from "@mui/material/colors";
import { Link } from "react-router";
import type { BriefTopic, Module } from "~/client";
import InnerHtml from "~/components/InnerHtml";
import { useApp } from "~/context";

export interface InfoCardProps {
	completed: boolean;
	disabled: boolean;
	module: Module;
	topic: BriefTopic;
}

export function InfoCard({
	topic,
	disabled,
	completed,
	module,
	...props
}: InfoCardProps & CardProps) {
	const { isReadOnly } = useApp();
	const id = `topic-${topic.hashid}`;
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
			to={`topics/${topic.hashid}`}
			sx={{
				position: "relative",
				backgroundColor: bgColor[state],
				textDecoration: "none",
				color: disabled ? "text.disabled" : "text.main",
				pointerEvents: disabled || isReadOnly.value ? "none" : "auto",
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
				title={topic.name}
				subheader={
					topic.dependencies.length > 0 && (
						<>
							Needs:{" "}
							{topic.dependencies
								.map((hashid) => module.topics[hashid].name)
								.join(",")}
						</>
					)
				}
			></CardHeader>
			<CardContent>
				<InnerHtml content={topic.preview} />
			</CardContent>
		</Card>
	);
}
