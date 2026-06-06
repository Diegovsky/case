import { useEffect, useState } from "react";
import {
	Box,
	Typography,
	RadioGroup,
	FormControlLabel,
	Radio,
	Button,
	Card,
	CardContent,
} from "@mui/material";

export interface Question {
	question: string;
	options: string[];
}

export default function QuizCard({
	question: { question, options },
	onSubmit,
}: {
	question: Question;
	onSubmit?: (index: number) => void;
}) {
	const [selectedOption, setSelectedOption] = useState(0);
	return (
		<Card variant="outlined" sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
			<CardContent sx={{ p: 4 }}>
				<Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
					{question}
				</Typography>
				<Box sx={{ mb: 4 }}>
					<RadioGroup
						value={selectedOption}
						onChange={(e) => setSelectedOption(parseInt(e.target.value))}
					>
						{options.map((option, index) => (
							<FormControlLabel
								key={index}
								value={index}
								control={<Radio />}
								label={option}
								sx={{ display: "block", mb: 1 }}
							/>
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
								setSelectedOption(0);
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
