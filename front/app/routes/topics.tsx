import { topicRetrieve, userMeCompleteTopicCreate } from "~/client";
import type { Route } from "./+types/topics";
import { handleResponse } from "~/utils";
import { Box, Divider } from "@mui/material";
import InnerMarkdown from "~/components/InnerMarkdown";
import { useApp } from "~/context";
import QuizCard from "~/components/QuizCard";
import confetti from "canvas-confetti";
import { redirect } from "react-router";

export async function loader({ params: { hashid } }: Route.LoaderArgs) {
	try {
		const topic = handleResponse(await topicRetrieve({ path: { hashid } }));
		return topic;
	} catch (_) {
		throw redirect("/");
	}
}

export default function Topics({ loaderData: topic }: Route.ComponentProps) {
	const app = useApp();
	app.aiContext = {
		topic,
		instructions: `Never straight up give the user answers, always try to guide them through answering the test correctly.`,
	};
	const { content } = topic;
	return (
		<Box sx={{ p: 4 }}>
			<InnerMarkdown content={content} />
			{topic.tests.length > 0 && <Divider />}
			{topic.tests.map((t) => (
				<QuizCard
					key={Math.random()}
					onSubmit={async (i) => {
						if (t.alternatives[i].is_correct) {
							console.log(i, t.alternatives[i]);
							await confetti();
							confetti.reset();
							handleResponse(
								await userMeCompleteTopicCreate({
									body: {
										hashid: topic.hashid,
									},
								}),
							);
						}
					}}
					question={t}
				/>
			))}
		</Box>
	);
}
