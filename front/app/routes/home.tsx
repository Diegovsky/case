import { Box, Container, Typography } from "@mui/material";
import { Fragment, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { moduleList, userMeSendMessageCreate, type Module } from "~/client";
import { useApp } from "~/context";
import { handleResponse } from "~/utils";
import type { Route } from "./+types/home";
import { userContext } from "~/layouts/authed";
import { InfoCard, type InfoCardProps } from "~/components/InfoCard";
import * as prompts from "~/data/prompts";

export async function loader({ context }: Route.LoaderArgs) {
	const modules = handleResponse(await moduleList());
	const user = context.get(userContext);
	if (user.info === "" && user.messages.length === 0) {
		await userMeSendMessageCreate({
			body: {
				context: JSON.stringify({ modules }),
				sender: "model",
				text: `System prompt: Given the context, generate a warm welcome message for the user and ask about their favorite topics or anything you feel might help them understand complex topics better. Never suggest other topics not in your context list. Tell the user to explore the topics and see which ones they want to learn.
					`,
			},
		});
	}
	return {
		modules,
	};
}

function int(b: boolean): number {
	return b as unknown as number;
}

export default function Home({
	loaderData: { modules },
}: Route.ComponentProps) {
	const app = useApp();
	const { user, isReadOnly: isReadOnlyHook } = app;

	const nav = useNavigate();
	const loc = useLocation();

	// biome-ignore lint/correctness/useExhaustiveDependencies:.
	useEffect(() => {
		// scroll to current header thing
		nav(loc, { replace: true });
	}, []);

	const rankTopic = (a: InfoCardProps) =>
		+10 * int(a.completed) + 11 * int(a.disabled);
	const rankModule = (a: Module) =>
		-10 * int(user.available_modules.includes(a.hashid)) +
		11 * int(user.completed_modules!.includes(a.hashid));

	const isReadOnly = isReadOnlyHook.value;
	if (isReadOnly) {
		app.aiContext = prompts.onboarding;
	} else {
		app.aiContext = {};
	}
	const sortedModules = Object.values(modules).sort(
		(a, b) => rankModule(a) - rankModule(b),
	);

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
			{sortedModules.map((mod) => (
				<Fragment key={mod.hashid}>
					<Box sx={{ gridColumn: "1 / -1" }}>
						<Typography id={mod.name} variant="h4">
							{mod.name}
						</Typography>
						{mod.dependencies.length > 0 && (
							<Typography>
								Needs:{" "}
								{mod.dependencies.map((id) => modules[id].name).join(", ")}
							</Typography>
						)}
					</Box>
					{Object.values(mod.topics)
						.map((sec) => ({
							completed: user.completed_topics!.includes(sec.hashid),
							topics: mod.topics,
							disabled: !(
								isReadOnly || user.available_topics.includes(sec.hashid)
							),
							topic: sec,
							module: mod,
						}))
						.sort((a, b) => rankTopic(a) - rankTopic(b))
						.map((props) => (
							<InfoCard key={props.topic.hashid} {...props} />
						))}
				</Fragment>
			))}
		</Box>
	);
}
