import type { Route } from "./+types/tests";
import { Box, Typography, Container, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router";
import { useRef, useState } from "react";
import QuizCard, { type Test } from "~/components/QuizCard";
import {
	moduleList,
	topicList,
	userMePartialUpdate,
	userMeSetModuleCreate,
	type Module,
} from "~/client";
import { handleResponse } from "~/utils";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const topics = Object.values(handleResponse(await topicList()));
	const data: string[] = await request
		.json()
		.catch(() => topics.slice(0, 5).map((t) => t.hashid));
	const tests = topics
		.filter((topic) => data.includes(topic.hashid))
		.flatMap((topic) => topic.tests.map((test) => ({ test, topic })));
	const modules = handleResponse(await moduleList());
	return { tests, modules };
};

function evalModuleDeps(mods: Record<string, Module>, i: string): string[] {
	const mod = mods[i];
	return mod.dependencies
		.flatMap((hashid) => [...evalModuleDeps(mods, hashid), hashid])
		.concat([i]);
}

export default function Onboarding({
	loaderData: { tests, modules },
}: Route.ComponentProps) {
	const navigate = useNavigate();
	const [currentIndex, setCurrentIndex] = useState(0);
	const moduleDeps = Object.fromEntries(
		Object.keys(modules).map((hashid) => [
			hashid,
			new Set(evalModuleDeps(modules, hashid)),
		]),
	);
	const maxModuleLevel = useRef<string>(
		Object.keys(moduleDeps).find((id) => moduleDeps[id].size === 1),
	);

	const getTest = (i: number): Test => tests[i].test;

	const handleSubmitAnswer = async (answerId: number) => {
		if (currentIndex >= tests.length - 1) {
			handleResponse(
				await userMeSetModuleCreate({
					body: { hashid: maxModuleLevel.current },
				}),
			);
			await navigate("/");
		}
		if (!getTest(currentIndex).alternatives[answerId].is_correct) {
			const mod = tests[currentIndex].topic.module;
			console.log("mod", mod, modules[mod].name);
			maxModuleLevel.current =
				Object.keys(moduleDeps).find((id) => !moduleDeps[id].has(mod)) ||
				maxModuleLevel.current;
		}
		setCurrentIndex((prev) => prev + 1);
	};

	const diagnosticProgress = (currentIndex / tests.length) * 100;

	return (
		<Container maxWidth="md">
			<Box
				sx={{
					marginTop: 8,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 4,
					textAlign: "center",
				}}
			>
				<Box
					sx={{
						width: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 4,
					}}
				>
					<Box sx={{ width: "100%", maxWidth: 600, textAlign: "center" }}>
						<Typography variant="h4" component="h1" gutterBottom>
							Diagnostic Exam
						</Typography>
						<Typography variant="h4" component="h1" gutterBottom>
							Max level: {modules[maxModuleLevel.current]?.name}
						</Typography>
						<Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
							Question {currentIndex + 1} of {tests.length}
						</Typography>
						<LinearProgress
							variant="determinate"
							value={diagnosticProgress}
							sx={{ height: 10, borderRadius: 5 }}
						/>
					</Box>

					<QuizCard
						question={getTest(currentIndex)}
						onSubmit={handleSubmitAnswer}
					/>
				</Box>
			</Box>
		</Container>
	);
}
