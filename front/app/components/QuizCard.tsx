import {
	Box,
	Button,
	Card,
	CardContent,
	FormControlLabel,
	Radio,
	RadioGroup,
	Typography,
} from "@mui/material";
import { useState } from "react";
import type { TestList } from "~/client";
import InnerMarkdown from "./InnerMarkdown";

export type Test = TestList[0];

export default function QuizCard({
	question: { question, alternatives, context },
	onSubmit,
}: {
	question: Test;
	onSubmit?: (index: number) => void;
}) {
	const [selectedOption, setSelectedOption] = useState(-1);
	return (
		<Card variant="outlined" sx={{ mt: 4 }}>
			<CardContent sx={{ p: 4, alignItems: "start", textAlign: "left" }}>
				{context && <InnerMarkdown content={context} />}
				<InnerMarkdown content={question} />
				<Box sx={{ mb: 4, ml: 8 }}>
					<RadioGroup
						value={selectedOption}
						onChange={(e) => setSelectedOption(parseInt(e.target.value))}
					>
						{alternatives.map((opt, i) => (
							<>
								{opt.isCorrect && "yes"}
								<FormControlLabel
									key={opt.letter}
									value={i}
									control={<Radio />}
									label={opt.file ? <image src={opt.file} /> : opt.text}
									sx={{ display: "block" }}
								/>
							</>
						))}
					</RadioGroup>
				</Box>
				<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
					<Button
						variant="contained"
						disabled={selectedOption === null}
						onClick={() => {
							if (onSubmit) {
								onSubmit(selectedOption);
							}
						}}
						size="large"
					>
						Submit Answer
					</Button>
				</Box>
			</CardContent>
		</Card>
	);
}
