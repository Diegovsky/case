import {
	sectionRetrieve,
	userMeCompleteSectionCreate,
	userMePartialUpdate,
} from "~/client";
import type { Route } from "./+types/topics";
import { handleResponse } from "~/utils";
import { Box, Typography } from "@mui/material";
import InnerHtml from "~/components/InnerHtml";
import InnerMarkdown from "~/components/InnerMarkdown";
import { useApp } from "~/context";
import { useEffect } from "react";

export async function loader({ params: { hashid } }: Route.LoaderArgs) {
	const section = handleResponse(await sectionRetrieve({ path: { hashid } }));
	return section;
}

export default function Topics({ loaderData: section }: Route.ComponentProps) {
	const app = useApp();
	app.aiContext = { section };
	const { content } = section;
	useEffect(() => {
		(async () => {
			handleResponse(
				await userMeCompleteSectionCreate({
					body: {
						hashid: section.hashid,
					},
				}),
			);
		})();
	});
	return (
		<Box sx={{ p: 4 }}>
			<InnerMarkdown content={content} />
		</Box>
	);
}
